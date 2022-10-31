import Product from './product';

export enum OrderStatus {
  Pending = 'Pending',
  Completed = 'Completed'
}

type IOrder = {
  id: string;
  product: Product;
  quantity: number;
  buyerAddress: string;
  buyerTransaction: string;
  sellerTransaction?: string;
  fee: number;
  amount: number;
  status: OrderStatus;
}

export default class Order {
  id: string;

  product: Product;

  quantity: number;

  buyerAddress: string;

  // Total order amount: quantity * productPrice
  amount: number;

  // Signed transaction for the buy side of the atomic swap (generated by seller)
  // Merchant broadcast both set of transactions to network
  // Hex value of encoded transaction, directly passable to a coordinator
  buyerTransaction: string;

  // Transaction generated by the merchant to transfer the asset to buyer
  // Hex value of encoded transaction, directly passable to a coordinator
  sellerTransaction: string;

  // Transaction fee for the seller transaction
  fee: number;

  status: OrderStatus;

  constructor(args: IOrder) {
    this.id = args.id;
    this.product = args.product;
    this.quantity = args.quantity;
    this.buyerAddress = args.buyerAddress;
    this.buyerTransaction = args.buyerTransaction;
    this.sellerTransaction = args.sellerTransaction;
    this.fee = args.fee;
    this.amount = args.amount;
    this.status = args.status;
  }

  setStatus(newStatus: OrderStatus) {
    this.status = newStatus;
  }
}
