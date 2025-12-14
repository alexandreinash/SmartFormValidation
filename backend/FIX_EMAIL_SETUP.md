# Fix Email Configuration for Password Reset

## Problem
You're not receiving password reset emails because the email service is not configured.

## Quick Fix (5 minutes)

### Step 1: Check Your Current Configuration

Run this command in the `backend` folder:
```bash
node check-email-config.js
```

This will show you exactly what's missing.

### Step 2: Configure Gmail (Recommended for Development)

#### A. Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Under "How you sign in to Google", click **2-Step Verification**
3. Follow the prompts to enable it (if not already enabled)

#### B. Generate App Password
1. Go to https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Smart Form Validator" as the name
5. Click **Generate**
6. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - Remove all spaces when copying

#### C. Update Your .env File

Open `backend/.env` and add/update these lines:

```env
# Enable email service
EMAIL_ENABLED=true

# Email provider (smtp for Gmail)
EMAIL_PROVIDER=smtp

# SMTP Configuration for Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character App Password (no spaces)
- Use your **full Gmail address** for `SMTP_USER`
- Use the **App Password** (not your regular password) for `SMTP_PASS`

### Step 3: Restart Your Backend Server

After updating the `.env` file:
1. Stop your backend server (Ctrl+C)
2. Start it again: `npm start` or `node src/server.js`

### Step 4: Verify Configuration

When you start the server, you should see:
```
✅ Email service: ENABLED
✅ SMTP configured: your-email@gmail.com
[Email Service] SMTP connection verified successfully ✓
```

If you see errors, check:
- Is `EMAIL_ENABLED=true` (not `false` or missing)?
- Is `SMTP_USER` your full Gmail address?
- Is `SMTP_PASS` the 16-character App Password (no spaces)?
- Is 2-Step Verification enabled on your Google account?

### Step 5: Test Email Sending

#### Option A: Test via API (if you're logged in as admin)
```bash
# Send POST request to /api/auth/test-email
# This will send a test email to your admin account
```

#### Option B: Test via Forgot Password
1. Go to the Forgot Password page
2. Enter your email address
3. Check your inbox and spam folder
4. You should receive the password reset email

## Troubleshooting

### "SMTP authentication failed" Error

**Problem:** You're using your regular Gmail password instead of an App Password.

**Solution:**
1. Make sure 2-Step Verification is enabled
2. Generate a new App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character App Password (remove spaces) in `SMTP_PASS`

### "Email service is disabled" Message

**Problem:** `EMAIL_ENABLED` is not set to `true`.

**Solution:** Set `EMAIL_ENABLED=true` in your `.env` file (not `false` or missing)

### "SMTP credentials not configured" Error

**Problem:** `SMTP_USER` or `SMTP_PASS` is missing.

**Solution:** Add both `SMTP_USER` and `SMTP_PASS` to your `.env` file

### Emails Not Arriving

1. **Check Spam Folder** - Gmail might mark them as spam initially
2. **Check Server Logs** - Look for error messages in your backend console
3. **Verify Email Address** - Make sure the email exists in your database
4. **Wait a Few Minutes** - Sometimes emails are delayed
5. **Check Backend Console** - Look for `[Password Reset]` error messages

### Still Not Working?

1. Run the configuration checker:
   ```bash
   cd backend
   node check-email-config.js
   ```

2. Check your backend server console for detailed error messages

3. Verify your `.env` file is in the `backend` folder (not the root folder)

4. Make sure you restarted the backend server after changing `.env`

## Alternative Email Providers

### SendGrid
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

### AWS SES
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## Need Help?

If you're still having issues:
1. Check the backend server console for error messages
2. Look for `[Email Service]` or `[Password Reset]` log messages
3. Verify all environment variables are set correctly
4. Make sure you're using an App Password for Gmail (not your regular password)

