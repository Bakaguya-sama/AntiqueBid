import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("antiques", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // Dùng UUID làm Khóa chính
    table.string("name").notNullable();
    table.string("description").notNullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("antiques");
}
