import * as XLSX from 'xlsx';
import { TheatreEvent, Theatre } from '../types';

// Helper function to clean text fields
function cleanText(text: any): string {
  if (!text) return '';
  return text.toString().trim();
}

// Helper function to normalize company names for matching
function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name.toString().trim().toLowerCase()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\bkc\b/g, '')  // Remove 'KC' suffix
    .replace(/\binc\.?\b/g, '')  // Remove 'Inc' or 'Inc.'
    .replace(/\btheatre\b/g, 'theater')  // Normalize theatre/theater
    .replace(/\s+$/g, '');  // Remove trailing spaces
}

// Helper function to validate event types
function validateEventType(type: string): TheatreEvent['eventType'] {
  const validTypes: TheatreEvent['eventType'][] = ['Play', 'Musical', 'Comedy', 'Drama', 'Children', 'Opera', 'Dance', 'Performance', 'Other'];
  const normalizedType = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Other';
  
  // Map common variations
  const typeMap: Record<string, TheatreEvent['eventType']> = {
    'music': 'Musical',
    'theatre': 'Play',
    'theater': 'Play',
    'show': 'Play',
    'concert': 'Musical',
    'kid': 'Children',
    'kids': 'Children',
    'child': 'Children'
  };
  
  const lowerType = normalizedType.toLowerCase();
  if (typeMap[lowerType]) {
    return typeMap[lowerType];
  }
  
  return validTypes.includes(normalizedType as TheatreEvent['eventType']) ? normalizedType as TheatreEvent['eventType'] : 'Other';
}

// Helper function to format date
function formatDate(dateInput: any): string {
  if (!dateInput) return '';
  
  let date: Date;
  if (typeof dateInput === 'number') {
    // Excel date serial number
    const excelEpoch = new Date(1900, 0, 1);
    date = new Date(excelEpoch.getTime() + (dateInput - 2) * 24 * 60 * 60 * 1000);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    // Try to parse string date
    const dateStr = dateInput.toString().trim();
    
    // Handle various date formats
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      date = new Date(dateStr);
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateStr);
    } else if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      const parts = dateStr.split('-');
      date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else {
      date = new Date(dateStr);
    }
  }
  
  if (isNaN(date.getTime())) {
    console.log('❌ Invalid date:', dateInput);
    return '';
  }
  
  return date.toISOString().split('T')[0];
}

