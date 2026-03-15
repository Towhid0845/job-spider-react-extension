import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

const BulkSpiderDialog = ({ isOpen, onClose, onSave }) => {
  const [countryCode, setCountryCode] = useState('');
  const [urls, setUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // Validate inputs
    if (!countryCode.trim()) {
      alert('Please enter a country code');
      return;
    }

    if (!urls.trim()) {
      alert('Please enter at least one URL');
      return;
    }

    // Parse URLs (one per line)
    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urlList.length === 0) {
      alert('Please enter at least one valid URL');
      return;
    }

    setIsLoading(true);

    try {
      // Call the parent's save handler
      await onSave({
        countryCode: countryCode.trim().toUpperCase(),
        urls: urlList
      });

      // Reset form
      setCountryCode('');
      setUrls('');
      onClose();
    } catch (error) {
      console.error('Failed to create bulk spiders:', error);
      alert('Failed to create spiders: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000096] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Create Bulk Spiders</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Country Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              placeholder="e.g., US, BD, UK"
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">2-letter ISO country code</p>
          </div>

          {/* URLs Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URLs <span className="text-red-500">*</span>
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter URLs, one per line&#10;https://example.com/jobs&#10;https://another-site.com/careers&#10;https://company.com/positions"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {urls.split('\n').filter(u => u.trim()).length} URL(s) entered
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            {isLoading ? 'Creating...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkSpiderDialog;