import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { OrganizationProvider } from './contexts/OrganizationContext.tsx'
import { DataProvider } from './contexts/ConvexDataContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import './index.css'
import App from './App.tsx'

// Import Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local");
}

if (!CONVEX_URL) {
  throw new Error("Missing Convex URL. Add VITE_CONVEX_URL to .env.local");
}

// Create Convex client
const convex = new ConvexReactClient(CONVEX_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <OrganizationProvider>
          <DataProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </DataProvider>
        </OrganizationProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
)
