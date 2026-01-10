# Troubleshooting Guide - GRAIL App

## Current Issues
- Logout button not working
- DOV balance showing as 0
- Profile pictures not loading
- Cup game progress not showing

## Diagnostic Steps

### 1. Open Browser Console
1. Open the app in your browser
2. Press `F12` or `Right Click > Inspect`
3. Click on the **Console** tab
4. Look for the emoji-tagged logs I just added:

**During App Load:**
- 🚀 "Initializing Supabase..." - App is starting
- 📦 "Creating Supabase client..." - Connecting to database
- ✅ "Supabase client created" - Connection successful
- 🔑 "Checking for existing session..." - Looking for logged-in user
- 👤 "User session found: [email]" - User is logged in
- 🔍 "ensureProfileExists called for user:" - Loading profile
- 📡 "Fetching profile from database..." - Querying database
- ✅ "Profile fetched:" - Shows the actual data from database

**During Logout:**
- 🚪 "Logout initiated..." - Logout button clicked
- 📡 "Unsubscribing from notifications..." - Cleaning up
- 🔐 "Signing out from Supabase..." - Calling logout API
- ✅ "Signed out successfully" - Logout worked
- 🧹 "Clearing app state..." - Resetting data
- ✅ "Logout complete!" - All done

### 2. What to Look For

**If you see ❌ (red X) errors:**
- Copy the entire error message
- Note what step failed

**If nothing loads at all:**
- Check if you see "🚀 Initializing Supabase..."
- If not, the app isn't even starting

**If logout doesn't work:**
- Click the logout button
- Look for "🚪 Logout initiated..."
- If you don't see it, the click handler isn't being called
- If you see ❌ errors, the Supabase signOut is failing

### 3. Check Network Tab
1. In DevTools, click **Network** tab
2. Filter by **Fetch/XHR**
3. Click logout button or refresh page
4. Look for requests to `supabase.co`
5. Check if any are **red** (failed) or **yellow** (slow)

### 4. Common Issues

**"Failed to fetch" errors:**
- Network connectivity problem
- CORS issue
- Supabase service down

**"Invalid API key" errors:**
- Environment variables not loading
- Check if `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**"Row not found" errors:**
- User profile doesn't exist in database
- Need to create profile manually in Supabase

**Silent failures (no errors but nothing works):**
- React component not re-rendering
- State not updating properly
- Check if `profile` object is actually populated

### 5. Quick Fixes

**Force Logout:**
Open console and run:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

**Check if Supabase is connected:**
Open console and run:
```javascript
// After page loads
console.log('Supabase client:', window.supabase)
```

**Manually check profile data:**
We need to add this to the code, but you can check in Supabase dashboard directly

### 6. Report Back

Please copy and paste:
1. Any ❌ error messages from console
2. What you see when page loads (which emoji logs appear)
3. What happens when you click logout (which emoji logs appear)
4. Any red/failed requests in Network tab

This will help me identify exactly where the connection is breaking!
