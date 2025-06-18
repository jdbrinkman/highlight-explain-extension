document.addEventListener("DOMContentLoaded", () => {
    const usageEl = document.getElementById("usage");
  
    chrome.storage.sync.get(["usageCount", "language", "fontSize"], (data) => {
      usageEl.textContent = `Used: ${data.usageCount || 0} / 10`;
      document.getElementById("language").value = data.language || "en";
      document.getElementById("fontSize").value = data.fontSize || "medium";
    });
  
    document.getElementById("language").addEventListener("change", (e) => {
      chrome.storage.sync.set({ language: e.target.value });
    });
  
    document.getElementById("fontSize").addEventListener("change", (e) => {
      chrome.storage.sync.set({ fontSize: e.target.value });
    });
  });
  