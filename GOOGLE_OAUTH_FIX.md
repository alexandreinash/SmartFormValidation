# Fix Google OAuth "origin_mismatch" Error

## Problem
You're seeing the error: **"Error 400: origin_mismatch"** when trying to sign in with Google.

This happens because your application's origin (URL) is not registered in Google Cloud Console.

## Solution

### Step 1: Go to Google Cloud Console
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you don't have one)

### Step 2: Navigate to OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID: `593069010968-07lknp6t8a8vjcpv5n08hv81sf6v6iir`
3. Click on it to edit

### Step 3: Add Authorized JavaScript Origins
In the **Authorized JavaScript origins** section, click **+ ADD URI** and add:

```
http://localhost:5174
http://localhost:5173
http://localhost:3000
```

**Note:** Add all the ports you might use. The app is currently configured for port 5174, but you may also need 5173 (default Vite port) and 3000.

### Step 4: Add Authorized Redirect URIs (if needed)
If you see a section for **Authorized redirect URIs**, you typically don't need to add anything for Google Sign-In (it uses popup), but if required, add:

```
http://localhost:5174
http://localhost:5173
```

### Step 5: Save and Wait
1. Click **SAVE** at the bottom
2. **Wait 1-2 minutes** for changes to propagate
3. Refresh your application page and try signing in again

## Current Configuration

- **Google Client ID:** `593069010968-07lknp6t8a8vjcpv5n08hv81sf6v6iir.apps.googleusercontent.com`
- **Application URL:** `http://localhost:5174`

## Troubleshooting

### Still getting the error?
1. Make sure you saved the changes in Google Cloud Console
2. Wait 2-3 minutes for propagation
3. Clear your browser cache and cookies
4. Try in an incognito/private window
5. Make sure you're using the correct Google account that has access to the project

### Using a different port?
If your app runs on a different port, add that port's origin to the Authorized JavaScript origins:
```
http://localhost:YOUR_PORT
```

### Production Deployment
When deploying to production, you'll need to add your production domain:
```
https://yourdomain.com
```

## Quick Checklist
- [ ] Added `http://localhost:5174` to Authorized JavaScript origins
- [ ] Added `http://localhost:5173` to Authorized JavaScript origins (backup)
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 1-2 minutes for propagation
- [ ] Refreshed the application page
- [ ] Tried signing in again

