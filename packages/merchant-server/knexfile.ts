import dotenv from 'dotenv';

dotenv.config({ path: '../merchant-server/.env' });

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export const development = {
  client: 'pg',
  connection: process.env.DB_CONNECTION_STRING,
  seeds: {
    directory: './migrations/seeds',
  },
};
