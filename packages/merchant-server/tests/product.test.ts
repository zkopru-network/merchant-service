import { describe, expect, test } from '@jest/globals';
import { v4 } from 'uuid';
import { ValidationError } from '../common/error';
import { TokenStandard } from '../common/interfaces';
import Product from '../domain/product';

describe('domain/product', () => {
  test('should be able to construct a Erc20 product successfully', () => {
    const product = new Product({
      id: v4(),
      name: 'MealCoin',
      description: 'Redeem 1 MealCoin for a two-course meals in any restaurant in our network',
      imageUrl: 'https://ipfs.io/1234',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093',
      availableQuantity: 20,
      price: 0.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(product).toBeInstanceOf(Product);
  });

  test('should be able to construct a Erc721 product successfully', () => {
    const product = new Product({
      id: v4(),
      name: 'BoredFrens',
      description: 'Unique NFTs',
      imageUrl: 'https://ipfs.io/721',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093',
      tokenId: '123',
      availableQuantity: 1,
      price: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(product).toBeInstanceOf(Product);
  });

  test('should throw ValidationError when quantity is not one for Erc721', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new Product({
        id: v4(),
        name: 'BoredFrens',
        description: 'The best NFT ever - Number: 4473',
        imageUrl: 'https://ipfs.io/1234',
        tokenStandard: TokenStandard.Erc721,
        contractAddress: '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093',
        tokenId: '4473',
        availableQuantity: 2,
        price: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrowError(ValidationError);
  });

  test('should throw ValidationError when tokenId is not specified for Erc721 tokens', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new Product({
        id: v4(),
        name: 'MealCoin',
        description: 'Redeem 1 MealCoin for a two-course meals in any restaurant in our network',
        imageUrl: 'https://ipfs.io/1234',
        tokenStandard: TokenStandard.Erc721,
        contractAddress: '0xc11Ffa318051d8aF4E5f2E2732d7049486fcE094',
        availableQuantity: 2,
        price: 0.1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrowError(ValidationError);
  });
});
