let explainBtn = null;
let currentSelection = '';
let tooltip = null;

// Constants for positioning offsets
const EXPLAIN_BUTTON_OFFSET_Y = 5; // Pixels below the selection for the explain button
const TOOLTIP_OFFSET_Y = 10;      // Pixels below the selection for the explanation tooltip

// Function to remove the existing tooltip
function removeTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

// Function to create and show the Explain button
function showExplainButton(selection) {
    // Remove any existing tooltip first
    removeTooltip();

    if (!selection || selection.toString().trim().length === 0) {
        if (explainBtn) {
            explainBtn.remove();
            explainBtn = null;
        }
        return;
    }

    currentSelection = selection.toString().trim();

    if (!explainBtn) {
        explainBtn = document.createElement('button');
        explainBtn.textContent = 'Explain';
        explainBtn.id = 'explainHighlightBtn';
        
        // Add a class for styling
        explainBtn.classList.add('explain-button'); 

        explainBtn.addEventListener('click', () => {
            // Only proceed if button is not disabled
            if (!explainBtn.disabled) {
                removeTooltip(); // Remove button and tooltip once clicked
                if (currentSelection) {
                    showLoadingTooltip(); // Show loading message
                    chrome.runtime.sendMessage({ type: 'explainText', text: currentSelection }, (response) => {
                        removeTooltip(); // Remove loading message
                        if (response && response.explanation) {
                            showTooltip(response.explanation);
                        } else if (response && response.error) {
                            showTooltip(`Error: ${response.error}`);
                        } else {
                            showTooltip('Failed to get explanation.');
                        }
                    });
                }
            }
        });
        document.body.appendChild(explainBtn);
    }

    const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
    
    // Position the button slightly below the selection using the constant
    explainBtn.style.top = `${window.scrollY + selectionRect.bottom + EXPLAIN_BUTTON_OFFSET_Y}px`;
    explainBtn.style.left = `${window.scrollX + selectionRect.left}px`;
    explainBtn.style.display = 'block';

    // --- NEW LOGIC FOR SHORT SELECTIONS ---
    if (currentSelection.length <= 10) {
        explainBtn.disabled = true;
        explainBtn.classList.add('disabled'); // Add a class for disabled styling
        explainBtn.setAttribute('title', 'Please select more than 10 characters to explain.');
    } else {
        explainBtn.disabled = false;
        explainBtn.classList.remove('disabled'); // Remove disabled styling
        explainBtn.removeAttribute('title');
    }
    // --- END NEW LOGIC ---
}

function showLoadingTooltip() {
    removeTooltip(); // Ensure no other tooltip is present

    tooltip = document.createElement('div');
    tooltip.className = 'highlight-explain-tooltip'; // Use the main tooltip class
    tooltip.id = 'loadingTooltip';
    tooltip.innerHTML = '<div class="loading-spinner"></div> Loading explanation...'; // Add a loading spinner/indicator

    document.body.appendChild(tooltip);

    // Position the tooltip at the center of the viewport for loading message
    tooltip.style.top = `${window.scrollY + window.innerHeight / 2 - tooltip.offsetHeight / 2}px`;
    tooltip.style.left = `${window.scrollX + window.innerWidth / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.display = 'block';

    // Fetch user settings to apply to the loading tooltip
    chrome.storage.sync.get(['fontSize', 'contrastMode'], (data) => {
        if (data.fontSize) {
            tooltip.style.fontSize = data.fontSize;
        }
        if (data.contrastMode === 'dark') {
            tooltip.classList.add('dark-contrast');
            tooltip.classList.remove('light-contrast');
        } else {
            tooltip.classList.add('light-contrast');
            tooltip.classList.remove('dark-contrast');
        }
    });
}

function showTooltip(text) {
    removeTooltip(); // Remove any existing tooltips (including loading)

    tooltip = document.createElement('div');
    tooltip.className = 'highlight-explain-tooltip';
    tooltip.innerHTML = `
        <span class="tooltip-content">${text}</span>
        <button class="tooltip-close-button">&times;</button>
    `;
    document.body.appendChild(tooltip);

    // Get position relative to selection
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
        // If no selection, position in a default spot or hide
        tooltip.style.top = `${window.scrollY + 20}px`; // This default value could also be a constant
        tooltip.style.left = `${window.scrollX + 20}px`; // This default value could also be a constant
    } else {
        const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
        // Position the tooltip slightly below the selection and align left using the constant
        tooltip.style.top = `${window.scrollY + selectionRect.bottom + TOOLTIP_OFFSET_Y}px`;
        tooltip.style.left = `${window.scrollX + selectionRect.left}px`;
    }

    tooltip.style.display = 'block';

    // Add event listener for the close button
    const closeButton = tooltip.querySelector('.tooltip-close-button');
    if (closeButton) {
        closeButton.addEventListener('click', removeTooltip);
    }

    // Fetch user settings and apply them
    chrome.storage.sync.get(['fontSize', 'contrastMode'], (data) => {
        if (data.fontSize) {
            tooltip.style.fontSize = data.fontSize;
        }
        if (data.contrastMode === 'dark') {
            tooltip.classList.add('dark-contrast');
            tooltip.classList.remove('light-contrast');
        } else {
            tooltip.classList.add('light-contrast');
            tooltip.classList.remove('dark-contrast');
        }
    });
}

// Listen for selection changes to show/hide the Explain button
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    showExplainButton(selection);
});

// Listen for clicks outside the tooltip to close it
document.addEventListener('click', (event) => {
    if (tooltip && !tooltip.contains(event.target) && event.target !== explainBtn) {
        removeTooltip();
    }
});