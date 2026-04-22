import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("notifications", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // Dùng UUID làm Khóa chính
    table
      .uuid("userId")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .enum("type", ["outbid", "win", "lose", "auction_update"])
      .notNullable();
    table
      .uuid("auctionId")
      .notNullable()
      .references("id")
      .inTable("auctions")
      .onDelete("CASCADE");
    table.string("message");
    table.boolean("isRead").notNullable().defaultTo(false);
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updatedAt").notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(
    'CREATE INDEX idx_noti_user_time ON notifications("userId", "createdAt" DESC)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications");
}
