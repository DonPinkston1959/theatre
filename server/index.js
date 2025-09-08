import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
});

// Data file path
const dataFilePath = path.join(__dirname, 'data.json');

// Helper function to read data
const readData = () => {
  try {
    // Check if file exists, create it if it doesn't
    if (!fs.existsSync(dataFilePath)) {
      const initialData = { events: [], theatres: [] };
      fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { events: [], theatres: [] };
  }
};

// Helper function to write data
const writeData = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
};

// Helper function to generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Routes

// Get all events
app.get('/api/events', (req, res) => {
  const data = readData();
  res.json(data.events);
});

// Get events by date range
app.get('/api/events/range', (req, res) => {
  const { startDate, endDate } = req.query;
  const data = readData();
  
  let filteredEvents = data.events;
  
  if (startDate) {
    filteredEvents = filteredEvents.filter(event => event.date >= startDate);
  }
  
  if (endDate) {
    filteredEvents = filteredEvents.filter(event => event.date <= endDate);
  }
  
  res.json(filteredEvents);
});

// Get all theatres
app.get('/api/theatres', (req, res) => {
  const data = readData();
  res.json(data.theatres);
});

// Admin password verification
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  const correctPassword = 'Test123';
  
  if (password === correctPassword) {
    res.json({ success: true, message: 'Password verified' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Upload Excel file
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('Processing file:', req.file.originalname);

    // Read the Excel file
    const workbook = XLSX.default.readFile(req.file.path);
    
    console.log('Available sheets:', workbook.SheetNames);
    
    // Find Companies and Shows tabs
    const companiesSheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('companies') || name.toLowerCase().includes('company')
    );
    const showsSheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('shows') || name.toLowerCase().includes('show')
    );
    
    console.log('All available sheets:', workbook.SheetNames);
    console.log('Found companies sheet:', companiesSheetName);
    console.log('Found shows sheet:', showsSheetName);
    
    if (!companiesSheetName || !showsSheetName) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required tabs. Found: ${workbook.SheetNames.join(', ')}. Need "Companies" and "Shows" tabs.`
      });
    }
    
    console.log(`Processing Companies tab: "${companiesSheetName}"`);
    console.log(`Processing Shows tab: "${showsSheetName}"`);
    
    // Read both tabs
    const companiesWorksheet = workbook.Sheets[companiesSheetName];
    const showsWorksheet = workbook.Sheets[showsSheetName];
    
    console.log('Companies worksheet loaded:', !!companiesWorksheet);
    console.log('Shows worksheet loaded:', !!showsWorksheet);
    
    const companiesData = XLSX.utils.sheet_to_json(companiesWorksheet);
    const showsData = XLSX.utils.sheet_to_json(showsWorksheet);
    
    console.log('Companies rows:', companiesData.length);
    console.log('Shows rows:', showsData.length);
    
    // Debug: show actual column names
    if (companiesData.length > 0) {
      console.log('\n=== COMPANIES TAB DEBUG ===');
      console.log('Company columns:', Object.keys(companiesData[0]));
      console.log('First company sample:', companiesData[0]);
    }
    
    if (showsData.length > 0) {
      console.log('\n=== SHOWS TAB DEBUG ===');
      console.log('Show columns:', Object.keys(showsData[0]));
      console.log('First show sample:', showsData[0]);
    }
    
// Helper function to normalize company names for matching
function normalizeCompanyName(name) {
  if (!name) return '';
  return name.toString().trim().toLowerCase()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\bkc\b/g, '')  // Remove 'KC' suffix
    .replace(/\binc\.?\b/g, '')  // Remove 'Inc' or 'Inc.'
    .replace(/\btheatre\b/g, 'theater')  // Normalize theatre/theater
    .replace(/\s+$/g, '');  // Remove trailing spaces
}

// Helper function to clean text fields
function cleanText(text) {
  if (!text) return '';
  return text.toString().trim();
}

    // Process companies first to create theatre lookup
    console.log('\n=== PROCESSING COMPANIES ===');
    const companyLookup = {};
    const companyNameMap = new Map(); // For fuzzy matching
    
    companiesData.forEach(company => {
      // Try multiple possible column names for company
      const rawCompanyName = company['Company'] || company['company'] || company['COMPANY'];
      const companyName = cleanText(rawCompanyName);
      const normalizedName = normalizeCompanyName(companyName);
      
      console.log(`Processing company: "${companyName}" (normalized: "${normalizedName}")`);
      if (companyName) {
        companyLookup[companyName] = {
          name: companyName,
          website: cleanText(company['CompanyWebsite'] || company['companywebsite'] || company['COMPANYWEBSITE']),
          showWebsite: cleanText(company['ShowWebsite (if different)'] || company['showwebsite (if different)'] || company['ShowWebsite'] || company['showwebsite']),
          email: cleanText(company['Email'] || company['email'] || company['EMAIL']),
          phone: cleanText(company['Phone'] || company['phone'] || company['PHONE']),
          address: cleanText(company['Address'] || company['address'] || company['ADDRESS'])
        };
        
        // Add to fuzzy matching map
        companyNameMap.set(normalizedName, companyName);
      } else {
        console.log('Skipping company row - no company name found:', Object.keys(company));
      }
    });
    
    console.log('Created company lookup for:', Object.keys(companyLookup).length, 'companies');
    console.log('Company lookup keys:', Object.keys(companyLookup));
    
    // Process shows and link with company data
    console.log('\n=== PROCESSING SHOWS ===');
    const newEvents = [];
    const newTheatres = new Map();

    for (const show of showsData) {
      console.log(`\n--- Processing show ${newEvents.length + 1} ---`);
      
      // Try multiple possible column names
      const rawCompanyName = show['Company'] || show['company'] || show['COMPANY'];
      const cleanCompanyName = cleanText(rawCompanyName);
      const normalizedCompanyName = normalizeCompanyName(cleanCompanyName);
      
      // Try exact match first, then fuzzy match
      let company = companyLookup[cleanCompanyName];
      let finalCompanyName = cleanCompanyName;
      
      if (!company && companyNameMap.has(normalizedCompanyName)) {
        finalCompanyName = companyNameMap.get(normalizedCompanyName);
        company = companyLookup[finalCompanyName];
        console.log(`Fuzzy matched "${cleanCompanyName}" to "${finalCompanyName}"`);
      }
      
      // Map column names with multiple variations
      const event = {
        id: generateId(),
        title: cleanText(show['Name'] || show['name'] || show['NAME'] || show['Title'] || show['title']),
        theatreName: finalCompanyName || '',
        eventType: validateEventType(cleanText(show['Type'] || show['type'] || show['TYPE']) || 'Other'),
        date: formatDate(show['Date'] || show['date'] || show['DATE']),
        time: formatTime(show['StartTime'] || show['starttime'] || show['STARTTIME'] || show['Time'] || show['time'] || show['TIME']),
        description: cleanText(show['Description'] || show['description'] || show['DESCRIPTION']),
        websiteUrl: cleanText((company && company.showWebsite) || show['url'] || show['URL'] || (company && company.website)),
        ticketUrl: cleanText(
          show['TicketURL'] ||
          show['ticketUrl'] ||
          show['TicketUrl'] ||
          show['ticketURL'] ||
          show['Ticket URL'] ||
          show['ticket url']
        ),
        venue: cleanText(show['Theatre'] || show['theatre'] || show['THEATRE'] || show['Venue'] || show['venue'] || show['VENUE']),
        price: cleanText(show['Price'] || show['price'] || show['PRICE']),
        signLanguageInterpreting: parseBoolean(show['InterpretativePerformance'] || show['InterpretivePerformance'] || show['interpretativeperformance'] || show['Interpreting'] || show['interpreting'] || show['INTERPRETING'])
      };

      // Show what we extracted from each possible column
      console.log('Column mapping results:');
      console.log(`  Title: "${event.title}"`);
      console.log(`  Company: "${event.theatreName}"`);
      console.log(`  Type: "${event.eventType}"`);
      console.log(`  Date: "${event.date}"`);
      console.log(`  Time: "${event.time}"`);
      
      // Debug: if title is empty, show what we're getting
      if (!event.title) {
        console.log('❌ TITLE IS EMPTY - Available columns:', Object.keys(show));
        console.log('Name field values:', {
          Name: show['Name'],
          name: show['name'],
          NAME: show['NAME']
        });
      }

      // Validate required fields
      if (event.title && event.theatreName && event.date) {
        console.log('✅ Valid event added:', event.title);
        newEvents.push(event);
        
        // Add company as theatre with full details
        if (company) {
          newTheatres.set(finalCompanyName, {
            name: finalCompanyName,
            website: company.website,
            address: company.address,
            email: company.email,
            phone: company.phone
          });
        }
      } else {
        console.log('❌ Invalid event skipped:');
        console.log('Skipping invalid event:', {
          title: event.title,
          company: event.theatreName,
          date: event.date
        });
      }
    }

    console.log('Valid events processed:', newEvents.length);

    // Read existing data
    const data = readData();

    // Add new events (avoiding duplicates based on title, theatre, and date)
    const existingEvents = data.events || [];
    const eventsToAdd = newEvents.filter(newEvent => {
      return !existingEvents.some(existing => 
        existing.title === newEvent.title &&
        existing.theatreName === newEvent.theatreName &&
        existing.date === newEvent.date &&
        existing.time === newEvent.time
      );
    });

    // Add new theatres
    const existingTheatres = data.theatres || [];
    const theatresToAdd = Array.from(newTheatres.values()).filter(newTheatre => {
      return !existingTheatres.some(existing => existing.name === newTheatre.name);
    });

    // Update data
    const updatedData = {
      events: [...existingEvents, ...eventsToAdd],
      theatres: [...existingTheatres, ...theatresToAdd]
    };

    // Write updated data
    if (writeData(updatedData)) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        success: true,
        message: `Successfully processed ${companiesData.length} companies and ${newEvents.length} shows! Added ${eventsToAdd.length} new events and ${theatresToAdd.length} new theatres.`,
        companiesProcessed: companiesData.length,
        addedEvents: eventsToAdd.length,
        addedTheatres: theatresToAdd.length,
        totalProcessed: newEvents.length
      });
    } else {
      res.status(500).json({ success: false, message: 'Error saving data' });
    }

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error processing file: ' + error.message 
    });
  }
});

// Helper function to validate event types
function validateEventType(type) {
  const validTypes = ['Play', 'Musical', 'Comedy', 'Drama', 'Children', 'Opera', 'Dance', 'Other'];
  const normalizedType = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Other';
  
  // Map common variations
  const typeMap = {
    'music': 'Musical',
    'theatre': 'Play',
    'theater': 'Play',
    'show': 'Play',
    'performance': 'Play',
    'concert': 'Musical',
    'kid': 'Children',
    'kids': 'Children',
    'child': 'Children'
  };
  
  const lowerType = normalizedType.toLowerCase();
  if (typeMap[lowerType]) {
    return typeMap[lowerType];
  }
  
  return validTypes.includes(normalizedType) ? normalizedType : 'Other';
}

// Helper functions
function formatDate(dateInput) {
  if (!dateInput) return '';

  let date;
  if (typeof dateInput === 'number') {
    // Excel stores dates as days since 1899-12-31. Convert using UTC to avoid timezone issues
    const ms = Math.round((dateInput - 25569) * 86400 * 1000);
    date = new Date(ms);
  } else if (dateInput instanceof Date) {
    date = new Date(Date.UTC(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate()
    ));
  } else {
    // Try to parse string date
    const dateStr = dateInput.toString().trim();

    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [m, d, y] = dateStr.split('/').map(Number);
      date = new Date(Date.UTC(y, m - 1, d));
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      date = new Date(Date.UTC(y, m - 1, d));
    } else if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      const [m, d, y] = dateStr.split('-').map(Number);
      date = new Date(Date.UTC(y, m - 1, d));
    } else {
      const parsed = new Date(dateStr);
      date = new Date(Date.UTC(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      ));
    }
  }

  if (isNaN(date.getTime())) {
    console.log('❌ Invalid date:', dateInput);
    return '';
  }

  const formatted = date.toISOString().split('T')[0];
  return formatted;
}

function formatTime(timeInput) {
  if (!timeInput) return '';
  
  if (typeof timeInput === 'number') {
    // Excel time format (fraction of a day)
    const hours = Math.floor(timeInput * 24);
    const minutes = Math.floor((timeInput * 24 * 60) % 60);
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return formatted;
  }
  
  if (timeInput instanceof Date) {
    // Date object - extract time portion
    const hours = timeInput.getHours();
    const minutes = timeInput.getMinutes();
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return formatted;
  }
  
  // Try to parse string time
  const timeStr = timeInput.toString();
  
  // Handle various time formats
  let timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const ampm = timeMatch[3];
    
    if (ampm) {
      if (ampm.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (ampm.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
    }
    
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes}`;
    return formatted;
  }
  
  // If no match, try to extract just numbers
  const numMatch = timeStr.match(/(\d{1,2})(\d{2})/);
  if (numMatch && (timeStr.length === 3 || timeStr.length === 4)) {
    const hours = numMatch[1];
    const minutes = numMatch[2] || '00';
    const formatted = `${hours.padStart(2, '0')}:${minutes}`;
    return formatted;
  }
  
  console.log('❌ Could not format time:', timeInput);
  return '00:00'; // Default fallback
}

// Helper function to parse boolean values
function parseBoolean(value) {
  if (!value) return false;

  const str = value.toString().toLowerCase().trim();
  return str === 'true' || str === 'yes' || str === '1' || str === 'available' || str === 'offered' || str === 'y';
}

export { formatTime, formatDate };

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}