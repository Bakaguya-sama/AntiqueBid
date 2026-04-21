exports.up = function (knex) {
  return knex.schema.createTable("otp_users", function (table) {
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
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("otp_users");
};
