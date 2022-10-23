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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapDBRowToProduct(dbRow: any) {
    return new Product({
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      imageUrl: dbRow.image_url,
      tokenStandard: dbRow.token_standard,
      contractAddress: dbRow.contract_address,
      availableQuantity: dbRow.available_quantity,
      priceInGwei: dbRow.price_in_gwei,
    });
  }

  private mapProductToDbRow(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      image_url: product.imageUrl,
      token_standard: product.tokenStandard,
      contract_address: product.contractAddress,
      available_quantity: product.availableQuantity,
      price_in_gwei: product.priceInGwei,
    };
  }

  async findProducts() : Promise<Product[]> {
    const rows = await this.db('products').select('*');
    return rows.map(this.mapDBRowToProduct);
  }

  async createProduct(product: Product) {
    await this.db('products').insert(
      this.mapProductToDbRow(product),
    );
  }
}
