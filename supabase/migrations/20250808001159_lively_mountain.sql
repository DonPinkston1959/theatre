/*
  # Fix admin permissions for Excel uploads

  1. Security Updates
    - Allow anonymous users to insert data (admin operations)
    - Keep read access open for public viewing
    - Allow updates for data management

  This enables the admin panel to work without requiring user authentication,
  since the admin panel has its own password protection.
*/

-- Update theatres policies to allow admin operations
DROP POLICY IF EXISTS "Authenticated users can insert theatres" ON theatres;
DROP POLICY IF EXISTS "Authenticated users can update theatres" ON theatres;

CREATE POLICY "Anyone can insert theatres"
  ON theatres
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update theatres"
  ON theatres
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Update events policies to allow admin operations
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;

CREATE POLICY "Anyone can insert events"
  ON events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update events"
  ON events
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);