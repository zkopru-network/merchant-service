import { ILogger, IOrderRepository } from '../common/interfaces';
import Order from '../domain/order';

type Context = {
  logger: ILogger;
  orderRepository: IOrderRepository;
};

export default async function getOrderUseCase(id: string, context: Context) : Promise<Order> {
  const order = await context.orderRepository.getById(id);

  return order;
}
