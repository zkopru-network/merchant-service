import knex, { Knex } from 'knex';
import { ILogger } from '../../common/interfaces';

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
      'available_quantity': string
      'price': string
      'created_at': Date
      'updated_at': Date
    },
    orders: {
      'id': string
      'product_id': string
      'quantity': string
      'amount': string
      'buyer_address': string
      'buyer_transaction': string
      'buyer_transaction_hash': string
      'seller_transaction': string
      'seller_transaction_hash': string
      'fee': string
      'status': string
      'created_at': Date
      'updated_at': Date
    }
  }
}

let db : Knex;

export function connectDB({ logger } : { logger: ILogger }) {
  if (db) {
    return db;
  }

  db = knex({
    client: 'pg',
    connection: process.env.DB_CONNECTION_STRING,
  });

  if (logger.level === 'debug') {
    db.on('query', (params) => {
      logger.info({ data: { query: params.sql } }, 'Executing SQL query');
    });
  }

  return db;
}

export function disconnectDB() {
  db.destroy();
}
