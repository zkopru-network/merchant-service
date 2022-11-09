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
import findProductsUseCase from '../use-cases/find-products';

describe('use-case/find-products', () => {
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

  test('should be able to fetch list of products successfully', async () => {
    // Set a dummy contract address for the token
    const tokenAddressErc20 = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';
    const tokenAddressErc721 = '0x122Ffa318051d8aF4E5f2E2732d7049486fcE022';

    // Fake wallet state to have enough balance for the token.
    zkopruService.balances = {
      [TokenStandard.Erc20]: {
        [tokenAddressErc20]: toWei(new BN(400)),
      },
      [TokenStandard.Erc721]: {
        [tokenAddressErc721]: [new BN('200')],
      },
    };

    await createProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddressErc20,
      availableQuantity: 400,
      price: 1,
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    await createProductUseCase({
      name: 'BoredFrens',
      description: 'Awesome NFT',
      imageUrl: 'https://ethereum.org/nft.png',
      tokenStandard: TokenStandard.Erc721,
      tokenId: '200',
      contractAddress: tokenAddressErc721,
      availableQuantity: 1,
      price: 2.4,
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    const products = await findProductsUseCase({
      productRepository: productRepo,
      logger,
    });

    // Contract address should not be changed
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBe(2);
  });
});
