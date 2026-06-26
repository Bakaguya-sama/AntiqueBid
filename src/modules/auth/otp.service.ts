import bcrypt from "bcrypt";
import redis from "@/config/redis.connection";
import { randomInt } from "crypto";
import { AppError } from "@/utils/app-error.utils";

export type OtpPurpose = "verify_email" | "reset_password" | "register";

const OTP_TTL = 300;
const MAX_ATTEMPTS = 5;

export class OtpService {
  async generateOtp(email: string, purpose: OtpPurpose) {
    const existingTTL = await redis.ttl(this.getOtpKey(email, purpose));
    if (existingTTL > -2) {
      throw new AppError(429, `Please wait 5 mins before requesting a new OTP`);
    }

    const otp = randomInt(100000, 999999).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    await redis.set(this.getOtpKey(email, purpose), hashedOtp, "EX", OTP_TTL);

    await redis.del(this.getAttempKey(email, purpose));

    return otp;
  }

  async verifyOtp(otp: string, email: string, purpose: OtpPurpose) {
    const otpKey = this.getOtpKey(email, purpose);
    const attemptKey = this.getAttempKey(email, purpose);

    const attempts = await redis.get(attemptKey);
    if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
      throw new AppError(
        429,
        "Too many failed attempts. Please request a new OTP.",
      );
    }

    const hashedOtp = await redis.get(otpKey);
    if (!hashedOtp) {
      throw new AppError(
        400,
        "OTP expired or does not exist. Please request a new OTP.",
      );
    }

    const isValid = await bcrypt.compare(otp, hashedOtp);
    if (!isValid) {
      const remainingTTL = await redis.ttl(otpKey);
      await redis.set(
        attemptKey,
        String(parseInt(attempts ?? "0") + 1),
        "EX",
        remainingTTL,
      );
      throw new AppError(400, "Invalid OTP");
    }

    await redis.del(otpKey);
    await redis.del(attemptKey);

    return true;
  }

  private getOtpKey(email: string, purpose: OtpPurpose) {
    const key = `otp:${purpose}:${email}`;
    return key;
  }

  private getAttempKey(email: string, purpose: OtpPurpose) {
    const key = `attemp:${purpose}:${email}`;
    return key;
  }
}

export const otpService = new OtpService();
