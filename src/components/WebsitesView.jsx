import { Loader2 } from 'lucide-react';

const WebsitesView = ({ 
  websitesData, 
  currentFilter, 
  setCurrentFilter, 
  selectedWebsite, 
  isLoading, 
  onSelectWebsite, 
  onCustomSpider, 
  onLogout 
}) => {
  const getFilteredWebsites = () => {
    switch (currentFilter) {
      case 'no-spider':
        return websitesData.filter(w => w.hasNoSpider === true);
      case 'broken-spider':
        return websitesData.filter(w => w.status === 'broken-spider');
      default:
        return websitesData;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 text-center">
          <h3 className="text-lg font-semibold">Select a website to create a spider</h3>
        </div>

        <div className="p-3 border-b flex justify-between items-center flex-wrap gap-4">
          <button
            onClick={onCustomSpider}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-[5px] rounded-full text-sm font-medium hover:shadow-lg transition-all"
          >
            Custom Spider
          </button>

          <div className="flex gap-2 items-center">
            <div className="flex gap-2">
              {[
                { filter: 'no-spider', icon: '🚫', tooltip: 'No Spider' },
                { filter: 'broken-spider', icon: '🪲', tooltip: 'Broken Spider' },
                { filter: 'all', icon: '✨', tooltip: 'All Spider' }
              ].map(({ filter, icon, tooltip }) => (
                <button
                  key={filter}
                  onClick={() => setCurrentFilter(filter)}
                  className={`px-[3px] py-[2px] rounded-lg border transition-all ${
                    currentFilter === filter ? 'border-indigo-600 border-2 bg-indigo-50' : 'border-gray-300 bg-white'
                  }`}
                  title={tooltip}
                >
                  {icon}
                </button>
              ))}
            </div>
            {/* <button
              onClick={onLogout}
              className="ml-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all"
            >
              Logout
            </button> */}
          </div>
        </div>

        <div className="overflow-auto h-[calc(100vh_-_140px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600 mb-3" size={32} />
              <span className="text-gray-600">Loading websites...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ISO2</th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Company Name</th>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Domain</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredWebsites().length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-20 text-gray-500">
                      <div className="text-4xl mb-2">🔭</div>
                      No websites found
                    </td>
                  </tr>
                ) : (
                  getFilteredWebsites().map((website, index) => (
                    <tr
                      key={index}
                      onClick={() => onSelectWebsite(website)}
                      className={`border-b hover:bg-indigo-50 cursor-pointer transition-all duration-300 ease-in-out hover:translate-x-[5px] ${
                        selectedWebsite?.companyName === website.companyName ? 'bg-indigo-100 border-l-4 border-l-indigo-600' : ''
                      }`}
                    >
                      <td className="px-6 py-[5px]">{website.countryCode}</td>
                      <td className="px-6 py-[5px] font-medium">{website.companyName}</td>
                      <td className="px-6 py-[5px] text-gray-600">{website.sourceKey}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsitesView;