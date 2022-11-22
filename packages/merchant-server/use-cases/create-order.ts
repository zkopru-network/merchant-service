import { v4 as uuid } from 'uuid';
import {
  ILogger, IBlockchainService, IOrderRepository, IProductRepository,
} from '../common/interfaces';
import Order, { OrderStatus } from '../domain/order';

type CreateOrderInput = {
  productId: string;
  quantity: number;
  buyerAddress: string;
  buyerTransaction: string;
  atomicSwapSalt: number;
};

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
  orderRepository: IOrderRepository;
  blockchainService: IBlockchainService;
};

const ORDER_FEE = 48000; // 0.1 ETH - Fee merchant would like to pay for the sell tx.

export default async function createOrderUseCase(orderInput: CreateOrderInput, context: Context) : Promise<Order> {
  const product = await context.productRepository.getById(orderInput.productId);

  // Create domain object
  const order = new Order({
    id: uuid(),
    ...orderInput,
    product,
    amount: orderInput.quantity * product.price,
    fee: ORDER_FEE,
    status: OrderStatus.Pending,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Ensure the token/quantity is available in the wallet
  await context.blockchainService.ensureProductAvailability(product, orderInput.quantity);

  // Create swap transaction and broadcast to blockchain
  const { buyerTransactionHash, sellerTransaction, sellerTransactionHash } = await context.blockchainService.executeOrder(order, { atomicSwapSalt: orderInput.atomicSwapSalt });
  order.sellerTransaction = sellerTransaction;
  order.buyerTransactionHash = buyerTransactionHash;
  order.sellerTransactionHash = sellerTransactionHash;

  // Deduct quantity from product's available quantity
  product.availableQuantity -= order.quantity;

  // Persist in DB
  await context.orderRepository.createOrder(order);
  await context.productRepository.updateProduct(product);

  return order;
}
