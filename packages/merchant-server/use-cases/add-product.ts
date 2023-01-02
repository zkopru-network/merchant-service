import { BN } from 'bn.js';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../common/error';
import {
  IProductRepository, TokenStandard, ILogger, IBlockchainService,
} from '../common/interfaces';
import Product from '../domain/product';

type AddProductInput = {
  name: string;
  description?: string;
  imageUrl?: string;
  tokenStandard: TokenStandard;
  contractAddress: string;
  tokenId?: string;
  availableQuantity: string;
  price: string;
};

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
  blockchainService: IBlockchainService;
};

export default async function addProductUseCase(productInput: AddProductInput, context: Context) : Promise<Product> {
  // Create domain object
  const product = new Product({
    id: uuid(),
    ...productInput,
    availableQuantity: new BN(productInput.availableQuantity),
    price: new BN(productInput.price),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Check for existing product with same token
  const productExists = await context.productRepository.productExist(product.contractAddress, product.tokenId);
  if (productExists) {
    throw new ValidationError('Another product exists with the same contract/tokenId');
  }

  // Ensure the token/quantity is available in the wallet
  await context.blockchainService.ensureProductAvailability(product, product.availableQuantity);

  // Add to repo
  await context.productRepository.addProduct(product);

  return product;
}
