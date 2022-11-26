import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="main">

      <div className="header">
        <h1 className="logo">
          ZMS
        </h1>
      </div>

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}
