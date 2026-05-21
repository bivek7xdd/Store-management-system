import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Sales from "./pages/Sales";
import SalesHistory from "./pages/SalesHistory";
import ReturnsHistory from "./pages/ReturnsHistory";
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
import Customers from "./pages/Customers";

import LandingPage from "./pages/LandingPage";
import Settings from "./pages/Settings";
import DevOfflineHandler from "./components/DevOfflineHandler";
import { Agentation } from "agentation";
import Expenses from "./pages/Expenses";
import SupplierPayables from "./pages/SupplierPayables";
import CashFlow from "./pages/CashFlow";
import BalanceSheet from "./pages/BalanceSheet";

export const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <DevOfflineHandler>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <SidebarProvider>
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
                            <ErrorBoundary><Dashboard /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Inventory /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/categories" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Categories /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/suppliers" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Suppliers /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/category/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><CategoryDetails /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/inventory/supplier/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><SupplierDetails /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/sales" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Sales /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/sales/history" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><SalesHistory /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/sales/returns" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><ReturnsHistory /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/debtors" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Debtors /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/customers" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Customers /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Reports /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/market" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Market /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/market/discovery" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><MarketDiscovery /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Settings /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/finance/expenses" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><Expenses /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/finance/payables" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><SupplierPayables /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/finance/cashflow" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><CashFlow /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/finance/balance-sheet" element={
                        <ProtectedRoute>
                          <Layout>
                            <ErrorBoundary><BalanceSheet /></ErrorBoundary>
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* Catch-all route for 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                  {import.meta.env.DEV && <Agentation />}
                </TooltipProvider>
              </SidebarProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </DevOfflineHandler>
    </ErrorBoundary>
  );
};

export default App;
