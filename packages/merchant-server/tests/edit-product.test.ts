import {
  beforeEach, describe, expect, test,
} from '@jest/globals';
import { newDb as pgMem } from 'pg-mem';
import { BN } from 'bn.js';
import { toWei } from 'web3-utils';
import { seed } from '../infra/db/migrations/seeds/bootstrap';
import { ProductRepository } from '../infra/repositories/product-repository';
import addProductUseCase from '../use-cases/add-product';
import { IProductRepository, ILogger, TokenStandard } from '../common/interfaces';
import { createLogger } from '../common/logger';
import ZkopruService from '../infra/services/zkopru-service';
import editProductUseCase from '../use-cases/edit-product';
import { ValidationError } from '../common/error';
import { getMockedZkopru, getMockedZkopruWallet } from './utils';

describe('use-case/edit-product', () => {
  let productRepo: IProductRepository;
  let logger: ILogger;
  let zkopruService: ZkopruService;
  const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

  beforeEach(async () => {
    logger = createLogger({ level: 'error' });

    const db = pgMem().adapters.createKnex();
    await seed(db, 'bigint');
    productRepo = new ProductRepository(db, { logger });

    zkopruService = new ZkopruService({
      websocketUrl: 'ws://test',
      contractAddress: null,
      accountPrivateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
    }, {
      logger,
    });

    zkopruService.node = await getMockedZkopru();
    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, ethBalance: 0.1, erc20Balance: 10, erc20TokenAddress: tokenAddress,
    });
  });

  test('should be able to edit successfully', async () => {
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

    const editedProduct = await editProductUseCase({
      id: createdProduct.id,
      productData: {
        name: 'HelloToken',
        description: 'Edited Description',
        imageUrl: 'Edited Image',
        availableQuantity: toWei('10'),
        price: toWei('1'),
      },
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    // Contract address should not be changed
    expect(editedProduct.contractAddress).toBe(tokenAddress);
    expect(editedProduct.name).toBe('HelloToken');
    expect(editedProduct.description).toBe('Edited Description');
    expect(editedProduct.imageUrl).toBe('Edited Image');
    expect(editedProduct.availableQuantity.toString()).toBe(toWei('10').toString());
    expect(editedProduct.price.toString()).toBe(toWei('1').toString());
  });

  test('should throw error when edited quantity is not available in wallet', async () => {
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

    await expect(() => editProductUseCase({
      id: createdProduct.id,
      productData: {
        name: 'HelloToken',
        description: 'Edited Description',
        imageUrl: 'Edited Image',
        availableQuantity: toWei('11'),
        price: toWei('1'),
      },
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });
});
