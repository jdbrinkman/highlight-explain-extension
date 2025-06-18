// content.js

let explainBtn = null;
let tooltip = null;
let selectionRect = null;

// Function to remove any existing tooltip
function removeTooltip() {
  if (tooltip && tooltip.parentNode) {
    tooltip.parentNode.removeChild(tooltip);
    tooltip = null;
  }
}

document.addEventListener("selectionchange", () => {
  // Always remove the tooltip when the selection changes
  removeTooltip();
  
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 10) {
    if (!explainBtn) {
      explainBtn = document.createElement("button");
      explainBtn.innerText = "Explain";
      // Basic styling for the button
      explainBtn.style.position = "absolute";
      explainBtn.style.zIndex = "2147483646";
      explainBtn.style.background = "#007bff";
      explainBtn.style.color = "white";
      explainBtn.style.border = "none";
      explainBtn.style.padding = "5px 10px";
      explainBtn.style.borderRadius = "5px";
      explainBtn.style.cursor = "pointer";
      document.body.appendChild(explainBtn);

      // This is the event listener that contains the fix.
      explainBtn.addEventListener("click", () => {
        // ** THE FIX IS HERE **
        // Instead of using the old 'selectedText' variable, we get the
        // current selection at the exact moment the button is clicked.
        const currentSelection = window.getSelection().toString().trim();
        if (currentSelection) {
            chrome.runtime.sendMessage({ action: "explain", text: currentSelection });
        }
      });
    }

    const range = selection.getRangeAt(0);
    selectionRect = range.getBoundingClientRect();
    explainBtn.style.display = "block";
    explainBtn.style.top = `${window.scrollY + selectionRect.bottom + 5}px`;
    explainBtn.style.left = `${window.scrollX + selectionRect.left}px`;
  } else if (explainBtn) {
    explainBtn.style.display = "none";
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "showTooltip") {
    removeTooltip(); // Remove old tooltip before showing a new one

    tooltip = document.createElement("div");
    tooltip.innerText = msg.summary;
    
    // Add classes for styling from content.css
    tooltip.classList.add("explanation-tooltip");

    // Get settings from storage and apply them
    chrome.storage.sync.get(["fontSize", "contrast"], (data) => {
        // Apply font size
        const fontSize = data.fontSize || "medium";
        tooltip.style.fontSize = fontSize;

        // Apply contrast theme
        const contrast = data.contrast || "light";
        tooltip.classList.add(`theme-${contrast}`);
    });

    // Position the tooltip below the selection
    if (selectionRect) {
        tooltip.style.top = `${window.scrollY + selectionRect.bottom + 40}px`; // Below button
        tooltip.style.left = `${window.scrollX + selectionRect.left}px`;
    }

    // Add a close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;"; // "X" symbol
    closeBtn.classList.add("explanation-tooltip-close-btn");
    closeBtn.onclick = removeTooltip; // Close button removes tooltip
    tooltip.appendChild(closeBtn);

    document.body.appendChild(tooltip);
  }
});

// Close tooltip if the user clicks anywhere else on the page
document.addEventListener('click', (event) => {
    if (tooltip && !tooltip.contains(event.target) && event.target !== explainBtn) {
        removeTooltip();
    }
});