import { IProductRepository, TokenStandard, ILogger } from '../core/interfaces';
import Product from '../domain/product';

export type CreateProductInput = {
  name: string;
  description?: string;
  image?: string;
  tokenStandard: TokenStandard;
  contractAddress: string;
  tokenId?: string;
  availableSupply: number;
  totalSupply: number;
  priceInGwei: number;
};

export type UsecaseContext = {
  logger: ILogger;
  productRepository: IProductRepository;
};

export default async function createProductUseCase(productInput: CreateProductInput, context: UsecaseContext) : Promise<Product> {
  // Create domain object
  const product = new Product({
    ...productInput,
  });

  // TODO: Validate presence of token in L2 chain

  // Add to repo
  await context.productRepository.createProduct(product);

  return product;
}
