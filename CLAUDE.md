# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (default port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## High-Level Architecture

This is a React-based web application for Casa de Copas, a nonprofit community space that supports Mexican artists. The app manages a token economy system called "Palomas" that members use to access facilities and services.

### Technology Stack
- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with PostCSS
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Payments**: PayPal integration
- **Serverless Functions**: Netlify Functions
- **UI Components**: Custom React components with inline styles

### Core Features
1. **Token Management**: Users can buy, send, and release "Palomas" tokens
2. **PayPal Integration**: Automated token crediting via webhook ($10 = 10 Palomas)
3. **Gamification**: Cup system where 100 Palomas = 1 Cup, with a tarot-themed game
4. **Admin Features**: Special controls for user "JPR333" including merit distribution
5. **AI Chat Support**: GPT-3.5 integration for user assistance

### Key Architecture Patterns

**Authentication Flow**: The app uses Supabase Auth with email/password. Password reset is handled via magic link. The main entry point (`src/main.jsx`) manages all authentication state and routing through conditional rendering.

**State Management**: Uses React hooks (useState, useEffect) for local state. User profile data is synchronized with Supabase on login and after transactions. Real-time notifications use Supabase subscriptions.

**Payment Processing**: PayPal buttons create orders with user ID in custom_id field. Netlify webhook function (`netlify/functions/paypal-webhook.js`) processes completed payments and updates user balances automatically.

**Component Architecture**: Single-page app with view switching managed in `src/main.jsx`. Components receive props for data and callbacks. No routing library - views are controlled by state flags.

### Database Schema (Supabase)
- **profiles**: User data including balances, username, wallet address
- **release_notifications**: Public feed of token releases
- **cup_logs**: History of cup awards

### Environment Variables Required
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_PAYPAL_CLIENT_ID`: PayPal client ID for payments
- `OPENAI_API_KEY`: For chat functionality (Netlify function)
- `PAYPAL_CLIENT_SECRET`: For webhook verification (Netlify function)
- `SUPABASE_SERVICE_ROLE_KEY`: For webhook database updates (Netlify function)

### Deployment
The app is configured for Netlify deployment with serverless functions in the `netlify/functions` directory. Build output goes to `dist/` directory.So I'd like to change the architecture of the cup game
