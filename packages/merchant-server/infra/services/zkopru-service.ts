/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved  */

// Note: Use `yarn link` to resolve below modules
import axios from 'axios';
import Zkopru from '@zkopru/client';
import {
  ZkAccount, ZkopruNode, ZkopruWallet,
} from '@zkopru/client/dist/node';
import { ZkTx } from '@zkopru/transaction';
import BN from 'bn.js';
import { toWei } from 'web3-utils';
import {
  ILogger, TokenStandard, IBlockchainService,
} from '../../common/interfaces';
import Order, { OrderStatus } from '../../domain/order';
import Product from '../../domain/product';
import { ValidationError } from '../../common/error';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type L2ServiceConstructor = {
  websocketUrl: string;
  contractAddress: string;
  accountPrivateKey: string;
}

export default class ZkopruService implements IBlockchainService {
  logger: ILogger;

  // URL for ETH node RPC (websocket)
  websocketUrl: string;

  // Zkopru contract address on L1
  contractAddress: string;

  private accountPrivateKey: string;

  zkAccount: ZkAccount;

  node: ZkopruNode;

  wallet: ZkopruWallet;

  constructor(params: L2ServiceConstructor, context: { logger: ILogger }) {
    this.logger = context.logger;

    this.accountPrivateKey = params.accountPrivateKey;
    this.zkAccount = new ZkAccount(params.accountPrivateKey);

    this.node = Zkopru.Node({
      websocket: params.websocketUrl,
      address: params.contractAddress,
      accounts: [this.zkAccount],
      databaseName: 'zkopru.db',
    });
  }

  async start() {
    await this.node.initNode();

    this.wallet = new Zkopru.Wallet(this.node, this.accountPrivateKey);

    await this.node.start();

    this.logger.info({
      data: {
        ethAddress: this.wallet.wallet.account.ethAddress,
        l2Address: this.wallet.wallet.account.zkAddress.toString(),
      },
    }, 'Started Zkopru Node');
  }

  async ensureProductAvailability(product: Product, requiredQuantity: BN) {
    const spendable = await this.wallet.wallet.getSpendableAmount();
    const walletBalances = {
      [TokenStandard.Erc20]:  Object.fromEntries(
        Object.entries(spendable.erc20).map(([k, v]) => [k.toLowerCase(), v])
      ),
      [TokenStandard.Erc721]:  Object.fromEntries(
        Object.entries(spendable.erc721).map(([k, v]) => [k.toLowerCase(), v])
      )
    }

    this.logger.info({ data: walletBalances }, 'Current wallet balance');

    if (product.tokenStandard === TokenStandard.Erc20) {
      const available = walletBalances[TokenStandard.Erc20][product.contractAddress.toLowerCase()] || 0;

      if (!available || requiredQuantity.gt(new BN(available.toString()))) {
        throw new ValidationError(
          `Wallet don't have enough balance for token ${product.contractAddress} for required quantity ${requiredQuantity}. Only ${available} available.`,
        );
      }
    } else if (product.tokenStandard === TokenStandard.Erc721) {
      const availableTokens = walletBalances[TokenStandard.Erc721][product.contractAddress.toLowerCase()] || [];
      const isAvailable = availableTokens.some((el) => el.toString() === product.tokenId.toString());
      if (!isAvailable) {
        throw new ValidationError(`Token ${product.tokenId} in contract ${product.contractAddress} not present in wallet.`);
      }
    } else {
      throw new ValidationError('Unknown Token Standard');
    }
  }

  async executeOrder(order: Order, params: { atomicSwapSalt: string }) {
    const weiPerBye = (48000 * (10 ** 9)).toString();

    // Generate swap transaction (sell tx)
    const merchantTx = await this.wallet.generateSwapTransaction(
      order.buyerAddress,
      order.product.contractAddress,
      order.quantity.toString(),
      ZERO_ADDRESS,
      order.amount.toString(),
      weiPerBye,
      params.atomicSwapSalt,
    );

    try {
      // Create shielded transaction and encode it
      const merchantZkTx = await this.wallet.wallet.shieldTx({ tx: merchantTx });
      const merchantTxEncoded = merchantZkTx.encode().toString('hex');

      const buyerZkTx = ZkTx.decode(Buffer.from(order.buyerTransaction, 'hex'));

      this.logger.debug({ data: { buyerZkTx, merchantTx } }, 'Swap transactions');

      if (!merchantZkTx.outflow.some((o) => o.note.eq(buyerZkTx.swap))) {
        throw new Error('Customer desired swap not found in generated merchant tx outflow.');
      }

      if (!buyerZkTx.outflow.some((o) => o.note.eq(merchantZkTx.swap))) {
        throw new ValidationError('Desired swap not found in any of the transaction outflow.');
      }

      // Send both transactions to the coordinator
      const coordinatorUrl = await this.wallet.wallet.coordinatorManager.activeCoordinatorUrl();
      const response = await axios(`${coordinatorUrl}/txs`, {
        method: 'post',
        headers: {
          'content-type': 'application/json',
        },
        data: JSON.stringify([merchantTxEncoded, order.buyerTransaction]),
      });

      // Revert UTXO status if tx fails
      if (response.status !== 200) {
        throw Error(`Error while sending tx to coordinator ${JSON.stringify(response.data)}`);
      }

      return {
        buyerTransactionHash: buyerZkTx.hash().toString(),
        sellerTransaction: merchantTxEncoded,
        sellerTransactionHash: merchantZkTx.hash().toString(),
        fee: merchantTx.fee.toString(),
      };
    } catch (error) {
      await this.wallet.wallet.unlockUtxos(merchantTx.inflow);
      throw error;
    }
  }

  async getConfirmationStatusForOrders(orders: Order[]) : Promise<Record<string, OrderStatus>> {
    const { history } = await this.wallet.transactionsFor(this.wallet.wallet.account.zkAddress.toString(), this.wallet.wallet.account.ethAddress);

    const receivedTransactions = history.filter((t) => t.type === 'Receive') as { hash: string }[];

    // Store as object for faster inclusion checks
    const receivedTransactionHashes = receivedTransactions.reduce((acc, tx) => {
      acc[tx.hash] = true;
      return acc;
    }, {} as Record<string, boolean>);

    const orderStatuses : Record<string, OrderStatus> = {};

    for (const order of orders) {
      // Decode buyer transaction and calculate hash
      const buyerZkTx = ZkTx.decode(Buffer.from(order.buyerTransaction, 'hex'));
      const hash = buyerZkTx.hash().toString();

      if (receivedTransactionHashes[hash]) {
        orderStatuses[order.id] = OrderStatus.Complete;
      } else {
        orderStatuses[order.id] = OrderStatus.Pending;
      }
    }

    return orderStatuses;
  }

  getWalletAddress() {
    return this.wallet.wallet.account.ethAddress;
  }

  async signMessage(message: string) {
    return this.wallet.wallet.account.ethAccount.sign(message).signature;
  }
}
