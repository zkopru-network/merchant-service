import { v4 as uuid, v4 } from 'uuid';
import { TokenStandard } from '../core/interfaces';

interface IProduct {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tokenStandard: TokenStandard;
  contractAddress: string;
  tokenId?: string;
  availableSupply: number;
  totalSupply: number;
  priceInGwei: number;
}

export default class Product {
  id: string;

  name: string;

  description: string;

  imageUrl: string;

  tokenStandard: TokenStandard;

  contractAddress: string;

  tokenId: string;

  availableSupply: number;

  totalSupply: number;

  priceInGwei: number;

  constructor(args: IProduct) {
    this.id = args.id || v4();
    this.name = args.name;
    this.description = args.description;
    this.imageUrl = args.imageUrl;
    this.tokenStandard = args.tokenStandard;
    this.contractAddress = args.contractAddress;
    this.priceInGwei = args.priceInGwei;

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
