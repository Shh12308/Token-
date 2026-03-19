import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext';
import { Web3Provider } from './context/Web3Context';
import { Provider } from 'react-redux';
import { store } from './store';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <Web3Provider>
          <CustomThemeProvider>
            <MUIThemeProvider theme={darkTheme}>
              <CssBaseline />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
              <App />
            </MUIThemeProvider>
          </CustomThemeProvider>
        </Web3Provider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
