import { BN } from 'bn.js';
import { v4 as uuid } from 'uuid';
import { fromWei } from 'web3-utils';
import {
  ILogger, IBlockchainService, IOrderRepository, IProductRepository,
} from '../common/interfaces';
import Order, { OrderStatus } from '../domain/order';

type CreateOrderInput = {
  productId: string;
  quantity: string;
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

export default async function createOrderUseCase(orderInput: CreateOrderInput, context: Context) : Promise<Order> {
  const product = await context.productRepository.getById(orderInput.productId);

  const quantity = new BN(orderInput.quantity);

  // Create domain object
  const order = new Order({
    id: uuid(),
    ...orderInput,
    product,
    quantity,
    amount: new BN(fromWei(quantity.mul(product.price))),
    status: OrderStatus.Pending,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Ensure the token/quantity is available in the wallet
  await context.blockchainService.ensureProductAvailability(product, quantity);

  // Create swap transaction and broadcast to blockchain
  const {
    buyerTransactionHash, sellerTransaction, sellerTransactionHash, fee,
  } = await context.blockchainService.executeOrder(order, { atomicSwapSalt: orderInput.atomicSwapSalt });

  order.sellerTransaction = sellerTransaction;
  order.buyerTransactionHash = buyerTransactionHash;
  order.sellerTransactionHash = sellerTransactionHash;
  order.fee = new BN(fee);

  // Deduct quantity from product's available quantity
  product.availableQuantity = product.availableQuantity.sub(order.quantity);

  // Persist in DB
  await context.orderRepository.createOrder(order);
  await context.productRepository.updateProduct(product);

  return order;
}
