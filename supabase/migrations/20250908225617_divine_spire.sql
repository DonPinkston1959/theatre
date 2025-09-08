/*
  # Add unique constraint for events table

  1. Database Changes
    - Add unique constraint on (title, theatre_name, date, time) to events table
    - This allows proper upsert operations with ON CONFLICT resolution
  
  2. Purpose
    - Enables the admin panel to properly handle duplicate events
    - Supports multiple showtimes for same event on same day
*/

-- Add unique constraint to support ON CONFLICT operations
ALTER TABLE public.events 
ADD CONSTRAINT unique_event_details 
UNIQUE (title, theatre_name, date, time);