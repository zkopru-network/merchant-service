import './styles.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Modal from 'react-modal';
import HomePage from './pages/home-page';
import LoginPage from './pages/login-page';
import Layout from './components/layout';

function App() {
  return (
    <Routes>
      <Route exact path="/" element={<Layout />}>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />

      </Route>
    </Routes>
  );
}

const container = document.getElementById('root');
Modal.setAppElement(container);

const root = createRoot(container);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
