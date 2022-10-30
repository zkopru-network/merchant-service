import {
  beforeEach, describe, expect, test,
} from '@jest/globals';
import { newDb as pgMem } from 'pg-mem';
import { BN } from 'bn.js';
import { toWei } from 'web3-utils';
import { seed } from '../infra/db-migrations/seeds/bootstrap';
import { ProductRepository } from '../infra/repositories/product-repository';
import createProductUseCase from '../use-cases/create-product';
import { IProductRepository, ILogger, TokenStandard } from '../common/interfaces';
import { createLogger } from '../common/logger';
import ZkopruService from '../infra/services/zkopru-service';
import editProductUseCase from '../use-cases/edit-product';
import { ValidationError } from '../common/error';

describe('use-case/edit-product', () => {
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

  test('should be able to edit successfully', async () => {
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

    const editedProduct = await editProductUseCase({
      id: createdProduct.id,
      productData: {
        name: 'HelloToken',
        description: 'Edited Description',
        imageUrl: 'Edited Image',
        availableQuantity: 10,
        price: 1,
      },
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    });

    // Contract address should not be changed
    expect(editedProduct.contractAddress).toBe(tokenAddress);
    expect(editedProduct.name).toBe('HelloToken');
    expect(editedProduct.description).toBe('Edited Description');
    expect(editedProduct.imageUrl).toBe('Edited Image');
    expect(editedProduct.availableQuantity).toBe(10);
    expect(editedProduct.price).toBe(1);
  });

  test('should throw error when edited quantity is not available in wallet', async () => {
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

    expect(() => editProductUseCase({
      id: createdProduct.id,
      productData: {
        name: 'HelloToken',
        description: 'Edited Description',
        imageUrl: 'Edited Image',
        availableQuantity: 11,
        price: 1,
      },
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    })).rejects.toThrowError(ValidationError);
  });
});
