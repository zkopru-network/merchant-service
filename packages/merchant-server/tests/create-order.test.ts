/* eslint-disable import/no-extraneous-dependencies */
import {
  afterEach, beforeEach, describe, expect, jest, test,
} from '@jest/globals';
import axios, { AxiosStatic, AxiosResponse } from 'axios';
import { Fp } from '@zkopru/babyjubjub';
import { newDb as pgMem } from 'pg-mem';
import BN from 'bn.js';
import { fromWei, toWei } from 'web3-utils';
import { ZkTx } from '@zkopru/transaction/src';
import { seed } from '../infra/db/migrations/seeds/bootstrap';
import { ProductRepository } from '../infra/repositories/product-repository';
import addProductUseCase from '../use-cases/add-product';
import {
  ILogger, TokenStandard, IOrderRepository, IProductRepository,
} from '../common/interfaces';
import { createLogger } from '../common/logger';
import ZkopruService from '../infra/services/zkopru-service';
import createOrderUseCase from '../use-cases/create-order';
import { OrderRepository } from '../infra/repositories/order-repository';
import Order, { OrderStatus } from '../domain/order';
import updateExistingOrderStatusUseCase from '../use-cases/update-existing-order-status';
import getOrderUseCase from '../use-cases/get-order';
import Product from '../domain/product';
import getProductUseCase from '../use-cases/get-product';
import { getMockedZkopru, getMockedZkopruWallet, merchantPrivateKey } from './utils';

// Mocked constants and helpers for all tests
const mockCoordinatorUrl = 'https://mock-coordinator';
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

