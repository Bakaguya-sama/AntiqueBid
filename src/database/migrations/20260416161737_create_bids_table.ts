import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("bids", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // Dùng UUID làm Khóa chính
    table.uuid("auctionId").notNullable();
    table
      .uuid("userId")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.decimal("price", 15, 2).notNullable();
    table.boolean("isValid").notNullable().defaultTo(false);
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());

    table.index(["auctionId"], "idx_bids_auction");
  });

  await knex.raw("CREATE INDEX idx_bids_price ON bids(price DESC)");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("bids");
}
