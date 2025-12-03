import { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import WebsitesView from './components/WebsitesView';
import XPathView from './components/XPathView';
import EditorView from './components/EditorView';
import Notification from './components/Notification';

const App = () => {
  const [currentView, setCurrentView] = useState('auth');
  const [authForm, setAuthForm] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [websitesData, setWebsitesData] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [xpathData, setXpathData] = useState({
    'start-url': '',
    'source-key': '',
    'company-name': '',
    'company-logo': '',
    'source-country': '',
    'lang-code': '',
    'job-link': '',
    'job-title': '',
    'job-location': '',
    'job-content': '',
    'playwright': false,
    'playwright-selector': ''
  });

  const [currentTab, setCurrentTab] = useState('spider');
  const [spiderCode, setSpiderCode] = useState('');
  const [jsonConfig, setJsonConfig] = useState('');
  const [hasGeneratedCode, setHasGeneratedCode] = useState(false);
  const [authData, setAuthData] = useState(null);

  const token = "215c566011a84286a440e42bb40d762347d4ab2be3334a438f9f6c2041cd57c35ca5fb28ce874110aa6873398b2d9f1c";

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    chrome.storage.local.get(['isAuthenticated', 'authData'], (result) => {
      if (result.isAuthenticated && result.authData) {
        setIsAuthenticated(true);
        setAuthData(result.authData);
        setCurrentView('websites');
        loadWebsites();
      }
    });

    // Listen for XPath updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "updateXPathField") {
        updateXPathField(request.field, request.value);
      }
      return true;
    });
  }, []);

  const updateXPathField = (field, value) => {
    setXpathData(prev => ({ ...prev, [field]: value }));
  };

  const loadWebsites = async () => {
    setIsLoading(true);
    try {
      chrome.runtime.sendMessage({
        action: "getSpiderList",
        token: token
      }, (response) => {
        if (response.success) {
          setWebsitesData(response.data);
        } else {
          showNotification('Failed to load websites: ' + response.error, 'error');
        }
        setIsLoading(false);
      });
    } catch (error) {
      showNotification('Failed to load websites: ' + error.message, 'error');
      setIsLoading(false);
    }
  };

  const handleAuth = (success) => {
    if (success) {
      chrome.storage.local.set({ isAuthenticated: true });
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    chrome.storage.local.set({ isAuthenticated: false, authData: null });
    setIsAuthenticated(false);
    setCurrentView('auth');
    setAuthForm('login');
    clearFields();
    showNotification('Logged out successfully', 'info');
  };

  const selectWebsite = (website) => {
    clearFields();
    setSelectedWebsite(website);
    setXpathData(prev => ({
      ...prev,
      'start-url': website.startUrl || '',
      'source-key': website.sourceKey || '',
      'company-name': website.companyName || '',
      'source-country': website.countryCode?.toLowerCase() || ''
    }));

    if (website.startUrl) {
      const url = website.startUrl.startsWith('http') ? website.startUrl : 'https://' + website.startUrl;
      window.open(url, 'noopener,noreferrer');
    }

    setTimeout(() => setCurrentView('xpath'), 300);
  };

  const generateSpider = async () => {
    const payload = {
      start_url: xpathData['start-url'],
      source_key: xpathData['source-key'],
      company_name: xpathData['company-name'],
      company_logo: xpathData['company-logo'],
      job_title_xpath: xpathData['job-title'],
      job_location_xpath: xpathData['job-location'],
      job_content_xpath: xpathData['job-content'],
      source_country: xpathData['source-country'],
      lang_code: xpathData['lang-code'],
      job_link: xpathData['job-link'],
      playwright: xpathData.playwright,
      playwright_selector: xpathData['playwright-selector']
    };

    const allEmpty = Object.values(payload).every(val => val === "" || val === false);
    if (allEmpty) {
      showNotification('Form is empty. Please fill in fields before generating.', 'error');
      return;
    }

    // Use the already loaded websitesData
    if (websitesData && websitesData.length > 0) {
      const exists = websitesData.some(spider =>
        spider.sourceKey?.toLowerCase() === payload.source_key?.toLowerCase()
      );

      if (exists) {
        showNotification(`Spider with source key "${payload.source_key}" already exists.`, 'warning');
        return;
      }
    }

    setIsLoading(true);
    chrome.runtime.sendMessage({
      action: "generateSpider",
      payload: payload
    }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setSpiderCode(response.data.spider_code || '# No spider code generated');
        setJsonConfig(typeof response.data.config === 'string' ? response.data.config : JSON.stringify(response.data.config, null, 2));
        setHasGeneratedCode(true);
        setCurrentView('editor');
        showNotification('Spider generated successfully', 'success');
      } else {
        showNotification('Error: ' + response.error, 'error');
      }
    });
  };

  const publishSpider = async () => {
    setIsLoading(true);
    try {
      if (!spiderCode || !jsonConfig) {
        throw new Error('Spider code or JSON configuration is missing');
      }

      let parsedConfig;
      try {
        parsedConfig = typeof jsonConfig === 'string' ? JSON.parse(jsonConfig) : jsonConfig;
      } catch (e) {
        throw new Error('Invalid JSON configuration: ' + e.message);
      }

      const payload = {
        CountryCode: xpathData['source-country'],
        CompanyName: xpathData['company-name'],
        SourceKey: xpathData['source-key'],
        ConfigJson: JSON.stringify(parsedConfig),
        SpiderCode: spiderCode,
        IsPublished: selectedWebsite?.isPublished || false,
        CurrentRunningStatus: 1,
        LastRunStarted: new Date().toISOString(),
        LastRunCompleted: new Date().toISOString(),
        LastRunTotalJobs: 0,
        LastRunSuccessful: true,
        HasNoJoblistingPage: false,
        IsJobportal: selectedWebsite?.isJobportal || false,
        Created: new Date().toISOString(),
        LastUpdated: new Date().toISOString(),
        CreatedBy: "extension",
        UpdatedBy: "extension",
        Type: "crawler",
        LastUploaded: new Date().toISOString()
      };

      chrome.runtime.sendMessage({
        action: "publishSpider",
        token: token,
        payload: payload
      }, (response) => {
        setIsLoading(false);
        if (response.success) {
          showNotification('Spider published successfully', 'success');
          clearFields();
          setCurrentView('websites');
          setShowPublishModal(false);
          loadWebsites();
        } else {
          showNotification('Publish error: ' + response.error, 'error');
        }
      });
    } catch (error) {
      setIsLoading(false);
      showNotification('Publish error: ' + error.message, 'error');
    }
  };

  const clearFields = () => {
    setXpathData({
      'start-url': '',
      'source-key': '',
      'company-name': '',
      'company-logo': '',
      'source-country': '',
      'lang-code': '',
      'job-link': '',
      'job-title': '',
      'job-location': '',
      'job-content': '',
      'playwright': false,
      'playwright-selector': ''
    });
    setSpiderCode('');
    setJsonConfig('');
    setHasGeneratedCode(false);
    setSelectedWebsite(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {currentView === 'auth' && (
        <AuthView
          authForm={authForm}
          setAuthForm={setAuthForm}
          onAuth={handleAuth}
          onGetStarted={() => {
            setCurrentView('websites');
            loadWebsites();
          }}
          showNotification={showNotification}
        />
      )}

      {currentView === 'websites' && (
        <WebsitesView
          websitesData={websitesData}
          currentFilter={currentFilter}
          setCurrentFilter={setCurrentFilter}
          selectedWebsite={selectedWebsite}
          isLoading={isLoading}
          onSelectWebsite={selectWebsite}
          onCustomSpider={() => {
            clearFields();
            setCurrentView('xpath');
          }}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'xpath' && (
        <XPathView
          xpathData={xpathData}
          setXpathData={setXpathData}
          hasGeneratedCode={hasGeneratedCode}
          isLoading={isLoading}
          onGenerate={generateSpider}
          onClear={clearFields}
          onBack={() => setCurrentView('websites')}
          onEditCode={() => setCurrentView('editor')}
          showNotification={showNotification}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'editor' && (
        <EditorView
          spiderCode={spiderCode}
          setSpiderCode={setSpiderCode}
          jsonConfig={jsonConfig}
          setJsonConfig={setJsonConfig}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isLoading={isLoading}
          showPublishModal={showPublishModal}
          setShowPublishModal={setShowPublishModal}
          onBack={() => setCurrentView('xpath')}
          onPublish={publishSpider}
          showNotification={showNotification}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;