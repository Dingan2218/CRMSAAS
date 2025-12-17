# 🚨 URGENT: Fix Vercel 500 Errors

## Problem
All API calls returning 500 error - Vercel can't connect to Supabase database.

## Root Cause
You're using the **direct connection** instead of **Session Pooler** for serverless.

## ✅ SOLUTION

### Step 1: Get Supabase Pooler Connection String

1. Go to **Supabase Dashboard** → Your Project
2. Click **Project Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section
4. **Change dropdown from "URI" to "Session"**
5. Copy the connection string that looks like:
   ```
   postgresql://postgres.ksdsxjqgzikvodtwljqf:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
   ```

### Step 2: Update Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Update these variables:**

| Variable | Value |
|----------|-------|
| `DB_HOST` | `aws-1-ap-northeast-2.pooler.supabase.com` |
| `DB_PORT` | `6543` |
| `DB_USER` | `postgres.ksdsxjqgzikvodtwljqf` |
| `DB_PASSWORD` | `2255` (your actual password) |
| `DB_NAME` | `postgres` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | (your JWT secret) |
| `JWT_EXPIRE` | `30d` |

### Step 3: Redeploy

After updating environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** on the latest deployment
3. Click **Redeploy**

## ⚠️ CRITICAL NOTES

### DO NOT USE:
❌ `db.ksdsxjqgzikvodtwljqf.supabase.co` (Direct connection - doesn't work with Vercel)

### USE THIS INSTEAD:
✅ `aws-1-ap-northeast-2.pooler.supabase.com` (Session Pooler - works with serverless)

## Testing After Fix

Once redeployed, test:
1. Login as admin
2. Go to dashboard
3. All API calls should work (no 500 errors)
4. Logo/color changes should persist

---

## Fix #2: Logo/Color Not Reflecting

After fixing the database connection, to see logo/color changes:

1. **Change logo/color** in Admin Settings
2. **Logout**
3. **Login again** - The new colors/logo will load with fresh user data

The issue is that user data (including company theme) is cached in localStorage and only refreshes on login.

---

## Quick Verification

After redeploying, check Vercel Logs:
- Should see: `✅ PostgreSQL connected successfully`
- Should NOT see: `ENOTFOUND` or connection errors

If you still see errors, double-check the environment variables match EXACTLY what's shown above.
