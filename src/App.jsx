// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";

import { AuthProvider } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import { TradingProvider } from "./context/TradingContext";
import { NavigationProvider } from "./context/NavigationContext";

import Loader from "./components/common/Loader";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ToastContainer from "./components/common/ToastContainer";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

/* Lazy Loaded Pages */
const Home = lazy(() => import("./pages/Home")); // <-- Changed from DashboardPage
const Wallet = lazy(() => import("./screens/WalletScreen"));
const Swap = lazy(() => import("./views/SwapView"));
const NFTMarketplace = lazy(() => import("./pages/NFTMarketplacePage"));
const Login = lazy(() => import("./pages/LoginPage"));
const Register = lazy(() => import("./pages/RegisterPage"));
const KYC = lazy(() => import("./pages/KYCPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <WalletProvider>
          <TradingProvider>
            <NavigationProvider>
              <Router>
                <ErrorBoundary>
                  <Suspense fallback={<Loader />}>
                    <Routes>

                      {/* Public Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      {/* Protected App Routes */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <MainLayout />
                          </ProtectedRoute>
                        }
                      >
                        {/* Home Page */}
                        <Route index element={<Home />} />

                        {/* Other Wallet/Feature Pages */}
                        <Route path="wallet" element={<Wallet />} />
                        <Route path="swap" element={<Swap />} />
                        <Route path="nfts" element={<NFTMarketplace />} />
                        <Route path="kyc" element={<KYC />} />
                      </Route>

                      {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                      </Route>

                      {/* Catch All */}
                      <Route path="*" element={<Navigate to="/" replace />} />

                    </Routes>

                    <ToastContainer />

                  </Suspense>
                </ErrorBoundary>
              </Router>
            </NavigationProvider>
          </TradingProvider>
        </WalletProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
