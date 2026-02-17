import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import { ToastProvider } from "./components/Toast";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import WarehousesPage from "./pages/WarehousesPage";
import CropsPage from "./pages/CropsPage";
import ResourcesPage from "./pages/ResourcesPage";
import AllocationsPage from "./pages/AllocationsPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import AuditLogPage from "./pages/AuditLogPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="warehouses" element={<WarehousesPage />} />
              <Route path="crops" element={<CropsPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="allocations" element={<AllocationsPage />} />
              <Route path="ai-insights" element={<AIInsightsPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
