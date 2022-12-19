import {
  beforeEach, describe, expect, test,
} from '@jest/globals';
import { newDb as pgMem } from 'pg-mem';
import { toWei } from 'web3-utils';
import { seed } from '../infra/db/migrations/seeds/bootstrap';
import { ProductRepository } from '../infra/repositories/product-repository';
import addProductUseCase from '../use-cases/add-product';
import { IProductRepository, ILogger, TokenStandard } from '../common/interfaces';
import { createLogger } from '../common/logger';
import ZkopruService from '../infra/services/zkopru-service';
import findProductsUseCase from '../use-cases/find-products';
import { getMockedZkopru, getMockedZkopruWallet, merchantPrivateKey } from './utils';

describe('use-case/find-products', () => {
  let productRepo: IProductRepository;
  let logger: ILogger;
  let zkopruService: ZkopruService;

  // Set a dummy contract address for the token
  const erc20TokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';
  const erc721TokenAddress = '0x122Ffa318051d8aF4E5f2E2732d7049486fcE022';

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
    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, ethBalance: 0.1, erc20Balance: 400, erc20TokenAddress, erc721TokenAddress, erc721TokenIds: ['200'],
    });
  });

  test('should be able to fetch list of products successfully', async () => {
    await addProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/test.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: erc20TokenAddress,
      availableQuantity: toWei('400'),
      price: toWei('1'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });

    await addProductUseCase({
      name: 'BoredFrens',
      description: 'Awesome NFT',
      imageUrl: 'https://ethereum.org/nft.png',
      tokenStandard: TokenStandard.Erc721,
      tokenId: '200',
      contractAddress: erc721TokenAddress,
      availableQuantity: toWei('1'),
      price: toWei('2.4'),
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
