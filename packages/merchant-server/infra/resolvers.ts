import type { MercuriusContext } from 'mercurius';
import createProductUseCase from '../use-cases/create-product';
import findProductsUseCase from '../use-cases/find-products';
import { Resolvers } from '../types/graphql.d';
import { ProductRepository } from './repositories/product-repository';

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
