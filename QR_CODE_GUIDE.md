# QR Code Printing & Guest Experience Guide

This guide explains how to generate, print, and display wedding QR codes so guests can scan with their phone cameras and share photos seamlessly.

---

## 1. How Guests Access the Upload Page

1. **No Apps Required**: Guests do not need to download any application.
2. **No Accounts or Logins**: Guests do not log in or create an account; they immediately see the photo picker upon scanning.
3. **Works on Android & iOS**:
   - **iPhone (iOS)**: Guests open the default iOS Camera app and point it at the QR code. A yellow pop-up banner appears linking directly to the wedding site in Safari.
   - **Android**: Guests open their camera (or Google Lens) and tap the link that appears on screen to open Chrome.

---

## 2. Accessing and Customizing the QR Code

1. Navigate to the Admin Dashboard at `/admin`.
2. Select the **"Wedding Details"** tab:
   - Ensure the **Public Website URL** is set to your deployed domain (e.g. `https://niks-and-sheku.vercel.app`).
   - Customize Couple Names (e.g. `Niks & Sheku`) and Wedding Date (e.g. `December 2, 2026`).
   - Click **Save Settings**.
3. Select the **"QR Code & Print"** tab:
   - You will see a live preview of the generated QR code.

---

## 3. Printing Table Cards

### Built-in Print-Ready Table Card
The platform comes with a dedicated printable card layout styled specifically for wedding receptions:
1. In the Admin Dashboard under **"QR Code & Print"**, click **"Open Print-Ready Card"** (or visit `/admin/print`).
2. The card features:
   - Double gold border with ornate corner flourishes.
   - Golden wedding rings / monogram icon.
   - Text: *"Scan to Share Your Wedding Memories"*.
   - Subtitle: *"Every moment deserves to be remembered. Open your phone camera to scan and upload your photos directly to our album."*.
   - Large, high-contrast, scannable QR code.
   - *"No App or Sign-in Required"* helper note.
   - Couple's names and wedding date at the base.
3. Click **"Print Card"**:
   - The built-in `@media print` style sheet automatically hides navigation bars and buttons, centering the card cleanly on paper.
   - Select **5x7 inch** or **A4** paper size in your print dialogue.
   - Set background graphics to **Enabled** in the print dialog for optimal gold accent rendering.

### Downloading High-Resolution PNG for Custom Stationery
If you are working with a professional wedding stationery printer:
1. On the print page, click **"Download PNG"**.
2. This exports a crisp **1024x1024 high-resolution image** of the QR code with proper margin padding.
3. Send this PNG file to your stationery designer to place onto custom menu cards, acrylic table blocks, or welcome signs.

---

## 4. Best Practices for Table Displays

- **Table Tents & Acrylic Stands**: Place 5x7 or 4x6 acrylic stands on dinner tables and near the bar where guests congregate.
- **Lighting**: Ensure tables have adequate ambient light so smartphone cameras can focus on the QR code without flash.
- **Reception Announcements**: Ask your DJ or MC to announce during the reception:
  *"Please check the QR code on your table to share your photos directly with the bride and groom!"*.
- **Post-Wedding Follow-up**: Include the QR code or link in your post-wedding thank-you notes for any photos taken by friends and family.
