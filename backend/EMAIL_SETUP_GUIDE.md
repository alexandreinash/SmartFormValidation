# Email Setup Guide for Password Reset

This guide will help you configure Gmail to send password reset emails.

## Quick Setup Steps

### 1. Enable Email Service

In your `backend/.env` file, set:

```env
EMAIL_ENABLED=true
```

### 2. Get a Gmail App Password

**IMPORTANT:** You CANNOT use your regular Gmail password. You MUST use an App Password.

#### Steps to get a Gmail App Password:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/
   - Click on **Security** in the left sidebar
   - Under "How you sign in to Google", click **2-Step Verification**
   - Follow the prompts to enable it

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords
   - Select **Mail** as the app
   - Select **Other (Custom name)** as the device
   - Enter "Smart Form Validator" as the name
   - Click **Generate**
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

3. **Update your .env file**:

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
FRONTEND_URL=http://localhost:5174
```

**Important Notes:**
- Remove spaces from the App Password when pasting (it should be 16 characters without spaces)
- Use your full Gmail address for `SMTP_USER`
- The App Password is 16 characters, no spaces

### 3. Restart Your Backend Server

After updating the `.env` file, restart your backend server:

```bash
cd backend
npm start
```

### 4. Verify Configuration

When you start the server, you should see one of these messages:

✅ **Success:**
```
[Email Service] SMTP connection verified successfully ✓
```

❌ **If you see errors:**
- Check that `EMAIL_ENABLED=true` (not `false` or missing)
- Verify your `SMTP_USER` is your full Gmail address
- Verify your `SMTP_PASS` is the 16-character App Password (no spaces)
- Make sure 2-Step Verification is enabled on your Google account

## Troubleshooting

### "SMTP authentication failed" Error

**Solution:** You're using your regular password instead of an App Password.
- Go to https://myaccount.google.com/apppasswords
- Generate a new App Password
- Use that 16-character password (no spaces) in `SMTP_PASS`

### "Email service is disabled" Message

**Solution:** Set `EMAIL_ENABLED=true` in your `.env` file (not `false`)

### "SMTP credentials not configured" Error

**Solution:** Make sure both `SMTP_USER` and `SMTP_PASS` are set in your `.env` file

### Emails Not Arriving

1. **Check Spam Folder** - Gmail might mark the emails as spam initially
2. **Check Server Logs** - Look for error messages in your backend console
3. **Verify Email Address** - Make sure the email address exists in your database
4. **Test Connection** - The server should show "SMTP connection verified successfully" on startup

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

## Testing

After setup, try requesting a password reset:
1. Go to the "Forgot Password" page
2. Enter your email address
3. Check your email (and spam folder)
4. You should receive a password reset link

If you don't receive the email, check the backend console for error messages.

