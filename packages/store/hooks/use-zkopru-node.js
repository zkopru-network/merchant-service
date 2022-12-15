/* eslint-disable no-alert */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-alert */
// eslint-disable-next-line import/no-extraneous-dependencies
import Zkopru, { ZkAccount } from '@zkopru/client/browser';
import React from 'react';
import { toWei, fromWei } from 'web3-utils';

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

export const ZkopruContext = React.createContext();

let privateKey;
function getWalletPrivateKey() {
  if (privateKey) return privateKey;

  privateKey = window.prompt('Enter private key for your L2 wallet');
  return privateKey;
}

export default function useZkopruNode(props) {
  const { chainId = 20200406 } = props;

  const _instance = React.useRef({ client: null, wallet: null });

  let { client, wallet } = _instance.current;

  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  function waitForReady() {
    return new Promise((res) => {
      const interval = setInterval(() => {
        if (client?.node?.synchronizer.status === 'fully synced') {
          clearInterval(interval);
          res();
        }
      }, 1000);
    });
  }

  async function generateSwapTransaction({ product, quantity }) {
    await waitForReady();

    const swapSalt = 500;

    let swapTx;
    try {
      swapTx = await wallet.generateSwapTransaction(
        process.env.MERCHANT_ADDRESS,
        '0x0000000000000000000000000000000000000000',
        toWei((product.price * Number(quantity)).toString()),
        product.contractAddress,
        toWei(quantity.toString()),
        (+48000 * (10 ** 9)).toString(),
        swapSalt,
      );

      const shieldedTx = await wallet.wallet.shieldTx({ tx: swapTx });

      return {
        customerTransaction: shieldedTx.encode().toString('hex'),
        swapSalt,
      };
    } catch (error) {
      if (swapTx) {
        // TODO: Release Utxo if the tx fails
        await wallet.wallet.unlockUtxos(swapTx.inflow);
      }

      // eslint-disable-next-line no-console
      console.error(error);
      throw error;
    }
  }

  async function getETHBalance() {
    await waitForReady();
    const spendable = await wallet.wallet.getSpendableAmount();
    return Number(fromWei(spendable.eth.toString()));
  }

  function updateStatus() {
    const { status } = client.node.synchronizer;
    if (status === 'on syncing') {
      setIsSyncing(true);
    } else if (status === 'fully synced') {
      setIsSyncing(false);
    }
  }

  async function startNode() {
    if (!client) {
      client = Zkopru.Node({
        websocket: NETWORKS[chainId].WEBSOCKET,
        address: NETWORKS[chainId].ZKOPRU_ADDRESSES[0],
        accounts: [new ZkAccount(getWalletPrivateKey())],
      });

      _instance.current.client = client;
    }

    setIsInitialized(true);
    setIsSyncing(true);
    await client.initNode();
    wallet = new Zkopru.Wallet(client, getWalletPrivateKey());
    _instance.current.wallet = wallet;

    if (!client.node.running) {
      await client.start();

      client.node.synchronizer.on('status', async () => updateStatus());
      client.node.blockProcessor.on('processed', async () => updateStatus());
    }
  }

  async function connect() {
    if (!NETWORKS[chainId]) {
      throw new Error(`ChainID ${chainId} not configured`);
    }

    if (!getWalletPrivateKey()) return;

    await startNode();
  }

  React.useEffect(() => {
    if (isInitialized && !isSyncing) {
      startNode();
    }

    return () => {
      if (client && client.node) {
        client.node.synchronizer.removeAllListeners();
        client.node.blockProcessor.removeAllListeners();
        client.stop();
      }
    };
  }, [client]);

  return {
    connect,
    isInitialized,
    isSyncing,
    getETHBalance,
    getAddress: () => wallet.wallet.account.zkAddress.toString(),
    generateSwapTransaction,
  };
}
