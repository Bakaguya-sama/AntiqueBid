import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("otp_users", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // Dùng UUID làm Khóa chính
    table
      .uuid("userId")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("otpCode");
    table.timestamp("expiresAt").notNullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.boolean("isUsed").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("otp_users");
}
