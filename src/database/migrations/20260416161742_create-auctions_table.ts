import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("auctions", function (table) {
      table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // Dùng UUID làm Khóa chính
      table
        .uuid("antiqueId")
        .notNullable()
        .references("id")
        .inTable("antiques")
        .onDelete("CASCADE");
      table
        .uuid("sellerId")
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.decimal("startingPrice", 15, 2).notNullable().defaultTo(0);
      table.decimal("stepPrice", 15, 2).notNullable().defaultTo(0);
      table.decimal("currentPrice", 15, 2).notNullable().defaultTo(0);
      table.timestamp("startsAt");
      table.timestamp("endsAt");
      table
        .enum("status", ["not_started", "active", "finished", "cancelled"])
        .notNullable()
        .defaultTo("not_started");
      table
        .uuid("winnerId")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());
      table.timestamp("lastBidAt");

      table.integer("extendCount").notNullable().defaultTo(0);
      table.integer("maxExtendCount").notNullable().defaultTo(6);
      table.integer("extendWindowSec").notNullable().defaultTo(10);
      table.integer("extendDurationSec").notNullable().defaultTo(10);

      table.index(["status"], "idx_auction_status");
    })
    .alterTable("bids", function (table) {
      table
        .foreign("auctionId")
        .references("id")
        .inTable("auctions")
        .onDelete("CASCADE");
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("bids", function (table) {
      table.dropForeign(["auctionId"]);
    })
    .dropTableIfExists("auctions");
}
