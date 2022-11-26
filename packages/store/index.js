import './styles/main.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter, createRoutesFromElements, Route, RouterProvider,
} from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import graphQLClient from './common/graphql-client';
import HomePage from './pages/home-page';
import ProductPage from './pages/product-page';
import Layout from './components/layout';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/products/:id" element={<ProductPage />} />
    </Route>,
  ),
);

const container = document.getElementById('root');

createRoot(container).render(
  <ApolloProvider client={graphQLClient}>
    <RouterProvider router={router} />
  </ApolloProvider>,
);
