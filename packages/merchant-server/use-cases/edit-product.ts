import {
  IProductRepository, ILogger, IBlockchainService,
} from '../common/interfaces';
import Product from '../domain/product';

type EditProductInput = {
  id: string;
  productData: {
    name: string;
    description?: string;
    imageUrl?: string;
    availableQuantity: number;
    price: number;
  }
};

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
  blockchainService: IBlockchainService;
};

export default async function editProductUseCase(productInput: EditProductInput, context: Context) : Promise<Product> {
  const { id, productData } = productInput;

  // Get product
  const product = await context.productRepository.getById(id);

  product.name = productData.name;
  product.description = productData.description;
  product.imageUrl = productData.imageUrl;
  product.availableQuantity = productData.availableQuantity;
  product.price = productData.price;

  product.updatedAt = new Date(); // TODO: Check value change before changing date

  // Ensure the new quantity is available in the wallet
  await context.blockchainService.ensureProductAvailability(product, product.availableQuantity);

  // Add to repo
  await context.productRepository.updateProduct(product);

  return product;
}
