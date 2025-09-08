/*
  # Fix unique constraint to allow multiple shows per day

  1. Changes
    - Drop existing unique constraint that only used (title, theatre_name, date)
    - Add new unique constraint that includes time: (title, theatre_name, date, time)
    - This allows multiple showtimes of same show on same day (like Clue at 12:15pm and 6:30pm)

  2. Security
    - Maintains existing RLS policies
    - No changes to table structure, just constraint modification
*/

-- Drop the existing unique constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_title_theatre_date_unique;

-- Add new unique constraint that includes time
ALTER TABLE events ADD CONSTRAINT events_title_theatre_date_time_unique 
  UNIQUE (title, theatre_name, date, time);

-- Update the index name as well
DROP INDEX IF EXISTS events_title_theatre_date_unique;
CREATE UNIQUE INDEX events_title_theatre_date_time_unique ON events (title, theatre_name, date, time);