import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Warehouse, Sprout, FlaskConical,
  GitMerge, BrainCircuit, ClipboardList, FileBarChart2,
  Menu, X, LogOut, ChevronRight, Leaf,
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/warehouses", label: "Warehouses", icon: Warehouse },
  { to: "/crops", label: "Crops", icon: Sprout },
  { to: "/resources", label: "Resources", icon: FlaskConical },
  { to: "/allocations", label: "Allocations", icon: GitMerge },
  { to: "/ai-insights", label: "AI Insights", icon: BrainCircuit },
  { to: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  MANAGER: "bg-blue-100 text-blue-700",
  OPERATOR: "bg-green-100 text-green-700",
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, organization, logout } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  function handleLogout() {
    logout();
    addToast("Logged out successfully", "info");
    navigate("/login");
  }

  const currentPage =
    location.pathname === "/"
      ? "Dashboard"
      : location.pathname.slice(1).replace(/-/g, " ");

  // Sidebar content shared between desktop and mobile
  const sidebarContent = (isDesktop: boolean) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 min-h-[64px]">
        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <Leaf size={18} className="text-white" />
        </div>
        {(isDesktop ? sidebarOpen : true) && (
          <div className="overflow-hidden">
            <p className="font-bold text-gray-900 text-sm leading-none">AgroTech</p>
            <p className="text-xs text-gray-400 mt-0.5">{organization.name}</p>
          </div>
        )}
        {/* Close button on mobile */}
        {!isDesktop && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-500 md:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {(isDesktop ? sidebarOpen : true) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User area */}
      {(isDesktop ? sidebarOpen : true) && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {currentUser.name.charAt(0)}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[currentUser.role]}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"
          }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 min-h-[64px]">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hidden md:block"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="text-green-700 font-medium">AgroTech</span>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium capitalize">
              {currentPage}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
