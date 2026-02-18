import { useState, useRef } from "react";
import { Upload, Download, FileText, AlertCircle, X, Eye } from "lucide-react";
import { parseCSVFile, useBulkOperations, type CSVImportResult } from "../utils/phase8-features";
import { validateStringLength, validateNumberRange } from "../utils/security";
import Modal from "./Modal";

interface BulkImportProps {
  onImport: (items: unknown[]) => Promise<void>;
  importType: "crops" | "warehouses" | "resources";
  isOpen: boolean;
  onClose: () => void;
}

const IMPORT_TEMPLATES = {
  crops: {
    filename: "crops_template.csv",
    headers: ["Name", "Quantity", "Status"],
    example: [
      ["Wheat", "1000", "PLANTED"],
      ["Rice", "800", "GROWING"],
      ["Corn", "1200", "HARVESTED"]
    ]
  },
  warehouses: {
    filename: "warehouses_template.csv", 
    headers: ["Name", "Location", "Total Capacity"],
    example: [
      ["Central Silo A", "North Field", "5000"],
      ["Storage Unit B", "South Field", "3000"],
      ["Warehouse C", "East Field", "4000"]
    ]
  },
  resources: {
    filename: "resources_template.csv",
    headers: ["Name", "Type", "Stock Quantity"],
    example: [
      ["Nitrogen Fertilizer", "FERTILIZER", "500"],
      ["Phosphorus Fertilizer", "FERTILIZER", "300"],
      ["Pesticide XYZ", "PESTICIDE", "200"]
    ]
  }
};

const VALIDATORS = {
  crops: (row: Record<string, string>) => {
    const errors: string[] = [];
    
    // Validate name
    const nameValid = validateStringLength(row.Name, 1, 100, "Name");
    if (!nameValid.valid) errors.push(nameValid.error!);
    
    // Validate quantity
    const qty = Number(row.Quantity);
    const qtyValid = validateNumberRange(qty, 1, 1000000, "Quantity");
    if (!qtyValid.valid) errors.push(qtyValid.error!);
    
    // Validate status
    const validStatuses = ["PLANTED", "GROWING", "HARVESTED", "STORED"];
    if (!validStatuses.includes(row.Status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    }
    
    if (errors.length > 0) {
      return { isValid: false, error: errors.join("; ") };
    }
    
    return {
      isValid: true,
      data: {
        name: row.Name,
        quantity: qty,
        status: row.Status
      }
    };
  },
  
  warehouses: (row: Record<string, string>) => {
    const errors: string[] = [];
    
    // Validate name
    const nameValid = validateStringLength(row.Name, 1, 100, "Name");
    if (!nameValid.valid) errors.push(nameValid.error!);
    
    // Validate location
    const locationValid = validateStringLength(row.Location, 1, 200, "Location");
    if (!locationValid.valid) errors.push(locationValid.error!);
    
    // Validate capacity
    const capacity = Number(row["Total Capacity"]);
    const capacityValid = validateNumberRange(capacity, 1, 10000000, "Total Capacity");
    if (!capacityValid.valid) errors.push(capacityValid.error!);
    
    if (errors.length > 0) {
      return { isValid: false, error: errors.join("; ") };
    }
    
    return {
      isValid: true,
      data: {
        name: row.Name,
        location: row.Location,
        totalCapacity: capacity
      }
    };
  },
  
  resources: (row: Record<string, string>) => {
    const errors: string[] = [];
    
    // Validate name
    const nameValid = validateStringLength(row.Name, 1, 100, "Name");
    if (!nameValid.valid) errors.push(nameValid.error!);
    
    // Validate type
    const validTypes = ["FERTILIZER", "PESTICIDE"];
    if (!validTypes.includes(row.Type)) {
      errors.push(`Type must be one of: ${validTypes.join(", ")}`);
    }
    
    // Validate stock quantity
    const stock = Number(row["Stock Quantity"]);
    const stockValid = validateNumberRange(stock, 0, 1000000, "Stock Quantity");
    if (!stockValid.valid) errors.push(stockValid.error!);
    
    if (errors.length > 0) {
      return { isValid: false, error: errors.join("; ") };
    }
    
    return {
      isValid: true,
      data: {
        name: row.Name,
        type: row.Type,
        stockQuantity: stock
      }
    };
  }
};

export default function BulkImport({ onImport, importType, isOpen, onClose }: BulkImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult<unknown> | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createOperation, updateProgress, setError: setBulkError, setResult: setBulkResult } = useBulkOperations();

  const template = IMPORT_TEMPLATES[importType];
  const validator = VALIDATORS[importType];

  const downloadTemplate = () => {
    const headers = template.headers;
    const rows = template.example;
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    setParsing(true);
    setResult(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseResult = await parseCSVFile(selectedFile, validator as any, template.headers);
      setResult(parseResult);
    } catch (error) {
      alert(`Error parsing CSV: ${error}`);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!result || result.success.length === 0) return;

    setImporting(true);
    const operationId = createOperation(`Import ${importType}`, result.success.length);

    try {
      // Import items in batches
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < result.success.length; i += batchSize) {
        batches.push(result.success.slice(i, i + batchSize));
      }

      let completed = 0;
      for (const batch of batches) {
        await onImport(batch);
        completed += batch.length;
        updateProgress(operationId, completed);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setBulkResult(operationId, {
        imported: result.success.length,
        errors: result.errors.length
      });

      // Close the modal and reset state
      handleClose();
      
    } catch (error) {
      setBulkError(operationId, (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setShowErrors(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={`Bulk Import ${importType.charAt(0).toUpperCase() + importType.slice(1)}`}>
      <div className="space-y-6">
        {/* Step 1: Download Template */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Download Template</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Download the CSV template with the correct format and example data.
          </p>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Download size={16} />
            Download {template.filename}
          </button>
        </div>

        {/* Step 2: Upload File */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Upload CSV File</h3>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${ 
              dragActive 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <FileText size={20} />
                <span className="font-medium">{file.name}</span>
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div>
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  Drag and drop your CSV file here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Expected headers: {template.headers.join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Review & Import */}
        {file && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Review & Import</h3>
            </div>

            {parsing ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Parsing CSV file...</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.summary.total}</div>
                    <div className="text-blue-700 dark:text-blue-300">Total Rows</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.summary.successful}</div>
                    <div className="text-green-700 dark:text-green-300">Valid</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.summary.failed}</div>
                    <div className="text-red-700 dark:text-red-300">Errors</div>
                  </div>
                </div>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                        <h4 className="font-medium text-red-700 dark:text-red-300">
                          {result.errors.length} rows have errors
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowErrors(!showErrors)}
                        className="text-red-600 dark:text-red-400 hover:underline text-sm flex items-center gap-1"
                      >
                        <Eye size={14} />
                        {showErrors ? "Hide" : "Show"} errors
                      </button>
                    </div>
                    
                    {showErrors && (
                      <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-red-700 dark:text-red-300">Row {error.row}:</span>
                            <span className="text-red-600 dark:text-red-400 ml-2">{error.error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Import button */}
                {result.success.length > 0 && (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {importing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      Import {result.success.length} {importType}
                      {importing ? "..." : ""}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}