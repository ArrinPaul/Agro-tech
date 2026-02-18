# 🚀 AgroTech Setup Guide

This guide will help you set up the AgroTech platform with Clerk authentication and Convex backend.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- A Clerk account (free tier available)
- A Convex account (free tier available)

## 🔧 Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Setup Clerk Authentication

1. **Create a Clerk Account**
   - Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
   - Sign up for a free account
   - Click "Create Application"

2. **Configure Clerk Project**
   - Name your application (e.g., "AgroTech")
   - Choose sign-in methods:
     - ✅ Email/Password (required)
     - ✅ Google OAuth (optional but recommended)
   - Click "Create Application"

3. **Get Your Clerk Keys**
   - In the Clerk dashboard, go to "API Keys"
   - Copy the **Publishable Key** (starts with `pk_test_...`)
   - Copy the **Secret Key** (starts with `sk_test_...`)

4. **Setup Clerk Webhook (for user sync)**
   - In Clerk dashboard, go to "Webhooks"
   - Click "Add Endpoint"
   - URL format: `https://your-convex-site.convex.site/webhook/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret

### 3. Setup Convex Backend

1. **Create a Convex Account**
   - Go to [https://dashboard.convex.dev/](https://dashboard.convex.dev/)
   - Sign up with GitHub (recommended)

2. **Initialize Convex Project**
   ```bash
   # From the root directory
   npx convex dev
   ```
   
   This will:
   - Create a new Convex project
   - Link it to your local workspace
   - Generate your deployment URL
   - Start the dev server

3. **Get Your Convex URL**
   - After running `npx convex dev`, you'll see output like:
   ```
   Convex Dev Server running at: https://your-project.convex.cloud
   ```
   - Copy this URL (it's your `VITE_CONVEX_URL`)

### 4. Configure Environment Variables

1. **Create root `.env.local` file:**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** and add your keys:
   ```env
   CONVEX_DEPLOYMENT=your-deployment-name
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_here
   ```

3. **Create frontend `.env.local` file:**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

4. **Edit `frontend/.env.local`**:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   VITE_CONVEX_URL=https://your-project.convex.cloud
   ```

### 5. Deploy Convex Schema

```bash
# Make sure convex dev is running
npx convex dev

# In another terminal, push the schema
npx convex deploy --cmd npm run dev
```

This will create all the database tables:
- users
- organizations
- warehouses
- crops
- resources
- cropResources
- allocations
- auditLogs

### 6. Test the Setup

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:5173`
   - You should see the login page

3. **Sign up for a new account:**
   - Click "Sign up" or go to `/sign-up`
   - Create a test account
   - You'll be redirected to the dashboard

4. **Verify User Creation:**
   - Go to your Convex dashboard
   - Check the `users` table
   - You should see your user entry

## 🎯 Quick Start After Setup

Once everything is configured:

```bash
# Terminal 1: Start Convex dev server
npx convex dev

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

## 📝 Default Data

The platform currently uses mock data for demonstration. To add real data:

1. **Create an Organization:**
   - Use the Convex dashboard to manually insert a record in the `organizations` table
   - Copy the generated organization ID

2. **Update User Organization:**
   - Find your user in the `users` table
   - Update the `organizationId` field with the organization ID from step 1

3. **Add Sample Data:**
   - Go to the frontend and start creating warehouses, crops, and resources
   - All data will be stored in Convex

## 🔒 Security Notes

- Never commit `.env.local` files to version control
- Keep your Clerk Secret Key private
- Use test keys during development
- Switch to production keys when deploying

## 🐛 Troubleshooting

### "Missing Clerk Publishable Key" Error
- Check that `VITE_CLERK_PUBLISHABLE_KEY` is set in `frontend/.env.local`
- Restart the dev server after adding environment variables

### "Missing Convex URL" Error
- Run `npx convex dev` first to get your deployment URL
- Add `VITE_CONVEX_URL` to `frontend/.env.local`

### Webhook Not Working
- Make sure your Convex deployment is live
- Check the webhook URL in Clerk dashboard
- View webhook logs in Clerk dashboard for errors

### User Not Appearing in Convex
- Check that the Clerk webhook is configured
- Verify the webhook signing secret
- Look at the `auth.ts` file and test the webhook endpoint

## 📚 Next Steps

After setup, you can:

1. **Implement Role-Based Access Control**
   - Update the `users` table schema to include roles
   - Create middleware for role checking
   - Update the UI to show/hide features based on roles

2. **Replace Mock Data with Real Queries**
   - Update `DataContext.tsx` to use Convex queries and mutations
   - Replace all mock CRUD operations with real Convex calls

3. **Add More Features**
   - Implement the allocation engine
   - Add AI suggestions
   - Create reports and analytics

## 🤝 Need Help?

- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [React Router Documentation](https://reactrouter.com)

## 📄 License

This project is licensed under the MIT License.
