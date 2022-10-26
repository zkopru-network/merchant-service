import fastify from 'fastify';
import mercurius, { IResolvers } from 'mercurius';
import { schema } from './infra/graphql';
import { createLogger } from './common/logger';
import resolvers from './infra/resolvers';
import ZkopruService from './infra/services/zkopru-service';
import { connectDB } from './infra/db';

const logger = createLogger();

// Create server
const app = fastify({ logger });

// Initialize DB connection
const db = connectDB();

// Initialize Zkopru service
const zkopruService = new ZkopruService({
  websocketUrl: process.env.WEBSOCKET_URL,
  contractAddress: process.env.ZKOPRU_CONTRACT_ADDRESS,
  accountPrivateKey: process.env.WALLET_PRIVATE_KEY,
}, {
  logger,
});

// Start ZKopru client when server starts
app.addHook('onReady', () => {
  zkopruService.start();
});

// Register GraphQL endpoint
export const buildContext = () => ({
  db,
  logger,
  zkopruService,
});

app.register(mercurius, {
  schema,
  context: buildContext,
  resolvers: resolvers as IResolvers,
  graphiql: true,
});

export default app;
