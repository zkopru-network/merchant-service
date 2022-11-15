import './styles/main.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Modal from 'react-modal';
import {
  ApolloClient, InMemoryCache, ApolloProvider, createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import HomePage from './pages/home-page';
import LoginPage from './pages/login-page';
import ProductsPage from './pages/products-page';
import CreateProductPage from './pages/create-product-page';
import Layout from './components/layout';

function App() {
  return (
    <Routes>
      <Route exact path="/" element={<Layout />}>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<CreateProductPage />} />

      </Route>
    </Routes>
  );
}

const container = document.getElementById('root');
Modal.setAppElement(container);

const root = createRoot(container);

const httpLink = createHttpLink({
  uri: 'http://localhost:8000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => window.alert(`Error from API: ${message}`));
  }
  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const client = new ApolloClient({
  link: authLink.concat(errorLink).concat(httpLink),
  cache: new InMemoryCache(),
});

root.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  </ApolloProvider>,
);
