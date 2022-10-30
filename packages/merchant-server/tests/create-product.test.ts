import {
  beforeEach, describe, expect, test,
} from '@jest/globals';
import { newDb as pgMem } from 'pg-mem';
import { BN } from 'bn.js';
import { toWei } from 'web3-utils';
import { seed } from '../infra/db-migrations/seeds/bootstrap';
import Product from '../domain/product';
import { ProductRepository } from '../infra/repositories/product-repository';
import createProductUseCase from '../use-cases/create-product';
import { IProductRepository, ILogger, TokenStandard } from '../common/interfaces';
import { createLogger } from '../common/logger';
import ZkopruService from '../infra/services/zkopru-service';
import { ValidationError } from '../common/error';

describe('use-case/create-product', () => {
  let productRepo: IProductRepository;
  let logger: ILogger;
  let zkopruService: ZkopruService;

  beforeEach(async () => {
    logger = createLogger({ level: 'error' });

    const db = pgMem().adapters.createKnex();
    await seed(db);
    productRepo = new ProductRepository(db, { logger });

    zkopruService = new ZkopruService({
      websocketUrl: 'ws://test',
      contractAddress: null,
      accountPrivateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
    }, {
      logger,
    });
  });

  test('should set id for product and save successfully', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

    // Fake wallet state to have enough balance for the token.
    zkopruService.tokens = {
      [TokenStandard.Erc20]: {
        [tokenAddress]: toWei(new BN(10)),
      },
      [TokenStandard.Erc721]: {},
    };

    const productInput = {
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: 4,
      price: 0.1,
    };

    const createdProduct = await createProductUseCase(productInput, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    });

    expect(createdProduct).toBeInstanceOf(Product);

    // Verify id has been set
    expect(typeof createdProduct.id).toBe('string');
  });

  test('should throw validation error when wallet balance is low', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

    // Fake wallet state to have enough balance for the token.
    zkopruService.tokens = {
      [TokenStandard.Erc20]: {
        [tokenAddress]: toWei(new BN(10)),
      },
      [TokenStandard.Erc721]: {},
    };

    const productInput = {
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: 11,
      price: 0.1,
    };

    expect(() => createProductUseCase(productInput, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });

  test('should throw error when there exist a product for same Erc20 token', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

    // Fake wallet state to have enough balance for the token.
    zkopruService.tokens = {
      [TokenStandard.Erc20]: {
        [tokenAddress]: toWei(new BN(10)),
      },
      [TokenStandard.Erc721]: {},
    };

    // Create product
    await createProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: 5,
      price: 0.1,
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    });

    // Create product for same token with different description (balance still available)
    expect(() => createProductUseCase({
      name: 'MealToken ',
      description: 'Exchange this for a meal',
      imageUrl: 'https://ethereum.org/2.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: 4,
      price: 0.3,
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });

  test('should be able to create multiple products for same Erc721 contract with different tokenId', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xd12Ffa318051d8aF4E5f2E2732d7049486fcE012';

    // Fake wallet state to have enough balance for the token.
    zkopruService.tokens = {
      [TokenStandard.Erc20]: {},
      [TokenStandard.Erc721]: {
        [tokenAddress]: [new BN('10'), new BN('5'), new BN('15')],
      },
    };

    // Create product
    await createProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '10',
      availableQuantity: 1,
      price: 0.1,
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    });

    // Create product for same token with different tokenId
    await createProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '5',
      availableQuantity: 1,
      price: 2,
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    });
  });

  test('should throw error when creating multiple products for same Erc721 contract with same tokenId', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xd12Ffa318051d8aF4E5f2E2732d7049486fcE012';

    // Fake wallet state to have enough balance for the token.
    zkopruService.tokens = {
      [TokenStandard.Erc20]: {},
      [TokenStandard.Erc721]: {
        [tokenAddress]: [new BN('10'), new BN('5'), new BN('15')],
      },
    };

    // Create product
    await createProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '15',
      availableQuantity: 1,
      price: 0.1,
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    });

    // Create product for same token with different tokenId
    expect(() => createProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '15',
      availableQuantity: 1,
      price: 2,
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });
});
