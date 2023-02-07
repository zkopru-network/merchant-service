import {
  beforeEach, describe, expect, test,
} from '@jest/globals';
import { newDb as pgMem } from 'pg-mem';
import { BN } from 'bn.js';
import { toWei } from 'web3-utils';
import { seed } from '../infra/db/migrations/seeds/bootstrap';
import Product from '../domain/product';
import { ProductRepository } from '../infra/repositories/product-repository';
import addProductUseCase from '../use-cases/add-product';
import { IProductRepository, ILogger, TokenStandard } from '../common/interfaces';
import { createLogger } from '../common/logger';
import ZkopruService from '../infra/services/zkopru-service';
import { ValidationError } from '../common/error';
import { getMockedZkopru, getMockedZkopruWallet, merchantPrivateKey } from './utils';

describe('use-case/add-product', () => {
  let productRepo: IProductRepository;
  let logger: ILogger;
  let zkopruService: ZkopruService;

  beforeEach(async () => {
    logger = createLogger({ level: 'error' });

    const db = pgMem().adapters.createKnex();
    await seed(db, 'bigint');
    productRepo = new ProductRepository(db, { logger });

    zkopruService = new ZkopruService({
      websocketUrl: 'ws://test',
      contractAddress: null,
      accountPrivateKey: merchantPrivateKey,
    }, {
      logger,
    });

    zkopruService.node = await getMockedZkopru();
  });

  test('should set id for product and save successfully', async () => {
    const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

    // Fake wallet state to have enough balance for the token.
    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, ethBalance: 0.1, erc20Balance: 10, erc20TokenAddress: tokenAddress,
    });

    const productInput = {
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: toWei('4'),
      price: toWei('0.1'),
    };

    const createdProduct = await addProductUseCase(productInput, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    expect(createdProduct).toBeInstanceOf(Product);

    // Verify id has been set
    expect(typeof createdProduct.id).toBe('string');

    expect(createdProduct.createdAt).toBeInstanceOf(Date);
    expect(createdProduct.updatedAt).toBeInstanceOf(Date);
    expect(createdProduct.createdAt.getTime()).toBeGreaterThan(new Date().getTime() - 10000);
  });

  test('should throw validation error when wallet balance is low', async () => {
    const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

    // Fake wallet state to have enough balance for the token.
    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, ethBalance: 0.1, erc20Balance: 10, erc20TokenAddress: tokenAddress,
    });

    const productInput = {
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: toWei('11'),
      price: toWei('0.1'),
    };

    await expect(() => addProductUseCase(productInput, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });

  test('should throw error when there exist a product for same Erc20 token', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

    // Fake wallet state to have enough balance for the token.
    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, ethBalance: 0.1, erc20Balance: 10, erc20TokenAddress: tokenAddress,
    });

    // Create product
    await addProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: toWei('5'),
      price: toWei('0.1'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    // Create product for same token with different description (balance still available)
    await expect(() => addProductUseCase({
      name: 'MealToken ',
      description: 'Exchange this for a meal',
      imageUrl: 'https://ethereum.org/2.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: toWei('4'),
      price: toWei('0.3'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });

  test('should be able to create multiple products for same Erc721 contract with different tokenId', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xD12Ffa318051d8aF4E5f2E2732d7049486fCE012';

    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, ethBalance: 0.1, erc721TokenAddress: tokenAddress, erc721TokenIds: ['10', '5', '15'],
    });

    // Create product
    await addProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '10',
      availableQuantity: toWei('1'),
      price: toWei('0.1'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    // Create product for same token with different tokenId
    await addProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '5',
      availableQuantity: toWei('1'),
      price: toWei('2'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });
  });

  test('should throw error when creating multiple products for same Erc721 contract with same tokenId', async () => {
    // Set a dummy contract address for the token
    const tokenAddress = '0xD12Ffa318051d8aF4E5f2E2732d7049486fCE012';

    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, ethBalance: 0.1, erc721TokenAddress: tokenAddress, erc721TokenIds: ['10', '5', '15'],
    });

    // Create product
    await addProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '15',
      availableQuantity: toWei('1'),
      price: toWei('0.1'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    // Create product for same token with different tokenId
    await expect(() => addProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc721,
      contractAddress: tokenAddress,
      tokenId: '15',
      availableQuantity: toWei('1'),
      price: toWei('2'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });
});
