import {
  ILogger, IBlockchainService, IOrderRepository, IProductRepository,
} from '../common/interfaces';
import Order, { OrderStatus } from '../domain/order';

type Context = {
  logger: ILogger;
  orderRepository: IOrderRepository;
  productRepository: IProductRepository;
  blockchainService: IBlockchainService;
};

export default async function updateExistingOrderStatusUseCase(context: Context) : Promise<Order> {
  context.logger.debug('Starting updateExistingOrderStatus use-case');

  // Get all orders
  const allOrders = await context.orderRepository.findOrders();

  if (allOrders.length === 0) {
    return;
  }

  context.logger.debug(`Checking order status for ${allOrders.length} orders`);

  const newOrderStatuses = await context.blockchainService.getConfirmationStatusForOrders(allOrders);

  for (const order of allOrders) {
    const newStatus = newOrderStatuses[order.id];

    if (order.status === OrderStatus.Complete && newStatus === OrderStatus.Pending) {
      // Revert product's available quantity
      // eslint-disable-next-line no-await-in-loop
      const product = await context.productRepository.getById(order.product.id);
      product.availableQuantity = product.availableQuantity.add(order.quantity);
      context.productRepository.updateProduct(product);
    }

    if (order.status !== newStatus) {
      context.logger.info(`Updating order status from ${order.status} to ${newStatus} for order ${order.id}`);
      order.setStatus(newStatus);
      order.updatedAt = new Date();
      // eslint-disable-next-line no-await-in-loop
      await context.orderRepository.updateOrder(order);
    }
  }
}
