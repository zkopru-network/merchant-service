import fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import { buildContext, schema } from './infra/graphql';
import { createLogger } from './common/logger';
import ZkopruService from './infra/services/zkopru-service';
import { connectDB } from './infra/db';
import updateExistingOrderStatusUseCase from './use-cases/update-existing-order-status';
import { OrderRepository } from './infra/repositories/order-repository';
import { AuthenticationError } from './common/error';

const logger = createLogger();

// Create server
const app = fastify({ logger });

app.register(cors, {
  origin: 'http://localhost:4000', // Whitelist local merchant-admin for CORS
});

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
app.addHook('onReady', async () => {
  await zkopruService.start();

  // Execute updateExistingOrderStatusUseCase periodically
  async function updateOrderStatus() {
    await updateExistingOrderStatusUseCase({
      logger,
      orderRepository: new OrderRepository(db, { logger }),
      blockchainService: zkopruService,
    });
    setTimeout(updateOrderStatus, 10 * 1000);
  }

  updateOrderStatus();
});

// Register GraphQL endpoint
app.register(mercurius, {
  schema,
  context: (req) => buildContext(req, logger, zkopruService, db),
  graphiql: true,
  errorFormatter: (result) => ({ statusCode: (result.errors[0].originalError as AuthenticationError)?.statusCode, response: result }),
});

export default app;
