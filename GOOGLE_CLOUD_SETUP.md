# Google Cloud Console Setup Guide for Wedding Photo-Sharing

This guide walks you through setting up Google Cloud OAuth 2.0 so the wedding organizer can connect her Google account and store all guest photos directly in her designated Google Drive folder.

---

## 1. Create a Google Cloud Project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with the Google account that the wedding organizer uses (or a developer account).
3. In the top navigation bar, click the project dropdown and select **"New Project"**.
4. Set the Project Name to: `Wedding-Photo-Sharing` (or any name you prefer).
5. Click **Create** and wait a few seconds for the project to provision.
6. Make sure your newly created project is selected in the top bar.

---

## 2. Enable the Google Drive API

1. In the left navigation menu, go to **APIs & Services > Library** (or search for "Google Drive API" in the search box).
2. Click on **Google Drive API**.
3. Click the blue **"Enable"** button.
4. *(Optional)* If you plan to expand folder selection capabilities later, you may also enable the **Google Picker API**.

---

## 3. Configure the OAuth Consent Screen

Before generating client credentials, you must configure what the organizer sees when connecting:

1. In the left menu, navigate to **APIs & Services > OAuth consent screen**.
2. **User Type**:
   - Select **External** (unless you have a Google Workspace organization and want to restrict it to that organization).
   - Click **Create**.
3. **App Information**:
   - **App name**: `Wedding Photo Sharing` (or `[Couple Names] Wedding Album`)
   - **User support email**: Select your email address.
   - **App logo**: Optional.
4. **App Domain**:
   - **Application home page**: `http://localhost:3000` (or your deployed URL, e.g., `https://our-wedding.vercel.app`)
   - **Privacy Policy link**: Optional for testing / internal use.
   - **Developer contact information**: Enter your email address.
   - Click **Save and Continue**.
5. **Scopes**:
   - Click **"Add or Remove Scopes"**.
   - Filter or manually add the following scopes:
     - `.../auth/drive.file` (See, edit, create, and delete only the specific Google Drive files you use with this app)
     - `.../auth/userinfo.email` (See your primary Google Account email address)
     - `.../auth/userinfo.profile` (See your personal info)
   - Click **Update**, then click **Save and Continue**.
6. **Test Users (Crucial Step for Testing Mode)**:
   - While the app is in "Testing" mode, Google requires every account that logs in to be explicitly added as a Test User.
   - Click **"Add Users"**.
   - **Enter the wedding organizer's Google email address** (and your own test email address).
   - Click **Save and Continue**.
7. Review your summary and return to the dashboard.

---

## 4. Create OAuth 2.0 Credentials (Client ID & Client Secret)

1. In the left menu, navigate to **APIs & Services > Credentials**.
2. Click **"+ Create Credentials"** at the top and select **"OAuth client ID"**.
3. **Application type**: Select **"Web application"**.
4. **Name**: `Wedding Scanner Web Client`.
5. **Authorized JavaScript origins**:
   - For local development:
     - `http://localhost:3000`
     - `http://localhost:5001`
   - For production deployment:
     - `https://your-wedding.vercel.app` (your frontend domain)
     - `https://your-backend.onrender.com` (your backend domain)
6. **Authorized redirect URIs**:
   - For local development:
     - `http://localhost:5001/api/auth/google/callback`
   - For production deployment:
     - `https://your-backend.onrender.com/api/auth/google/callback`
7. Click **Create**.
8. A modal will appear showing:
   - **Client ID**: e.g., `1234567890-abcdefg.apps.googleusercontent.com`
   - **Client Secret**: e.g., `GOCSPX-xxxxxxxxxxxxxx`
9. Copy both values immediately into your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxx
   GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
   ```

---

## 5. Scope Selection & Least-Privilege Security Explanation

We intentionally selected the **`https://www.googleapis.com/auth/drive.file`** scope instead of the blanket `https://www.googleapis.com/auth/drive` scope:

| Scope | Permission Level | Why It Matters |
|---|---|---|
| `.../auth/drive.file` (Used) | Least Invasive | Can only access files and folders created by this app. It **cannot** read, see, or touch any of the organizer's personal documents, private photos, or financial files. |
| `.../auth/drive` (Avoided) | Full Read/Write | Gives full unrestricted access to the user's entire Google Drive. Triggers scary security warnings and requires lengthy Google verification. |

### Automatic Folder Creation
When the organizer connects her Google account, the app automatically creates a dedicated folder titled:
`[Couple Names] - Wedding Photos`
Because the app created this folder, it automatically has full read/write permission to it under the `drive.file` scope.

---

## 6. Testing Mode vs. Production Verification

### During Testing Mode:
- **Who can log in**: Only email addresses listed under **Test Users** in the Google Cloud Console.
- Since only the wedding organizer needs to connect Google Drive (guests never log in!), **Testing Mode is completely sufficient for a wedding!**
- You do **not** need to go through Google's complex App Verification process as long as the organizer's Gmail account is added as a Test User.

### If Publishing to Production:
- If you click "Publish App" in the OAuth Consent Screen, any Google account can connect without being added as a test user.
- Sensitive scopes like `drive.file` may show an "Unverified App" warning during consent, where the organizer can click **Advanced > Proceed to Wedding Photo Sharing (unsafe)**. This warning appears only once to the organizer during initial setup.

---

## 7. Verifying the Connection

1. Start your local server (`npm run dev`).
2. Visit `http://localhost:3000/admin`.
3. Sign in using the admin password (`wedding2025` by default).
4. Click **"Connect Google Drive"**.
5. Select your Google account and grant permissions.
6. You will be redirected back to the Admin Dashboard showing:
   - ✅ Drive Connected: `your-email@gmail.com`
   - Destination Folder: `Niks & Sheku - Wedding Photos`
7. Click **"Test Connection"** to verify that write access is functional.
