/* eslint-disable import/first */

import dotenv from 'dotenv';

dotenv.config();

import app from './app';

const port = Number(process.env.PORT) || 8000;

app.listen({ port });
