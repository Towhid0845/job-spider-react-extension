if (!window.__xPathCopierInjected) {
  window.__xPathCopierInjected = true;
  let lastRightClickedElement = null;

  document.addEventListener('contextmenu', (event) => {
    lastRightClickedElement = event.target;
  }, true);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "copyXPath" && lastRightClickedElement) {

      let xpath = "";

      if (request.field === "job-link" || request.field === "Job Link") {
        xpath = getJobLinkXPath(lastRightClickedElement);
        // Avoid duplicate if xpath already ends with /@href
        if (!xpath.endsWith("/@href")) {
          xpath += "/@href";
        }
      } else if (request.field === "company-logo" || request.field === "Company Logo") {
        xpath = getCompanyLogoXPath(lastRightClickedElement);
        // Avoid duplicate if xpath already ends with /@src
        if (!xpath.endsWith("/@src") && !xpath.endsWith("found")) {
          xpath += "/@src";
        }
      } else if (request.field === "job-location" || request.field === "Job Location" || request.field === "job-title" || request.field === "Job Title") {
        xpath = getXPath(lastRightClickedElement);
        // Avoid duplicate if xpath already ends with /text()
        if (!xpath.endsWith("/text()")) {
          xpath += "/text()";
        }
      } else if (request.field === "job-content" || request.field === "Job Content") {
        // xpath = getJobContentXPath(lastRightClickedElement);
        let container = getJobContentContainer(lastRightClickedElement);
        xpath = getXPath(container);
      } else {
        xpath = getXPath(lastRightClickedElement);
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

  // ✅ Helper: find nearest <a> parent
  function getJobLinkXPath(element) {
    if (!element) return "";

    // Step 1: Find the closest visible and meaningful <a> tag
    const linkAncestor = findValidAnchor(element);
    if (linkAncestor) {
      return getXPath(linkAncestor);
    }

    // Step 2: Otherwise, build XPath normally
    return getXPath(element);
  }

  // ✅ Helper: find nearest <img> (likely company logo)
  function getCompanyLogoXPath(element) {
    // If element itself is an <img>
    if (element.tagName && element.tagName.toLowerCase() === 'img') {
      return getXPath(element);
    }

    // Try to find the closest <svg>
    const svgTag = findClosest(element, "svg");
    if (svgTag) {
      console.log("SVG found");
      // return getXPath(svgTag);
      return "No image src available — SVG found";
    }

    // If inside header/nav/brand section, find the first <img>
    const headerZone = element.closest('header, nav, [class*="header"], [class*="navbar"], [class*="brand"], [id*="header"], [id*="nav"]');
    if (headerZone) {
      const img = headerZone.querySelector('img');
      if (img) return getXPath(img);
    }

    // Otherwise, find the nearest <img> ancestor or sibling
    const nearbyImg = element.closest('img') || element.parentElement?.querySelector('img');
    if (nearbyImg) return getXPath(nearbyImg);

    return 'No img tag found';
  }

  // ✅ Helper: find nearest job content parent
  // function getJobContentXPath(element) {
  //   if (!element) return "";

  //   // Walk up until we hit something that looks like a content wrapper
  //   let current = element;

  //   while (current && current !== document.body) {
  //     const className = (current.className || "").toLowerCase();
  //     const id = (current.id || "").toLowerCase();

  //     // 1️⃣ Check for common keywords used in job content wrappers
  //     if (
  //       /description|content|content-box|jobbody|job-description|details|posting|editor|wysiwyg|body/i.test(
  //         className + " " + id
  //       )
  //     ) {
  //       return getXPath(current);
  //     }

  //     // 2️⃣ Stop early if we go too high (like <main> or <body>)
  //     if (["main", "body", "html"].includes(current.tagName.toLowerCase())) {
  //       break;
  //     }

  //     current = current.parentElement;
  //   }

  //   // If not found, fallback to nearest <div> parent
  //   const fallbackDiv = element.closest("div");
  //   if (fallbackDiv) return getXPath(fallbackDiv);

  //   return getXPath(element);
  // }
  function getJobContentContainer(element) {
    const BLOCK_TAGS = ['P', 'UL', 'OL', 'H1', 'H2', 'H3', 'DIV', 'COL', 'SPAN'];
    const KEYWORDS = ['content', 'description', 'details', 'body', 'editor', 'wysiwyg', 'jobbody', 'jobdescription', 'job-description', 'posting', 'layout'];

    let current = element;

    while (current && current !== document.body) {
      // 1️⃣ Check for keyword hint in class or id
      const classId = (current.className || "") + " " + (current.id || "");
      if (KEYWORDS.some(k => classId.toLowerCase().includes(k))) {
        return current; // found a likely content container
      }

      // 2️⃣ Check sibling count and type
      const siblings = Array.from(current.parentNode?.children || []);
      const blockSiblings = siblings.filter(s => BLOCK_TAGS.includes(s.tagName));

      if (blockSiblings.length >= 2) {
        return current.parentNode; // multiple structured siblings — go one level up
      }

      // 3️⃣ Check if this element itself has enough block children
      const blockChildren = Array.from(current.children).filter(c =>
        BLOCK_TAGS.includes(c.tagName)
      );
      if (blockChildren.length >= 3) {
        return current; // rich structured container
      }

      // 4️⃣ Aggressive fallback: if it's just a <div> go one step up
      if (current.tagName.toLowerCase() === 'div') {
        return current.parentNode || current;
      }

      // keep climbing
      current = current.parentNode;
    }

    return element; // fallback
  }

  /** Find the closest <a> ancestor that is visible and not empty */
  function findValidAnchor(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName && current.tagName.toLowerCase() === "a") {
        if (isVisible(current) && hasMeaningfulContent(current)) {
          return current;
        }
      }
      current = current.parentElement;
    }
    return null;
  }

  /** Check if element is visible */
  function isVisible(el) {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /** Check if <a> tag has real text or visible children */
  function hasMeaningfulContent(a) {
    const text = a.textContent.trim();
    if (text.length > 3) return true; // has readable text

    // Check if it contains visible nested elements
    const visibleChildren = Array.from(a.querySelectorAll("*")).filter(isVisible);
    return visibleChildren.some(
      (child) =>
        child.tagName.toLowerCase() === "div" ||
        child.tagName.toLowerCase() === "span" ||
        child.tagName.toLowerCase() === "h4" ||
        child.tagName.toLowerCase() === "h5"
    );
  }

  /** Find closest matching element by tag name */
  function findClosest(element, tagName) {
    let current = element;
    tagName = tagName.toLowerCase();
    while (current && current !== document.body) {
      if (current.tagName && current.tagName.toLowerCase() === tagName) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

}