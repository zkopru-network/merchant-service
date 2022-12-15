/* eslint-disable no-alert */

import React from 'react';
import { toWei } from 'web3-utils';

export default function useZkopruExtension() {
  const [isInitialized, setIsInitialized] = React.useState(window.zkopru && window.zkopru.connected);
  const [isSyncing, setIsSyncing] = React.useState(false);

  window.addEventListener('ZKOPRU#PROVIDER_CONNECTED', async () => {
    setIsInitialized(true);
  });

  async function connect() {
    if (!window.zkopru) {
      alert('Zkopru extension is missing.');
      return;
    }

    if (!window.zkopru.connected) {
      setIsSyncing(true);
      try {
        await window.zkopru.connect();
      } catch (error) {
        alert(`Error connecting Zkopru extension: ${error.message}`);
      }
      setIsSyncing(false);
    }
  }

  async function generateSwapTransaction({ product, quantity }) {
    const ethRequired = product.price * quantity;

    const swapSalt = Math.round(Math.random() * 10000000);

    const { tx } = await window.zkopru.generateSwapTx(
      '0x0000000000000000000000000000000000000000',
      toWei(ethRequired.toString()),
      product.contractAddress,
      toWei(quantity.toString()),
      process.env.MERCHANT_ADDRESS,
      swapSalt,
      (+48000 * (10 ** 9)).toString(),
    );

    return {
      customerTransaction: tx,
      swapSalt,
    };
  }

  async function getETHBalance() {
    const balances = await window.zkopru.getBalance();
    return Number(balances.eth.toString());
  }

  async function getAddress() {
    return window.zkopru.getAddress();
  }

  return {
    connect,
    isInitialized,
    isSyncing,
    getETHBalance,
    getAddress,
    generateSwapTransaction,
  };
}
