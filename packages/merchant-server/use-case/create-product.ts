import { BigNumber } from '@ethersproject/bignumber';
import { IProductRepository, TokenStandard, ILogger } from '../core/interfaces';
import Product from '../domain/product';

export type CreateProductInput = {
  name: string;
  description: string;
  image: string;
  tokenStandard: TokenStandard;
  contract: string;
  tokenId: string;
  availableSupply: number;
  totalSupply: number;
  priceInWei: string;
};

export type UsecaseContext = {
  logger: ILogger;
  productRepository: IProductRepository;
};

export default async function createProductUseCase(productInput: CreateProductInput, context: UsecaseContext) : Promise<Product> {
  // Create domain object
  const product = new Product({
    ...productInput,
    priceInWei: BigNumber.from(productInput.priceInWei),
  });

  // TODO: Validate presence of token in L2 chain

  // Add to repo
  await context.productRepository.createProduct(product);

  return product;
}
