/* eslint-disable no-underscore-dangle */
/* eslint-disable no-alert */
// eslint-disable-next-line import/no-extraneous-dependencies
import Zkopru, { ZkAccount } from '@zkopru/client/browser';
import React from 'react';
import { toWei } from 'web3-utils';

// Note: This is one of the sample account from hardhat
// TODO: Add a way to load private key from Metamask
const CUSTOMER_PRIVATE_KEY = '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c';

const NETWORKS = {
  20200406: {
    NAME: 'Local',
    WEBSOCKET: 'ws://127.0.0.1:5000',
    ZKOPRU_ADDRESSES: [
      '0x970e8f18ebfEa0B08810f33a5A40438b9530FBCF',
    ],
  },
  5: {
    NAME: 'Goerli testnet',
    WEBSOCKET: 'wss://goerli2.zkopru.network',
    ZKOPRU_ADDRESSES: [
      '0x48458C823DF628f0C053B0786d4111529B9fB7B0',
    ],
    METAMASK_PARAMS: {
      chainId: '0x5',
      chainName: 'Goerli',
      nativeCurrency: {
        name: 'Goerli ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://goerli.infura.io/v3/'],
      blockExplorerUrls: ['https://goerli.etherscan.io'],
    },
  },
  69: {
    NAME: 'Optimism testnet',
    WEBSOCKET: 'wss://optimism-kovan.zkopru.network',
    ZKOPRU_ADDRESSES: [
      '0x31f3E51Fc7BE2BD24F258af92B0E371fa0A48762', // minimum stake amount 1 ETH
    ],
    METAMASK_PARAMS: {
      chainId: '0x45',
      chainName: 'Optimism-kovan',
      nativeCurrency: {
        name: 'Optimism ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://kovan.optimism.io'],
      blockExplorerUrls: ['https://kovan-optimistic.etherscan.io'],
    },
  },
};

let _wallet;
let _client;
let _isReady;

export default function useZkopruNode(chainId = 20200406) {
  const [client, setClient] = React.useState(_client);
  const [wallet, setWallet] = React.useState(_wallet);
  const [isReady, setIsReady] = React.useState(_isReady);

  if (!NETWORKS[chainId]) {
    throw new Error(`ChainID ${chainId} not configured`);
  }

  if (!client) {
    _client = Zkopru.Node({
      websocket: NETWORKS[chainId].WEBSOCKET,
      address: NETWORKS[chainId].ZKOPRU_ADDRESSES[0],
      accounts: [new ZkAccount(CUSTOMER_PRIVATE_KEY)],
      databaseName: 'zkopru.db',
    });
    setClient(_client);
  }

  const waitForReady = () => new Promise((res) => {
    const interval = setInterval(() => {
      if (_isReady) {
        clearInterval(interval);
        res();
      }
    }, 1000);
  });

  async function generateSwapTransaction({ product, merchantAddress, quantity }) {
    await waitForReady();

    const ethRequired = product.price * quantity;

    // TODO: Release Utxo if the tx fails
    return wallet.generateSwapTransaction(
      merchantAddress,
      '0x0000000000000000000000000000000000000000',
      toWei(ethRequired.toString()).toString(),
      product.contractAddress,
      toWei(quantity.toString()).toString(),
      (+48000 * (10 ** 9)).toString(),
      Math.round(Math.random() * 10000000),
    )
      .then((t) => wallet.wallet.shieldTx({ tx: t }))
      .then((t) => t.encode().toString('hex'));
  }

  async function getBalance() {
    const spendable = await wallet.wallet.getSpendableAmount();
    return spendable;
  }

  function updateStatus() {
    const { status } = client.node.synchronizer;
    if (status === 'on syncing') {
      _isReady = false;
    } else if (status === 'fully synced') {
      _isReady = true;
    }
    setIsReady(_isReady);
  }

  React.useEffect(() => {
    (async () => {
      await client.initNode();
      _wallet = new Zkopru.Wallet(client, CUSTOMER_PRIVATE_KEY);
      setWallet(_wallet);

      if (!client.node.running) {
        await client.start();

        client.node.synchronizer.on('status', async () => updateStatus());
        client.node.blockProcessor.on('processed', async () => updateStatus());
      }
    })();

    return () => {
      if (client && client.node) {
        setWallet(null);
        client.node.synchronizer.removeAllListeners();
        client.node.blockProcessor.removeAllListeners();
        client.stop();
      }
    };
  }, []);

  return {
    isReady,
    getBalance,
    generateSwapTransaction,
  };
}
