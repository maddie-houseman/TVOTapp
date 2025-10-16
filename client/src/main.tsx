import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Login from './pages/Login';
import BusinessFramework from './pages/BusinessFramework';
import FrameworkEntry from './pages/FrameworkEntry';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <Home /> },
    { path: 'login', element: <Login /> },
    { path: 'business-framework', element: <ProtectedRoute><BusinessFramework /></ProtectedRoute> },
    { path: 'framework', element: <ProtectedRoute><FrameworkEntry /></ProtectedRoute> },
    { path: 'dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
    { path: 'account', element: <ProtectedRoute><Account /></ProtectedRoute> },
  ]},
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
);

