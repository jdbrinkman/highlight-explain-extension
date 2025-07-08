// popup.js

document.addEventListener("DOMContentLoaded", () => {
    const usageEl = document.getElementById("usage");
    const languageSelect = document.getElementById("language");
    const fontSelect = document.getElementById("fontSize");
    const contrastRadios = document.querySelectorAll('input[name="contrast"]');
    const verificationSelect = document.getElementById("verificationMode");
    const tutorialBtn = document.getElementById("tutorialBtn");
  
    // Load all settings from storage
    chrome.storage.sync.get(["usageCount", "language", "fontSize", "contrast", "verificationMode"], (data) => {
      usageEl.textContent = `Used: ${data.usageCount || 0} / 10`;
      languageSelect.value = data.language || "en";
      fontSelect.value = data.fontSize || "medium";
      verificationSelect.value = data.verificationMode || "enhanced";
      
      // Set the checked radio button for contrast
      const contrast = data.contrast || "light";
      const radioToCheck = document.querySelector(`input[name="contrast"][value="${contrast}"]`);
      if (radioToCheck) {
          radioToCheck.checked = true;
      }
    });
  
    // Save language
    languageSelect.addEventListener("change", (e) => {
      chrome.storage.sync.set({ language: e.target.value });
    });
  
    // Save font size
    fontSelect.addEventListener("change", (e) => {
      chrome.storage.sync.set({ fontSize: e.target.value });
    });
  
    // Save contrast setting
    contrastRadios.forEach(radio => {
      radio.addEventListener("change", (e) => {
          if(e.target.checked) {
              chrome.storage.sync.set({ contrast: e.target.value });
          }
      });
    });

    // Save verification mode
    verificationSelect.addEventListener("change", (e) => {
      chrome.storage.sync.set({ verificationMode: e.target.value });
    });

    // Tutorial button handler
    tutorialBtn.addEventListener("click", () => {
        // Get the active tab and send message to start tutorial
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "startTutorial"});
            window.close(); // Close popup
        });
    });
  });