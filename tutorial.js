// tutorial.js - First-time user guidance for seniors

let tutorialOverlay = null;
let currentTutorialStep = 0;
let tutorialActive = false;

// Tutorial steps with senior-friendly instructions
const tutorialSteps = [
    {
        title: "Welcome to Highlight & Explain! 👋",
        content: "This tool helps you understand difficult text on any website. Let me show you how to use it in 3 simple steps.",
        position: "center",
        showSkip: true
    },
    {
        title: "Step 1: Select Text 📝",
        content: "Use your mouse to highlight any text you want explained. Try highlighting this sentence right now!",
        position: "center",
        highlightDemo: true,
        demoText: "This is sample text you can highlight to see how it works."
    },
    {
        title: "Step 2: Click 'Explain' 🔍",
        content: "After highlighting text, a blue 'Explain' button will appear. Click it to get a simple explanation.",
        position: "center",
        showButton: true
    },
    {
        title: "Step 3: Read the Explanation 💡",
        content: "The explanation will appear in a box like this one. You can close it by clicking the ✕ in the corner.",
        position: "center",
        showCloseDemo: true
    },
    {
        title: "That's it! You're ready to go! 🎉",
        content: "Now you can highlight any text on any website to get help understanding it. You can change settings by clicking the extension icon in your browser.",
        position: "center",
        isLastStep: true
    }
];

