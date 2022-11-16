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

  private mapDBRowToOrder(dbRow: Tables['orders'] & Tables['products'] & { product_created_at: Date, product_updated_at: Date }) {
    let status;
    if (dbRow.status === 'Complete') { status = OrderStatus.Complete; }
    if (dbRow.status === 'Pending') { status = OrderStatus.Pending; }

    return new Order({
      id: dbRow.id,
      product: ProductRepository.mapDBRowToProduct({
        ...dbRow, id: dbRow.product_id, created_at: dbRow.product_created_at, updated_at: dbRow.product_updated_at,
      }),
      quantity: dbRow.quantity,
      amount: dbRow.amount,
      buyerAddress: dbRow.buyer_address,
      buyerTransaction: dbRow.buyer_transaction,
      sellerTransaction: dbRow.seller_transaction,
      fee: dbRow.fee,
      status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
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
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  async getById(id: string) : Promise<Order> {
    const rows = await this.db('orders').select('*').where({ id });

    if (rows.length !== 1) {
      throw new Error(`Cannot find order with id ${id}`);
    }

    return this.mapDBRowToOrder(rows[0]);
  }

  async findOrders(filters?: { status: OrderStatus, productId: string }) : Promise<Order[]> {
    const rows = await this.db.from('orders')
      .innerJoin('products', 'orders.product_id', 'products.id')
      .modify((qb) => {
        if (filters?.status) {
          qb.where('orders.status', filters.status.toString());
        }
        if (filters?.productId) {
          qb.where('orders.product_id', filters.productId);
        }
      })
      .select(
        '*',
        'orders.id as id',
        'orders.created_at as created_at',
        'orders.updated_at as updated_at',
        'products.created_at as product_created_at',
        'products.updated_at as product_updated_at',
      );

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
