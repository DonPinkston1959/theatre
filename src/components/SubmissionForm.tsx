import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

interface SubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialForm = {
  contactName: '',
  contactEmail: '',
  companyName: '',
  showTitle: '',
  eventType: 'Play',
  venueName: '',
  venueAddress: '',
  performanceDates: '',
  websiteUrl: '',
  ticketUrl: '',
  notes: ''
};

const SubmissionForm: React.FC<SubmissionFormProps> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(initialForm);

  if (!isOpen) return null;

  const updateField = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const body = [
      'New KC Live Theatre show submission',
      '',
      `Contact: ${form.contactName}`,
      `Contact email: ${form.contactEmail}`,
      `Company: ${form.companyName}`,
      `Show: ${form.showTitle}`,
      `Type: ${form.eventType}`,
      `Venue: ${form.venueName}`,
      `Address: ${form.venueAddress || 'Not provided'}`,
      `Performance dates and times: ${form.performanceDates}`,
      `Website: ${form.websiteUrl || 'Not provided'}`,
      `Ticket link: ${form.ticketUrl || 'Not provided'}`,
      '',
      `Notes: ${form.notes || 'None'}`
    ].join('\n');

    window.location.href = `mailto:don.pinkston.jr@gmail.com?subject=${encodeURIComponent(`Show submission: ${form.showTitle}`)}&body=${encodeURIComponent(body)}`;
  };

  const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Submit a Show</h2>
            <p className="text-sm text-gray-600">Send the details to Don for review before they are listed.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close submission form">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-6 sm:grid-cols-2">
          {[
            ['contactName', 'Your name', 'text', true],
            ['contactEmail', 'Your email', 'email', true],
            ['companyName', 'Theatre company', 'text', true],
            ['showTitle', 'Show title', 'text', true],
            ['venueName', 'Venue', 'text', true],
            ['venueAddress', 'Venue address', 'text', false],
            ['websiteUrl', 'Show or company website', 'url', false],
            ['ticketUrl', 'Ticket link', 'url', false]
          ].map(([name, label, type, required]) => (
            <label key={String(name)} className="block text-sm font-medium text-gray-700">
              {label}{required ? ' *' : ''}
              <input
                className={`${inputClass} mt-1`}
                name={String(name)}
                type={String(type)}
                value={form[name as keyof typeof form]}
                onChange={updateField}
                required={Boolean(required)}
              />
            </label>
          ))}

          <label className="block text-sm font-medium text-gray-700">
            Event type *
            <select name="eventType" value={form.eventType} onChange={updateField} className={`${inputClass} mt-1`}>
              {['Play', 'Musical', 'Comedy', 'Drama', 'Children', 'Opera', 'Dance', 'Performance', 'Other'].map(type => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
            Performance dates and start times *
            <textarea
              className={`${inputClass} mt-1`}
              name="performanceDates"
              value={form.performanceDates}
              onChange={updateField}
              rows={4}
              placeholder="Example: Oct. 3 at 7:30 PM; Oct. 4 at 2:00 PM and 7:30 PM"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
            Additional notes
            <textarea className={`${inputClass} mt-1`} name="notes" value={form.notes} onChange={updateField} rows={3} />
          </label>

          <p className="text-xs text-gray-500 sm:col-span-2">
            Submitting opens your email app with these details addressed to Don. Nothing is published automatically.
          </p>

          <button type="submit" className="flex items-center justify-center rounded-lg bg-red-800 px-4 py-3 font-medium text-white hover:bg-red-900 sm:col-span-2">
            <Send className="mr-2 h-4 w-4" />
            Email Submission to Don
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmissionForm;
