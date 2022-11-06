import {
  ILogger, IBlockchainService, IOrderRepository,
} from '../common/interfaces';
import Order from '../domain/order';

type Context = {
  logger: ILogger;
  orderRepository: IOrderRepository;
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

    if (order.status !== newStatus) {
      context.logger.info(`Updating order status from ${order.status} to ${newStatus} for order ${order.id}`);
      order.setStatus(newStatus);
      // eslint-disable-next-line no-await-in-loop
      await context.orderRepository.updateOrder(order);
    }
  }
}
