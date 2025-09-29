// Side Panel initialization
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => console.log('Side panel not available:', err));
  
  createContextMenus();
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "copy-xpath",
      title: "Get XPath for",
      contexts: ["all"]
    });

    const fields = ["Company Logo", "Job Link", "Job Title", "Job Location", "Job Content"];
    fields.forEach(field => {
      chrome.contextMenus.create({
        id: field.toLowerCase().replace(/\s+/g, "-"),
        parentId: "copy-xpath",
        title: field,
        contexts: ["all"]
      });
    });
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && /^https?:/.test(tab.url)) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    }).catch(err => console.warn("Already injected:", err));
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.storage.local.get(['isAuthenticated'], (result) => {
    if (!result.isAuthenticated) {
      openSidePanelForAuth();
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, {
      action: "copyXPath",
      field: info.menuItemId 
    });
  });
});

function openSidePanelForAuth() {
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
    .catch(err => console.log('Could not open side panel:', err));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "openSidePanel":
      (async () => {
        try {
          const window = await chrome.windows.getCurrent();
          await chrome.sidePanel.open({ windowId: window.id });
          sendResponse({ success: true });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
      
    case "updateXPathField":
      chrome.runtime.sendMessage({
        action: "updateXPathField",
        field: message.field,
        value: message.value 
      }).catch(err => console.log('Side panel not available:', err));
      sendResponse({ success: true });
      return false;
    
    case "getSpiderList":
      handleGetSpiderList(message, sendResponse);
      return true;

    case "generateSpider":
      handleGenerateSpider(message, sendResponse);
      return true;
      
    case "publishSpider":
      handlePublishSpider(message, sendResponse);
      return true;
  }
});

async function handlePublishSpider(message, sendResponse) {
  try {
    const { token, payload } = message;
    
    if (!token || !payload) {
      sendResponse({ success: false, error: "Missing required data" });
      return;
    }

    const response = await fetch("https://data.jobdesk.com/api/AddNewCrawler", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    sendResponse({ success: true, data: result });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleGenerateSpider(message, sendResponse) {
  try {
    const response = await fetch("https://spidergenerator.jobdesk.com/generate-spider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    sendResponse({ success: true, data: result });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleGetSpiderList(message, sendResponse) {
  try {
    const response = await fetch("https://data.jobdesk.com/api/GetSpiderListPlugin", {
      method: "GET",
      headers: { 'Authorization': `Bearer ${message.token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    sendResponse({ success: true, data: data });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
});