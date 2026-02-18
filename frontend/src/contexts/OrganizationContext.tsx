import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface OrganizationContextType {
  currentOrgId: Id<"organizations"> | null;
  setCurrentOrgId: (id: Id<"organizations"> | null) => void;
  organizations: Array<{ _id: Id<"organizations">; name: string }> | undefined;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider");
  return ctx;
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrgId, setCurrentOrgId] = useState<Id<"organizations"> | null>(null);
  
  // Query all organizations
  const organizations = useQuery(api.organizations.listOrganizations);
  
  const isLoading = organizations === undefined;

  // Auto-select first organization if none selected
  useEffect(() => {
    if (!currentOrgId && organizations && organizations.length > 0) {
      // Try to restore from localStorage
      const saved = localStorage.getItem("agrotech_current_org");
      if (saved) {
        const found = organizations.find(o => o._id === saved);
        if (found) {
          setCurrentOrgId(found._id);
          return;
        }
      }
      // Default to first org
      setCurrentOrgId(organizations[0]._id);
    }
  }, [currentOrgId, organizations]);

  // Save to localStorage when changed
  useEffect(() => {
    if (currentOrgId) {
      localStorage.setItem("agrotech_current_org", currentOrgId);
    }
  }, [currentOrgId]);

  return (
    <OrganizationContext.Provider value={{ currentOrgId, setCurrentOrgId, organizations, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}
