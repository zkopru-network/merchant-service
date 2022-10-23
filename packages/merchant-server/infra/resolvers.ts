import createProductUseCase from '../use-case/create-product';
import findProductsUseCase from '../use-case/find-products';
import { Resolvers } from '../types/graphql.d';
import type { GraphQLContext } from './graphql';
import { ProductRepository } from '../repository/product-repository';

const resolvers : Resolvers<GraphQLContext> = {
  Mutation: {
    async createProduct(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });

      const createdProduct = await createProductUseCase(args.product, {
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
