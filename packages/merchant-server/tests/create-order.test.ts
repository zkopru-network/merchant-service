/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
import {
  beforeEach, describe, expect, jest, test,
} from '@jest/globals';
import axios, { AxiosStatic, AxiosResponse } from 'axios';
import Zkopru from '@zkopru/client';
import { ZkopruNode } from '@zkopru/client/dist/node';
import { Note, ZkTx, Utxo } from '@zkopru/transaction';
import { Fp } from '@zkopru/babyjubjub';
import { newDb as pgMem } from 'pg-mem';
import BN from 'bn.js';
import { toWei } from 'web3-utils';
import { seed } from '../infra/db-migrations/seeds/bootstrap';
import { ProductRepository } from '../infra/repositories/product-repository';
import createProductUseCase from '../use-cases/create-product';
import {
  ILogger, TokenStandard, IOrderRepository, IProductRepository,
} from '../common/interfaces';
import { createLogger } from '../common/logger';
import ZkopruService from '../infra/services/zkopru-service';
import createOrderUseCase from '../use-cases/create-order';
import { OrderRepository } from '../infra/repositories/order-repository';

// Mock axios
jest.mock('axios');
interface AxiosMock extends AxiosStatic {
  mockImplementation: (_: () => Promise<Partial<AxiosResponse>>) => void
}
const mockedAxios = axios as AxiosMock;

// Mocked constants and helpers for all tests
const mockCoordinatorUrl = 'https://mock-coordinator';
const merchantPrivateKey = '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1';
const buyerPrivateKey = '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773';

function getMockedZkopru() : ZkopruNode {
  const node = {
    node: {
      db: {},
      layer1: {
        address: 'https://mock',
      },
      tracker: {
        addAccounts: async () => ({}),
      },
      layer2: {
        grove: {
          utxoTree: {
            merkleProof: () => ({}),
          },
        },
      },
      running: true,
      blockCache: {},
      blockProcessor: {},
      synchronizer: {},
    },
  } as unknown as ZkopruNode;

  return node;
}

function getMockedZkopruWallet({
  node, privateKey, ethBalance, erc20Balance, erc721Balance, tokenAddress,
}: { node: ZkopruNode, privateKey: string, ethBalance?: number, erc20Balance?: number, erc721Balance?: number, tokenAddress?: string}) {
  const wallet = new Zkopru.Wallet(node, privateKey);

  // Override activeCoordinatorUrl to return mock url
  wallet.wallet.coordinatorManager.activeCoordinatorUrl = async () => mockCoordinatorUrl;

  // Override shieldTx to prevent actual SNARK calculation
  wallet.wallet.shieldTx = async ({ tx }: { tx: object }) => ({
    encode: async () => Buffer.from(JSON.stringify(tx)), // only encode is used by the merchant-server.. return RaxTx
  }) as unknown as ZkTx;

  // Create Utxo with given balances
  const utxo = Utxo.from(new Note(wallet.wallet.account.zkAddress, Fp.from('123'), {
    eth: Fp.from(ethBalance ? toWei(ethBalance.toString()) : '0'),
    tokenAddr: Fp.from(tokenAddress ?? '0x0000000000000000000000000000000000000000'),
    erc20Amount: Fp.from(erc20Balance ? toWei(erc20Balance.toString()) : '0'),
    nft: Fp.from(erc721Balance ? toWei(erc721Balance.toString()) : '0'),
  }));
  utxo.nullifier = () => Fp.from(1);

  // Override wallet getSpendables method to return the created Utxo instead of querying DB
  wallet.wallet.getSpendables = async () => [
    utxo,
  ];

  return wallet;
}

describe('use-case/create-order', () => {
  let productRepo: IProductRepository;
  let orderRepo: IOrderRepository;
  let logger: ILogger;
  let zkopruService: ZkopruService;
  let mockedAxiosRequest: jest.MockedFunction<() => any>;
  const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

  beforeEach(async () => {
    logger = createLogger({ level: 'error' });

    const db = pgMem().adapters.createKnex();
    await seed(db);
    productRepo = new ProductRepository(db, { logger });
    orderRepo = new OrderRepository(db, { logger });

    zkopruService = new ZkopruService({
      websocketUrl: 'ws://mock',
      contractAddress: null,
      accountPrivateKey: merchantPrivateKey,
    }, {
      logger,
    });

    zkopruService.node = getMockedZkopru();
    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, privateKey: merchantPrivateKey, ethBalance: 0.1, erc20Balance: 10, tokenAddress,
    });

    expect(Fp).toBeTruthy();

    await zkopruService.updateBalance();
  });

  test('should create an order successfully', async () => {
    // Fake wallet state to have enough balance for the token.
    zkopruService.tokens = {
      [TokenStandard.Erc20]: {
        [tokenAddress]: toWei(new BN(10)),
      },
      [TokenStandard.Erc721]: {},
    };

    // Create a product with EC20 token and price as 1 ETH
    const createdProduct = await createProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/food.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: 10,
      price: 1,
    }, {
      productRepository: productRepo,
      walletService: zkopruService,
      logger,
    });

    // Create buyer transaction
    const buyerWallet = getMockedZkopruWallet({
      node: zkopruService.node, privateKey: buyerPrivateKey, ethBalance: 10, tokenAddress,
    });
    const buyerAddress = buyerWallet.wallet.account.zkAddress.toString();
    const purchaseQuantity = 3;
    const atomicSwapSalt = 500; // Random salt
    const buyerTx = await buyerWallet.generateSwapTransaction(
      zkopruService.wallet.wallet.account.zkAddress.toString(),
      '0x0000000000000000000000000000000000000000', // Sending eth
      toWei(new BN(createdProduct.price).mul(new BN(purchaseQuantity))).toString(),
      createdProduct.contractAddress,
      toWei(new BN(purchaseQuantity)).toString(),
      (+48000 * (10 ** 9)).toString(), // Coordinator fee
      atomicSwapSalt,
    );
    const buyerZkTx = await buyerWallet.wallet.shieldTx({ tx: buyerTx });
    const buyerTransactionEncoded = buyerZkTx.encode().toString('hex');

    // Mock call to coordinator URL (axios)
    mockedAxiosRequest = jest.fn(async () => ({ status: 200 }));
    mockedAxios.mockImplementation(mockedAxiosRequest);

    const createdOrder = await createOrderUseCase({
      productId: createdProduct.id,
      quantity: purchaseQuantity,
      buyerAddress,
      buyerTransaction: buyerTransactionEncoded,
      atomicSwapSalt,
    }, {
      productRepository: productRepo,
      orderRepository: orderRepo,
      walletService: zkopruService,
      logger,
    });

    // Expect order to be created
    expect(typeof createdOrder.id).toBe('string');
    expect(createdOrder.buyerAddress).toBe(buyerAddress);
    expect(createdOrder.quantity).toBe(purchaseQuantity);
    expect(createdOrder.amount).toBe(createdProduct.price * createdOrder.quantity);

    const { buyerTransaction, sellerTransaction } = createdOrder;

    // Expect coordinator URL be called with both transactions
    const expectedCall = {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      data: JSON.stringify([buyerTransaction, sellerTransaction]),
    };
    expect(mockedAxios).toBeCalledWith(`${mockCoordinatorUrl}/txs`, expectedCall);
  });
});
