import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { DataProvider, useData } from "./contexts/DataContext";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import WarehousesPage from "./pages/WarehousesPage";
import CropsPage from "./pages/CropsPage";
import ResourcesPage from "./pages/ResourcesPage";
import AllocationsPage from "./pages/AllocationsPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import AuditLogPage from "./pages/AuditLogPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedRoute() {
  const { isAuthenticated } = useData();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated } = useData();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <DataProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="warehouses" element={<WarehousesPage />} />
                  <Route path="crops" element={<CropsPage />} />
                  <Route path="resources" element={<ResourcesPage />} />
                  <Route path="allocations" element={<AllocationsPage />} />
                  <Route path="ai-insights" element={<AIInsightsPage />} />
                  <Route path="audit-log" element={<AuditLogPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </DataProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
