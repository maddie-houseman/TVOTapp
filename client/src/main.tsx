import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Login from './pages/Login';
import FrameworkEntry from './pages/FrameworkEntry';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <Home /> },
    { path: 'login', element: <Login /> },
    { path: 'framework', element: <FrameworkEntry /> },
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'account', element: <Account /> },
  ]},
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
);

