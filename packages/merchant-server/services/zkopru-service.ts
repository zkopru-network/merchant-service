/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved  */

// Note: Use `yarn link` to resolve below modules
import Zkopru, { UtxoStatus } from '@zkopru/client';
import { ZkAccount } from '@zkopru/client/dist/node';
import type ZkopruNode from '@zkopru/client/dist/zkopru-node';
import type ZkopruWallet from '@zkopru/client/dist/zkopru-wallet';

type L2ServiceConstructor = {
  websocketUrl: string;
  contractAddress: string;
  accountPrivateKey: string;
}

export default class ZkopruService {
  websocketUrl: string;

  contractAddress: string;

  private accountPrivateKey: string;

  zkAccount: ZkAccount;

  node: ZkopruNode;

  wallet: ZkopruWallet;

  constructor(params: L2ServiceConstructor) {
    this.accountPrivateKey = params.accountPrivateKey;
    this.zkAccount = new ZkAccount(params.accountPrivateKey);

    this.node = Zkopru.Node({
      websocket: params.websocketUrl,
      address: params.contractAddress,
      accounts: [this.zkAccount],
    });
  }

  async start() {
    await this.node.initNode();

    this.wallet = new Zkopru.Wallet(this.node, this.accountPrivateKey);

    // Node only tracks Utxo for the specified accounts. The `Zkopru.Node` don't expose a way for specifying the default client.
    // Using below hack at the moment to add accounts to the tracker.
    await this.node.node.blockProcessor.tracker.addAccounts(this.zkAccount);
    this.node.node.blockCache.web3.eth.accounts.wallet.add(this.zkAccount.toAddAccount());

    await this.node.start();
  }

  async getBalances() {
    const [
      spendable,
      locked,
      erc20Info,
      notes,
    ] = await Promise.all([
      this.wallet.wallet.getSpendableAmount(),
      this.wallet.wallet.getLockedAmount(),
      this.node.node.loadERC20Info(),
      this.wallet.wallet.getUtxos(null, [UtxoStatus.UNSPENT, UtxoStatus.SPENDING]),
    ]);

    return {
      spendable,
      locked,
      erc20Info,
      notes,
    };
  }
}

// Test
(async () => {
  const service = new ZkopruService({
    accountPrivateKey: 'd5eecfacbe5fff810074c5c1e371c65eb4c7f9b0269b3cb250ed0520255e551d',
    websocketUrl: 'ws://127.0.0.1:5000',
    contractAddress: '0x970e8f18ebfEa0B08810f33a5A40438b9530FBCF',
  });

  service.start();

  setInterval(async () => {
    console.log(await service.getBalances());
  }, 10000);
})();
