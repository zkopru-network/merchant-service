import { IProductRepository, ILogger } from '../common/interfaces';
import Product from '../domain/product';

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
};

export default async function createProductUseCase(context: Context) : Promise<Product[]> {
  const result = await context.productRepository.findProducts();
  return result;
}
