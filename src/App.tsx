import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { BluetoothProvider } from "./contexts/BluetoothContext";
import Dashboard from "./pages/Dashboard";
import Parties from "./pages/Parties";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";

import CreateInvoice from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Returns from "./pages/Returns";
import DistributorsData from "./pages/DistributorsData";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BluetoothProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/parties" element={<Parties />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/inventory" element={<Inventory />} />

                    <Route path="/create-invoice" element={<CreateInvoice />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/distributors-data" element={<DistributorsData />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin-panel" element={<AdminPanel />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </BluetoothProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;