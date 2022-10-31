import type { Knex, Tables } from 'knex';
import { IOrderRepository, ILogger } from '../../common/interfaces';
import Order, { OrderStatus } from '../../domain/order';
import { ProductRepository } from './product-repository';

export class OrderRepository implements IOrderRepository {
  db: Knex;

  logger: ILogger;

  constructor(db: Knex, context: { logger: ILogger}) {
    this.db = db;
    this.logger = context.logger;
  }

  private mapDBRowToOrder(dbRow: Tables['orders'] & Tables['products']) {
    let status;
    if (dbRow.status === 'Complete') { status = OrderStatus.Complete; }
    if (dbRow.status === 'Pending') { status = OrderStatus.Pending; }

    return new Order({
      id: dbRow.id,
      product: ProductRepository.mapDBRowToProduct({ ...dbRow, id: dbRow.product_id }),
      quantity: dbRow.quantity,
      amount: dbRow.amount,
      buyerAddress: dbRow.buyer_address,
      buyerTransaction: dbRow.buyer_transaction,
      sellerTransaction: dbRow.seller_transaction,
      fee: dbRow.fee,
      status,
    });
  }

  private mapOrderToDbRow(order: Order) {
    return {
      id: order.id,
      product_id: order.product.id,
      quantity: order.quantity,
      amount: order.amount,
      buyer_address: order.buyerAddress,
      buyer_transaction: order.buyerTransaction,
      seller_transaction: order.sellerTransaction,
      fee: order.fee,
      status: order.status.toString(),
    };
  }

  async getById(id: string) : Promise<Order> {
    const rows = await this.db('orders').select('*').where({ id });

    if (rows.length !== 1) {
      throw new Error(`Cannot find order with id ${id}`);
    }

    return this.mapDBRowToOrder(rows[0]);
  }

  async findOrders(filters: { status: OrderStatus }) : Promise<Order[]> {
    const rows = await this.db.from('orders')
      .innerJoin('products', 'orders.product_id', 'products.id')
      .modify((qb) => {
        if (filters.status) {
          qb.where('orders.status', filters.status.toString());
        }
      })
      .select('*', 'orders.id');

    return rows.map(this.mapDBRowToOrder);
  }

  async createOrder(order: Order) {
    await this.db('orders').insert(
      this.mapOrderToDbRow(order),
    );
  }

  async updateOrder(order: Order) {
    await this.db('orders').update(
      this.mapOrderToDbRow(order),
    ).where({ id: order.id });
  }
}
