import type { MercuriusContext } from 'mercurius';
import createProductUseCase from '../use-cases/create-product';
import findProductsUseCase from '../use-cases/find-products';
import { Resolvers } from '../types/graphql.d';
import { ProductRepository } from './repositories/product-repository';
import editProductUseCase from '../use-cases/edit-product';
import { OrderRepository } from './repositories/order-repository';
import createOrderUseCase from '../use-cases/create-order';

const resolvers : Resolvers<MercuriusContext> = {
  Mutation: {
    async createProduct(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });

      const createdProduct = await createProductUseCase(args.product, {
        walletService: context.zkopruService,
        productRepository: productRepo,
        logger: context.logger,
      });

      return createdProduct;
    },
    async editProduct(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });

      const createdProduct = await editProductUseCase({ id: args.id, productData: args.productData }, {
        walletService: context.zkopruService,
        productRepository: productRepo,
        logger: context.logger,
      });

      return createdProduct;
    },
    async createOrder(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });
      const orderRepo = new OrderRepository(context.db, { logger: context.logger });

      const createdOrder = await createOrderUseCase(args.order, {
        walletService: context.zkopruService,
        productRepository: productRepo,
        orderRepository: orderRepo,
        logger: context.logger,
      });

      return createdOrder;
    },
  },
  Query: {
    async findProducts(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });

      const products = await findProductsUseCase({
        productRepository: productRepo,
        logger: context.logger,
      });

      return products;
    },
  },
};

export default resolvers;
