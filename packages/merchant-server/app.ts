import fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import { buildContext, schema } from './infra/graphql/graphql';
import { createLogger } from './common/logger';
import ZkopruService from './infra/services/zkopru-service';
import { connectDB } from './infra/db/db';
import updateExistingOrderStatusUseCase from './use-cases/update-existing-order-status';
import { OrderRepository } from './infra/repositories/order-repository';
import { AuthenticationError } from './common/error';
import { ProductRepository } from './infra/repositories/product-repository';

const logger = createLogger();

// Create server
const app = fastify({ logger });

app.register(cors, {
  origin: '*',
});

// Initialize DB connection
const db = connectDB({ logger });

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
  logger.debug('Starting zkopru node');
  await zkopruService.start();
  logger.debug('Started zkopru node successfully');

  // Execute updateExistingOrderStatusUseCase periodically
  async function updateOrderStatus() {
    await updateExistingOrderStatusUseCase({
      logger,
      orderRepository: new OrderRepository(db, { logger }),
      productRepository: new ProductRepository(db, { logger }),
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
  errorFormatter: (result) => ({ statusCode: (result.errors[0].originalError as AuthenticationError)?.statusCode ?? 200, response: result }),
  errorHandler(error, request, reply) {
    logger.error(error);
    reply.send({ errors: error.errors || [{ message: 'Unexpected error ocurred' }] });
  },
});

export default app;
