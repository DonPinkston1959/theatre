/*
  # Add DELETE policy for events table

  1. Security Changes
    - Add DELETE policy to allow anyone to delete events
    - This enables the admin panel to clear existing events when uploading new data
    - Maintains consistency with existing INSERT and UPDATE policies

  2. Purpose
    - Allows admin panel to wipe previous events when loading new spreadsheet
    - Ensures data can be completely refreshed with new uploads
*/

-- Add DELETE policy for events table
CREATE POLICY "Anyone can delete events"
  ON events
  FOR DELETE
  TO anon, authenticated
  USING (true);
