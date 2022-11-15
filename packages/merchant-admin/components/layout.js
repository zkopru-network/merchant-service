import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../data';

export default function Layout() {
  const isLoginPage = window.location.pathname.includes('/login');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoginPage) {
      if (!getAuthToken()) {
        navigate('/login');
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
          <Link to="/">
            ZMS
          </Link>
        </h1>

        <div className="sidebar-menu">
          <Link className="sidebar-menu-item" to="/">Home</Link>
          <Link className="sidebar-menu-item" to="/products">Products</Link>
          <Link className="sidebar-menu-item" to="/orders">Orders</Link>
        </div>

      </div>

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}
