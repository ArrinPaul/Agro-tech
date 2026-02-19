import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import WarehousesPage from "./pages/WarehousesPage";
import CropsPage from "./pages/CropsPage";
import CropDetailPage from "./pages/CropDetailPage";
import ResourcesPage from "./pages/ResourcesPage";
import AllocationsPage from "./pages/AllocationsPage";
import AllocationDetailPage from "./pages/AllocationDetailPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import AuditLogPage from "./pages/AuditLogPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// Clerk handles auth on the UI layer.
// Convex handles data isolation via organizationId on every query/mutation.
// UserSync in main.tsx creates/syncs the user record via createOrGetUser mutation.
function ProtectedRoute() {
  return (
    <>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
}

function PublicRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  return isSignedIn ? <Navigate to="/" replace /> : <Outlet />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            {/* Public routes — use /* so Clerk SSO sub-paths (e.g. /sign-up/sso-callback) don't 404 */}
            <Route element={<PublicRoute />}>
              <Route path="/login/*" element={<LoginPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="warehouses" element={<WarehousesPage />} />
                <Route path="crops" element={<CropsPage />} />
                <Route path="crops/:id" element={<CropDetailPage />} />
                <Route path="resources" element={<ResourcesPage />} />
                <Route path="allocations" element={<AllocationsPage />} />
                <Route path="allocations/:id" element={<AllocationDetailPage />} />
                <Route path="ai-insights" element={<AIInsightsPage />} />
                <Route path="audit-log" element={<AuditLogPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>
            </Route>

            {/* Error pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
