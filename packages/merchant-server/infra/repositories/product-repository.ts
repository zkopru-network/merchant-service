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

  private mapDBRowToProduct(dbRow: Tables['products']) {
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
      token_id: product.tokenId,
      token_standard: product.tokenStandard.toString(),
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

  async productExist(contractAddress: string, tokenId?: string) : Promise<boolean> {
    const rows = await this.db('products').count('id').where({
      contract_address: contractAddress,
      ...tokenId && { token_id: tokenId },
    });

    const exists = rows[0]?.count && Number(rows[0]?.count) > 0;

    return exists;
  }
}
