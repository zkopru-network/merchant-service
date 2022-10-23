import { v4 as uuid } from 'uuid';
import { IProductRepository, TokenStandard, ILogger } from '../core/interfaces';
import Product from '../domain/product';

type CreateProductInput = {
  name: string;
  description?: string;
  image?: string;
  tokenStandard: TokenStandard;
  contractAddress: string;
  tokenId?: string;
  availableQuantity: number;
  priceInGwei: number;
};

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
};

export default async function createProductUseCase(productInput: CreateProductInput, context: Context) : Promise<Product> {
  // Create domain object
  const product = new Product({
    id: uuid(),
    ...productInput,
  });

  // TODO: Validate presence of token in L2 chain

  // Add to repo
  await context.productRepository.createProduct(product);

  return product;
}
