import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver')) {
    e.stopImmediatePropagation();
    return;
  }
  console.error('Global error:', e.error || e.message);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
