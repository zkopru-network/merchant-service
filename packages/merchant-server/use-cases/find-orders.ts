import { ILogger, IOrderRepository } from '../common/interfaces';
import Order, { OrderStatus } from '../domain/order';

type Context = {
  logger: ILogger;
  orderRepository: IOrderRepository;
};

type FindOrdersInput = {
  status?: OrderStatus
}

export default async function findOrdersUseCase(findOrdersInput: FindOrdersInput, context: Context) : Promise<Order[]> {
  const result = await context.orderRepository.findOrders({ status: findOrdersInput.status });
  return result;
}