// Create tutorial overlay
function createTutorialOverlay() {
    if (tutorialOverlay) return;

    tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'tutorial-overlay';
    tutorialOverlay.innerHTML = `
        <div class="tutorial-backdrop"></div>
        <div class="tutorial-content">
            <div class="tutorial-header">
                <h2 class="tutorial-title"></h2>
                <button class="tutorial-close" title="Close tutorial">&times;</button>
            </div>
            <div class="tutorial-body">
                <p class="tutorial-text"></p>
                <div class="tutorial-demo-area"></div>
            </div>
            <div class="tutorial-footer">
                <button class="tutorial-skip">Skip Tutorial</button>
                <div class="tutorial-progress">
                    <span class="tutorial-step-counter"></span>
                </div>
                <div class="tutorial-nav">
                    <button class="tutorial-prev" style="display: none;">← Previous</button>
                    <button class="tutorial-next">Next →</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(tutorialOverlay);

    // Add event listeners
    tutorialOverlay.querySelector('.tutorial-close').addEventListener('click', closeTutorial);
    tutorialOverlay.querySelector('.tutorial-skip').addEventListener('click', closeTutorial);
    tutorialOverlay.querySelector('.tutorial-next').addEventListener('click', nextTutorialStep);
    tutorialOverlay.querySelector('.tutorial-prev').addEventListener('click', prevTutorialStep);

    // Prevent clicks on backdrop from closing (seniors might click accidentally)
    tutorialOverlay.querySelector('.tutorial-backdrop').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Show tutorial step
function showTutorialStep(stepIndex) {
    if (!tutorialOverlay || stepIndex >= tutorialSteps.length) return;

    const step = tutorialSteps[stepIndex];
    const titleEl = tutorialOverlay.querySelector('.tutorial-title');
    const textEl = tutorialOverlay.querySelector('.tutorial-text');
    const demoAreaEl = tutorialOverlay.querySelector('.tutorial-demo-area');
    const stepCounterEl = tutorialOverlay.querySelector('.tutorial-step-counter');
    const nextBtn = tutorialOverlay.querySelector('.tutorial-next');
    const prevBtn = tutorialOverlay.querySelector('.tutorial-prev');
    const skipBtn = tutorialOverlay.querySelector('.tutorial-skip');

    // Update content
    titleEl.textContent = step.title;
    textEl.textContent = step.content;
    stepCounterEl.textContent = `Step ${stepIndex + 1} of ${tutorialSteps.length}`;

    // Clear demo area
    demoAreaEl.innerHTML = '';

    // Handle special step features
    if (step.highlightDemo) {
        demoAreaEl.innerHTML = `
            <div class="tutorial-demo-text">${step.demoText}</div>
            <p class="tutorial-hint">👆 Try highlighting the text above with your mouse!</p>
        `;
        
        // Make the demo text selectable and add highlight detection
        const demoTextEl = demoAreaEl.querySelector('.tutorial-demo-text');
        demoTextEl.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (selection.toString().trim().length > 0) {
                setTimeout(() => {
                    demoAreaEl.innerHTML = `
                        <div class="tutorial-success">✅ Great job! You highlighted the text!</div>
                        <p class="tutorial-hint">Now you'll see an 'Explain' button appear when you highlight text on real websites.</p>
                    `;
                }, 500);
            }
        });
    }

    if (step.showButton) {
        demoAreaEl.innerHTML = `
            <div class="tutorial-demo-button">Explain</div>
            <p class="tutorial-hint">This is what the button looks like when you highlight text!</p>
        `;
    }

    if (step.showCloseDemo) {
        demoAreaEl.innerHTML = `
            <div class="tutorial-demo-tooltip">
                <span>This is what an explanation looks like!</span>
                <button class="tutorial-demo-close">&times;</button>
            </div>
            <p class="tutorial-hint">Click the ✕ button to close explanations when you're done reading.</p>
        `;
    }

    // Update navigation
    prevBtn.style.display = stepIndex > 0 ? 'inline-block' : 'none';
    
    if (step.isLastStep) {
        nextBtn.textContent = 'Got it!';
        skipBtn.style.display = 'none';
    } else {
        nextBtn.textContent = 'Next →';
        skipBtn.style.display = step.showSkip ? 'inline-block' : 'none';
    }

    // Show overlay
    tutorialOverlay.style.display = 'block';
    
    // Apply user's contrast settings to tutorial
    chrome.storage.sync.get(['contrast'], (data) => {
        if (data.contrast === 'dark') {
            tutorialOverlay.classList.add('dark-mode');
        } else {
            tutorialOverlay.classList.remove('dark-mode');
        }
    });
}

// Navigation functions
function nextTutorialStep() {
    currentTutorialStep++;
    if (currentTutorialStep >= tutorialSteps.length) {
        closeTutorial();
    } else {
        showTutorialStep(currentTutorialStep);
    }
}

function prevTutorialStep() {
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        showTutorialStep(currentTutorialStep);
    }
}

function closeTutorial() {
    if (tutorialOverlay) {
        tutorialOverlay.remove();
        tutorialOverlay = null;
    }
    tutorialActive = false;
    
    // Mark tutorial as completed
    chrome.storage.sync.set({ tutorialCompleted: true });
}

// Check if tutorial should be shown
function checkShowTutorial() {
    chrome.storage.sync.get(['tutorialCompleted'], (data) => {
        if (!data.tutorialCompleted && !tutorialActive) {
            // Show tutorial after a short delay so page can load
            setTimeout(() => {
                startTutorial();
            }, 2000);
        }
    });
}

// Start tutorial
function startTutorial() {
    if (tutorialActive) return;
    
    tutorialActive = true;
    currentTutorialStep = 0;
    createTutorialOverlay();
    showTutorialStep(0);
}

// Help button functionality
function createHelpButton() {
    // Only add help button if it doesn't exist
    if (document.getElementById('highlight-explain-help')) return;

    const helpButton = document.createElement('button');
    helpButton.id = 'highlight-explain-help';
    helpButton.innerHTML = '❓';
    helpButton.title = 'Get help with Highlight & Explain';
    helpButton.className = 'help-button';
    
    helpButton.addEventListener('click', () => {
        startTutorial(); // Restart tutorial
    });

    document.body.appendChild(helpButton);
}

// Initialize tutorial system
function initTutorial() {
    // Check if tutorial should be shown on page load
    checkShowTutorial();
    
    // Create help button
    createHelpButton();
}

// Listen for messages to manually start tutorial
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startTutorial") {
        startTutorial();
    }
});

// Start tutorial system when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTutorial);
} else {
    initTutorial();
}