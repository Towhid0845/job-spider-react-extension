if (!window.__xPathCopierInjected) {
  window.__xPathCopierInjected = true;
  let lastRightClickedElement = null;

  document.addEventListener('contextmenu', (event) => {
    lastRightClickedElement = event.target;
  }, true);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "copyXPath" && lastRightClickedElement) {
      let xpath = getXPath(lastRightClickedElement);
      if (request.field === "job-link" || request.field === "Job Link") {
        // Avoid duplicate if xpath already ends with /@href
        if (!xpath.endsWith("/@href")) {
          xpath += "/@href";
        }
      }

      if (request.field === "company-logo" || request.field === "Company Logo") {
        // Avoid duplicate if xpath already ends with /@href
        if (!xpath.endsWith("/@src")) {
          xpath += "/@src";
        }
      }

      if (request.field === "job-location" || request.field === "Job Location" || request.field === "job-title" || request.field === "Job Title") {
        // Avoid duplicate if xpath already ends with /@href
        if (!xpath.endsWith("/text()")) {
          xpath += "/text()";
        }
      }

      chrome.runtime.sendMessage({
        action: "updateXPathField",
        field: request.field,
        value: xpath
      });

      navigator.clipboard.writeText(xpath);
      showQuickNotification(`XPath copied for ${request.field}`);
      sendResponse({ success: true, xpath: xpath });
    } else {
      sendResponse({ success: false, error: "No element selected" });
    }
    return false;
  });

  function showQuickNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 10px 15px;
      border-radius: 6px;
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2000);
  }

  function getXPath(element) {
    if (element.className && typeof element.className === "string") {
      const className = element.className.trim();
      if (className) {
        return '//' + element.tagName.toLowerCase() +
          '[contains(@class, "' + className + '")]';
      }
    }
    if (element.id) {
      return '//*[@id="' + element.id + '"]';
    }
    if (element === document.body) {
      return '/html/body';
    }

    let ix = 0;
    let siblings = element.parentNode ? element.parentNode.childNodes : [];
    for (let i = 0; i < siblings.length; i++) {
      let sibling = siblings[i];
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
        if (sibling === element) {
          return getXPath(element.parentNode) + '/' +
            element.tagName.toLowerCase() + '[' + ix + ']';
        }
      }
    }
  }
}