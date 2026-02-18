import { useEffect, useCallback, useRef } from "react";

/**
 * Keyboard shortcut definitions for the application
 */
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  "alt+d": { action: "navigate_dashboard", description: "Go to Dashboard" },
  "alt+w": { action: "navigate_warehouses", description: "Go to Warehouses" },
  "alt+c": { action: "navigate_crops", description: "Go to Crops" },
  "alt+r": { action: "navigate_resources", description: "Go to Resources" },
  "alt+a": { action: "navigate_allocations", description: "Go to Allocations" },
  "alt+i": { action: "navigate_ai_insights", description: "Go to AI Insights" },
  "alt+l": { action: "navigate_audit_log", description: "Go to Audit Log" },
  "alt+p": { action: "navigate_reports", description: "Go to Reports" },

  // Actions
  "ctrl+n": { action: "create_new", description: "Create new item" },
  "ctrl+s": { action: "save", description: "Save current form" },
  "ctrl+f": { action: "focus_search", description: "Focus search bar" },
  "ctrl+shift+e": { action: "export_csv", description: "Export to CSV" },
  "escape": { action: "close_modal", description: "Close modal/dialog" },
  "ctrl+a": { action: "select_all", description: "Select all items" },
  "delete": { action: "delete_selected", description: "Delete selected items" },
  "?": { action: "show_shortcuts", description: "Show keyboard shortcuts" },
} as const;

type ShortcutAction = (typeof KEYBOARD_SHORTCUTS)[keyof typeof KEYBOARD_SHORTCUTS]["action"];

/**
 * Hook for global keyboard shortcuts with focus management
 */
export function useGlobalKeyboardShortcuts(
  handlers: Partial<Record<ShortcutAction, () => void>>
) {
  const handlersRef = useRef(handlers);
  useEffect(() => { handlersRef.current = handlers; });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs (unless it's Escape)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (isInput && e.key !== "Escape") return;

      // Build key combo string
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("ctrl");
      if (e.shiftKey) parts.push("shift");
      if (e.altKey) parts.push("alt");
      parts.push(e.key.toLowerCase());
      const combo = parts.join("+");

      const shortcut = KEYBOARD_SHORTCUTS[combo as keyof typeof KEYBOARD_SHORTCUTS];
      if (shortcut) {
        const handler = handlersRef.current[shortcut.action];
        if (handler) {
          e.preventDefault();
          e.stopPropagation();
          handler();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Focus trap for modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTab);
    return () => container.removeEventListener("keydown", handleTab);
  }, [isActive]);

  return containerRef;
}

/**
 * Skip navigation link for accessibility
 */
export function SkipNavLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-green-600 focus:text-white focus:rounded-br-lg"
    >
      Skip to main content
    </a>
  );
}

/**
 * Live region announcer for screen readers
 */
export function useAnnouncer() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const region = document.getElementById(`aria-live-${priority}`);
    if (region) {
      region.textContent = "";
      // Force DOM re-render for screen readers
      requestAnimationFrame(() => {
        region.textContent = message;
      });
    }
  }, []);

  return { announce };
}

/**
 * Component that provides live regions for announcements
 */
export function AriaLiveRegions() {
  return (
    <>
      <div
        id="aria-live-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        id="aria-live-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * Keyboard shortcuts help dialog content
 */
export function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  const categories = {
    Navigation: Object.entries(KEYBOARD_SHORTCUTS)
      .filter(([, v]) => v.action.startsWith("navigate_"))
      .map(([key, v]) => ({ key, description: v.description })),
    Actions: Object.entries(KEYBOARD_SHORTCUTS)
      .filter(([, v]) => !v.action.startsWith("navigate_"))
      .map(([key, v]) => ({ key, description: v.description })),
  };

  return (
    <div className="space-y-4" role="dialog" aria-label="Keyboard Shortcuts">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close shortcuts dialog"
        >
          ✕
        </button>
      </div>
      {Object.entries(categories).map(([category, shortcuts]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{category}</h3>
          <div className="space-y-1">
            {shortcuts.map(({ key, description }) => (
              <div key={key} className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-700 dark:text-gray-300">{description}</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                  {key.replace("ctrl", "Ctrl").replace("alt", "Alt").replace("shift", "Shift").replace("+", " + ")}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
