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

// Interface for the service interacting with the Blockchain
export interface IWalletService {
  start: () => void;
  ensureProductAvailability: (product: Product, quantity?: number) => Promise<void>
  executeOrder: (order: Order, params: object) => Promise<string>;
  filterConfirmedOrders: (orders: Order[]) => Promise<Order[]>; // Given a list of orders, return confirmed orders (transactions confirmed on chain)
}

export interface IProductRepository {
  getById: (id: string) => Promise<Product>;
  findProducts: () => Promise<Product[]>;
  productExist: (contractAddress: string, tokenId?: string) => Promise<boolean>;
  createProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
}

export interface IOrderRepository {
  getById: (id: string) => Promise<Order>;
  findOrders: (filters: { status: OrderStatus }) => Promise<Order[]>;
  createOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
}
