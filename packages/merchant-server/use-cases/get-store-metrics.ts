import { addDays, startOfDay, endOfDay } from 'date-fns';
import { ILogger, IOrderRepository, IProductRepository } from '../common/interfaces';

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
  orderRepository: IOrderRepository;
};

type StoreMetrics = {
  totalProducts: number;
  totalOrders: number;
  totalOrderAmount: number;
  orderHistory: {
    timestamp: Date;
    totalOrders: number;
    totalOrderAmount: number;
  }[]
}

export default async function getStoreMetricsUseCase({ historyDays }: { historyDays: number }, context: Context) : Promise<StoreMetrics> {
  const startDate = startOfDay(addDays(new Date(), historyDays * -1));
  const endDate = endOfDay(addDays(new Date(), -1));

  const [
    { totalProducts },
    { totalOrderAmount, totalOrders },
    history,
  ] = await Promise.all([
    context.productRepository.getProductMetrics(),
    context.orderRepository.getOrderMetrics(),
    context.orderRepository.getDailyOrderMetrics(startDate, endDate),
  ]);

  return {
    totalProducts,
    totalOrders,
    totalOrderAmount,
    orderHistory: history,
  };
}
