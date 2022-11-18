import type { Logger } from 'pino';
import Product from '../domain/product';
import Order, { OrderStatus } from '../domain/order';

// TODO: Can be changed to a custom type to avoid dependency on pino
export type ILogger = Logger;

/* eslint-disable no-shadow */
export enum TokenStandard {
  Erc20 = 'Erc20',
  Erc721 = 'Erc721'
}

export type ProductMetrics = {
  totalProducts: number;
  totalInventoryValue: number;
}

export type DailyOrderSnapshot = {
  timestamp: Date;
  totalOrders: number;
  totalOrderAmount: number;
}

export type OrderMetrics = {
  totalOrders: number;
  totalOrderAmount: number;
  topProductsByAmount: {
    productName: string,
    totalOrderAmount: number
  }[]
  topProductsByQuantity: {
    productName: string,
    totalSold: number
  }[]
  topBuyers: {
    buyerAddress: string;
    totalOrderAmount: number
  }[]
}

// Interface for the service interacting with the Blockchain
export interface IBlockchainService {
  start: () => void;
  ensureProductAvailability: (product: Product, quantity?: number) => Promise<void>
  executeOrder: (order: Order, params: object) => Promise<string>;
  getConfirmationStatusForOrders: (orders: Order[]) => Promise<Record<string, OrderStatus>>; // Given a list of orders, return { orderId: "pending | complete" } based on transaction finalization
  signMessage: (message: string) => Promise<string>
  getWalletAddress: () => string
}

export interface IProductRepository {
  getById: (id: string) => Promise<Product>;
  findProducts: () => Promise<Product[]>;
  productExist: (contractAddress: string, tokenId?: string) => Promise<boolean>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  getProductMetrics: () => Promise<ProductMetrics>;
}

export interface IOrderRepository {
  getById: (id: string) => Promise<Order>;
  findOrders: (filters?: { status?: OrderStatus, productId?: string }) => Promise<Order[]>;
  createOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
  getOrderMetrics: (startDate: Date, endDate: Date) => Promise<OrderMetrics>;
  getDailyOrderMetrics: (startDate: Date, endDate: Date) => Promise<DailyOrderSnapshot[]>;
}
