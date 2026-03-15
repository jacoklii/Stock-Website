import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Initialize theme attribute for CSS variables
const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// [AI] Entry point for React application
// Renders the App component into the root element
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
