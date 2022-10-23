import { TokenStandard } from '../core/interfaces';

interface IProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tokenStandard: TokenStandard;
  contractAddress: string;
  tokenId?: string;
  availableQuantity: number;
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

  priceInGwei: number;

  availableQuantity: number;

  constructor(args: IProduct) {
    this.id = args.id;
    this.name = args.name;
    this.description = args.description;
    this.imageUrl = args.imageUrl;
    this.tokenStandard = args.tokenStandard;
    this.contractAddress = args.contractAddress;
    this.priceInGwei = args.priceInGwei;

    if (args.tokenStandard === TokenStandard.Erc721) {
      if (!args.tokenId) {
        throw new Error('tokenId is required for Erc721 type token.');
      }

      if (args.availableQuantity > 1) {
        throw new Error('Erc721 type token cannot have more than one quantity available.');
      }
    }

    if (args.tokenStandard === TokenStandard.Erc20) {
      if (args.tokenId) {
        throw new Error('tokenId should not be found for Erc20 type token.');
      }
    }

    this.tokenId = args.tokenId;
    this.availableQuantity = args.availableQuantity;
  }
}
