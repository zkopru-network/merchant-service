import dotenv from 'dotenv';
dotenv.config();

// eslint-disable-next-line import/first
import app from './app';

const port = Number(process.env.PORT) || 8000;

app.listen({ port }, (_, args) => {
  console.log(`server start on port ${port}`);
})
