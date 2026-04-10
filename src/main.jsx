import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import style from './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// import { Web3Provider } from './context/Web3Context';

root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* REMOVE THIS TEMPORARILY */}
      {/* <Web3Provider> */}
        <App />
      {/* </Web3Provider> */}
    </BrowserRouter>
  </React.StrictMode>
);
