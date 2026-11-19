# Wedding Photo-Sharing Platform with Google Drive Integration

A complete, mobile-first, luxury wedding photo-sharing platform. Guests scan a table QR code, pick or snap up to 35 photos on their phones, and upload them directly into the wedding organizer's designated Google Drive folder—**without creating an account, downloading an app, or logging into Google**.

The wedding organizer connects her Google account **once** through a secure OAuth 2.0 flow in the protected admin dashboard. All guest uploads are automatically organized and stored in one designated Google Drive album.

---

## Key Features

### 1. Guest Experience (Mobile-First)
- **Zero Login Friction**: Guests scan the table QR code and upload immediately—no passwords, no apps, no Google account required.
- **Luxury Wedding Aesthetic**: Designed with an ivory, champagne, beige, and muted gold palette, elegant Cormorant Garamond typography, and subtle animations.
- **Camera & Gallery Support**: Guests can pick photos from their photo library or capture photos directly using their phone camera (`capture="environment"`).
- **HEIC / iPhone Support**: Automatic client-side preview for iPhone HEIC/HEIF images alongside JPG, PNG, and WebP.
- **Up to 35 Photos per Session**: Guests can select up to 35 photos at once with real-time slot counter and validation.
- **Thumbnail Preview & Removal**: Full preview grid showing thumbnails, formatted file sizes, and individual remove buttons before uploading.
- **Resilient Upload Engine**: Smooth mobile upload with individual photo progress bars, overall progress bar, duplicate filename protection, and individual retry buttons for failed uploads.
- **Celebration Modal**: Heartfelt thank-you message and gold confetti celebration on successful upload.

### 2. Google Drive Integration (Organizer Setup)
- **Google OAuth 2.0 (No Service Accounts)**: The organizer signs in once with her Google account.
- **Least-Invasive Permissions**: Uses the Google-recommended `https://www.googleapis.com/auth/drive.file` scope. The app can only access the wedding folder it creates or is assigned—it **cannot** see, read, or modify any other files in the organizer's personal Google Drive.
- **Automatic Folder Creation**: Automatically creates `[Couple Names] - Wedding Photos` in Google Drive upon first connection.
- **Change Destination Folder**: Allows creating new folders or switching to an existing Google Drive folder ID anytime.
- **Secure Backend Token Storage**: OAuth refresh tokens are encrypted using **AES-256-GCM** before saving to disk. Tokens are never exposed to the frontend.
- **Automatic Token Refresh**: The backend handles access token expiration and refreshing silently.
- **One-Click Disconnect**: Revokes access and clears credentials at any time.
- **Test Connection**: Built-in ping tool to test Google Drive folder write access from the dashboard.

### 3. QR Code & Reception Center
- **Dynamic QR Code Generation**: Generates a high-contrast QR code linking directly to the guest upload page.
- **Print-Ready Table Card**: Includes a dedicated printable 5x7 / A4 table card with elegant gold borders, flourishes, and instructions for reception tables.
- **Instant PNG Export**: Download a 1024x1024 high-resolution PNG for custom wedding stationery printers.

### 4. Admin Dashboard
- **Protected Access**: Protected by an administrator password and signed JWT session token.
- **Live Statistics**: Real-time counters for total photos uploaded, upload sessions, and failure records.
- **Wedding Customization**: Customize couple names, wedding date, landing page headings, subtitles, max photo limits, and website URL.
- **Activity & Failure Logs**: Complete audit table of all uploaded photos with Google Drive links, timestamps, and error diagnostics.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Canvas Confetti, QRCode.React, Heic2Any
- **Backend**: Node.js, Express.js, TypeScript, Multer, googleapis (Official Google SDK), JSONWebToken, Helmet, Express-Rate-Limit
- **Security**: AES-256-GCM Encryption, Rate Limiting, Input Sanitation, CSP Security Headers
- **Testing**: Automated backend integration test suite with 16 assertions
- **Deployment**: Ready for Vercel (Frontend) and Render (Backend)

---

## Project Structure

