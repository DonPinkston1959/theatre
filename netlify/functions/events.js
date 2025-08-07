import fs from 'fs';
import path from 'path';

// Simple in-memory storage for demo purposes
// Note: In production, you'd want to use a database
let eventsData = {
  events: [
    {
      id: '1',
      title: 'A Christmas Carol',
      theatreName: 'Kansas City Repertory Theatre',
      eventType: 'Play',
      date: '2025-01-15',
      time: '19:30',
      description: 'A heartwarming holiday classic brought to life on stage.',
      websiteUrl: 'https://www.kcrep.org',
      venue: 'Spencer Theatre',
      price: '$25-$65'
    },
    {
      id: '2',
      title: 'The Lion King',
      theatreName: 'Music Hall Kansas City',
      eventType: 'Musical',
      date: '2025-01-18',
      time: '20:00',
      description: 'Disney\'s award-winning musical spectacular.',
      websiteUrl: 'https://www.musichallkc.org',
      ticketUrl: 'https://www.tickets.com',
      price: '$45-$125'
    },
    {
      id: '3',
      title: 'Comedy Night Live',
      theatreName: 'The Improv Shop',
      eventType: 'Comedy',
      date: '2025-01-20',
      time: '21:00',
      description: 'An evening of laughs with local comedians.',
      websiteUrl: 'https://www.theimprovshop.com',
      price: '$15-$25'
    },
    {
      id: '4',
      title: 'Romeo and Juliet',
      theatreName: 'Heart of America Shakespeare Festival',
      eventType: 'Drama',
      date: '2025-01-22',
      time: '18:00',
      description: 'Shakespeare\'s timeless tragedy of young love.',
      websiteUrl: 'https://www.kcshakes.org',
      price: 'Free',
      signLanguageInterpreting: true
    },
    {
      id: '5',
      title: 'Nutcracker Suite',
      theatreName: 'Starlight Theatre',
      eventType: 'Dance',
      date: '2025-01-25',
      time: '14:00',
      description: 'Classical ballet performance for the whole family.',
      websiteUrl: 'https://www.kcstarlight.com',
      ticketUrl: 'https://www.tickets.com/starlight',
      price: '$20-$50'
    }
  ],
  theatres: [
    { name: 'Kansas City Repertory Theatre', website: 'https://www.kcrep.org' },
    { name: 'Music Hall Kansas City', website: 'https://www.musichallkc.org' },
    { name: 'The Improv Shop', website: 'https://www.theimprovshop.com' },
    { name: 'Heart of America Shakespeare Festival', website: 'https://www.kcshakes.org' },
    { name: 'Starlight Theatre', website: 'https://www.kcstarlight.com' }
  ]
};

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

  if (event.httpMethod === 'GET') {
    const { queryStringParameters } = event;
    let filteredEvents = eventsData.events;

    // Handle date range filtering
    if (queryStringParameters?.startDate) {
      filteredEvents = filteredEvents.filter(event => event.date >= queryStringParameters.startDate);
    }

    if (queryStringParameters?.endDate) {
      filteredEvents = filteredEvents.filter(event => event.date <= queryStringParameters.endDate);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(filteredEvents)
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};

// Export data for other functions to access
export { eventsData };