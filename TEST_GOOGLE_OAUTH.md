# Testing Google OAuth Configuration

## Current Status

✅ Backend `.env` file created with `GOOGLE_CLIENT_ID`
✅ Frontend `.env` file created with `VITE_GOOGLE_CLIENT_ID`
✅ Code updated with better error handling and logging
✅ Client IDs match between frontend and backend

## Important: Server Restart Required

**Both servers MUST be restarted** to load the new environment variables:

### Backend Server
```bash
cd backend
# Stop the current server (Ctrl+C)
npm start
# OR if using nodemon:
npm run dev
```

Look for this in the console:
```
[Google OAuth] Client initialized successfully
[Google OAuth] Client ID: 593069010968-07l...
```

### Frontend Dev Server
```bash
cd frontend
# Stop the current server (Ctrl+C)
npm run dev
```

## Debugging Steps

### 1. Check Backend Configuration
```bash
cd backend
node verify-google-oauth.js
```

Should show:
```
✅ GOOGLE_CLIENT_ID is SET
✅ Format looks correct
✅ OAuth2Client initialized successfully
```

### 2. Check Browser Console
When you try to sign in with Google, check the browser console (F12) for:
- `[Google Sign-In] Initializing with client ID: ...`
- `[Google Sign-In] Initialized successfully`
- `[Google Sign-In] Received credential, sending to backend...`
- `[Google Sign-In] Backend response: ...`

### 3. Check Backend Console
When you try to sign in, look for:
- `[Google OAuth] Login request received`
- `[Google OAuth] Client status - googleClient: initialized`
- `[Google OAuth] Attempting token verification with client ID: ...`
- Either success or detailed error messages

## Common Issues

### Issue: "Google OAuth is not configured"
**Solution**: Backend server not restarted. Restart it.

### Issue: "Google login failed. Please try again."
**Possible causes**:
1. Client ID mismatch - Check that frontend and backend use the same client ID
2. Token verification failed - Check backend console for detailed error
3. Database connection issue - Check if database is running
4. CORS issue - Check backend CORS configuration

### Issue: "Wrong recipient" or "audience" error
**Solution**: The token was issued for a different client ID. Ensure:
- Frontend uses the same client ID as backend
- Google Cloud Console has the correct authorized origins
- Both servers have been restarted

## Verification Checklist

- [ ] Backend `.env` file exists with `GOOGLE_CLIENT_ID`
- [ ] Frontend `.env` file exists with `VITE_GOOGLE_CLIENT_ID`
- [ ] Both client IDs match exactly
- [ ] Backend server restarted (check console for initialization message)
- [ ] Frontend dev server restarted
- [ ] Browser console shows Google Sign-In initialization
- [ ] Backend console shows client initialization on startup

## Next Steps After Restart

1. Open browser to frontend (http://localhost:5174)
2. Go to login page
3. Open browser console (F12)
4. Click "Sign in with Google"
5. Check both browser console and backend console for errors
6. If errors appear, share the error messages for further debugging

