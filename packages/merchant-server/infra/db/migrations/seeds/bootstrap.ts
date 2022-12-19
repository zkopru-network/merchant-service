import type { Knex } from "knex";

export async function seed(knex: Knex, numberType = "decimal") {
  await knex.schema.createTable("products", (table) => {
    table.string("id").unique();
    table.string("name", 255).notNullable();
    table.string("description", 2000).nullable();
    table.string("image_url", 255).nullable();
    table.string("token_id", 255).nullable();
    table.string("token_standard", 10).notNullable();
    table.string("contract_address", 42).notNullable();
    // @ts-ignore
    table[numberType]("available_quantity", 30, 0).notNullable();
    // @ts-ignore
    table[numberType]("price", 30, 0).notNullable();
    table.dateTime("created_at").notNullable();
    table.dateTime("updated_at").notNullable();
  });

  await knex.schema.createTable("orders", (table) => {
    table.string("id").unique();
    table.string("product_id").references("id").inTable("products");
    // @ts-ignore
    table[numberType]("quantity", 30, 0).notNullable();
    // @ts-ignore
    table[numberType]("amount", 30, 0).notNullable();
    table.string("buyer_address", 255).nullable();
    table.string("buyer_transaction", 5000).nullable();
    table.string("buyer_transaction_hash", 255).nullable();
    table.string("seller_transaction", 5000).nullable();
    table.string("seller_transaction_hash", 255).nullable();
    table.string("status", 100);
    // @ts-ignore
    table[numberType]("fee", 30, 0).notNullable();
    table.dateTime("created_at").notNullable();
    table.dateTime("updated_at").notNullable();
  });
}
