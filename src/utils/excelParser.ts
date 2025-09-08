import * as XLSX from 'xlsx';
import { TheatreEvent, Theatre } from '../types';

// Helper function to clean text fields
function cleanText(text: any): string {
  if (!text) return '';
  return text.toString().trim();
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
    'show': 'Performance',
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
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD format (most likely from the new format)
      date = new Date(dateStr);
    } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
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
  const timeStr = timeInput.toString().trim();
  
  // Handle HH:MM:SS format (new format)
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = timeMatch[1];
    const minutes = timeMatch[2];
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Handle HHMM format
  const numMatch = timeStr.match(/^(\d{3,4})$/);
  if (numMatch) {
    const timeNum = numMatch[1];
    if (timeNum.length === 3) {
      const hours = timeNum.substring(0, 1);
      const minutes = timeNum.substring(1, 3);
      return `${hours.padStart(2, '0')}:${minutes}`;
    } else if (timeNum.length === 4) {
      const hours = timeNum.substring(0, 2);
      const minutes = timeNum.substring(2, 4);
      return `${hours}:${minutes}`;
    }
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
        
        // Find Show or Shows tab only
        const showsSheetName = workbook.SheetNames.find(name => 
          name.toLowerCase() === 'show' || name.toLowerCase() === 'shows'
        );
        
        if (!showsSheetName) {
          throw new Error(`Missing required "Show" or "Shows" tab. Found: ${workbook.SheetNames.join(', ')}.`);
        }
        
        console.log(`Processing Shows tab: "${showsSheetName}"`);
        
        // Read Shows tab
        const showsWorksheet = workbook.Sheets[showsSheetName];
        const showsData = XLSX.utils.sheet_to_json(showsWorksheet);
        
        console.log('Shows rows:', showsData.length);
        
        if (showsData.length > 0) {
          console.log('\n=== SHOWS TAB COLUMNS ===');
          console.log('Available columns:', Object.keys(showsData[0]));
          console.log('First row sample:', showsData[0]);
        }
        
        // Process shows - extract all data from Shows worksheet only
        console.log('\n=== PROCESSING SHOWS ===');
        const newEvents: Omit<TheatreEvent, 'id'>[] = [];
        const newTheatres = new Map<string, Omit<Theatre, 'website'>>();

        for (const show of showsData) {
          console.log(`\n--- Processing show ${newEvents.length + 1} ---`);
          
          // Map columns exactly as provided in the new structure
          const companyName = cleanText((show as any)['Company']);
          const theatreName = cleanText((show as any)['Theatre']);
          const address = cleanText((show as any)['Address']);
          
          const event: Omit<TheatreEvent, 'id'> = {
            title: cleanText((show as any)['Name']),
            theatreName: companyName || '',
            eventType: validateEventType(cleanText((show as any)['Type']) || 'Other'),
            date: formatDate((show as any)['Date']),
            time: formatTime((show as any)['StartTime']),
            description: cleanText((show as any)['Description']),
            websiteUrl: cleanText((show as any)['url']),
            ticketUrl: cleanText((show as any)['TicketURL']) || undefined,
            venue: theatreName || undefined,
            price: undefined, // Not in new structure
            signLanguageInterpreting: parseBoolean((show as any)['InterpretivePerformance'])
          };

          console.log('Column mapping results:');
          console.log(`  Title: "${event.title}"`);
          console.log(`  Company: "${event.theatreName}"`);
          console.log(`  Theatre: "${event.venue}"`);
          console.log(`  Type: "${event.eventType}"`);
          console.log(`  Date: "${event.date}"`);
          console.log(`  Time: "${event.time}"`);
          
          // Validate required fields
          if (event.title && event.theatreName && event.date) {
            console.log('✅ Valid event added:', event.title);
            newEvents.push(event);
            
            // Add company as theatre company
            if (companyName) {
              newTheatres.set(companyName, {
                name: companyName,
                website: event.websiteUrl || '',
                address: address || undefined,
                email: undefined,
                phone: undefined
              });
            }
            
            // Add theatre venue if different from company
            if (theatreName && theatreName !== companyName) {
              newTheatres.set(theatreName, {
                name: theatreName,
                website: event.websiteUrl || '',
                address: address || undefined,
                email: undefined,
                phone: undefined
              });
            }
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