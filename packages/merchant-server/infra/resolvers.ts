import type { MercuriusContext } from 'mercurius';
import createProductUseCase from '../use-cases/create-product';
import findProductsUseCase from '../use-cases/find-products';
import { Resolvers } from '../types/graphql.d';
import { ProductRepository } from './repositories/product-repository';
import editProductUseCase from '../use-cases/edit-product';
import { OrderRepository } from './repositories/order-repository';
import createOrderUseCase from '../use-cases/create-order';
import findOrdersUseCase from '../use-cases/find-orders';
import getOrderUseCase from '../use-cases/get-order';
import Order from '../domain/order';
import Product from '../domain/product';
import signInUseCase from '../use-cases/sign-in';

function productToDTO(product: Product) {
  return {
    ...product,
    createdAt: product.createdAt.getTime(),
    updatedAt: product.updatedAt.getTime(),
  };
}

function orderToDTO(order: Order) {
  return {
    ...order,
    createdAt: order.createdAt.getTime(),
    updatedAt: order.updatedAt.getTime(),
    product: productToDTO(order.product),
  };
}

const resolvers : Resolvers<MercuriusContext> = {
  Mutation: {
    async signIn(_, args, context) {
      const authToken = await signInUseCase(args, {
        blockchainService: context.zkopruService,
        logger: context.logger,
      });

      return authToken;
    },
    async createProduct(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });

      const createdProduct = await createProductUseCase(args.product, {
        blockchainService: context.zkopruService,
        productRepository: productRepo,
        logger: context.logger,
      });

      return productToDTO(createdProduct);
    },
    async editProduct(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });

      const editedProduct = await editProductUseCase({ id: args.id, productData: args.productData }, {
        blockchainService: context.zkopruService,
        productRepository: productRepo,
        logger: context.logger,
      });

      return productToDTO(editedProduct);
    },
    async createOrder(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });
      const orderRepo = new OrderRepository(context.db, { logger: context.logger });

      const createdOrder = await createOrderUseCase(args.order, {
        blockchainService: context.zkopruService,
        productRepository: productRepo,
        orderRepository: orderRepo,
        logger: context.logger,
      });

      return orderToDTO(createdOrder);
    },
  },
  Query: {
    async findProducts(_, args, context) {
      const productRepo = new ProductRepository(context.db, { logger: context.logger });

      const products = await findProductsUseCase({
        productRepository: productRepo,
        logger: context.logger,
      });

      return products.map(productToDTO);
    },
    async findOrders(_, args, context) {
      const ordersRepo = new OrderRepository(context.db, { logger: context.logger });

      const orders = await findOrdersUseCase({ status: args.status }, {
        orderRepository: ordersRepo,
        logger: context.logger,
      });

      return orders.map(orderToDTO);
    },
    async getOrder(_, args, context) {
      const ordersRepo = new OrderRepository(context.db, { logger: context.logger });

      const order = await getOrderUseCase(args.id, {
        orderRepository: ordersRepo,
        logger: context.logger,
      });

      return orderToDTO(order);
    },
  },
};

export default resolvers;
