import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
const XPathView = ({
  xpathData,
  setXpathData,
  hasGeneratedCode,
  isLoading,
  onGenerate,
  onClear,
  onBack,
  onEditCode,
  showNotification
}) => {
  const [missingFields, setMissingFields] = useState([]);
  // Validation function
  const validateFields = () => {
    const missing = [];

    Object.entries(xpathData).forEach(([key, value]) => {
      if (key === 'playwright') return; // skip toggle
      if (key === 'playwright-selector' && !xpathData.playwright) return; // skip if not used
      if (!value || value.trim() === '') missing.push(key);
    })

    setMissingFields(missing);

    if (missing.length > 0) {
      const readable = missing
        .map((k) =>
          k
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        )
        .join(', ');

      showNotification(`Please fill all required fields: ${readable}`, 'error');
      return false;
    }
    return true;
  };
  // Handle Generate click
  const handleGenerate = () => {
    if (validateFields()) {
      onGenerate();
    }
  };

  const handleChange = (key, value) => {
    // setXpathData({ ...xpathData, [key]: value });
    const updatedData = { ...xpathData, [key]: value };

    if (missingFields.includes(key) && value.trim() !== '') {
      // remove from missing list dynamically when user types
      setMissingFields(missingFields.filter((f) => f !== key));
    }

    // Auto-generate source-key when start-url changes
    if (key === 'start-url' && value.trim()) {
      try {
        // Ensure it has a protocol
        const url = value.startsWith('http') ? value : 'https://' + value;
        const parsedUrl = new URL(url);

        // Example: from "https://jobs.jansen.com/eng"
        // we want "jobs.jansen.com"
        let host = parsedUrl.hostname;

        // Handle common cases:
        // remove "www." or other prefixes like "careers."
        host = host.replace(/^www\./, '').replace(/^careers\./, '');

        // Remove trailing dots if any
        host = host.replace(/\.$/, '');

        updatedData['source-key'] = host;
      } catch (err) {
        console.warn('Invalid start URL, cannot derive source key:', err);
      }
    }
    setXpathData(updatedData);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 text-center">
          <h3 className="text-lg font-semibold">Get the XPath to create a spider</h3>
        </div>

        <div className="p-3 border-b flex justify-between">
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-[5px] rounded-full hover:shadow-lg transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={onClear}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-[5px] rounded-full text-sm font-medium hover:shadow-lg transition-all"
          >
            Clear All
          </button>
        </div>

        <div className="p-4 space-y-4 h-[calc(100vh_-_220px)] overflow-y-auto">
          {Object.entries(xpathData).map(([key, value]) => {
            if (key === 'playwright') {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Playwright</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={value === true}
                        onChange={() => setXpathData({ ...xpathData, playwright: true })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={value === false}
                        onChange={() => setXpathData({ ...xpathData, playwright: false })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              );
            }
            if (key === 'playwright-selector' && !xpathData.playwright) return null;
            const isMissing = missingFields.includes(key);
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors ${isMissing
                    ? 'border-red-500 focus:border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-blue-500'
                    }`}
                />
                {isMissing && (
                  <p className="text-red-500 text-sm mt-1">
                    This field is required
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-[5px] rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
          {hasGeneratedCode && (
            <button
              onClick={onEditCode}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-[5px] rounded-full font-medium hover:shadow-lg transition-all"
            >
              Edit Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default XPathView;