// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "explain") {
      // Get language and usageCount from storage
      chrome.storage.sync.get(["language", "usageCount"], (data) => {
        const lang = data.language || "en"; // Default to 'en' if not set
        const currentUsage = data.usageCount || 0;
  
        // Optional: Check if user is within usage limits
        // This is a basic check. For a real product, you'd want more secure validation.
        if (currentUsage >= 10) {
          console.log("Usage limit reached");
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTooltip",
            summary: "You have reached your free limit of 10 explanations."
          });
          return; // Stop execution
        }
  
        // Use your actual deployed Vercel URL with the correct API path
        const apiUrl = "https://highlight-explain-extension.vercel.app/api/explain";
  
        fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: message.text,
            language: lang,
          }),
        })
        .then(res => {
          if (!res.ok) { // Better error handling
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.summary) {
              // Increment usage count only on successful explanation
              chrome.storage.sync.set({ usageCount: currentUsage + 1 });
              
              chrome.tabs.sendMessage(sender.tab.id, {
                  action: "showTooltip",
                  summary: data.summary,
              });
          } else {
              throw new Error("Received empty summary from API.");
          }
        })
        .catch(error => {
          console.error("Failed to fetch explanation:", error);
          // Inform the user of the error
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTooltip",
            summary: "Sorry, an error occurred while getting the explanation."
          });
        });
      });
      // Return true to indicate you wish to send a response asynchronously
      return true;
    }
  });
  
  // Set default values on installation
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
      usageCount: 0,
      language: "en",
      fontSize: "medium",
      contrast: "light"
    });
  });