import { eventsData } from './events.js';

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      // For now, return a demo response since we can't handle file uploads
      // without additional setup for multipart/form-data parsing
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Demo mode: Excel upload functionality is available in development. In production, this would process your Excel file with Companies and Shows tabs.',
          companiesProcessed: 0,
          addedEvents: 0,
          addedTheatres: 0,
          totalProcessed: 0,
          note: 'To enable full Excel upload in production, a database service would be required for data persistence.'
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error processing upload: ' + error.message 
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};