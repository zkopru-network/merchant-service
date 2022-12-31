import React, { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ZkopruContext } from '../context/zkopru-context';

export default function Layout() {
  const {
    getETHBalance, isInitialized, connect, isSyncing,
  } = useContext(ZkopruContext);

  const [balance, setBalance] = React.useState();

  React.useEffect(() => {
    let interval;
    if (isInitialized && !isSyncing) {
      getETHBalance().then(setBalance);

      clearInterval(interval);
      interval = setInterval(() => {
        getETHBalance().then(setBalance);
      }, 5000);
    }

    return () => {
      clearInterval(interval);
    }
  }, [isInitialized, isSyncing]);

  return (
    <div className="main">

      <div className="header">
        <h1 className="logo">
          <Link to="/">
            ZMS
          </Link>
        </h1>

        <div className="wallet-status">
          {!isInitialized && (
            <button type="button" className="btn-connect" onClick={connect}>Connect</button>
          )}

          {isInitialized && isSyncing && (
            <div className="spinner" style={{ height: '25px', width: '25px' }} />
          )}

          {isInitialized && !isSyncing && (balance !== undefined) && (
            <>
              <div className="wallet-connected">Connected</div>
              <div className="wallet-balance">Balance: Ξ {balance}</div>
            </>
          )}
        </div>

      </div>

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}
