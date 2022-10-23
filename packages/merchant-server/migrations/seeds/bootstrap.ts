import type { Knex } from 'knex';

export async function seed(knex: Knex) {
  await knex.schema
    .createTable('products', (table) => {
      table.string('id');
      table.string('name', 255).notNullable();
      table.string('description', 2000).nullable();
      table.string('image_url', 255).nullable();
      table.string('token_standard', 10).notNullable();
      table.string('contract_address', 42).notNullable();
      table.string('tokenId', 255).nullable();
      table.integer('available_quantity').notNullable();
      table.integer('price_in_gwei').notNullable();
    });
}
