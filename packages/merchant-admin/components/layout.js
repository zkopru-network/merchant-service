import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const isLoginPage = window.location.pathname.includes('/login');
  const authToken = window.localStorage.getItem('authToken');

  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoginPage) {
      if (!authToken) {
        navigate('/login');
      }
    }
    if (isLoginPage) {
      if (authToken) {
        navigate('/');
      }
    }
  }, [isLoginPage]);

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

        <div className="sidebar-menu">
          <Link className="sidebar-menu-item" to="/">
            <i className="icon icon-home" />
            Home
          </Link>
          <Link className="sidebar-menu-item" to="/products">
            <i className="icon icon-products" />
            Products
          </Link>
          <Link className="sidebar-menu-item" to="/orders">
            <i className="icon icon-orders" />
            Orders
          </Link>
        </div>

      </div>

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}