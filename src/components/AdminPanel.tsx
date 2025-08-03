import React, { useState } from 'react';
import { Upload, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';

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
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsAuthenticated(true);
        setMessage({ type: 'success', text: 'Authentication successful!' });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: 'Invalid password' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Connection error' });
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully processed ${result.companiesProcessed} companies and ${result.totalProcessed} shows! Added ${result.addedEvents} new events and ${result.addedTheatres} new theatres.`
        });
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        onDataUpdate();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
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
                  <p><strong>Required tabs:</strong> Companies and Shows</p>
                  <div className="mt-2">
                    <p><strong>Companies tab columns:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Company (required)</li>
                      <li>CompanyWebsite</li>
                      <li>ShowWebsite (if different)</li>
                      <li>Email, Phone, Address</li>
                    </ul>
                  </div>
                  <div className="mt-2">
                    <p><strong>Shows tab columns:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Company (required)</li>
                      <li>Name (show title, required)</li>
                      <li>Type (play, performance, musical)</li>
                      <li>Date, StartTime</li>
                      <li>Theatre, url, Description, Interpreting</li>
                    </ul>
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                  <div className="text-yellow-800">
                    <p className="font-medium">Processing your Excel file...</p>
                    <p className="text-sm">Reading Companies and Shows tabs</p>
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