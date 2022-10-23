import type { Knex } from 'knex';
import { IProductRepository, ILogger } from '../core/interfaces';
import Product from '../domain/product';

export class ProductRepository implements IProductRepository {
  db: Knex;

  logger: ILogger;

  constructor(db: Knex, context: { logger: ILogger}) {
    this.db = db;
    this.logger = context.logger;
  }

  async createProduct(product: Product) {
    await this.db('products').insert({
      name: product.name,
      description: product.description,
      image_url: product.imageUrl,
      token_standard: product.tokenStandard,
      contract_address: product.contractAddress,
      tokenId: product.tokenId,
      available_supply: product.availableSupply,
      total_supply: product.totalSupply,
      price_in_gwei: product.priceInGwei,
    });
  }
}
