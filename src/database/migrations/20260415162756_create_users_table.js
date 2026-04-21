exports.up = function (knex) {
  return knex.schema.createTable("users", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // Dùng UUID làm Khóa chính
    table.string("fullName").notNullable();
    table.string("userName").unique().notNullable(); // Không được trùng
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.enum("role", ["user", "admin"]).defaultTo("user"); // Ràng buộc chỉ nhận user hoặc admin
    table.boolean("isActive").defaultTo(false); // Mặc định chưa kích hoạt email
    table.timestamp("lastLoginAt");
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};
