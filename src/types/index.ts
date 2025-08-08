export interface TheatreEvent {
  id: string;
  title: string;
  theatreName: string;
  eventType: 'Play' | 'Musical' | 'Comedy' | 'Drama' | 'Children' | 'Opera' | 'Dance' | 'Performance' | 'Other';
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  description: string;
  websiteUrl: string;
  ticketUrl?: string;
  venue?: string;
  price?: string;
  signLanguageInterpreting?: boolean;
}

export interface Theatre {
  name: string;
  website: string;
  address?: string;
}

export interface FilterOptions {
  theatreCompanies: string[];
  theatres: string[];
  eventTypes: string[];
  startDate?: string;
  endDate?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'all';
  signLanguageInterpreting?: boolean;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}