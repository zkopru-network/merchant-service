/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */

import type { Logger } from 'pino';
import Product from '../domain/product';

export enum TokenStandard {
  Erc20 = 'Erc20',
  Erc721 = 'Erc721'
}

export interface IProductRepository {
  productExist: (contractAddress: string, tokenId?: string) => Promise<boolean>;
  findProducts: () => Promise<Product[]>;
  createProduct: (product: Product) => Promise<void>;
}

export type ILogger = Logger;

export interface IWalletService {
  start: () => void;
  ensureProductAvailability: (args: { product: Product; quantity?: number }) => Promise<void>
}
