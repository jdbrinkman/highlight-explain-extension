let explainBtn = null;
let verifyBtn = null;
let currentSelection = '';
let tooltip = null;

// Constants for positioning offsets
const EXPLAIN_BUTTON_OFFSET_Y = 5; // Pixels below the selection for the explain button
const VERIFY_BUTTON_OFFSET_Y = 5;  // Pixels below the explain button
const TOOLTIP_OFFSET_Y = 10;      // Pixels below the selection for the explanation tooltip

// Function to remove the existing tooltip
function removeTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

// Function to remove buttons
function removeButtons() {
    if (explainBtn) {
        explainBtn.remove();
        explainBtn = null;
    }
    if (verifyBtn) {
        verifyBtn.remove();
        verifyBtn = null;
    }
}

// Function to create and show both Explain and Verify buttons
function showActionButtons(selection) {
    // Remove any existing tooltip first
    removeTooltip();

    if (!selection || selection.toString().trim().length === 0) {
        removeButtons();
        return;
    }

    currentSelection = selection.toString().trim();
    const selectionRect = selection.getRangeAt(0).getBoundingClientRect();

    // Create Explain button
    if (!explainBtn) {
        explainBtn = document.createElement('button');
        explainBtn.textContent = '🔍 Explain';
        explainBtn.id = 'explainHighlightBtn';
        explainBtn.classList.add('explain-button');

        explainBtn.addEventListener('click', () => {
            if (!explainBtn.disabled) {
                removeButtons();
                removeTooltip();
                if (currentSelection) {
                    showLoadingTooltip("Getting explanation...");
                    chrome.runtime.sendMessage({ 
                        action: "explain", 
                        text: currentSelection 
                    });
                }
            }
        });
        document.body.appendChild(explainBtn);
    }

    // Create Verify button
    if (!verifyBtn) {
        verifyBtn = document.createElement('button');
        verifyBtn.textContent = '✓ Verify';
        verifyBtn.id = 'verifyHighlightBtn';
        verifyBtn.classList.add('verify-button');

        verifyBtn.addEventListener('click', () => {
            if (!verifyBtn.disabled) {
                removeButtons();
                removeTooltip();
                if (currentSelection) {
                    showLoadingTooltip("Checking facts...");
                    chrome.runtime.sendMessage({ 
                        action: "verify", 
                        text: currentSelection 
                    });
                }
            }
        });
        document.body.appendChild(verifyBtn);
    }

    // Position the buttons
    explainBtn.style.top = `${window.scrollY + selectionRect.bottom + EXPLAIN_BUTTON_OFFSET_Y}px`;
    explainBtn.style.left = `${window.scrollX + selectionRect.left}px`;
    explainBtn.style.display = 'block';

    verifyBtn.style.top = `${window.scrollY + selectionRect.bottom + EXPLAIN_BUTTON_OFFSET_Y}px`;
    verifyBtn.style.left = `${window.scrollX + selectionRect.left + 120}px`; // Next to explain button
    verifyBtn.style.display = 'block';

    // Handle short selections
    const isShortSelection = currentSelection.length <= 10;
    
    [explainBtn, verifyBtn].forEach(btn => {
        if (isShortSelection) {
            btn.disabled = true;
            btn.classList.add('disabled');
            btn.setAttribute('title', 'Please select more than 10 characters.');
        } else {
            btn.disabled = false;
            btn.classList.remove('disabled');
            btn.removeAttribute('title');
        }
    });
}

function showLoadingTooltip(message = "Loading...") {
    removeTooltip();

    tooltip = document.createElement('div');
    tooltip.className = 'highlight-explain-tooltip loading';
    tooltip.innerHTML = `<div class="loading-spinner"></div> ${message}`;

    document.body.appendChild(tooltip);

    // Position the tooltip at the center of the viewport for loading message
    tooltip.style.top = `${window.scrollY + window.innerHeight / 2 - tooltip.offsetHeight / 2}px`;
    tooltip.style.left = `${window.scrollX + window.innerWidth / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.display = 'block';

    // Apply user settings
    chrome.storage.sync.get(['fontSize', 'contrast'], (data) => {
        if (data.fontSize) {
            tooltip.classList.add(`font-${data.fontSize}`);
        }
        if (data.contrast === 'dark') {
            tooltip.classList.add('dark-contrast');
            tooltip.classList.remove('light-contrast');
        } else {
            tooltip.classList.add('light-contrast');
            tooltip.classList.remove('dark-contrast');
        }
    });
}

function showTooltip(text, alertType = "info", isVerification = false) {
    removeTooltip();

    tooltip = document.createElement('div');
    tooltip.className = `highlight-explain-tooltip ${alertType}`;
    
    // Add verification styling if this is a verification result
    if (isVerification) {
        tooltip.classList.add('verification-result');
    }

    // Create alert icon based on type
    let alertIcon = '';
    let alertClass = '';
    
    switch(alertType) {
        case 'danger':
            alertIcon = '⚠️';
            alertClass = 'alert-danger';
            break;
        case 'warning':
            alertIcon = '⚡';
            alertClass = 'alert-warning';
            break;
        case 'success':
            alertIcon = '✅';
            alertClass = 'alert-success';
            break;
        default:
            alertIcon = isVerification ? '🔍' : 'ℹ️';
            alertClass = 'alert-info';
    }

    tooltip.innerHTML = `
        <div class="tooltip-header ${alertClass}">
            <span class="alert-icon">${alertIcon}</span>
            <span class="alert-title">${isVerification ? 'Verification Result' : 'Explanation'}</span>
            <button class="tooltip-close-button" title="Close">&times;</button>
        </div>
        <div class="tooltip-content">${text}</div>
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
        tooltip.style.top = `${window.scrollY + 20}px`;
        tooltip.style.left = `${window.scrollX + 20}px`;
    } else {
        const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
        tooltip.style.top = `${window.scrollY + selectionRect.bottom + TOOLTIP_OFFSET_Y}px`;
        tooltip.style.left = `${window.scrollX + selectionRect.left}px`;
    }

    tooltip.style.display = 'block';

    // Add close button event
    const closeButton = tooltip.querySelector('.tooltip-close-button');
    if (closeButton) {
        closeButton.addEventListener('click', removeTooltip);
    }

    // Apply user settings
    chrome.storage.sync.get(['fontSize', 'contrast'], (data) => {
        if (data.fontSize) {
            tooltip.classList.add(`font-${data.fontSize}`);
        }
        if (data.contrast === 'dark') {
            tooltip.classList.add('dark-contrast');
            tooltip.classList.remove('light-contrast');
        } else {
            tooltip.classList.add('light-contrast');
            tooltip.classList.remove('dark-contrast');
        }
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showTooltip") {
        showTooltip(message.summary, message.alertType, message.isVerification);
    }
});

// Listen for selection changes to show/hide buttons
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    showActionButtons(selection);
});

// Listen for clicks outside to close tooltip and buttons
document.addEventListener('click', (event) => {
    if (tooltip && !tooltip.contains(event.target) && 
        event.target !== explainBtn && event.target !== verifyBtn) {
        removeTooltip();
    }
});

// Remove buttons when clicking elsewhere (but not on selected text)
document.addEventListener('click', (event) => {
    if ((explainBtn && !explainBtn.contains(event.target)) &&
        (verifyBtn && !verifyBtn.contains(event.target))) {
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection || selection.toString().trim().length === 0) {
                removeButtons();
            }
        }, 100);
    }
});