describe('use-case/create-order', () => {
  let productRepo: IProductRepository;
  let orderRepo: IOrderRepository;
  let logger: ILogger;
  let zkopruService: ZkopruService;
  const tokenAddress = '0xc22Ffa318051d8aF4E5f2E2732d7049486fcE093';

  beforeEach(async () => {
    logger = createLogger({ level: 'error' });

    const db = pgMem().adapters.createKnex();
    await seed(db, 'bigint');
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
      node: zkopruService.node, ethBalance: 0.1, erc20Balance: 10, erc20TokenAddress: tokenAddress,
    });

    expect(Fp).toBeTruthy();
  });

  // Test helpers
  function createSampleProduct() {
    return addProductUseCase({
      name: 'FoodToken',
      description: 'Token exchangeable for a meal',
      imageUrl: 'https://ethereum.org/food.png',
      tokenStandard: TokenStandard.Erc20,
      contractAddress: tokenAddress,
      availableQuantity: toWei('10'),
      price: toWei('1'),
    }, {
      productRepository: productRepo,
      blockchainService: zkopruService,
      logger,
    });
  }

  async function createOrder({
    product,
    purchaseQuantity,
    atomicSwapSalt,
    purchasePrice,
  } : {
    product: Product,
    purchaseQuantity: BN,
    atomicSwapSalt: number,
    purchasePrice?: BN
  }) : Promise<{ createdOrder: Order, buyerAddress: string, buyerZkTx: ZkTx }> {
    // Create a new wallet for the buyer
    const buyerWallet = getMockedZkopruWallet({
      node: zkopruService.node, privateKey: buyerPrivateKey, ethBalance: 10,
    });

    const buyerAddress = buyerWallet.wallet.account.zkAddress.toString();

    const buyerTx = await buyerWallet.generateSwapTransaction(
      zkopruService.wallet.wallet.account.zkAddress.toString(),
      '0x0000000000000000000000000000000000000000', // Sending eth
      purchasePrice ? purchasePrice.toString() : fromWei((product.price.mul(purchaseQuantity)).toString()),
      product.contractAddress,
      purchaseQuantity.toString(),
      (+48000 * (10 ** 9)).toString(), // Coordinator fee
      atomicSwapSalt,
    );

    const buyerZkTx = await buyerWallet.wallet.shieldTx({ tx: buyerTx });
    const buyerTransactionEncoded = buyerZkTx.encode().toString('hex');

    // Execute create order use-case
    const createdOrder = await createOrderUseCase({
      productId: product.id,
      quantity: purchaseQuantity.toString(),
      buyerAddress,
      buyerTransaction: buyerTransactionEncoded,
      atomicSwapSalt,
    }, {
      productRepository: productRepo,
      orderRepository: orderRepo,
      blockchainService: zkopruService,
      logger,
    });

    return {
      buyerZkTx, buyerAddress, createdOrder,
    };
  }

  function mockCoordinatorAPI() : jest.MockedFunction<(...args: unknown[]) => Promise<unknown>> {
    // Mock call to coordinator URL (axios)
    const mockedCoordinatorAPI = jest.fn(async () => ({ status: 200 }));
    mockedAxios.mockImplementation(mockedCoordinatorAPI);

    return mockedCoordinatorAPI;
  }

  test('should create an order successfully', async () => {
    const mockedCoordinatorAPI = mockCoordinatorAPI();

    const createdProduct = await createSampleProduct();
    const purchaseQuantity = new BN(toWei('3'));
    const atomicSwapSalt = 500; // Random salt
    const { createdOrder } = await createOrder({
      product: createdProduct,
      atomicSwapSalt,
      purchaseQuantity,
    });

    // Expect order to be created
    expect(typeof createdOrder.id).toBe('string');
    expect(createdOrder.quantity.toString()).toBe(purchaseQuantity.toString());
    expect(createdOrder.amount.toString()).toBe(fromWei(createdProduct.price.mul(createdOrder.quantity)).toString());

    expect(createdOrder.createdAt).toBeInstanceOf(Date);
    expect(createdOrder.updatedAt).toBeInstanceOf(Date);
    expect(createdOrder.createdAt.getTime()).toBeGreaterThan(new Date().getTime() - 10000);

    const { buyerTransaction, sellerTransaction } = createdOrder;

    // Expect coordinator URL be called with both transactions
    const expectedCall = {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      data: JSON.stringify([sellerTransaction, buyerTransaction]),
    };

    expect(mockedCoordinatorAPI).toBeCalledWith(`${mockCoordinatorUrl}/txs`, expectedCall);
  }, 15 * 1000);

  test('should reduce available quantity of product after creating order', async () => {
    mockCoordinatorAPI();

    const createdProduct = await createSampleProduct();
    const purchaseQuantity = new BN(toWei('3'));
    const atomicSwapSalt = 500; // Random salt
    const { createdOrder } = await createOrder({
      product: createdProduct,
      atomicSwapSalt,
      purchaseQuantity,
    });

    expect(typeof createdOrder.id).toBe('string');

    // Expect available quantity to be reduced
    const updatedProduct = await getProductUseCase(createdProduct.id, {
      logger,
      productRepository: productRepo,
    });
    expect(updatedProduct.availableQuantity.toString()).toEqual(createdProduct.availableQuantity.sub(createdOrder.quantity).toString());
  }, 15 * 1000);

  test('should fail creating order if transaction amount is lower', async () => {
    const mockedCoordinatorAPI = mockCoordinatorAPI();

    const createdProduct = await createSampleProduct();
    const purchaseQuantity = new BN(toWei('3'));
    const atomicSwapSalt = 500; // Random salt
    const purchasePrice = new BN(fromWei(createdProduct.price.mul(purchaseQuantity))).sub(new BN(toWei('1'))); // Send 1ETH less

    // Swap will not match is the price is different
    await expect(createOrder({
      product: createdProduct,
      atomicSwapSalt,
      purchaseQuantity,
      purchasePrice,
    })).rejects.toThrow('Desired swap not found in any of the transaction outflow.');

    // Coordinator should not be called
    expect(mockedCoordinatorAPI).toBeCalledTimes(0);
  }, 15 * 1000);

  test('should update order status to confirmed when transaction is finalized on chain', async () => {
    mockCoordinatorAPI();

    const createdProduct = await createSampleProduct();
    const purchaseQuantity = new BN(toWei('3'));
    const atomicSwapSalt = 500; // Random salt
    const { createdOrder, buyerZkTx } = await createOrder({
      product: createdProduct,
      atomicSwapSalt,
      purchaseQuantity,
    });

    // Override and return customer's transaction.
    // This would normally happen when coordinator produce a block that include the transactions
    zkopruService.wallet.transactionsFor = async () => ({
      pending: [],
      history: [{ hash: buyerZkTx.hash().toString(), type: 'Receive' }],
    });

    expect(typeof createdOrder.id).toBe('string');
    expect(createdOrder.status).toBe(OrderStatus.Pending);

    // This would be executed periodically by the server
    // Trigger manual call now for testing
    await updateExistingOrderStatusUseCase({
      logger,
      orderRepository: orderRepo,
      blockchainService: zkopruService,
      productRepository: productRepo,
    });

    // Get updated order
    const updatedOrder = await getOrderUseCase(createdOrder.id, {
      logger,
      orderRepository: orderRepo,
    });

    expect(updatedOrder.status).toBe(OrderStatus.Complete);
  }, 15 * 1000);

  test('should update a confirmed order to pending if block containing the transaction is slashed', async () => {
    mockCoordinatorAPI();

    const createdProduct = await createSampleProduct();
    const purchaseQuantity = new BN(toWei('3'));
    const atomicSwapSalt = 500; // Random salt
    const { createdOrder, buyerZkTx } = await createOrder({
      product: createdProduct,
      atomicSwapSalt,
      purchaseQuantity,
    });

    expect(typeof createdOrder.id).toBe('string');
    expect(createdOrder.status).toBe(OrderStatus.Pending);

    zkopruService.wallet.transactionsFor = async () => ({
      pending: [],
      history: [{ hash: buyerZkTx.hash().toString(), type: 'Receive' }],
    });

    await updateExistingOrderStatusUseCase({
      logger,
      orderRepository: orderRepo,
      blockchainService: zkopruService,
      productRepository: productRepo,
    });

    // Get updated order
    const updatedOrder = await getOrderUseCase(createdOrder.id, {
      logger,
      orderRepository: orderRepo,
    });

    expect(updatedOrder.status).toBe(OrderStatus.Complete);

    // Mock a slash event - transaction removed from chain
    zkopruService.wallet.transactionsFor = async () => ({
      pending: [],
      history: [],
    });

    // Rune updateStatus use case again
    await updateExistingOrderStatusUseCase({
      logger,
      orderRepository: orderRepo,
      blockchainService: zkopruService,
      productRepository: productRepo,
    });

    // Get updated order
    const updatedOrder2 = await getOrderUseCase(createdOrder.id, {
      logger,
      orderRepository: orderRepo,
    });

    // Transaction would be back to Pending
    expect(updatedOrder2.status).toBe(OrderStatus.Pending);

    // Deducted quantity should be reverted back
    const updatedProduct = await getProductUseCase(createdProduct.id, {
      logger,
      productRepository: productRepo,
    });
    expect(updatedProduct.availableQuantity).toEqual(createdProduct.availableQuantity);
  }, 15 * 1000);
});
