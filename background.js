chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "explain") {
      fetch("https://your-serverless-api.com/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.text,
          language: "en" // Or get from storage
        })
      })
        .then(res => res.json())
        .then(data => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showTooltip",
            summary: data.summary
          });
        });
    }
  });
  