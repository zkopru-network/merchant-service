import { IProductRepository, ILogger } from '../common/interfaces';
import Product from '../domain/product';

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
};

export default async function findProductsUseCase({ onlyActive = true }, context: Context) : Promise<Product[]> {
  const result = await context.productRepository.findProducts();

  if (onlyActive) {
    return result.filter(p => p.isActive)
  }

  return result;
}