```
Wedding_Scanner/
├── client/                          # React + TypeScript + Vite Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminNavbar.tsx      # Admin header with connection status
│   │   │   ├── Header.tsx           # Luxury wedding header with monogram
│   │   │   ├── PhotoPreviewGrid.tsx # Photo thumbnails, status & delete
│   │   │   ├── PhotoUploader.tsx    # Drag-and-drop, camera & file picker
│   │   │   ├── SuccessModal.tsx     # Confetti celebration modal
│   │   │   └── UploadProgressBar.tsx# Overall progress indicator
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.tsx # Full admin control center
│   │   │   ├── AdminLoginPage.tsx   # Secure password sign-in
│   │   │   ├── GuestUploadPage.tsx  # Main mobile guest landing & upload
│   │   │   └── PrintQRCodePage.tsx  # Printable 5x7 reception table card
│   │   ├── services/
│   │   │   └── api.ts               # API client with XHR progress tracking
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx                  # Main router
│   │   ├── index.css                # Wedding luxury styles & print CSS
│   │   └── main.tsx                 # Application entry point
│   ├── index.html                   # HTML template with Google Fonts
│   ├── package.json
│   ├── tailwind.config.js           # Ivory, champagne, and gold theme
│   └── vite.config.ts               # Vite configuration with API proxy
├── server/                          # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts               # Environment variables configuration
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT admin protection
│   │   │   ├── rateLimiter.ts       # Rate limiting middleware
│   │   │   └── upload.middleware.ts # Multer limits & MIME filters
│   │   ├── routes/
│   │   │   ├── admin.routes.ts      # Stats, settings, folder management
│   │   │   ├── auth.routes.ts       # Google OAuth start, callback, status
│   │   │   ├── public.routes.ts     # Public config & health check
│   │   │   └── upload.routes.ts     # Single & batch Google Drive uploads
│   │   ├── services/
│   │   │   ├── googleDrive.service.ts # Google Drive API & OAuth client
│   │   │   └── storage.service.ts   # Persistent JSON data store
│   │   ├── utils/
│   │   │   ├── encryption.ts        # AES-256-GCM token encryption
│   │   │   └── fileValidation.ts    # Filename & MIME validation
│   │   ├── app.ts                   # Express application setup & middleware
│   │   └── server.ts                # Server startup script
│   ├── data/                        # Persistent store (app-data.json)
│   ├── test-suite.ts                # Automated integration test runner
│   ├── package.json
│   └── tsconfig.json
├── .env.example                     # Environment configuration template
├── DEPLOYMENT_GUIDE.md              # Vercel & Render deployment guide
├── GOOGLE_CLOUD_SETUP.md            # Google Cloud OAuth setup guide
├── QR_CODE_GUIDE.md                 # QR code printing & table advice
├── render.yaml                      # Render Infrastructure-as-Code config
├── vercel.json                      # Vercel configuration & rewrites
└── package.json                     # Root orchestrator scripts
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 2. Clone and Install Dependencies
```bash
# Clone the repository
git clone <your-repo-url>
cd Wedding_Scanner

# Install dependencies for root, server, and client
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Fill in your Google OAuth credentials (see [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)):
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
ADMIN_PASSWORD=wedding2025
JWT_SECRET=super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=super-secret-aes-key-change-in-production
MAX_FILES_PER_UPLOAD=35
MAX_FILE_SIZE_MB=70
```

### 4. Run Development Servers
Start both the Express backend and Vite React frontend concurrently with one command:
```bash
npm run dev
```
- **Guest Upload Website**: `http://localhost:3000`
- **Organizer Admin Dashboard**: `http://localhost:3000/admin`
- **Backend API**: `http://localhost:5001`
- **API Health Check**: `http://localhost:5001/api/public/health`

---

## How the Organizer Connects Google Drive

1. Open `http://localhost:3000/admin`.
2. Sign in with the administrator password (default: `wedding2025`).
3. Click **"Connect Google Drive"**.
4. The organizer is redirected to Google's OAuth consent screen:
   - Signs into her Google account.
   - Reviews and grants permission to manage wedding files.
5. Google redirects back to `/admin?oauth=success`.
6. The app automatically creates a folder named:
   `[Couple Names] - Wedding Photos` inside the organizer's Google Drive.
7. Click **"Test Connection"** to verify folder write access.
8. That's it! Drive is now permanently connected via offline refresh tokens.

---

## How Guests Upload Photos

1. The guest sits down at a reception table and scans the printed QR code with their phone camera.
2. The browser opens the wedding microsite (e.g., `https://our-wedding.com`).
3. The guest sees the couple's names, date, and "Every Moment Deserves to Be Remembered".
4. The guest taps **"Choose Photos"** or **"Take Photo"**:
   - Picks up to 35 photos from their library, or takes photos live.
   - Previews thumbnails, checks file sizes, or removes photos.
5. The guest taps **"Upload Photos"**:
   - Real-time progress indicators show upload progress per photo.
   - Photos stream through the backend directly into the organizer's Google Drive folder.
6. A gold confetti celebration appears with a heartfelt thank-you card!

---

## Running the Automated Test Suite

The project includes an integration test suite verifying file validation, encryption, filename collision prevention, admin authentication, rate limiting, and upload constraints.

Run the test suite:
```bash
cd server
npm test
```

### Test Coverage Highlights:
- ✅ AES-256-GCM encryption and decryption roundtrip.
- ✅ Graceful handling of corrupted encrypted tokens.
- ✅ Filename sanitization (removes unsafe characters, preserves original extension).
- ✅ Duplicate filename collision prevention with unique suffixes.
- ✅ Storage service persistence for wedding settings and upload records.
- ✅ Public health check and configuration endpoints.
- ✅ Admin login password rejection (401) and JWT issuance (200).
- ✅ Bearer token validation and route protection.
- ✅ Enforcing maximum 35-photo limit on settings update.
- ✅ 503 response when Google Drive has not yet been connected.
- ✅ Rejection of unsupported file types (.txt, .exe, etc.).
- ✅ Enforcement of maximum 35 photos in batch upload.

---

## Production Deployment

See the comprehensive [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions:
- **Frontend**: Deploy to **Vercel** with automatic rewrite proxying.
- **Backend**: Deploy to **Render** with persistent secrets.
- **Single Server Option**: Build client into `client/dist` and run `npm start` on a single container or VPS.

---

## Documentation Links

- [Google Cloud OAuth Setup Guide](./GOOGLE_CLOUD_SETUP.md)
- [Deployment Guide (Vercel & Render)](./DEPLOYMENT_GUIDE.md)
- [QR Code Printing & Table Guide](./QR_CODE_GUIDE.md)
- [Environment Configuration Template](./.env.example)

---

## License

This project is licensed under the ISC License.
