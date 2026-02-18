import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportSection = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
};

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  organization?: string;
  dateRange?: { start: string; end: string };
  sections: ReportSection[];
  summary?: Record<string, string | number>;
}

const BRAND_GREEN = [22, 163, 74]; // #16a34a
const HEADER_BG = [34, 197, 94]; // #22c55e
const LIGHT_GRAY = [249, 250, 251];
const DARK_TEXT = [17, 24, 39];

export function exportToPDF(options: PDFExportOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header bar
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, pageWidth, 30, "F");

  // Logo text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("AgroTech", 14, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Smart Crop & Warehouse Management", 14, 21);

  // Title on right
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(options.title, pageWidth - 14, 14, { align: "right" });

  if (options.subtitle) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(options.subtitle, pageWidth - 14, 21, { align: "right" });
  }

  y = 38;

  // Meta info
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  const metaLines: string[] = [];
  if (options.organization) metaLines.push(`Organization: ${options.organization}`);
  if (options.dateRange) metaLines.push(`Period: ${options.dateRange.start} — ${options.dateRange.end}`);
  metaLines.push(`Generated: ${new Date().toLocaleString()}`);

  metaLines.forEach((line) => {
    doc.text(line, 14, y);
    y += 5;
  });
  y += 3;

  // Summary box
  if (options.summary && Object.keys(options.summary).length > 0) {
    doc.setFillColor(...LIGHT_GRAY);
    const summaryEntries = Object.entries(options.summary);
    const boxHeight = 12 + Math.ceil(summaryEntries.length / 3) * 10;
    doc.roundedRect(14, y, pageWidth - 28, boxHeight, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_GREEN);
    doc.text("Summary", 18, y + 6);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(8);

    const colWidth = (pageWidth - 36) / 3;
    summaryEntries.forEach(([key, value], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 18 + col * colWidth;
      const yPos = y + row * 10;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(key, x, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_TEXT);
      doc.text(String(value), x, yPos + 4);
    });

    y += Math.ceil(summaryEntries.length / 3) * 10 + 4;
  }

  // Sections with tables
  options.sections.forEach((section) => {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 15;
    }

    // Section title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_GREEN);
    doc.text(section.title, 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [section.headers],
      body: section.rows.map((row) => row.map(String)),
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7,
        cellPadding: 3,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: HEADER_BG as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      didDrawPage: () => {
        // Footer on every page
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `AgroTech Report — Page ${doc.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          pageH - 8,
          { align: "center" }
        );
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable?.finalY + 10 || y + 20;
  });

  // Save
  const filename = `${options.title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
  return filename;
}

// Convenience functions for each report type

export function exportWarehouseReportPDF(
  data: { warehouses: any[]; summary: any },
  organization: string,
  dateRange?: { start: string; end: string }
) {
  return exportToPDF({
    title: "Warehouse Report",
    subtitle: "Capacity & Utilization Analysis",
    organization,
    dateRange,
    summary: {
      "Total Warehouses": data.summary.totalWarehouses,
      "Active Warehouses": data.summary.activeWarehouses,
      "Total Capacity": data.summary.totalCapacity.toLocaleString(),
      "Total Used": data.summary.totalUsed.toLocaleString(),
      "Avg Utilization": `${data.summary.avgUtilization}%`,
      "Total Allocations": data.summary.totalAllocations,
    },
    sections: [
      {
        title: "Warehouse Details",
        headers: ["Name", "Location", "Capacity", "Used", "Utilization", "Status", "Allocations"],
        rows: data.warehouses.map((w: any) => [
          w.name,
          w.location,
          w.totalCapacity.toLocaleString(),
          w.usedCapacity.toLocaleString(),
          `${w.utilizationPercent}%`,
          w.status,
          w.totalAllocations,
        ]),
      },
    ],
  });
}

export function exportAllocationReportPDF(
  data: { allocations: any[]; summary: any },
  organization: string,
  groupBy: string,
  dateRange?: { start: string; end: string }
) {
  return exportToPDF({
    title: "Allocation Report",
    subtitle: `Grouped by ${groupBy}`,
    organization,
    dateRange,
    summary: {
      "Total Allocations": data.summary.totalAllocations,
      "Total Quantity": data.summary.totalQuantity.toLocaleString(),
      "Unique Groups": data.allocations.length,
    },
    sections: [
      {
        title: `Allocations by ${groupBy}`,
        headers: ["Group", "Count", "Total Quantity", "Avg Quantity"],
        rows: data.allocations.map((a: any) => [
          a.groupKey,
          a.count,
          a.totalQuantity.toLocaleString(),
          a.avgQuantity.toFixed(1),
        ]),
      },
    ],
  });
}

export function exportResourceReportPDF(
  data: { resources: any[]; summary: any },
  organization: string,
  dateRange?: { start: string; end: string }
) {
  return exportToPDF({
    title: "Resource Usage Report",
    subtitle: "Stock Levels & Depletion Analysis",
    organization,
    dateRange,
    summary: {
      "Total Resources": data.summary.totalResources,
      "Total Stock": data.summary.totalStock.toLocaleString(),
      "Total Used": data.summary.totalUsed.toLocaleString(),
      "At Risk": data.summary.atRiskCount,
    },
    sections: [
      {
        title: "Resource Details",
        headers: ["Name", "Type", "Stock", "Used", "Avg Daily Usage", "Days Until Depletion"],
        rows: data.resources.map((r: any) => [
          r.name,
          r.type,
          r.currentStock.toLocaleString(),
          r.totalUsed.toLocaleString(),
          r.avgDailyUsage.toFixed(1),
          r.daysUntilDepletion !== null ? r.daysUntilDepletion : "N/A",
        ]),
      },
    ],
  });
}

export function exportCropReportPDF(
  data: { crops: any[]; summary: any },
  organization: string,
  dateRange?: { start: string; end: string }
) {
  return exportToPDF({
    title: "Crop Report",
    subtitle: "Status & Allocation Analysis",
    organization,
    dateRange,
    summary: {
      "Total Crops": data.summary.totalCrops,
      "Total Quantity": data.summary.totalQuantity.toLocaleString(),
      "Allocated Crops": data.summary.allocatedCrops,
      "Allocation Rate": `${data.summary.avgAllocationRate}%`,
    },
    sections: [
      {
        title: "Crop Details",
        headers: ["Name", "Status", "Quantity", "Allocations", "Allocation Rate", "Resources"],
        rows: data.crops.map((c: any) => [
          c.name,
          c.status,
          c.totalQuantity.toLocaleString(),
          c.allocationCount,
          `${c.allocationRate}%`,
          c.resourceCount,
        ]),
      },
    ],
  });
}

export function exportDashboardSummaryPDF(
  data: { summary: any },
  organization: string
) {
  return exportToPDF({
    title: "Dashboard Summary",
    subtitle: "Overview Snapshot",
    organization,
    summary: {
      "Warehouses": data.summary.totalWarehouses,
      "Crops": data.summary.totalCrops,
      "Resources": data.summary.totalResources || "N/A",
      "Allocations": data.summary.totalAllocations,
      "Avg Utilization": `${data.summary.avgUtilization}%`,
    },
    sections: [],
  });
}
