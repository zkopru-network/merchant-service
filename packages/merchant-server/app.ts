import fastify from 'fastify';
import mercurius, { IResolvers } from 'mercurius';
import { schema } from './infra/graphql';
import { createLogger } from './core/logger';
import resolvers from './infra/resolvers';
import ZkopruService from './services/zkopru-service';
import { connectDB } from './infra/db';

export const logger = createLogger();

const app = fastify({ logger });

const db = connectDB();

const zkopruService = new ZkopruService({
  websocketUrl: process.env.WEBSOCKET_URL,
  contractAddress: process.env.ZKOPRU_CONTRACT_ADDRESS,
  accountPrivateKey: process.env.WALLET_PRIVATE_KEY,
}, {
  logger,
});

app.addHook('onReady', () => {
  zkopruService.start();
});

export const buildContext = () => ({
  db,
  logger,
  zkopruService,
});

// Register GraphQL endpoint
app.register(mercurius, {
  schema,
  context: buildContext,
  resolvers: resolvers as IResolvers,
  graphiql: true,
});

export default app;
