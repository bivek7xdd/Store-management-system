import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Sales from "./pages/Sales";
import SalesHistory from "./pages/SalesHistory";
import Debtors from "./pages/Debtors";
import Reports from "./pages/Reports";
import Market from "./pages/Market";
import NotFound from "./pages/NotFound";
import EnhancedSignup from "./components/EnhancedSignup";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CategoryDetails from "./pages/CategoryDetails";
import SupplierDetails from "./pages/SupplierDetails";
import MarketDiscovery from "./pages/MarketDiscovery";

import React from "react";
import LandingPage from "./pages/LandingPage";
import Settings from "./pages/Settings";
import DevOfflineHandler from "./components/DevOfflineHandler";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



export const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <DevOfflineHandler>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<EnhancedSignup />} />
                      <Route path="/otp" element={<OTP />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* Protected routes */}
                      <Route path="/" element={
                        <ProtectedRoute requireAuth={false}>
                          <LandingPage />
                        </ProtectedRoute>
                      } />

                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Layout>
                            <Dashboard />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory" element={
                        <ProtectedRoute>
                          <Layout>
                            <Inventory />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/categories" element={
                        <ProtectedRoute>
                          <Layout>
                            <Categories />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/suppliers" element={
                        <ProtectedRoute>
                          <Layout>
                            <Suppliers />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/category/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <CategoryDetails />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/supplier/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <SupplierDetails />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/sales" element={
                        <ProtectedRoute>
                          <Layout>
                            <Sales />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/sales/history" element={
                        <ProtectedRoute>
                          <Layout>
                            <SalesHistory />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/debtors" element={
                        <ProtectedRoute>
                          <Layout>
                            <Debtors />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute>
                          <Layout>
                            <Reports />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/market" element={
                        <ProtectedRoute>
                          <Layout>
                            <Market />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/market/discovery" element={
                        <ProtectedRoute>
                          <Layout>
                            <MarketDiscovery />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <Layout>
                            <Settings />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Catch-all route for 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </DevOfflineHandler>
    </ErrorBoundary>
  );
};

export default App;
