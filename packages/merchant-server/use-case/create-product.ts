import { v4 as uuid } from 'uuid';
import {
  IProductRepository, TokenStandard, ILogger, IWalletService,
} from '../core/interfaces';
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
  walletService: IWalletService;
};

export default async function createProductUseCase(productInput: CreateProductInput, context: Context) : Promise<Product> {
  // Create domain object
  const product = new Product({
    id: uuid(),
    ...productInput,
  });

  // Ensure the token is available in the wallet
  context.walletService.ensureProductAvailability({ product, quantity: product.availableQuantity });

  // Add to repo
  await context.productRepository.createProduct(product);

  return product;
}
