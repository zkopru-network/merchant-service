import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { fromWei } from 'web3-utils';
import useZkopruNode from '../hooks/use-zkopru-node';

export default function Layout() {
  const { getBalance, isReady } = useZkopruNode();

  const [balance, setBalance] = React.useState();

  React.useEffect(() => {
    if (isReady) {
      getBalance().then((b) => {
        if (b.eth) {
          setBalance(fromWei(b?.eth.toString()));
        }
      });
    }
  }, [isReady]);

  return (
    <div className="main">

      <div className="header">
        <h1 className="logo">
          <Link to="/">
            ZMS
          </Link>
        </h1>

        <div className="wallet-status">
          {!isReady && (
            <div className="spinner" style={{ height: '25px', width: '25px' }} />
          )}

          {isReady && balance && (
            <>
              <div className="wallet-connected">Connected</div>
              <div className="wallet-balance">Balance: Ξ {balance}</div>
            </>
          )}
          {/* <button type="button" onClick={connect}>Connect</button> */}
        </div>

      </div>

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}
