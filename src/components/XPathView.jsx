import { ArrowLeft, Loader2 } from 'lucide-react';

const XPathView = ({ 
  xpathData, 
  setXpathData, 
  hasGeneratedCode, 
  isLoading, 
  onGenerate, 
  onClear, 
  onBack, 
  onEditCode 
}) => {
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
                        onChange={() => setXpathData({...xpathData, playwright: true})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={value === false}
                        onChange={() => setXpathData({...xpathData, playwright: false})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              );
            }
            if (key === 'playwright-selector' && !xpathData.playwright) return null;
            
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setXpathData({...xpathData, [key]: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            );
          })}
        </div>

        <div className="p-6 flex gap-3">
          <button
            onClick={onGenerate}
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