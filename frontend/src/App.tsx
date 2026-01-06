import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
import Register from "./pages/Register";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import CategoryDetails from "./pages/CategoryDetails";
import SupplierDetails from "./pages/SupplierDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp" element={<OTP />} />

            {/* Protected routes */}
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/inventory/categories" element={<Categories />} />
                    <Route path="/inventory/suppliers" element={<Suppliers />} />
                    <Route path="/inventory/category/:id" element={<CategoryDetails />} />
                    <Route path="/inventory/supplier/:id" element={<SupplierDetails />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/sales/history" element={<SalesHistory />} />
                    <Route path="/debtors" element={<Debtors />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/market" element={<Market />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
