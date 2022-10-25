import type { Knex } from 'knex';

export async function seed(knex: Knex) {
  await knex.schema
    .createTable('products', (table) => {
      table.string('id').unique();
      table.string('name', 255).notNullable();
      table.string('description', 2000).nullable();
      table.string('image_url', 255).nullable();
      table.string('token_id', 255).nullable();
      table.string('token_standard', 10).notNullable();
      table.string('contract_address', 42).notNullable();
      table.decimal('available_quantity').notNullable();
      table.decimal('price').notNullable();
    });

  await knex.schema
    .createTable('orders', (table) => {
      table.string('id').unique();
      table.string('product_id', 36).references('id').inTable('products');
      table.decimal('quantity').notNullable();
      table.decimal('amount').notNullable();
      table.string('buyer_address', 255).nullable();
      table.string('buyer_transaction', 5000).nullable();
      table.string('seller_transaction', 5000).nullable();
      table.decimal('fee').notNullable();
    });
}
