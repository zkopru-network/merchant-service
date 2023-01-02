import { BN } from 'bn.js';
import {
  addDays, startOfDay, endOfDay, isBefore, isSameDay, isAfter,
} from 'date-fns';
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

  if (isAfter(startDate, endDate)) {
    throw new Error('startDate cannot be after endDate');
  }

  const [
    { totalProducts, totalInventoryValue },
    {
      totalOrderAmount, totalOrders, topProductsByAmount, topProductsByQuantity,
    },
    dailyOrderSnapshots,
  ] = await Promise.all([
    context.productRepository.getProductMetrics(),
    context.orderRepository.getOrderMetrics(startDate, endDate),
    context.orderRepository.getDailyOrderMetrics(startDate, endDate),
  ]);

  const allDayOrderSnapshots = [];
  let currentDate = startDate;
  while (isBefore(currentDate, endDate)) {
    // eslint-disable-next-line no-loop-func
    const metricsForDay = dailyOrderSnapshots.find((d) => isSameDay(d.timestamp, currentDate));
    allDayOrderSnapshots.push({
      timestamp: currentDate,
      totalOrders: metricsForDay ? metricsForDay.totalOrders : 0,
      totalOrderAmount: metricsForDay ? metricsForDay.totalOrderAmount : new BN('0'),
    });
    currentDate = addDays(currentDate, 1);
  }

  return {
    totalProducts,
    totalInventoryValue,
    totalOrders,
    totalOrderAmount,
    topProductsByAmount,
    topProductsByQuantity,
    dailyOrderSnapshots: allDayOrderSnapshots,
  };
}
