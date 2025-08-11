I guess I # Local Development Setup Guide

This guide will help you set up a complete local development and testing environment for the Grail App.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account (free tier works)
- A PayPal developer account (for testing payments)
- Netlify CLI (for testing serverless functions locally)

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone [repository-url]
cd grail-main

# Install dependencies
npm install

# Install Netlify CLI globally
npm install -g netlify-cli
```

## Step 2: Set Up Supabase

1. **Create a new Supabase project** at https://supabase.com

2. **Create the required tables** in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  dov_balance NUMERIC DEFAULT 0,
  djr_balance NUMERIC DEFAULT 0,
  cup_count INTEGER DEFAULT 0,
  tarot_level INTEGER DEFAULT 1,
  merit_count INTEGER DEFAULT 0,
  total_palomas_collected NUMERIC DEFAULT 0,
  wallet_address TEXT,
  last_status_update TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create release_notifications table
CREATE TABLE release_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  token_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create cup_logs table
CREATE TABLE cup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  awarded_by UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  reason TEXT,
  cup_count_after INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for release_notifications (public read)
CREATE POLICY "Anyone can view release notifications" ON release_notifications
  FOR SELECT USING (true);

CREATE POLICY "Users can create own notifications" ON release_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for cup_logs
CREATE POLICY "Users can view all cup logs" ON cup_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can create cup logs" ON cup_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = awarded_by);
```

3. **Enable Email Auth** in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Email provider
   - Configure email templates if needed

## Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# PayPal Configuration (use sandbox for testing)
VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id

# For Netlify Functions (create .env in netlify/functions/)
OPENAI_API_KEY=your_openai_api_key
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_SUPABASE_URL=your_supabase_project_url
```

## Step 4: Set Up PayPal Sandbox

1. **Create a PayPal Developer Account** at https://developer.paypal.com

2. **Create a Sandbox App**:
   - Go to Dashboard > My Apps & Credentials
   - Click "Create App"
   - Choose "Sandbox" environment
   - Copy the Client ID and Secret

3. **Create Test Accounts**:
   - Go to Sandbox > Accounts
   - Create both Personal and Business test accounts
   - Note the email and password for testing

4. **Configure Webhooks** (for production):
   - In your app settings, add webhook URL
   - Select events: PAYMENT.SALE.COMPLETED, PAYMENT.CAPTURE.COMPLETED

## Step 5: Run the Development Environment

### Option A: Basic Development (without serverless functions)

```bash
# Start the Vite dev server
npm run dev

# The app will be available at http://localhost:5173
```

### Option B: Full Development with Netlify Functions

```bash
# Start Netlify Dev (includes functions)
netlify dev

# This will start:
# - Vite dev server (usually on port 8888)
# - Netlify Functions on port 9999
# - Proxy that handles both
```

## Step 6: Testing the Application

### 1. Create Test Users

- Register new users through the app
- For admin access, register with username "JPR333"

### 2. Test PayPal Integration

- Use PayPal sandbox credentials
- Login with sandbox personal account
- Payments will be processed in test mode

### 3. Test Serverless Functions Locally

```bash
# Test the chat function
curl -X POST http://localhost:9999/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "profile": {"username": "test"}}'

# Test webhook manually (you'll need to simulate PayPal webhook payload)
```

## Step 7: Create Test Data

You can create test data directly in Supabase or via SQL:

```sql
-- Create a test user with tokens
INSERT INTO profiles (id, username, email, dov_balance, total_palomas_collected, cup_count)
VALUES (
  gen_random_uuid(),
  'TESTUSER1',
  'test@example.com',
  100,
  100,
  1
);
```

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure your Supabase URL is correct and includes https://
2. **PayPal button not loading**: Check that PayPal Client ID is set correctly
3. **Functions not working**: Ensure Netlify CLI is installed and .env is in the right location
4. **Database errors**: Check Supabase RLS policies and that tables exist

### Debug Mode

Add these to your .env for more logging:

```bash
NODE_ENV=development
DEBUG=true
```

## Testing Checklist

- [ ] User registration and login
- [ ] Profile creation
- [ ] PayPal payment flow (sandbox)
- [ ] Token transfers between users
- [ ] Token release notifications
- [ ] Cup game mechanics
- [ ] Admin features (JPR333 user)
- [ ] GPT chat functionality
- [ ] Real-time notifications

## Next Steps

1. Set up automated tests (Jest/React Testing Library)
2. Configure CI/CD pipeline
3. Set up staging environment
4. Configure production deployment