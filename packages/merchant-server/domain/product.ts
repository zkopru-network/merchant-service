import BN from 'bn.js';
import { TokenStandard } from '../core/interfaces';

interface IProduct {
  name: string;
  description: string;
  image: string;
  tokenStandard: TokenStandard;
  contract: string;
  tokenId: string;
  availableSupply: number;
  totalSupply: number;
  priceInWei: BN;
}

export default class Product {
  name: string;

  description: string;

  image: string;

  tokenStandard: TokenStandard;

  contract: string;

  tokenId: string;

  availableSupply: number;

  totalSupply: number;

  priceInGwei: BN;

  constructor(args: IProduct) {
    this.name = args.name;
    this.description = args.description;
    this.image = args.image;
    this.tokenStandard = args.tokenStandard;
    this.contract = args.contract;
    this.priceInGwei = args.priceInWei;

    if (args.tokenStandard === TokenStandard.Erc721) {
      if (!args.tokenId) {
        throw new Error('tokenId is required for Erc721 type token');
      }

      if (args.totalSupply > 1) {
        throw new Error('Erc721 type token cannot have more than one supply');
      }
    }

    this.tokenId = args.tokenId;
    this.availableSupply = args.availableSupply;
    this.totalSupply = args.totalSupply;
  }
}
