import React from 'react';
import useZkopruExtension from '../hooks/use-zkopru-extension';
import useZkopruNode from '../hooks/use-zkopru-node';

export const ZkopruContext = React.createContext();

export function ZkopruContextProvider(props) {
  const { children, provider, chainId = 20200406 } = props;

  if (!['node', 'extension'].includes(provider)) {
    throw new Error('Provider should either be node or extension');
  }

  let connect;
  let isInitialized;
  let isSyncing;
  let getETHBalance;
  let generateSwapTransaction;
  let getAddress;

  if (provider === 'node') {
    ({
      connect,
      isInitialized,
      isSyncing,
      getETHBalance,
      generateSwapTransaction,
      getAddress,
    } = useZkopruNode({ chainId }));
  }

  if (provider === 'extension') {
    ({
      connect,
      isInitialized,
      isSyncing,
      getETHBalance,
      generateSwapTransaction,
      getAddress,
    } = useZkopruExtension());
  }

  const contextParams = React.useMemo(() => ({
    connect,
    isInitialized,
    isSyncing,
    getETHBalance,
    generateSwapTransaction,
    getAddress,
  }), [isSyncing, isInitialized]);

  return (
    <ZkopruContext.Provider value={contextParams}>
      {children}
    </ZkopruContext.Provider>
  );
}
