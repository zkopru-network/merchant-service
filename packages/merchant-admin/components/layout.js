import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { getAuthToken, removeAuthToken } from '../common/auth-helpers';

export default function Layout() {
  const isLoginPage = window.location.pathname.includes('/login');
  const authToken = getAuthToken();

  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoginPage && authToken) {
      navigate('/');
    }
    if (!isLoginPage && !authToken) {
      navigate('/login');
    }
  }, [isLoginPage, authToken]);

  function onLogoutClick() {
    removeAuthToken();
    navigate('/login');
  }

  if (isLoginPage) {
    return (
      <Outlet />
    );
  }

  return (
    <div className="main">

      <div className="sidebar">

        <h1 className="logo">
          ZMS
        </h1>

        <div className="sidebar__menu">
          <Link className="sidebar__menu-item" to="/">
            <i className="icon icon-home" />
            Home
          </Link>
          <Link className="sidebar__menu-item" to="/products">
            <i className="icon icon-products" />
            Products
          </Link>
          <Link className="sidebar__menu-item" to="/orders">
            <i className="icon icon-orders" />
            Orders
          </Link>
        </div>

        <div className="sidebar__footer">
          <button className="icon-button" type="button" onClick={onLogoutClick}>
            <i className="icon icon-logout" />
            Logout
          </button>
        </div>

      </div>

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}
