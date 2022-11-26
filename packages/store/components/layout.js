import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="main">

      <div className="header">
        <h1 className="logo">
          <Link to="/">
            ZMS
          </Link>
        </h1>
      </div>

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}
