import createProductUseCase from '../use-case/create-product';
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

      // Convert domain to DTO
      return createdProduct;
    },
  },
};

export default resolvers;
