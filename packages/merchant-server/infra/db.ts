import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DB_CONNECTION_STRING,
});

export default db;
