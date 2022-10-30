/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved  */

// Note: Use `yarn link` to resolve below modules
import axios from 'axios';
import Zkopru from '@zkopru/client';
import {
  ZkAccount, ZkopruNode, ZkopruWallet,
} from '@zkopru/client/dist/node';
import { ZkTx } from '@zkopru/transaction';
import BN from 'bn.js';
import { fromWei, toWei } from 'web3-utils';
import { ILogger, TokenStandard, IWalletService } from '../../common/interfaces';
import Order from '../../domain/order';
import Product from '../../domain/product';
import { ValidationError } from '../../common/error';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type L2ServiceConstructor = {
  websocketUrl: string;
  contractAddress: string;
  accountPrivateKey: string;
}

export default class ZkopruService implements IWalletService {
  logger: ILogger;

  websocketUrl: string;

  contractAddress: string;

  private accountPrivateKey: string;

  zkAccount: ZkAccount;

  node: ZkopruNode;

  wallet: ZkopruWallet;

  tokens: Record<TokenStandard, Record<string, object | object[]>>;

  private timer: NodeJS.Timeout;

  constructor(params: L2ServiceConstructor, context: { logger: ILogger }) {
    this.accountPrivateKey = params.accountPrivateKey;
    this.zkAccount = new ZkAccount(params.accountPrivateKey);

    this.node = Zkopru.Node({
      websocket: params.websocketUrl,
      address: params.contractAddress,
      accounts: [this.zkAccount],
      databaseName: 'zkopru.db',
    });

    this.tokens = {
      [TokenStandard.Erc20]: {},
      [TokenStandard.Erc721]: {},
    };

    this.logger = context.logger;
  }

  async start() {
    this.logger.info('Starting Zkopru Node');

    await this.node.initNode();

    this.wallet = new Zkopru.Wallet(this.node, this.accountPrivateKey);

    await this.node.start();

    await this.updateBalance();
  }

  stop() {
    clearTimeout(this.timer);
  }

  async updateBalance() {
    this.logger.debug('Updating Zkopru balances');

    const spendable = await this.wallet.wallet.getSpendableAmount();

    this.tokens = {
      [TokenStandard.Erc721]: spendable.erc721,
      [TokenStandard.Erc20]: spendable.erc20,
    };

    this.timer = setTimeout(async () => {
      await this.updateBalance();
    }, 10000);
  }

  async ensureProductAvailability(product: Product, quantity: number) {
    if (product.tokenStandard === TokenStandard.Erc20) {
      const available = this.tokens[product.tokenStandard][product.contractAddress] as BN;
      const requiredQuantity = new BN(toWei(quantity.toString(), 'ether'));

      if (!available || requiredQuantity.gt(available)) {
        throw new ValidationError(
          `No enough balance in wallet for token ${product.contractAddress} for required quantity ${quantity}. Only ${fromWei((available || 0).toString(), 'ether')} available.`,
        );
      }
    } else if (product.tokenStandard === TokenStandard.Erc721) {
      const availableTokens = this.tokens[product.tokenStandard][product.contractAddress] as BN[] || [];
      const isAvailable = (availableTokens as BN[] || []).some((el) => el.eq(new BN(product.tokenId)));
      if (!isAvailable) {
        throw new ValidationError(`Token ${product.tokenId} in contract ${product.contractAddress} not present in wallet.`);
      }
    } else {
      throw new ValidationError('Unknown Token Standard');
    }
  }

  async executeOrder(order: Order, params: { atomicSwapSalt: string }) {
    // Generate swap transaction (sell tx)
    const merchantTx = await this.wallet.generateSwapTransaction(
      order.buyerAddress,
      order.product.contractAddress,
      toWei(new BN(order.quantity)).toString(),
      ZERO_ADDRESS,
      toWei(new BN(order.amount)).toString(),
      (+order.fee * (10 ** 9)).toString(), // TODO: Verify fee / weiPerByte calculation
      params.atomicSwapSalt,
    );

    // Create shielded transaction and encode it
    const merchantZkTx = await this.wallet.wallet.shieldTx({ tx: merchantTx });
    const merchantTxEncoded = merchantZkTx.encode().toString('hex');

    const buyerZkTx = ZkTx.decode(Buffer.from(order.buyerTransaction, 'hex'));

    if (!merchantZkTx.outflow.some((o) => o.note.eq(buyerZkTx.swap))) {
      throw new Error('Customer desired swap not found in generated merchant tx outflow.');
    }

    if (!buyerZkTx.outflow.some((o) => o.note.eq(merchantZkTx.swap))) {
      throw new ValidationError('Desired swap not found in any the transaction outflow.');
    }

    // Send both transactions to the coordinator
    const coordinatorUrl = await this.wallet.wallet.coordinatorManager.activeCoordinatorUrl();
    const response = await axios(`${coordinatorUrl}/txs`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      data: JSON.stringify([order.buyerTransaction, merchantTxEncoded]),
    });

    // Revert UTXO status if tx fails
    if (response.status !== 200) {
      await this.wallet.wallet.unlockUtxos(merchantTx.inflow);
      throw Error(`Error while sending tx to coordinator ${JSON.stringify(response.data)}`);
    }

    return merchantTxEncoded;
  }
}
