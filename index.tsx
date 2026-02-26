
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StylePlaygroundPage from './pages/stylePlayground';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const RootPage = window.location.pathname === '/style-playground' ? StylePlaygroundPage : App;

root.render(
  <React.StrictMode>
    <RootPage />
  </React.StrictMode>
);
