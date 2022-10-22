/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved  */

// Note: Use `yarn link` to resolve below modules
import Zkopru from '@zkopru/client';
import { ZkAccount, ZkopruNode, ZkopruWallet } from '@zkopru/client/dist/node';
import BN from 'bn.js';
import { TokenStandard, WalletService } from '../core/interfaces';
import Product from '../domain/product';

type L2ServiceConstructor = {
  websocketUrl: string;
  contractAddress: string;
  accountPrivateKey: string;
}

export default class ZkopruService implements WalletService {
  websocketUrl: string;

  contractAddress: string;

  private accountPrivateKey: string;

  zkAccount: ZkAccount;

  node: ZkopruNode;

  wallet: ZkopruWallet;

  tokens: Record<string, Record<string, BN>>;

  constructor(params: L2ServiceConstructor) {
    this.accountPrivateKey = params.accountPrivateKey;
    this.zkAccount = new ZkAccount(params.accountPrivateKey);

    this.node = Zkopru.Node({
      websocket: params.websocketUrl,
      address: params.contractAddress,
      accounts: [this.zkAccount],
      databaseName: 'zkopru.db',
    });

    this.tokens = {};
  }

  async start() {
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
    const spendable = await this.wallet.wallet.getSpendableAmount();

    this.tokens = {
      erc721: spendable.erc721,
      erc20: spendable.erc20,
    };

    setTimeout(async () => {
      await this.updateBalance();
    }, 10000);
  }

  async ensureProductAvailability({ product, quantity }: { product: Product, quantity: number }) {
    console.log('ensureProductAvailability', product, quantity);

    // if (product.tokenStandard === TokenStandard.Erc20) {
    //   if (!this.tokens[product.contract]) {
    //     throw new Error("No token regis")
    //   }
    // }
  }
}

// Test
// (async () => {
//   const service = new ZkopruService({
//     accountPrivateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
//     websocketUrl: 'ws://127.0.0.1:5000',
//     contractAddress: '0x970e8f18ebfEa0B08810f33a5A40438b9530FBCF',
//   });

//   await service.start();
// })();
