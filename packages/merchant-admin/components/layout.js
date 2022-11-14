import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      {/* <div className="header">
        <h1 className="logo">
          <Link to="/">
            ZMS
          </Link>
        </h1>

      </div> */}

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
    </>
  );
}
