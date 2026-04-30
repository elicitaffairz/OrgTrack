# OrgTrack

**OrgTrack** is a responsive, web-based attendance monitoring system tailored for event organizers, faculty, and student organization officers. It streamlines the recording and management of event attendees through rapid QR and barcode scanning, transitioning away from high-friction, error-prone manual administrative tasks into a seamless digital experience.

## ✨ Features

- **Masterlist Importation**: Easily upload `.csv` and `.xlsx` files to prepopulate the student database before an event.
- **Integrated Camera Scanner**: Uses device cameras built into laptops, tablets, and phones to read both QR codes and 1D barcodes. Automatically defaults to the rear camera on mobile devices.
- **Hardware Scanner Support**: Seamlessly captures input from USB or Bluetooth physical barcode scanners.
- **Manual Entry Fallback**: An intuitive form allowing manual input of student details if scanning fails or a participant does not have their ID.
- **Real-Time Dashboard**: Visualizes total students, total attendees, and percentage breakdowns by year level in real-time.
- **Data Export**: One-click export of attendance data to a formatted Excel file for post-event reporting.
- **Offline & Privacy Focused**: Utilizes client-side local storage. Data is saved natively on the device's browser, preventing data loss without requiring an immediate backend database connection.

## 🛠️ Tech Stack

- **Frontend Framework**: React (with Vite)
- **Programming Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: Zustand
- **Scanner Integration**: `html5-qrcode`
- **Spreadsheet Parsing**: `xlsx`

## 🚀 How to Use

1. **Upload Masterlist**: Head to the **Files** tab and upload an Excel/CSV file containing your expected attendees' list (must include an ID column, and optionally Name, Course, and Year level).
2. **Scan Attendees**: Head to the **Scan** tab. Switch to "Camera Scanner" mode to utilize your device's camera for QR or barcode scanning. Alternatively, connect a physical USB/Bluetooth scanner and use the "Barcode Scanner" mode.
3. **Analyze the Turnout**: Navigate to the **Dashboard** to see real-time updates:
   - Total students registered vs. total attendees.
   - Scan distributions broken down by academic year.
4. **Export the Results**: Once the event concludes, go back to the **Files** tab and click "Export to Excel" to download a consolidated spreadsheet of the actual attendees with timestamps.
5. **End Session**: Click "End Session" in the Dashboard or Files page to securely clear the current event data and prepare for the next event.

## 🎨 HCI Principles Applied

OrgTrack incorporates Human-Computer Interaction (HCI) methodologies:
- **Visibility of System Status** through real-time analytic dashboards and scan counting.
- **Error Prevention** via duplicate scan blockers, file format validations, and clear toast notifications.
- **User Control and Freedom** allowing manual entry overrides for edge cases.
- **Aesthetic and Minimalist Design** utilizing high-contrast, responsive interfaces built for focus under demanding event entry scenarios.

## 📦 Setup and Development

To run this application locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```
