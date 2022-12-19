import BN from 'bn.js';
import Product from './product';

// eslint-disable-next-line no-shadow
export enum OrderStatus {
  Pending = 'Pending',
  Complete = 'Complete',
}

type IOrder = {
  id: string;
  product: Product;
  quantity: BN;
  buyerAddress: string;
  buyerTransaction: string;
  buyerTransactionHash?: string;
  sellerTransaction?: string;
  sellerTransactionHash?: string;
  fee?: BN;
  amount: BN;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export default class Order {
  id: string;

  product: Product;

  quantity: BN;

  buyerAddress: string;

  // Total order amount: quantity * productPrice
  amount: BN;

  // Signed transaction for the buy side of the atomic swap (generated by seller)
  // Merchant broadcast both set of transactions to network
  // Hex value of encoded transaction, directly passable to a coordinator
  buyerTransaction: string;

  buyerTransactionHash: string;

  // Transaction generated by the merchant to transfer the asset to buyer
  // Hex value of encoded transaction, directly passable to a coordinator
  sellerTransaction: string;

  sellerTransactionHash: string;

  // Transaction fee for the seller transaction
  fee: BN;

  status: OrderStatus;

  createdAt: Date;

  updatedAt: Date;

  constructor(args: IOrder) {
    this.id = args.id;
    this.product = args.product;
    this.quantity = args.quantity;
    this.buyerAddress = args.buyerAddress;
    this.buyerTransaction = args.buyerTransaction;
    this.buyerTransactionHash = args.buyerTransactionHash;
    this.sellerTransaction = args.sellerTransaction;
    this.sellerTransactionHash = args.sellerTransactionHash;
    this.fee = args.fee;
    this.amount = args.amount;
    this.status = args.status;
    this.createdAt = args.createdAt;
    this.updatedAt = args.updatedAt;
  }

  setStatus(newStatus: OrderStatus) {
    this.status = newStatus;
  }
}
