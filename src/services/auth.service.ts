import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/user.repo";

export class AuthService {
  static async register(data: any) {
    const { email, fullName, userName, password } = data;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) throw new Error("This email is used!");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await UserRepository.create({
      email,
      userName,
      fullName,
      password: hashedPassword,
    });

    return newUser;
  }
}
