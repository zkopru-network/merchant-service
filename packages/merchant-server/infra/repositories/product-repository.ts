import BN from 'bn.js';
import type { Knex, Tables } from 'knex';
import { IProductRepository, ILogger, TokenStandard } from '../../common/interfaces';
import Product from '../../domain/product';

export class ProductRepository implements IProductRepository {
  db: Knex;

  logger: ILogger;

  constructor(db: Knex, context: { logger: ILogger}) {
    this.db = db;
    this.logger = context.logger;
  }

  static mapDBRowToProduct(dbRow: Tables['products']) {
    let tokenStandard : TokenStandard;
    if (dbRow.token_standard === TokenStandard.Erc20.toString()) {
      tokenStandard = TokenStandard.Erc20;
    }
    if (dbRow.token_standard === TokenStandard.Erc721.toString()) {
      tokenStandard = TokenStandard.Erc721;
    }

    return new Product({
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      imageUrl: dbRow.image_url,
      tokenId: dbRow.token_id,
      tokenStandard,
      contractAddress: dbRow.contract_address,
      availableQuantity: new BN(dbRow.available_quantity.toString()),
      price: new BN(dbRow.price.toString()),
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    });
  }

  private static mapProductToDbRow(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      image_url: product.imageUrl,
      token_id: product.tokenId,
      token_standard: product.tokenStandard.toString(),
      contract_address: product.contractAddress,
      available_quantity: product.availableQuantity.toString(),
      price: product.price.toString(),
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    };
  }

  async getById(id: string) : Promise<Product> {
    const rows = await this.db('products').select('*').where({ id });

    if (rows.length !== 1) {
      throw new Error(`Cannot find product with id ${id}`);
    }

    return ProductRepository.mapDBRowToProduct(rows[0]);
  }

  async findProducts() : Promise<Product[]> {
    const rows = await this.db('products').select('*');
    return rows.map(ProductRepository.mapDBRowToProduct);
  }

  async addProduct(product: Product) {
    await this.db('products').insert(
      ProductRepository.mapProductToDbRow(product),
    );
  }

  async updateProduct(product: Product) {
    await this.db('products').update(
      ProductRepository.mapProductToDbRow(product),
    ).where({ id: product.id });
  }

  async productExist(contractAddress: string, tokenId?: string) : Promise<boolean> {
    const rows = await this.db('products').count('id').where({
      contract_address: contractAddress,
      ...tokenId && { token_id: tokenId },
    });

    const exists = rows[0]?.count && Number(rows[0]?.count) > 0;

    return exists;
  }

  async getProductMetrics() : Promise<{ totalProducts: number; totalInventoryValue: BN; }> {
    const [stats] = await this.db('products')
      .select<{ totalProducts: number, totalInventoryValue: string }[]>(
        this.db.raw('SUM(1) as "totalProducts"'),
        this.db.raw('SUM("price" * "available_quantity" / 1000000000000000000) as "totalInventoryValue"'),
      );

    const inventoryValue = stats.totalInventoryValue?.split('.')[0] || 0;

    return {
      totalProducts: Number(stats.totalProducts),
      totalInventoryValue: new BN(inventoryValue),
    };
  }
}
