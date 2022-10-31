import {
  ILogger, IWalletService, IOrderRepository,
} from '../common/interfaces';
import Order, { OrderStatus } from '../domain/order';

type Context = {
  logger: ILogger;
  orderRepository: IOrderRepository;
  walletService: IWalletService;
};

export default async function updateExistingOrderStatusUseCase(context: Context) : Promise<Order> {
  context.logger.debug('Starting updateExistingOrderStatus use-case');

  const pendingOrders = await context.orderRepository.findOrders({ status: OrderStatus.Pending });

  if (pendingOrders.length === 0) {
    return;
  }

  context.logger.info(`Checking order status for ${pendingOrders.length} orders`);

  const confirmedOrders = await context.walletService.filterConfirmedOrders(pendingOrders);

  for (const order of confirmedOrders) {
    context.logger.info(`Updating order status to Confirmed for order ${order.id}`);
    order.setStatus(OrderStatus.Complete);
    // eslint-disable-next-line no-await-in-loop
    await context.orderRepository.updateOrder(order);
  }
}
