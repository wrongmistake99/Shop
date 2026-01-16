// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';          // ← Tailwind styles loaded here
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);