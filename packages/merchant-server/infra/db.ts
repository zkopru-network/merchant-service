import knex, { Knex } from 'knex';

declare module 'knex' {
  interface Tables {
    products: {
      'id': string
      'name': string
      'description'?: string
      'image_url'?: string
      'token_standard': string
      'contract_address': string
      'token_id'?: string
      'available_quantity': number
      'price': number
    },
    orders: {
      'id': string
      'product_id': string
      'quantity': number
      'amount': number
      'buyer_address': string
      'buyer_transaction': string
      'seller_transaction': string
      'fee': number
      'status': string
    }
  }
}

let db : Knex;

export function connectDB() {
  if (db) {
    return db;
  }

  db = knex({
    client: 'pg',
    connection: process.env.DB_CONNECTION_STRING,
  });

  return db;
}

export function disconnectDB() {
  db.destroy();
}
