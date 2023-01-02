import BN from 'bn.js';
import { toWei } from 'web3-utils';
import { ValidationError } from '../common/error';
import { TokenStandard } from '../common/interfaces';

type IProduct = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tokenStandard: TokenStandard;
  contractAddress: string;
  tokenId?: string;
  availableQuantity: BN;
  price: BN;
  createdAt: Date;
  updatedAt: Date;
}

export default class Product {
  id: string;

  name: string;

  description: string;

  imageUrl: string;

  tokenStandard: TokenStandard;

  contractAddress: string;

  tokenId: string;

  price: BN;

  availableQuantity: BN;

  createdAt: Date;

  updatedAt: Date;

  get isActive() {
    return this.availableQuantity.gt(new BN(toWei('0')))
  }

  constructor(args: IProduct) {
    this.id = args.id;
    this.name = args.name;
    this.description = args.description;
    this.imageUrl = args.imageUrl;
    this.tokenStandard = args.tokenStandard;
    this.contractAddress = args.contractAddress;
    this.price = args.price;

    if (args.tokenStandard === TokenStandard.Erc721) {
      if (!args.tokenId) {
        throw new ValidationError('tokenId is required for Erc721 type token.');
      }

      if (!args.availableQuantity.eq(new BN(toWei('1'))) && !args.availableQuantity.eq(new BN('0'))) {
        throw new ValidationError('Erc721 type token cannot have more than one quantity available.');
      }
    }

    if (args.tokenStandard === TokenStandard.Erc20) {
      if (args.tokenId) {
        throw new ValidationError('tokenId should not be found for Erc20 type token.');
      }
    }

    this.tokenId = args.tokenId;
    this.availableQuantity = args.availableQuantity;
    this.createdAt = args.createdAt;
    this.updatedAt = args.updatedAt;
  }
}
