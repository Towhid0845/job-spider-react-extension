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

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   chrome.storage.local.get(['isAuthenticated'], (result) => {
//     if (!result.isAuthenticated) {
//       openSidePanelForAuth();
//       return;
//     }

//     chrome.tabs.sendMessage(tab.id, {
//       action: "copyXPath",
//       field: info.menuItemId
//     });
//   });
// });

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { isAuthenticated } = await chrome.storage.local.get(['isAuthenticated']);

  if (!isAuthenticated) {
    openSidePanelForAuth();
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: "copyXPath",
      field: info.menuItemId
    });
  } catch (err) {
    // If no content script exists, inject it first
    console.warn("Content script not found, injecting again...", err);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      // Retry sending message
      await chrome.tabs.sendMessage(tab.id, {
        action: "copyXPath",
        field: info.menuItemId
      });
    } catch (e2) {
      console.error("Failed to inject content script:", e2);
    }
  }
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
      sendResponse({ success: true });
      chrome.runtime.sendMessage({
        action: "updateXPathField",
        field: message.field,
        value: message.value
      }).catch(err => console.warn('Reload to send message to background:', err));
      return false;

    case "authorize_token":
      handleAuthorization(message, sendResponse);
      return true;

    case "getSpiderList":
      handleGetSpiderList(message, sendResponse);
      return true;

    case "generateSpider":
      handleGenerateSpider(message, sendResponse);
      return true;

    case "publishSpider":
      handlePublishSpider(message, sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

async function handleAuthorization(message, sendResponse) {
  try {
    const timeout = 60000;
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), timeout);

    const {
      sas_base_url,
      email,
      password,
      f2aKey = null
    } = message;
    // console.log("Authorization request received:", message);

    let geoInfo = null;
    try {
      const geoResp = await fetch("https://sas.jobdesk.com/api/HomeApp/jdp/mepi/false", {
        method: "GET",
        headers: {
          "token": "52158475DFDC4D21BE6565F56CB3FA547352B8E42EDE48188F435866B254D0E9"
        }
      });
      geoInfo = await geoResp.json();
      console.log("Geo info fetched:", geoInfo);
    } catch (geoErr) {
      console.warn("Geo info fetch failed:", geoErr);
      geoInfo = {}; // fallback empty
    }

    const requestBody = {
      email,
      password,
      LastLoginRegionCode: geoInfo?.IpObject?.continentCode || "",
      LastLoginIP: geoInfo?.IpObject?.query || "",
      LastLoginCountryCode: geoInfo?.IpObject?.countryCode || ""
    };

    if (f2aKey) {
      requestBody.isMobile = false;
      requestBody.F2aKey = f2aKey;
      requestBody.F2a = true;
    }

    const performLogin = (baseUrl, bodyData) => {
      return fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
        signal: abortController.signal
      }).then(resp => resp.json());
    };

    console.log("Login request:", requestBody);
    const json = await performLogin(sas_base_url, requestBody);
    console.log("Login response:", json);

    // CASE 1: External login
    if (json.IsExternal === true && json.Domain && json.Email && json.Password) {
      console.log("External login detected. Retrying with domain:", json);

      try {
        const externalResponse = await performLogin(json.Domain + '/api', {
          email,
          password,
          LastLoginRegionCode: geoInfo?.IpObject?.continentCode || "",
          LastLoginIP: geoInfo?.IpObject?.query || "",
          LastLoginCountryCode: geoInfo?.IpObject?.countryCode || ""
        });

        if (externalResponse) {
          // Store auth data
          await chrome.storage.local.set({
            isAuthenticated: true,
            authData: {
              email: json.Email,
              token: externalResponse,
              domain: json.Domain,
              isExternal: true
            }
          });

          sendResponse({
            event: 'authorization_complete',
            authorized: true,
            data: {
              email: json.Email,
              token: externalResponse,
              domain: json.Domain,
              isExternal: true
            }
          });
        } else {
          sendResponse({
            event: 'authorization_incomplete',
            authorized: false,
            data: false,
            error: externalResponse.message || 'External login failed'
          });
        }
        return;
      } catch (exErr) {
        sendResponse({
          event: 'authorization_incomplete',
          authorized: false,
          data: false,
          error: 'External login error: ' + exErr.toString()
        });
        return;
      }
    }

    // CASE 2: 2FA required
    if (json.fa2 === true && !f2aKey) {
      sendResponse({
        event: '2fa_required',
        authorized: false,
        requires2FA: true
      });
      return;
    }

    // CASE 3: Normal login success
    if (json) {
      const token = json.token || json;

      // Store auth data
      await chrome.storage.local.set({
        isAuthenticated: true,
        authData: {
          email,
          token,
          isExternal: false
        }
      });

      sendResponse({
        event: 'authorization_complete',
        authorized: true,
        data: {
          email,
          token,
          isExternal: false
        }
      });
    }

    // CASE 4: Login failed
    else {
      sendResponse({
        event: 'authorization_incomplete',
        authorized: false,
        data: false,
        error: json.message || 'Invalid login credentials'
      });
    }
  } catch (error) {
    sendResponse({
      event: 'authorization_incomplete',
      authorized: false,
      error: error.toString()
    });
  }
}

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
    console.log("Fetched spider list:", data[0].sourceKey);
    sendResponse({ success: true, data: data });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
});