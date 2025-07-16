/* index.js */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
/*import '@fortawesome/fontawesome-free/css/all.min.css';*/

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

const GlobalStyles = () => (
  <style>
    {`
      @import 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css';
      
      body {
        background-color: #e8f5e9;
        font-family: Arial, sans-serif;
      }
    `}
  </style>
);

root.render(
  <React.StrictMode>
    <GlobalStyles />
    <App />
  </React.StrictMode>
);