// Helper function to format time
function formatTime(timeInput: any): string {
  if (!timeInput) return '00:00';
  
  if (typeof timeInput === 'number') {
    // Excel time format (fraction of a day)
    const hours = Math.floor(timeInput * 24);
    const minutes = Math.floor((timeInput * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (timeInput instanceof Date) {
    const hours = timeInput.getHours();
    const minutes = timeInput.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Try to parse string time
  const timeStr = timeInput.toString();
  
  // Handle various time formats
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
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
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // If no match, try to extract just numbers
  const numMatch = timeStr.match(/(\d{1,2})(\d{2})/);
  if (numMatch && (timeStr.length === 3 || timeStr.length === 4)) {
    const hours = numMatch[1];
    const minutes = numMatch[2] || '00';
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  console.log('❌ Could not format time:', timeInput);
  return '00:00';
}

// Helper function to parse boolean values
function parseBoolean(value: any): boolean {
  if (!value) return false;
  const str = value.toString().toLowerCase().trim();
  return str === 'true' || str === 'yes' || str === '1' || str === 'available' || str === 'offered' || str === 'y';
}

export interface ParseResult {
  events: Omit<TheatreEvent, 'id'>[];
  theatres: Omit<Theatre, 'website'>[];
  companiesProcessed: number;
  showsProcessed: number;
}

export function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('Available sheets:', workbook.SheetNames);
        
        // Find Shows tab only - we'll extract all data from here
        const showsSheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('shows') || name.toLowerCase().includes('show')
        );
        
        if (!showsSheetName) {
          throw new Error(`Missing required "Shows" tab. Found: ${workbook.SheetNames.join(', ')}.`);
        }
        
        console.log(`Processing Shows tab: "${showsSheetName}"`);
        
        // Read Shows tab only
        const showsWorksheet = workbook.Sheets[showsSheetName];
        
        const showsData = XLSX.utils.sheet_to_json(showsWorksheet);
        
        console.log('Shows rows:', showsData.length);
        
        // Process shows only - extract all unique data from Shows worksheet
        console.log('\n=== PROCESSING SHOWS ===');
        const newEvents: Omit<TheatreEvent, 'id'>[] = [];
        const newTheatres = new Map<string, Omit<Theatre, 'website'>>();

        for (const show of showsData) {
          console.log(`\n--- Processing show ${newEvents.length + 1} ---`);
          
          const rawCompanyName = (show as any)['Company'] || (show as any)['company'] || (show as any)['COMPANY'];
          const cleanCompanyName = cleanText(rawCompanyName);
          
          const event: Omit<TheatreEvent, 'id'> = {
            title: cleanText((show as any)['Name'] || (show as any)['name'] || (show as any)['NAME'] || (show as any)['Title'] || (show as any)['title']),
            theatreName: cleanCompanyName || '',
            eventType: validateEventType(cleanText((show as any)['Type'] || (show as any)['type'] || (show as any)['TYPE']) || 'Other'),
            date: formatDate((show as any)['Date'] || (show as any)['date'] || (show as any)['DATE']),
            time: formatTime((show as any)['StartTime'] || (show as any)['starttime'] || (show as any)['STARTTIME'] || (show as any)['Time'] || (show as any)['time'] || (show as any)['TIME']),
            description: cleanText((show as any)['Description'] || (show as any)['description'] || (show as any)['DESCRIPTION']),
            websiteUrl: cleanText((show as any)['url'] || (show as any)['URL'] || (show as any)['Website'] || (show as any)['website']),
            ticketUrl: cleanText(
              (show as any)['TicketURL'] ||
              (show as any)['ticketUrl'] ||
              (show as any)['TicketUrl'] ||
              (show as any)['ticketURL'] ||
              (show as any)['Ticket URL'] ||
              (show as any)['ticket url']
            ),
            venue: cleanText((show as any)['Theatre'] || (show as any)['theatre'] || (show as any)['THEATRE'] || (show as any)['Venue'] || (show as any)['venue'] || (show as any)['VENUE']),
            price: cleanText((show as any)['Price'] || (show as any)['price'] || (show as any)['PRICE']),
            signLanguageInterpreting: parseBoolean((show as any)['InterpretativePerformance'] || (show as any)['InterpretivePerformance'] || (show as any)['interpretativeperformance'] || (show as any)['Interpreting'] || (show as any)['interpreting'] || (show as any)['INTERPRETING'])
          };

          console.log('Column mapping results:');
          console.log(`  Title: "${event.title}"`);
          console.log(`  Company: "${event.theatreName}"`);
          console.log(`  Type: "${event.eventType}"`);
          console.log(`  Date: "${event.date}"`);
          console.log(`  Time: "${event.time}"`);
          
          // Validate required fields
          if (event.title && event.theatreName && event.date) {
            console.log('✅ Valid event added:', event.title);
            newEvents.push(event);
            
            // Add company as theatre from Shows data only
            newTheatres.set(cleanCompanyName, {
              name: cleanCompanyName,
              website: event.websiteUrl,
              address: cleanText((show as any)['Address'] || (show as any)['address'] || (show as any)['ADDRESS']),
              email: cleanText((show as any)['Email'] || (show as any)['email'] || (show as any)['EMAIL']),
              phone: cleanText((show as any)['Phone'] || (show as any)['phone'] || (show as any)['PHONE'])
            });
          } else {
            console.log('❌ Invalid event skipped:', {
              title: event.title,
              company: event.theatreName,
              date: event.date
            });
          }
        }

        console.log('Valid events processed:', newEvents.length);

        resolve({
          events: newEvents,
          theatres: Array.from(newTheatres.values()),
          companiesProcessed: newTheatres.size,
          showsProcessed: newEvents.length
        });

      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}