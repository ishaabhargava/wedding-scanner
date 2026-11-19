# Deployment Guide for Wedding Photo-Sharing Platform

This guide explains how to deploy the wedding photo-sharing application to production using **Render** (for the Node.js backend) and **Vercel** (for the React frontend), or as a **single unified service**.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Wedding Guests        |
                      |  (Scan QR Code with Phone)  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  React Frontend (Vercel)    |
                      |  - Mobile-first luxury UI   |
                      |  - Camera capture / Gallery |
                      |  - Up to 35 photos preview  |
                      +--------------+--------------+
                                     |
                        HTTP /api/*  | Multipart Uploads
                                     v
                      +-----------------------------+
                      | Express Backend (Render)    |
                      |  - Rate limiting & Helmet   |
                      |  - Multer memory buffer     |
                      |  - Encrypted token storage  |
                      |  - Admin Auth & Management  |
                      +--------------+--------------+
                                     |
                 OAuth 2.0 Streaming | Official Googleapis SDK
                                     v
                      +-----------------------------+
                      | Organizer Google Drive      |
                      |  - "Niks & Sheku Album"     |
                      |  - Preserved photo names    |
                      +-----------------------------+
```

---

## Option A: Split Deployment (Recommended)
Frontend on **Vercel** + Backend on **Render**

### Part 1: Deploy Backend on Render

1. Push your project repository to GitHub or GitLab.
2. Sign up or log into [Render.com](https://render.com).
3. Click **"New +"** and select **"Web Service"**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `wedding-photos-backend`
   - **Region**: Choose the region closest to your wedding venue.
   - **Branch**: `main`
   - **Root Directory**: Leave blank or set to `.`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && cd server && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     cd server && npm start
     ```
6. Add Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `FRONTEND_URL`: `https://your-wedding-frontend.vercel.app`
   - `GOOGLE_CLIENT_ID`: `your-client-id.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET`: `your-client-secret`
   - `GOOGLE_REDIRECT_URI`: `https://wedding-photos-backend.onrender.com/api/auth/google/callback`
   - `ADMIN_PASSWORD`: Your secure admin password
   - `JWT_SECRET`: Random 32+ character string
   - `ENCRYPTION_KEY`: Random 32+ character string
   - `MAX_FILES_PER_UPLOAD`: `35`
   - `MAX_FILE_SIZE_MB`: `70`
7. Click **Create Web Service** and wait for deployment to complete.
8. Copy your live backend URL (e.g., `https://wedding-photos-backend.onrender.com`).

---

### Part 2: Deploy Frontend on Vercel

1. Log into [Vercel.com](https://vercel.com).
2. Click **"Add New..." > "Project"**.
3. Import your GitHub repository.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and select `client` (or use root with `vercel.json`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In `vercel.json` (or via Vercel rewrites), verify that API calls are directed to your Render backend:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://wedding-photos-backend.onrender.com/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
6. Click **Deploy**.
7. Copy your production frontend URL (e.g., `https://our-special-wedding.vercel.app`).

---

### Part 3: Update Google Cloud Console Authorized URIs

Now that your production domains are active:
1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Click on your OAuth 2.0 Web Client.
3. Under **Authorized JavaScript origins**, add:
   - `https://our-special-wedding.vercel.app`
   - `https://wedding-photos-backend.onrender.com`
4. Under **Authorized redirect URIs**, add:
   - `https://wedding-photos-backend.onrender.com/api/auth/google/callback`
5. Click **Save**.

---

## Option B: Single Service Deployment (Docker / VPS / Single Render Web Service)

The Express server includes built-in static file serving from `client/dist`. You can run both frontend and backend on a single server or container:

1. Build both client and server:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```
   The server will serve:
   - The React frontend at `/` and `/admin`
   - The API endpoints at `/api/*`

---

## Post-Deployment Checklist

- [ ] Visit `https://your-frontend-domain.com/api/public/health` to confirm server health.
- [ ] Visit `https://your-frontend-domain.com/admin`.
- [ ] Log in with your `ADMIN_PASSWORD`.
- [ ] Click **"Connect Google Drive"** and authorize the organizer account.
- [ ] Click **"Test Connection"** to verify Drive folder write permissions.
- [ ] Update the **Public Website URL** in settings to match your custom domain.
- [ ] Go to **QR Code & Print** tab and download or print the reception table cards.
- [ ] Scan the printed QR code with a phone and test a sample upload of photos.
