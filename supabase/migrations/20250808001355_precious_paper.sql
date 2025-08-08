/*
  # Add unique constraints for proper upsert operations

  1. New Constraints
    - Add unique constraint on events table for (title, theatre_name, date) to prevent duplicate events
  
  2. Security
    - Maintains existing RLS policies
    - No security changes needed
*/

-- Add unique constraint on events to prevent duplicate events
ALTER TABLE events 
ADD CONSTRAINT events_title_theatre_date_unique 
UNIQUE (title, theatre_name, date);