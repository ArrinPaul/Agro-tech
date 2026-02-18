import { useState } from "react";
import { 
  Trash2, 
  Download, 
  Plus,
  Check,
  X,
  PackageCheck,
  AlertTriangle,
  Loader
} from "lucide-react";
import { useBulkOperations } from "../utils/phase8-features";
import { useOptimisticUpdates } from "../hooks/useAdvancedFeatures";

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkStatusUpdate?: (ids: string[], status: string) => Promise<void>; 
  onBulkExport?: (ids: string[]) => Promise<void>;
  onBulkImport?: () => void;
  itemType: "crops" | "warehouses" | "resources";
  statusOptions?: { value: string; label: string; color: string }[];
}

const STATUS_CONFIGS = {
  crops: [
    { value: "PLANTED", label: "Planted", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" },
    { value: "GROWING", label: "Growing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" },
    { value: "HARVESTED", label: "Harvested", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
    { value: "STORED", label: "Stored", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300" },
  ],
  warehouses: [
    { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
    { value: "MAINTENANCE", label: "Maintenance", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" },
    { value: "INACTIVE", label: "Inactive", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300" },
  ],
  resources: [
    { value: "IN_STOCK", label: "In Stock", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
    { value: "LOW_STOCK", label: "Low Stock", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" },
    { value: "OUT_OF_STOCK", label: "Out of Stock", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" },
  ]
};

export default function BulkActions({
  selectedIds,
  onClearSelection,
  onBulkDelete,
  onBulkStatusUpdate,
  onBulkExport,
  onBulkImport,
  itemType,
  statusOptions
}: BulkActionsProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  
  const { createOperation, updateProgress, setResult, setError } = useBulkOperations();
  const { applyOptimisticUpdate, clearOptimisticUpdate } = useOptimisticUpdates();

  const statusConfigs = statusOptions || STATUS_CONFIGS[itemType];

  if (selectedIds.length === 0) {
    return null;
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (!onBulkStatusUpdate) return;
    
    setLoading('status');
    setShowStatusMenu(false);

    // Create bulk operation
    const operationId = createOperation(`Update status to ${status}`, selectedIds.length);

    // Add optimistic updates
    selectedIds.forEach(id => 
      applyOptimisticUpdate(id, { status } as Partial<{ _id: string }>)
    );

    try {
      // Process in batches for better performance
      const batchSize = 10;
      let completed = 0;
      
      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batch = selectedIds.slice(i, i + batchSize);
        await onBulkStatusUpdate(batch, status);
        completed += batch.length;
        updateProgress(operationId, completed);
        
        // Small delay to prevent overwhelming the server  
        if (i + batchSize < selectedIds.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setResult(operationId, {
        updated: selectedIds.length,
        status: status
      });

      onClearSelection();

    } catch (error) {
      // Remove optimistic updates on error
      selectedIds.forEach(id => clearOptimisticUpdate(id));
      setError(operationId, (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    
    setLoading('delete');
    setShowDeleteConfirm(false);

    // Create bulk operation
    const operationId = createOperation(`Delete ${itemType}`, selectedIds.length);

    // Add optimistic updates (mark as deleted)
    selectedIds.forEach(id => 
      applyOptimisticUpdate(id, { deleted: true } as Partial<{ _id: string }>)
    );

    try {
      // Process in batches
      const batchSize = 10;
      let completed = 0;
      
      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batch = selectedIds.slice(i, i + batchSize);
        await onBulkDelete(batch);
        completed += batch.length;
        updateProgress(operationId, completed);
        
        if (i + batchSize < selectedIds.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setResult(operationId, {
        deleted: selectedIds.length
      });

      onClearSelection();

    } catch (error) {
      // Remove optimistic updates on error
      selectedIds.forEach(id => clearOptimisticUpdate(id));
      setError(operationId, (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleBulkExport = async () => {
    if (!onBulkExport) return;
    
    setLoading('export');
    
    try {
      await onBulkExport(selectedIds);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <PackageCheck size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
              {selectedIds.length} {itemType} selected
            </span>
          </div>
          
          <button
            onClick={onClearSelection}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Clear selection"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Import Button */}
          {onBulkImport && (
            <button
              onClick={onBulkImport}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              Import
            </button>
          )}

          {/* Export Button */}
          {onBulkExport && (
            <button
              onClick={handleBulkExport}
              disabled={loading === 'export'}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'export' ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Export
            </button>
          )}

          {/* Status Update */}
          {onBulkStatusUpdate && statusConfigs && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={loading === 'status'}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading === 'status' ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Update Status
              </button>

              {showStatusMenu && (
                <div className="absolute top-full right-0 mt-1 rounded-lg shadow-lg py-1 z-10 min-w-[150px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  {statusConfigs.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleBulkStatusUpdate(status.value)}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delete Button */}
          {onBulkDelete && (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading === 'delete'}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading === 'delete' ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="card p-6 max-w-md w-full mx-4">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        Confirm Deletion
                      </h3>
                    </div>
                    
                    <p className="mb-6" style={{ color: "var(--text-muted)" }}>
                      Are you sure you want to delete {selectedIds.length} {itemType}? This action cannot be undone.
                    </p>
                    
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="btn btn-danger"
                      >
                        Delete {selectedIds.length} {itemType}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Click outside handler for status menu */}
      {showStatusMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </div>
  );
}