import bcrypt from "bcrypt";
import { userRepository } from "../../repositories/user.repo";
import { AppError } from "@/utils/app-error.utils";
import { jwtService } from "@/services/jwt.service";
import { Prisma, User } from "../../../generated/prisma/client";
import { loginInput } from "@/types/auth.types";
import { redisService } from "@/services/redis.service";
import { OtpPurpose, otpService } from "./otp.service";
import { sendMail } from "@/services/nodemailer.service";
import { userIdentityRepository } from "@/repositories/user-identity.repo";
import { randomUUID } from "crypto";
import redis from "@/config/redis.connection";

const MAX_LOGIN_ATTEMPTS = 5;

export class AuthService {
  async register(data: Prisma.UserCreateInput, verifiedToken: string) {
    const verifiedEmail = await redis.get(`verified:register:${verifiedToken}`);

    if (!verifiedEmail) {
      throw new AppError(
        400,
        "Verification expired, please restart registration",
      );
    }

    if (verifiedEmail !== data.email) {
      throw new AppError(400, "Email does not match verification");
    }

    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) throw new Error("This email is used!");

    const username = await userRepository.findByUsername(data.userName);
    if (username) throw new Error("This username is used!");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password!, saltRounds);

    const newUser = await userRepository.create({
      ...data,
      isActive: true,
      password: hashedPassword,
    });

    await redis.del(`verified:register:${verifiedToken}`);

    return newUser;
  }

  async login(data: loginInput) {
    const attempts = await redisService.getLoginAttempts(data.clientIp);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      throw new AppError(
        429,
        "Too many login attempts. Try again in 15 minutes.",
      );
    }

    if (!data.username) throw new AppError(400, "Empty username");

    const user = await userRepository.findByUsername(data.username);

    if (!user) {
      await redisService.incrementLoginAttempts(data.clientIp);
      throw new AppError(401, "Invalid username");
    }

    if (!(await bcrypt.compare(data.password, user.password!))) {
      await redisService.incrementLoginAttempts(data.clientIp);
      throw new AppError(401, "Invalid password");
    }

    if (!user.isActive) throw new AppError(403, "Account is disabled");

    await redisService.resetLoginAttempts(data.clientIp);

    const { accessToken, refreshToken, tokenFamily } =
      await jwtService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      });

    await redisService.saveRefreshToken(user.id, refreshToken, tokenFamily);

    await userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
    };
  }

  async oauthLogin(user?: User) {
    if (!user) {
      throw new AppError(401, "OAuth login failed");
    }

    const { accessToken, refreshToken, tokenFamily } =
      await jwtService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      });

    await redisService.saveRefreshToken(user.id, refreshToken, tokenFamily);

    await userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logOut(
    userId: string,
    tokenFamily: string,
    accessJti: string,
    accessExp: number,
  ) {
    const remainingTTL = accessExp - Math.floor(Date.now() / 1000);

    await Promise.all([
      jwtService.revokeRefreshToken(userId, tokenFamily),
      redisService.blacklistAccessToken(accessJti, accessExp),
    ]);
  }

  async logOutAll(userId: string, accessJti: string, accessExp: number) {
    const remainingTTL = accessExp - Math.floor(Date.now() / 1000);

    await Promise.all([
      jwtService.revokeAllTokensByUser(userId),
      redisService.blacklistAccessToken(accessJti, accessExp),
    ]);
  }

  async refreshToken(oldRefreshToken: string) {
    const res = await jwtService.rotateRefreshToken(oldRefreshToken);

    if (!res) {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    return res;
  }

  async sendVerifyEmail(email: string, purpose: OtpPurpose) {
    const user = await userRepository.findByEmail(email);

    if (purpose === "register") {
      if (user) {
        throw new AppError(409, "Email already registered");
      }
    } else {
      // Handles "verify_email" and "reset_password"
      if (!user) {
        throw new AppError(404, "User not found");
      }
      if (user.deletedAt) {
        throw new AppError(401, "User account was deleted");
      }
      if (purpose === "verify_email" && user.isActive) {
        throw new AppError(400, "Email already verified");
      }
    }

    const otp = await otpService.generateOtp(email, purpose);

    const userName = user?.userName ?? email;
    let subject = "";
    let textBody = "";
    let htmlBody = "";

    switch (purpose) {
      case "register":
        subject = "Welcome to AntiqueBid! Verify Your Email";
        textBody = `Hello,\n\nThank you for registering with AntiqueBid. Your verification code is: ${otp}\n\nThis code will expire in 5 minutes. Please use this code to complete your registration.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe AntiqueBid Team`;
        htmlBody = `
          <h1>Welcome to AntiqueBid!</h1>
          <p>Thank you for registering. Please use the following code to verify your email address:</p>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
          <br>
          <p>Thanks,</p>
          <p>The AntiqueBid Team</p>
        `;
        break;
      case "reset_password":
        subject = "Your Password Reset Code for AntiqueBid";
        textBody = `Hello ${userName},\n\nYour password reset code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe AntiqueBid Team`;
        htmlBody = `
          <h1>Hello ${userName},</h1>
          <p>Your password reset code is: <strong>${otp}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
          <br>
          <p>Thanks,</p>
          <p>The AntiqueBid Team</p>
        `;
        break;
      case "verify_email":
        subject = "Your Email Verification Code for AntiqueBid";
        textBody = `Hello ${userName},\n\nYour verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe AntiqueBid Team`;
        htmlBody = `<h1>Hello ${userName},</h1><p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p><p>If you did not request this, please ignore this email.</p><br><p>Thanks,</p><p>The AntiqueBid Team</p>`;
        break;
    }

    await sendMail(email, subject, textBody, htmlBody);
    return;
  }

  async verifyEmail(
    email: string,
    otp: string,
    purpose: OtpPurpose,
    ttl: number,
  ) {
    await otpService.verifyOtp(otp, email, purpose);

    const verifiedToken = randomUUID();

    const key = `verified:${purpose}:${verifiedToken}`;

    await redis.set(key, email, "EX", ttl);

    return verifiedToken;
  }

  async changePassword(
    email: string,
    verifiedToken: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const verifiedEmail = await redis.get(
      `verified:reset_password:${verifiedToken}`,
    );

    if (!verifiedEmail) {
      throw new AppError(
        400,
        "Verification expired, please restart registration",
      );
    }

    if (verifiedEmail !== email) {
      throw new AppError(400, "Email does not match verification");
    }

    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError(404, "User not found");
    if (user.deletedAt) throw new AppError(401, "User account was deleted");

    const loginByOauth = await userIdentityRepository.countProviderByUserId(
      user.id,
    );
    if (loginByOauth > 0)
      throw new AppError(400, "Cannot change password of oauth login method");

    const isMatched = await bcrypt.compare(oldPassword, user.password!);
    if (!isMatched) throw new AppError(400, "Old password is not correct");

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.updateByEmail(email, {
      password: hashedNewPassword,
    });
    const subject = "Your AntiqueBid Password Has Been Changed";
    const textBody = `Hello ${user.userName},\n\nThis is a confirmation that the password for your account has just been changed.\n\nIf you did not make this change, please contact our support team immediately.\n\nThanks,\nThe AntiqueBid Team`;
    const htmlBody = `
      <h1>Hello ${user.userName},</h1>
      <p>This is a confirmation that the password for your account has just been changed.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
      <br>
      <p>Thanks,</p>
      <p>The AntiqueBid Team</p>
    `;
    await sendMail(email, subject, textBody, htmlBody);
    return;
  }
}

export const authService = new AuthService();
