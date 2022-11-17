import './styles/main.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Modal from 'react-modal';
import { ApolloProvider } from '@apollo/client';
import graphQLClient from './common/graphql-client';
import HomePage from './pages/home-page';
import LoginPage from './pages/login-page';
import ProductsListPage from './pages/product-list-page';
import OrdersListPage from './pages/order-list-page';
import AddProductPage from './pages/add-product-page';
import ProductPage from './pages/product-page';
import OrderPage from './pages/order-page';
import Layout from './components/layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/new" element={<AddProductPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/orders" element={<OrdersListPage />} />
        <Route path="/orders/:id" element={<OrderPage />} />
      </Route>
    </Routes>
  );
}

const container = document.getElementById('root');
Modal.setAppElement(container);

createRoot(container).render(
  <ApolloProvider client={graphQLClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  </ApolloProvider>,
);
