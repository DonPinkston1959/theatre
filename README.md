# KC Live Theatre Events Website

A comprehensive theatre events website for the Kansas City area, featuring a calendar-based interface, advanced filtering, and admin upload capabilities.

## Features

### Core Functionality
- **Interactive Calendar**: Month, Week, and Day views with seamless switching
- **Event Display**: Events shown directly on calendar with color-coded types
- **Event Popups**: Detailed information with theatre website links
- **Mobile Responsive**: Optimized for all device sizes

### Filtering System
- **Theatre Filter**: Filter by specific theatre venues
- **Event Type Filter**: Play, Musical, Comedy, Drama, Children, Opera, Dance, Other
- **Date Range**: Custom start and end date selection
- **Time Filter**: Morning, Afternoon, Evening, or All times
- **Multiple Filters**: Apply multiple filters simultaneously

### Admin Features
- **Password Protection**: Admin panel secured with password (Test123)
- **Excel Upload**: Upload .xlsx files with event data
- **Data Persistence**: New uploads update existing data without loss
- **Error Handling**: Comprehensive error messages and validation

## Expected Excel File Format

The Excel file should contain the following columns:

### Required Columns:
- **Theatre Name**: Name of the theatre venue
- **Event Title**: Title of the show/event
- **Event Type**: Play, Musical, Comedy, Drama, Children, Opera, Dance, or Other
- **Date**: Event date (MM/DD/YYYY or similar formats)
- **Time**: Event time (HH:MM format)
- **Description**: Event description
- **Website URL**: Theatre's website URL

### Optional Columns:
- **Venue**: Specific venue name (if different from theatre)
- **Price**: Ticket price range

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Application**:
   ```bash
   npm run dev
   ```
   This will start both the frontend (Vite) and backend (Express) servers concurrently.

3. **Access the Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

### Viewing Events
1. Navigate through the calendar using Month, Week, or Day views
2. Click on events to see detailed information
3. Use filters to narrow down events by theatre, type, date, or time

### Adding Events (Admin)
1. Click the Settings icon in the top-right corner
2. Enter the admin password: `Test123`
3. Upload an Excel file with the proper format
4. Events will be automatically parsed and added to the calendar

### Sample Data
The application comes with sample KC area theatre events including:
- Music Hall Kansas City
- Kansas City Repertory Theatre  
- Starlight Theatre
- The Improv Shop
- Heart of America Shakespeare Festival

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Responsive Design** with mobile-first approach

### Backend
- **Express.js** server
- **File-based storage** (JSON) for data persistence
- **XLSX library** for Excel file processing
- **Multer** for file uploads
- **CORS** enabled for cross-origin requests

### Data Storage
- Events and theatres stored in `server/data.json`
- Automatic backup and persistence
- Duplicate prevention based on title, theatre, and date

## API Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/range` - Get events by date range
- `GET /api/theatres` - Get all theatres
- `POST /api/admin/verify` - Verify admin password
- `POST /api/admin/upload` - Upload Excel file

## Color Coding

Events are color-coded by type:
- **Musical**: Purple
- **Play**: Blue  
- **Comedy**: Yellow
- **Drama**: Red
- **Children**: Green
- **Opera**: Indigo
- **Dance**: Pink
- **Other**: Gray

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

To add new theatre venues or modify event types, update the corresponding arrays in the FilterPanel component and ensure the backend validation matches.

## License

This project is licensed under the MIT License.