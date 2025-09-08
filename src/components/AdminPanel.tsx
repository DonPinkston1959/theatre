import React, { useState } from 'react';
import { Upload, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseExcelFile } from '../utils/excelParser';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdate: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onDataUpdate }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check
    const correctPassword = 'Test123';
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setMessage({ type: 'success', text: 'Authentication successful!' });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: 'Invalid password' });
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // Parse Excel file
      console.log('Starting Excel file processing...');
      const parseResult = await parseExcelFile(file);
      console.log('Excel parsing completed:', parseResult);

      // Insert theatres first
      let addedTheatres = 0;
      if (parseResult.theatres.length > 0) {
        const { data: insertedTheatres, error: theatreError } = await supabase
          .from('theatres')
          .upsert(
            parseResult.theatres.map(theatre => ({
              name: theatre.name,
              website: theatre.website || null,
              address: theatre.address || null,
              email: theatre.email || null,
              phone: theatre.phone || null
            })),
            { 
              onConflict: 'name',
              ignoreDuplicates: false 
            }
          )
          .select();

        if (theatreError) {
          console.error('Theatre insertion error:', theatreError);
          throw theatreError;
        }
        addedTheatres = insertedTheatres?.length || 0;
      }

      // Insert events
      let addedEvents = 0;
      if (parseResult.events.length > 0) {
        // Remove duplicates within the batch before inserting
        const uniqueEvents = parseResult.events.filter((event, index, array) => {
          return array.findIndex(e => 
            e.title === event.title && 
            e.theatreName === event.theatreName && 
            e.date === event.date &&
            e.time === event.time
          ) === index;
        });
        
        console.log(`Filtered ${parseResult.events.length} events down to ${uniqueEvents.length} unique events`);

        const { data: insertedEvents, error: eventsError } = await supabase
          .from('events')
          .upsert(
            uniqueEvents.map(event => ({
              title: event.title,
              theatre_name: event.theatreName,
              event_type: event.eventType,
              date: event.date,
              time: event.time,
              description: event.description || null,
              website_url: event.websiteUrl || null,
              ticket_url: event.ticketUrl || null,
              venue: event.venue || null,
              price: event.price || null,
              sign_language_interpreting: event.signLanguageInterpreting
            })),
            { 
              onConflict: 'title,theatre_name,date,time',
              ignoreDuplicates: false 
            }
          )
          .select();

        if (eventsError) {
          console.error('Events insertion error:', eventsError);
          throw eventsError;
        }
        addedEvents = insertedEvents?.length || 0;
      }

      setMessage({
        type: 'success',
        text: `Successfully processed ${parseResult.companiesProcessed} companies and ${parseResult.showsProcessed} shows! Added/updated ${addedEvents} events and ${addedTheatres} theatres to the database.`
      });
      
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      onDataUpdate();
      
    } catch (error) {
      console.error('Error during file upload:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Upload failed. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    if (!uploading) {
      setIsAuthenticated(false);
    }
    setFile(null);
    setMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Admin Panel
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!isAuthenticated ? (
            /* Password Form */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors duration-200"
              >
                Authenticate
              </button>
            </form>
          ) : (
            /* Upload Form */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Expected Excel Format</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Required tab:</strong> "Show" or "Shows"</p>
                  <div className="mt-2">
                    <p><strong>Required columns in order:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      <li><strong>Number</strong> - Row number</li>
                      <li><strong>Company</strong> - Theatre company name</li>
                      <li><strong>Theatre</strong> - Venue name</li>
                      <li><strong>Address</strong> - Venue address</li>
                      <li><strong>Name</strong> - Show title</li>
                      <li><strong>Type</strong> - Event type</li>
                      <li><strong>url</strong> - Website URL</li>
                      <li><strong>TicketURL</strong> - Ticket purchase URL</li>
                      <li><strong>Day</strong> - Day of week (optional)</li>
                      <li><strong>Date</strong> - Event date (YYYY-MM-DD)</li>
                      <li><strong>StartTime</strong> - Start time (HH:MM:SS)</li>
                      <li><strong>InterpretivePerformance</strong> - Sign language</li>
                      <li><strong>Description</strong> - Event description</li>
                    </ul>
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                  <div className="text-yellow-800">
                    <p className="font-medium">Processing your Excel file...</p>
                    <p className="text-sm">Reading Show/Shows tab</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Excel File (.xlsx)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={uploading}
                    required
                  />
                  {file && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Excel File...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Events
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;