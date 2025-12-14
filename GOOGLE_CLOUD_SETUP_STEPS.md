# Google Cloud Setup - Step-by-Step Guide

## Current Step: Create Credentials for Natural Language API

You're on the "Create credentials" page. Here's what to do:

---

## Step 1: Select the Correct API

**Current Status:** Dropdown shows "Cloud Datastore API" ❌

**What to Do:**
1. Click the dropdown that says "Select an API *"
2. Type "Natural Language API" in the search box
3. Select "Cloud Natural Language API" from the results

**Why:** You need credentials for Natural Language API, not Datastore API.

---

## Step 2: Select "Application data"

**Current Status:** You need to choose between "User data" and "Application data"

**What to Do:**
1. Select the radio button for **"Application data"**
   - This creates a **service account** (what your backend needs)
   - This is for server-to-server authentication
   - Your backend will use this to call the API

**Why NOT "User data":**
- "User data" creates an OAuth client (for user login)
- You need a service account for your backend to call the API automatically
- The info box even says: "This Google Cloud API is usually accessed from a server using a service account"

---

## Step 3: Click "Next"

After selecting:
- API: **Cloud Natural Language API**
- Data type: **Application data**

Click the blue **"Next"** button at the bottom.

---

## Step 4: Create Service Account (Next Screen)

After clicking "Next", you'll see a form to create the service account:

### Fill in:
1. **Service account name:** `nlp-service` (or any name you like)
2. **Service account ID:** Auto-filled (leave as is)
3. **Description (optional):** "Service account for Smart Form Validator NLP API"

### Click "Create and Continue"

---

## Step 5: Grant Permissions (Optional)

You may see a "Grant this service account access to project" screen:
- You can skip this for now (click "Continue")
- Or grant "Cloud Natural Language API User" role if shown

---

## Step 6: Create Key

You'll see options to create a key:

1. Click **"Create Key"** button
2. Select **"JSON"** format
3. Click **"Create"**

**Important:** A JSON file will download automatically - **SAVE THIS FILE!**

---

## Step 7: Save the Credentials File

1. The downloaded file will be named something like:
   ```
   rugged-matrix-480005-d0-xxxxx.json
   ```
2. Rename it to: `service-account.json` (easier to remember)
3. Move it to your `backend/` folder:
   ```
   SmartFormValidation/
   └── backend/
       └── service-account.json  ← Put it here
   ```

---

## Step 8: Update Your .env File

Open `backend/.env` and update:

```env
# Enable Google NLP
GCLOUD_NLP_ENABLED=true

# Path to your service account JSON file
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

**Note:** If you're on Windows with absolute path:
```env
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\Drei\Downloads\SmartFormValidation\backend\service-account.json
```

---

## Step 9: Restart Your Backend

1. Stop your backend server (Ctrl+C)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

---

## Step 10: Test It!

1. Create a form with AI validation enabled
2. Submit a form with negative text (like "I hate this")
3. Check if AI validation works:
   - Should detect negative sentiment
   - Should show AI feedback

---

## ✅ Quick Checklist

- [ ] Selected "Cloud Natural Language API" in dropdown
- [ ] Selected "Application data" radio button
- [ ] Clicked "Next"
- [ ] Created service account (named it)
- [ ] Created JSON key and downloaded it
- [ ] Saved JSON file to `backend/service-account.json`
- [ ] Updated `.env` with `GCLOUD_NLP_ENABLED=true`
- [ ] Updated `.env` with `GOOGLE_APPLICATION_CREDENTIALS` path
- [ ] Restarted backend server
- [ ] Tested with a form submission

---

## 🚨 Common Mistakes to Avoid

1. **Wrong API:** Make sure you select "Natural Language API", not "Datastore API"
2. **Wrong data type:** Select "Application data", NOT "User data"
3. **Lost JSON file:** If you lose it, you'll need to create a new key
4. **Wrong path:** Make sure the path in `.env` is correct
5. **Forgot to enable API:** Make sure Natural Language API is enabled in your project

---

## 🆘 Troubleshooting

### "API not enabled" error?
1. Go to "APIs & Services" → "Library"
2. Search "Natural Language API"
3. Click "Enable"

### "Credentials not found" error?
- Check the path in `.env` is correct
- Make sure the JSON file exists at that path
- Try using absolute path instead of relative

### "Permission denied" error?
- Make sure the service account has "Cloud Natural Language API User" role
- Go to IAM & Admin → Service Accounts → Your service account → Permissions

---

## 🎉 You're Done!

Once you complete these steps, your Smart Form Validator will be able to use Google's Natural Language API for AI-powered validation!

**Next:** Test it by submitting a form with AI validation enabled.

