// Example: Using role-based UI components

import { AdminOnly, ManagerOnly, useCurrentUser, useHasRole } from "../components/RequireRole";
import { Trash2, Settings, UserPlus } from "lucide-react";

export default function ExampleDashboard() {
  const user = useCurrentUser();
  const isAdmin = useHasRole(["ADMIN"]);
  const canManage = useHasRole(["ADMIN", "MANAGER"]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {user?.name} ({user?.role})
        </p>
      </div>

      {/* Example 1: Conditional rendering with hook */}
      {isAdmin && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            ⚡ You have admin privileges. You can manage all users and settings.
          </p>
        </div>
      )}

      {/* Example 2: Using AdminOnly component */}
      <div className="grid gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Warehouse Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure warehouse capacity and locations
          </p>
          
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              View
            </button>
            
            <ManagerOnly>
              <button className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure
              </button>
            </ManagerOnly>
            
            <AdminOnly>
              <button className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete All
              </button>
            </AdminOnly>
          </div>
        </div>

        {/* Example 3: Entire section only for admins */}
        <AdminOnly>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Admin Panel
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage users, roles, and system settings
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded">
              Go to Admin Panel
            </button>
          </div>
        </AdminOnly>

        {/* Example 4: Manager+ features */}
        <ManagerOnly fallback={
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm text-gray-500">
              🔒 Advanced features require Manager or Admin role
            </p>
          </div>
        }>
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">
              View detailed reports and predictions
            </p>
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              View Reports
            </button>
          </div>
        </ManagerOnly>
      </div>

      {/* Example 5: Dynamic menu based on role */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Everyone can see these */}
          <button className="p-3 border rounded hover:bg-gray-50">
            View Crops
          </button>
          <button className="p-3 border rounded hover:bg-gray-50">
            View Warehouses
          </button>
          
          {/* Only managers can see these */}
          {canManage && (
            <>
              <button className="p-3 border border-blue-300 text-blue-700 rounded hover:bg-blue-50">
                Bulk Import
              </button>
              <button className="p-3 border border-blue-300 text-blue-700 rounded hover:bg-blue-50">
                Export Reports
              </button>
            </>
          )}
          
          {/* Only admins can see these */}
          {isAdmin && (
            <>
              <button className="p-3 border border-purple-300 text-purple-700 rounded hover:bg-purple-50">
                System Settings
              </button>
              <button className="p-3 border border-purple-300 text-purple-700 rounded hover:bg-purple-50">
                User Management
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
