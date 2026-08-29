import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient, useMutation } from 'convex/react'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { api } from '../../convex/_generated/api'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local");
}
if (!CONVEX_URL) {
  throw new Error("Missing Convex URL. Add VITE_CONVEX_URL to .env.local");
}

const convex = new ConvexReactClient(CONVEX_URL);

// Syncs the signed-in Clerk user into the Convex database on first login.
// This replaces the Clerk webhook — no dashboard setup required.
function UserSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const createOrGetUser = useMutation(api.auth.createOrGetUser);
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || synced.current) return;
    synced.current = true;

    const email = user.primaryEmailAddress?.emailAddress ?? '';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || email;

    createOrGetUser({ clerkId: user.id, email, name }).catch(() => {
      // User likely already exists — safe to ignore
      synced.current = false; // allow retry on failure
    });
  }, [isLoaded, isSignedIn, user, createOrGetUser]);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <UserSync />
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
)

