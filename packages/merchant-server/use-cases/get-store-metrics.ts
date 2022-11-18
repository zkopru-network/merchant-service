import { addDays, startOfDay, endOfDay } from 'date-fns';
import {
  DailyOrderSnapshot, ILogger, IOrderRepository, IProductRepository, OrderMetrics, ProductMetrics,
} from '../common/interfaces';

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
  orderRepository: IOrderRepository;
};

type Filters = {
  startDate?: Date,
  endDate?: Date,
}

type StoreMetrics = ProductMetrics & OrderMetrics & {
  dailyOrderSnapshots: DailyOrderSnapshot[]
}

const DEFAULT_DIFF_DAYS = 30;

export default async function getStoreMetricsUseCase(args: Filters, context: Context) : Promise<StoreMetrics> {
  let { startDate, endDate } = args;

  startDate = startDate || startOfDay(addDays(new Date(), DEFAULT_DIFF_DAYS * -1));
  endDate = endDate || endOfDay(addDays(new Date(), -1));

  const [
    { totalProducts, totalInventoryValue },
    {
      totalOrderAmount, totalOrders, topProducts, topBuyers,
    },
    dailyOrderSnapshots,
  ] = await Promise.all([
    context.productRepository.getProductMetrics(),
    context.orderRepository.getOrderMetrics(startDate, endDate),
    context.orderRepository.getDailyOrderMetrics(startDate, endDate),
  ]);

  return {
    totalProducts,
    totalInventoryValue,
    totalOrders,
    totalOrderAmount,
    topProducts,
    topBuyers,
    dailyOrderSnapshots,
  };
}
