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
  venueAddress?: string;
  price?: string;
  signLanguageInterpreting?: boolean;
  organizationType: OrganizationType;
}

export type OrganizationType = 'High School' | 'Community' | 'Professional / Other';

export interface Theatre {
  name: string;
  website: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface FilterOptions {
  theatreCompanies: string[];
  theatres: string[];
  eventTypes: string[];
  organizationTypes: OrganizationType[];
  startDate?: string;
  endDate?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'all';
  signLanguageInterpreting?: boolean;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}
