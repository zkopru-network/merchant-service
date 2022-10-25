/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */

import type { Logger } from 'pino';
import Product from '../domain/product';
import Order from '../domain/order';

// TODO: Can be changed to a custom type to avoid dependency on pino
export type ILogger = Logger;

export enum TokenStandard {
  Erc20 = 'Erc20',
  Erc721 = 'Erc721'
}

// Interface for the service interacting with the Blockchain
export interface IWalletService {
  start: () => void;
  ensureProductAvailability: (product: Product, quantity?: number) => Promise<void>
}

export interface IProductRepository {
  getById: (id: string) => Promise<Product>;
  findProducts: () => Promise<Product[]>;
  productExist: (contractAddress: string, tokenId?: string) => Promise<boolean>;
  createProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
}
