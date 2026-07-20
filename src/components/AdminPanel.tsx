import React, { useState } from 'react';
import { Upload, Lock, AlertCircle, CheckCircle, X, FileSearch } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ParseResult, parseExcelFile } from '../utils/excelParser';
import { TheatreEvent } from '../types';
import ActivityDashboard from './ActivityDashboard';
import { toLocalDateString } from '../utils/date';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdate: () => void;
  events: TheatreEvent[];
}

interface UploadPreview {
  added: number;
  removed: number;
  unchanged: number;
  duplicates: number;
  pastEvents: number;
  firstDate?: string;
  lastDate?: string;
  uniqueEvents: ParseResult['events'];
}

const eventKey = (event: Pick<TheatreEvent, 'title' | 'theatreName' | 'date' | 'time'>) =>
  [event.title, event.theatreName, event.date, event.time.split(':').slice(0, 2).join(':')]
    .map(value => value.trim().toLowerCase())
    .join('|');

const createUploadPreview = (parseResult: ParseResult, currentEvents: TheatreEvent[]): UploadPreview => {
  const uniqueEvents = parseResult.events.filter((event, index, array) =>
    array.findIndex(candidate => eventKey(candidate) === eventKey(event)) === index
  );
  const incomingKeys = new Set(uniqueEvents.map(eventKey));
  const currentKeys = new Set(currentEvents.map(eventKey));
  const dates = uniqueEvents.map(event => event.date).filter(Boolean).sort();
  const today = toLocalDateString(new Date());

  return {
    added: [...incomingKeys].filter(key => !currentKeys.has(key)).length,
    removed: [...currentKeys].filter(key => !incomingKeys.has(key)).length,
    unchanged: [...incomingKeys].filter(key => currentKeys.has(key)).length,
    duplicates: parseResult.events.length - uniqueEvents.length,
    pastEvents: uniqueEvents.filter(event => event.date < today).length,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
    uniqueEvents
  };
};

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onDataUpdate, events }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check
    const correctPassword = 'JoshRocks28';
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setMessage({ type: 'success', text: 'Authentication successful!' });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: 'Invalid password' });
    }
  };

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setParseResult(null);
    setPreview(null);
    setConfirmed(false);
    setMessage(null);

    if (!selectedFile) return;

    setParsing(true);
    try {
      const result = await parseExcelFile(selectedFile);
      setParseResult(result);
      setPreview(createUploadPreview(result, events));
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not read that spreadsheet.'
      });
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !parseResult || !preview || preview.uniqueEvents.length === 0 || !confirmed) {
      setMessage({ type: 'error', text: 'Please select and review a valid file first.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
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

      // Replace the event collection in one database transaction. If any row is
      // invalid, Postgres rolls the whole operation back and keeps the old list.
      const eventRows = preview.uniqueEvents.map(event => ({
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
      }));
      const { data: addedEvents, error: eventsError } = await supabase
        .rpc('replace_events', { new_events: eventRows });

      if (eventsError) {
        console.error('Event replacement error:', eventsError);
        throw eventsError;
      }

      setMessage({
        type: 'success',
        text: `Successfully processed ${parseResult.companiesProcessed} companies and ${parseResult.showsProcessed} shows! Added/updated ${addedEvents || 0} events and ${addedTheatres} theatres to the database.`
      });
      
      setFile(null);
      setParseResult(null);
      setPreview(null);
      setConfirmed(false);
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
    setParseResult(null);
    setPreview(null);
    setConfirmed(false);
    setMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Admin Panel
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            aria-label="Close admin panel"
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

              {(uploading || parsing) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                  <div className="text-yellow-800">
                    <p className="font-medium">{parsing ? 'Reviewing your Excel file...' : 'Updating the event database...'}</p>
                    <p className="text-sm">{parsing ? 'No database changes are being made yet.' : 'Please keep this window open.'}</p>
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
                    onChange={(e) => void handleFileChange(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={uploading || parsing}
                    required
                  />
                  {file && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                {preview && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-3 flex items-center font-medium text-blue-900">
                      <FileSearch className="mr-2 h-4 w-4" />
                      Review before replacing events
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div><strong>{preview.added}</strong><br /><span className="text-blue-800">new</span></div>
                      <div><strong>{preview.unchanged}</strong><br /><span className="text-blue-800">unchanged</span></div>
                      <div><strong>{preview.removed}</strong><br /><span className="text-blue-800">removed</span></div>
                      <div><strong>{preview.duplicates}</strong><br /><span className="text-blue-800">duplicates skipped</span></div>
                    </div>
                    <p className="mt-3 text-xs text-blue-800">
                      {preview.uniqueEvents.length} unique performances from {preview.firstDate || 'unknown'} through {preview.lastDate || 'unknown'}.
                    </p>
                    {preview.pastEvents > 0 && (
                      <p className="mt-2 text-xs font-medium text-amber-800">
                        {preview.pastEvents} past performances will be stored for history but hidden from visitors.
                      </p>
                    )}
                    {preview.removed > Math.max(preview.unchanged, 50) && (
                      <p className="mt-2 text-xs font-medium text-red-800">
                        Large removal detected. Confirm that this is the complete master spreadsheet.
                      </p>
                    )}
                    {preview.uniqueEvents.length === 0 && (
                      <p className="mt-2 text-xs font-medium text-red-800">
                        This spreadsheet contains no valid performances and cannot be imported.
                      </p>
                    )}
                  </div>
                )}

                {preview && preview.uniqueEvents.length > 0 && (
                  <label className="flex items-start rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(event) => setConfirmed(event.target.checked)}
                      className="mr-3 mt-0.5 h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-500"
                    />
                    I reviewed this summary and confirm this is the complete master spreadsheet.
                  </label>
                )}

                <button
                  type="submit"
                  disabled={uploading || parsing || !file || !preview || preview.uniqueEvents.length === 0 || !confirmed}
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
                      Replace Events After Review
                    </>
                  )}
                </button>
              </form>

              <ActivityDashboard isActive={isAuthenticated} />
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
