import { ArrowLeft, Copy, Download, Loader2 } from 'lucide-react';
import Editor from "react-simple-code-editor";
import Prism from "prismjs";

// Import Prism languages you need
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";

const EditorView = ({
  spiderCode,
  setSpiderCode,
  jsonConfig,
  setJsonConfig,
  currentTab,
  setCurrentTab,
  isLoading,
  showPublishModal,
  setShowPublishModal,
  onBack,
  onPublish,
  showNotification
}) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Copied to clipboard', 'success');
    }).catch(() => {
      showNotification('Failed to copy', 'error');
    });
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 text-center">
          <h3 className="text-lg font-semibold">Generated Spider Code</h3>
        </div>

        <div className="p-3 border-b flex justify-between items-center flex-wrap gap-3">
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-[5px] rounded-full hover:shadow-lg transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentTab('spider')}
              className={`px-4 py-[5px] rounded-lg font-medium transition-all ${currentTab === 'spider' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
            >
              Spider Code
            </button>
            <button
              onClick={() => setCurrentTab('json')}
              className={`px-4 py-[5px] rounded-lg font-medium transition-all ${currentTab === 'json' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
            >
              JSON Config
            </button>
          </div>
        </div>

        <div className="p-4">
          <Editor
            value={currentTab === "spider" ? spiderCode : jsonConfig}
            onValueChange={(code) =>
              currentTab === "spider" ? setSpiderCode(code) : setJsonConfig(code)
            }
            highlight={(code) =>
              Prism.highlight(
                code,
                currentTab === "spider" ? Prism.languages.python : Prism.languages.json,
                currentTab === "spider" ? "python" : "json"
              )
            }
            padding={12}
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: 14,
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              borderRadius: "8px",
              height: "calc(100vh - 230px)",
              overflow: "auto",
            }}
          />

          <div className="flex gap-3 mt-4 flex-wrap">
            <button
              onClick={() => copyToClipboard(currentTab === 'spider' ? spiderCode : jsonConfig)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-[5px] rounded-full font-medium hover:shadow-lg transition-all"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => downloadFile(currentTab === 'spider' ? spiderCode : jsonConfig, currentTab === 'spider' ? 'spider.py' : 'config.json')}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-[5px] rounded-full font-medium hover:shadow-lg transition-all"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-[5px] rounded-full font-medium hover:shadow-lg transition-all ml-auto"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(5px)' }}>
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl animate-modal-in">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-2">Confirm Publish</h3>
            <p className="text-gray-600 mb-6">Do you really want to publish this spider?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPublishModal(false)}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onPublish}
                disabled={isLoading}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Publishing...
                  </>
                ) : (
                  'Yes, Publish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorView;