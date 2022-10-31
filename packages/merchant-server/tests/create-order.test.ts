/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
import {
  afterEach, beforeEach, describe, expect, jest, test,
} from '@jest/globals';
import axios, { AxiosStatic, AxiosResponse } from 'axios';
import Zkopru from '@zkopru/client';
import { ZkopruNode } from '@zkopru/client/dist/node';
import { Note, Utxo } from '@zkopru/transaction';
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
import { OrderStatus } from '../domain/order';

// Mocked constants and helpers for all tests
const mockCoordinatorUrl = 'https://mock-coordinator';
const merchantPrivateKey = '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1';
const buyerPrivateKey = '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773';

// Mock axios
jest.mock('axios');
interface AxiosMock extends AxiosStatic {
  mockImplementation: (_: () => Promise<Partial<AxiosResponse>>) => void
}
const mockedAxios = axios as AxiosMock;

// Mock snark calculation
jest.mock('@zkopru/zk-wizard/dist/snark', () => ({
  __esModule: true,
  genSNARK: async () => ({
    proof: {
      pi_a: [Buffer.from('1'), Buffer.from('1')] as object[],
      pi_b: [[Buffer.from('1'), Buffer.from('1')], [Buffer.from('1'), Buffer.from('1')]] as object[],
      pi_c: [Buffer.from('1'), Buffer.from('1')] as object[],
    },
  }),
}));

async function getMockedZkopru() : Promise<ZkopruNode> {
  const node = {
    node: {
      db: {
        transaction: async () => ({}),
      },
      layer1: {
        address: 'https://mock',
      },
      tracker: {
        addAccounts: async () => ({}),
      },
      layer2: {
        grove: {
          utxoTree: {
            merkleProof: () => ({
              siblings: [] as object[],
              index: Fp.from(0),
              root: Fp.from(0),
            }),
          },
        },
        snarkVerifier: {
          verifyTx: async () => true,
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
  let mockedCoordinatorAPI: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
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

    zkopruService.node = await getMockedZkopru();
    zkopruService.wallet = getMockedZkopruWallet({
      node: zkopruService.node, privateKey: merchantPrivateKey, ethBalance: 0.1, erc20Balance: 10, tokenAddress,
    });

    zkopruService.balanceUpdateInterval = 500; // Reduce interval to have quick updates based on mock values

    expect(Fp).toBeTruthy();

    await zkopruService.updateBalance();
  });

  afterEach(() => {
    zkopruService.stop();
  });

  test('should create an order successfully', async () => {
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
    mockedCoordinatorAPI = jest.fn(async () => ({ status: 200 }));
    mockedAxios.mockImplementation(mockedCoordinatorAPI);

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
      data: JSON.stringify([sellerTransaction, buyerTransaction]),
    };
    expect(mockedCoordinatorAPI).toBeCalledWith(`${mockCoordinatorUrl}/txs`, expectedCall);
  });

  test('should fail creating order if transaction amount is lower', async () => {
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
    const purchasePrice = new BN(createdProduct.price * purchaseQuantity - 1); // Send 1ETH less
    const buyerTx = await buyerWallet.generateSwapTransaction(
      zkopruService.wallet.wallet.account.zkAddress.toString(),
      '0x0000000000000000000000000000000000000000', // Sending eth
      toWei(purchasePrice).toString(),
      createdProduct.contractAddress,
      toWei(new BN(purchaseQuantity)).toString(),
      (+48000 * (10 ** 9)).toString(), // Coordinator fee
      atomicSwapSalt,
    );
    const buyerZkTx = await buyerWallet.wallet.shieldTx({ tx: buyerTx });
    const buyerTransactionEncoded = buyerZkTx.encode().toString('hex');

    // Mock call to coordinator URL (axios)
    mockedCoordinatorAPI = jest.fn(async () => ({ status: 200 }));
    mockedAxios.mockImplementation(mockedCoordinatorAPI);

    // Swap will not match is the price is different
    await expect(createOrderUseCase({
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
    })).rejects.toThrow('Desired swap not found in any the transaction outflow.');

    // Coordinator should not be called
    expect(mockedCoordinatorAPI).toBeCalledTimes(0);
  });

  test('should update order status when transaction is confirmed/finalized on chain', async () => {
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
    mockedCoordinatorAPI = jest.fn(async () => {
      // Override and return customer's transaction.
      // This would normally happen when coordinator produce a block that include the transactions
      zkopruService.wallet.transactionsFor = async () => ({
        pending: [],
        history: [{ hash: buyerZkTx.hash().toString(), type: 'Receive' }],
      });

      return { status: 200 };
    });
    mockedAxios.mockImplementation(mockedCoordinatorAPI);

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

    expect(typeof createdOrder.id).toBe('string');

    // Wait for the balance update checker
    await new Promise((r) => { setTimeout(r, 3000); });

    expect(createdOrder.status).toBe(OrderStatus.Completed);
  }, 10 * 1000);
});
