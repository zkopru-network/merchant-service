import { ILogger, IProductRepository } from '../common/interfaces';
import Order from '../domain/product';

type Context = {
  logger: ILogger;
  productRepository: IProductRepository;
};

export default async function getProductUseCase(id: string, context: Context) : Promise<Order> {
  const product = await context.productRepository.getById(id);

  return product;
}
