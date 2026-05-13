# OrgTrack

OrgTrack is a web-based attendance tool for events. Import a masterlist, scan IDs, and export reports. No login required—data is stored locally in the browser.

## Core features
- Import masterlist (`.csv`, `.xlsx`)
- Scan IDs using:
  - Camera (QR + 1D barcodes)
  - USB/Bluetooth hardware barcode scanners
  - OCR fallback (Tesseract.js) if barcode decoding fails
- Prevent duplicate scans
- Dashboard totals + year-level breakdown
- Export attendance to Excel

## Tech
React + Vite + TypeScript, Tailwind CSS, Zustand (localStorage), html5-qrcode, Tesseract.js, xlsx/papaparse

## Run locally
```bash
npm install
npm run dev
npm run build