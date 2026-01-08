// src/index.js
import { createApp } from './app.js';   // your app factory

const app = createApp();

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`🚀 JurisonShop Backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV}`);
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown (good practice)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});