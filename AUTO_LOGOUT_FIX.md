# Auto-Logout Fix

## Problem
Users (especially admins) were being automatically logged out after some time or certain actions.

## Root Causes Found

### 1. Aggressive 401 Handler
**Problem:** The API interceptor was logging users out on ANY 401 error, including:
- Permission denied errors (403 should be used but some endpoints return 401)
- Failed requests that should show an error message
- Temporary network issues

**Fix Applied:** Modified `/client/src/services/api.js`
- Now only logs out on actual token problems (expired, invalid)
- Checks error message for keywords: 'token', 'expired', 'invalid'
- Adds 100ms delay before redirect to allow pending requests to complete

### 2. JWT Token Expiration
**Problem:** JWT tokens expire too quickly (default is 7 days)

**Fix Needed:** Update your `.env` file:
```env
JWT_EXPIRE=30d  # Changed from 7d to 30d
```

## How to Apply the Full Fix

1. **Frontend** - Already fixed and will deploy with next push
2. **Backend** - Update your server `.env` file:

```bash
cd server
# Edit .env file and change:
JWT_EXPIRE=30d
```

3. **Restart server** (if running locally):
```bash
npm run dev
```

## Vercel Environment Variables

If using Vercel, also update there:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add or update: `JWT_EXPIRE` = `30d`
3. Redeploy

## Testing

After applying the fix:
1. Login as admin
2. Perform various actions (create user, manage leads, etc.)
3. Wait 5-10 minutes and continue using the app
4. Should NOT be logged out unexpectedly

## What Changed

### Before:
- Any 401 error → immediate logout
- Token expires in 7 days
- User loses work in progress

### After:
- Only logout on actual token expiration/invalid token
- Token expires in 30 days
- Users stay logged in during normal operations
- Better error messages instead of forced logout

---

**Note:** Users will need to logout and login again for the new 30-day token to take effect.
