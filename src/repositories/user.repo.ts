import { db } from "../database/db";

export class UserRepository {
  static async findByEmail(email: string) {
    return await db("users").where({ email }).first();
  }

  static async create(userData: any) {
    const [user] = await db("users")
      .insert(userData)
      .returning(["id", "email", "userName", "fullName"]);
    return user;
  }
}
