/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */

import type { Logger } from 'pino';
import Product from '../domain/product';

export enum TokenStandard {
  Erc20,
  Erc721
}

export interface IProductRepository {
  createProduct: (product: Product) => Promise<void>;
}

export type ILogger = Logger;

export interface WalletService {
  start: () => void;
  ensureProductAvailability: (args: { product: Product; quantity?: number }) => Promise<void>
}
