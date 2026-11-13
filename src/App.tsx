import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/stores/auth-store';
import { useBusinessStore } from '@/stores/business-store';
import { businessService } from '@/lib/services';

import WelcomePage from '@/features/auth/WelcomePage';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import CreateBusinessPage from '@/features/onboarding/CreateBusinessPage';

import DashboardPage from '@/features/dashboard/DashboardPage';
import ProductsPage from '@/features/products/ProductsPage';
import InventoryPage from '@/features/inventory/InventoryPage';
import POSPage from '@/features/pos/POSPage';
import SalesPage from '@/features/sales/SalesPage';
import SaleDetailPage from '@/features/sales/SaleDetailPage';
import PurchasesPage from '@/features/purchases/PurchasesPage';
import ExpensesPage from '@/features/expenses/ExpensesPage';
import CustomersPage from '@/features/customers/CustomersPage';
import SuppliersPage from '@/features/suppliers/SuppliersPage';
import ReportsPage from '@/features/reports/ReportsPage';
import StaffPage from '@/features/staff/StaffPage';
import BranchesPage from '@/features/branches/BranchesPage';
import SettingsPage from '@/features/settings/SettingsPage';
import SubscriptionPage from '@/features/subscription/SubscriptionPage';
import SupportPage from '@/features/support/SupportPage';

import { ProtectedRoute } from '@/routes/ProtectedRoute';

export default function App() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { businesses, setBusinesses } = useBusinessStore();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  // Load businesses after login
  useEffect(() => {
    if (isAuthenticated && user && businesses.length === 0) {
      businessService.list().then(setBusinesses).catch(() => {});
    }
  }, [isAuthenticated, user, businesses.length, setBusinesses]);

  const needsOnboarding = isAuthenticated && businesses.length === 0;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding */}
      <Route
        path="/onboarding/business"
        element={
          <ProtectedRoute requireBusiness={false}>
            <CreateBusinessPage />
          </ProtectedRoute>
        }
      />

      {/* App (auth + business required) */}
      <Route
        element={
          <ProtectedRoute requireBusiness>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? (needsOnboarding ? '/onboarding/business' : '/dashboard') : '/'}
            replace
          />
        }
      />
    </Routes>
  );
}
