/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved  */

// Note: Use `yarn link` to resolve below modules
import Zkopru from '@zkopru/client';
import {
  ZkAccount, ZkopruNode, ZkopruWallet, ZkTx,
} from '@zkopru/client/dist/node';
import BN from 'bn.js';
import { fromWei, toWei } from 'web3-utils';
import { ILogger, TokenStandard, IWalletService } from '../../common/interfaces';
import Order from '../../domain/order';
import Product from '../../domain/product';

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

  tokens: Record<TokenStandard, Record<string, BN | [BN]>>;

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

    // Node only tracks Utxo for the specified accounts. The `Zkopru.Node()` don't expose a way for specifying the accounts at the moment.
    // Using below hack at the moment to add accounts to the tracker.
    await this.node.node.blockProcessor.tracker.addAccounts(this.zkAccount);
    this.node.node.blockCache.web3.eth.accounts.wallet.add(this.zkAccount.toAddAccount());

    this.wallet = new Zkopru.Wallet(this.node, this.accountPrivateKey);

    await this.node.start();

    await this.updateBalance();
  }

  async updateBalance() {
    this.logger.debug('Updating Zkopru balances');

    const spendable = await this.wallet.wallet.getSpendableAmount();

    this.tokens = {
      [TokenStandard.Erc721]: spendable.erc721,
      [TokenStandard.Erc20]: spendable.erc20,
    };

    setTimeout(async () => {
      await this.updateBalance();
    }, 10000);
  }

  async ensureProductAvailability(product: Product, quantity: number) {
    if (product.tokenStandard === TokenStandard.Erc20) {
      const available = this.tokens[product.tokenStandard][product.contractAddress] as BN;
      const requiredQuantity = new BN(toWei(quantity.toString(), 'ether'));

      if (!available || requiredQuantity.gt(available)) {
        throw new Error(`No enough balance in wallet for token ${product.contractAddress} for required quantity ${quantity}. Only ${fromWei((available || 0).toString(), 'ether')} available.`);
      }
    } else if (product.tokenStandard === TokenStandard.Erc721) {
      const availableTokens = this.tokens[product.tokenStandard][product.contractAddress] as BN[] || [];
      const isAvailable = (availableTokens as BN[] || []).some((el) => el.eq(new BN(product.tokenId)));
      if (!isAvailable) {
        throw new Error(`Token ${product.tokenId} in contract ${product.contractAddress} not present in wallet.`);
      }
    } else {
      throw new Error('Unknown Token Standard');
    }
  }
}
