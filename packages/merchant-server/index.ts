/* eslint-disable import/first */

import dotenv from 'dotenv';

dotenv.config();

[
  'DB_CONNECTION_STRING',
  'WEBSOCKET_URL',
  'ZKOPRU_CONTRACT_ADDRESS',
  'WALLET_PRIVATE_KEY',
  'JWT_SECRET',
].forEach((e) => {
  if (!process.env[e]) {
    throw new Error(`Required env variable ${e} not set.`);
  }
});

import app from './app';

const port = Number(process.env.PORT) || 8000;

app.listen({ port });
