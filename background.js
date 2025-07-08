// background.js - Enhanced with verification features

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "explain") {
      // Get language and usageCount from storage
      chrome.storage.sync.get(["language", "usageCount", "verificationMode"], (data) => {
        const lang = data.language || "en"; // Default to 'en' if not set
        const currentUsage = data.usageCount || 0;
        const verificationMode = data.verificationMode || "basic"; // basic, enhanced, or scam-alert
  
        // Optional: Check if user is within usage limits
        if (currentUsage >= 10) {
          console.log("Usage limit reached");
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTooltip",
            summary: "You have reached your free limit of 10 explanations."
          });
          return; // Stop execution
        }
  
        // Enhanced prompt based on verification mode
        let enhancedPrompt = getEnhancedPrompt(message.text, lang, verificationMode, sender.tab.url);
  
        const apiUrl = "https://highlight-explain-extension-bkvt.vercel.app/api/explain";
  
        fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: enhancedPrompt,
            language: lang,
          }),
        })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.summary) {
              // Increment usage count only on successful explanation
              chrome.storage.sync.set({ usageCount: currentUsage + 1 });
              
              // Parse the response for verification alerts
              const parsedResponse = parseVerificationResponse(data.summary, verificationMode);
              
              chrome.tabs.sendMessage(sender.tab.id, {
                  action: "showTooltip",
                  summary: parsedResponse.content,
                  alertType: parsedResponse.alertType,
                  isVerification: parsedResponse.isVerification
              });
          } else {
              throw new Error("Received empty summary from API.");
          }
        })
        .catch(error => {
          console.error("Failed to fetch explanation:", error);
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTooltip",
            summary: "Sorry, an error occurred while getting the explanation."
          });
        });
      });
      return true;
    }

    // New: Handle verification-only requests
    if (message.action === "verify") {
      chrome.storage.sync.get(["language", "usageCount"], (data) => {
        const lang = data.language || "en";
        const currentUsage = data.usageCount || 0;
  
        if (currentUsage >= 10) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTooltip",
            summary: "You have reached your free limit of 10 verifications."
          });
          return;
        }

        const verificationPrompt = getVerificationOnlyPrompt(message.text, lang, sender.tab.url);
        const apiUrl = "https://highlight-explain-extension-bkvt.vercel.app/api/explain";

        fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: verificationPrompt,
            language: lang,
          }),
        })
        .then(res => res.json())
        .then(data => {
          if (data.summary) {
            chrome.storage.sync.set({ usageCount: currentUsage + 1 });
            
            const parsedResponse = parseVerificationResponse(data.summary, "enhanced");
            
            chrome.tabs.sendMessage(sender.tab.id, {
              action: "showTooltip",
              summary: parsedResponse.content,
              alertType: parsedResponse.alertType,
              isVerification: true
            });
          }
        })
        .catch(error => {
          console.error("Verification failed:", error);
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTooltip",
            summary: "Sorry, verification is currently unavailable."
          });
        });
      });
      return true;
    }
  });

// Enhanced prompt generation based on verification mode
function getEnhancedPrompt(text, language, verificationMode, pageUrl) {
  const basePrompt = `Please explain the following text at a 9th-grade reading level in ${language === "es" ? "Spanish" : "English"}:\n\n"${text}"`;
  
  const domain = pageUrl ? new URL(pageUrl).hostname : "unknown website";
  
  switch (verificationMode) {
    case "enhanced":
      return `${basePrompt}

IMPORTANT: Also include verification information:
1. Check if this information appears to be factually accurate
2. Note any red flags for misinformation 
3. If this relates to health, finance, or safety - add appropriate warnings
4. Rate the credibility as: HIGH, MEDIUM, or LOW
5. If from ${domain}, note if this is a trustworthy source

Format your response as:
EXPLANATION: [your explanation]
CREDIBILITY: [HIGH/MEDIUM/LOW with brief reason]
WARNINGS: [any important warnings for seniors]`;

    case "scam-alert":
      return `${basePrompt}

CRITICAL: Analyze this text for potential scams targeting seniors:
1. Look for urgent language, pressure tactics, requests for money/personal info
2. Check for common senior scam patterns (fake tech support, Medicare scams, etc.)
3. Note suspicious claims about prizes, refunds, or "limited time" offers
4. Identify if this appears to be from ${domain} legitimately

Format your response as:
EXPLANATION: [your explanation]
SCAM RISK: [NONE/LOW/MEDIUM/HIGH with specific reasons]
RED FLAGS: [list any warning signs]
ADVICE: [what seniors should do]`;

    default: // basic
      return `${basePrompt}

Also briefly mention if this information seems reliable and if there are any important things to be careful about.`;
  }
}

// Verification-only prompt for dedicated fact-checking
function getVerificationOnlyPrompt(text, language, pageUrl) {
  const domain = pageUrl ? new URL(pageUrl).hostname : "unknown website";
  
  return `Please fact-check and verify this text for accuracy in ${language === "es" ? "Spanish" : "English"}:

"${text}"

Source: ${domain}

Provide:
1. ACCURACY: Is this information factually correct?
2. SOURCE RELIABILITY: Is ${domain} a trustworthy source?
3. WARNINGS: Any concerns for seniors (scams, misinformation, health/financial risks)?
4. VERIFICATION: Can this be independently verified?
5. ADVICE: Should seniors trust this information?

Be especially alert for:
- Medical misinformation
- Financial scams
- Fake tech support
- Prize/sweepstakes scams
- Social Security/Medicare scams
- Romance scams
- Investment fraud

Keep explanations simple and clear for seniors.`;
}

// Parse AI response to extract verification information
function parseVerificationResponse(response, verificationMode) {
  let alertType = "info"; // default: info, warning, danger
  let isVerification = verificationMode !== "basic";
  
  const lowerResponse = response.toLowerCase();
  
  // Check for danger signals
  if (lowerResponse.includes("scam risk: high") || 
      lowerResponse.includes("credibility: low") ||
      lowerResponse.includes("red flags:") ||
      lowerResponse.includes("warning:") ||
      lowerResponse.includes("be careful") ||
      lowerResponse.includes("suspicious") ||
      lowerResponse.includes("fraud")) {
    alertType = "danger";
  }
  // Check for warning signals  
  else if (lowerResponse.includes("scam risk: medium") ||
           lowerResponse.includes("credibility: medium") ||
           lowerResponse.includes("caution") ||
           lowerResponse.includes("verify") ||
           lowerResponse.includes("double-check")) {
    alertType = "warning";
  }
  // Check for positive signals
  else if (lowerResponse.includes("credibility: high") ||
           lowerResponse.includes("scam risk: none") ||
           lowerResponse.includes("reliable") ||
           lowerResponse.includes("trustworthy")) {
    alertType = "success";
  }

  return {
    content: response,
    alertType: alertType,
    isVerification: isVerification
  };
}
  
// Set default values on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    usageCount: 0,
    language: "en",
    fontSize: "medium",
    contrast: "light",
    verificationMode: "enhanced" // Default to enhanced verification for seniors
  });
});