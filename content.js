let config = {
    isActive: true,
    keyCrop: '7',
    keyAnalyze: '8',
    keyShow: '9'
};

chrome.storage.local.get(['isActive', 'keyCrop', 'keyAnalyze', 'keyShow'], (result) => {
    updateConfig(result);
});

chrome.storage.onChanged.addListener((changes) => {
    const newConfig = {};
    for (let key in changes) {
        newConfig[key] = changes[key].newValue;
    }
    updateConfig(newConfig);
});

function updateConfig(newValues) {
    config = { ...config, ...newValues };
    if (!config.keyCrop) config.keyCrop = '7';
    if (!config.keyAnalyze) config.keyAnalyze = '8';
    if (!config.keyShow) config.keyShow = '9';
}

// Key Listener
document.addEventListener('keydown', (e) => {
    if (!config.isActive) return;

    const key = e.key.toUpperCase();

    if (key === config.keyCrop) {
        startCropMode();
    } else if (key === config.keyAnalyze) {
        // Just send message, wait for confirmation to show Red Dot
        removeAnswerWindow();
        try {
            chrome.runtime.sendMessage({ action: "ANALYZE_LAST_CROP" });
        } catch (err) {
            console.error("QuizSolver: Context invalidated. Refresh page.", err);
            showIndicator("error");
        }
    } else if (key === config.keyShow) {
        // Just toggle
        toggleAnswerWindow();
    }
});

// --- Stealth Indicators ---
function showIndicator(type) {
    const toast = document.createElement('div');
    toast.className = 'quiz-solver-toast indicator-' + type;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000); // Slightly longer for visibility
}

// --- Crop Mode Logic (Stealth) ---
let isCropping = false;
let startPoint = null;
let overlayDiv = null;

function startCropMode() {
    if (isCropping) return;
    isCropping = true;
    startPoint = null;

    overlayDiv = document.createElement('div');
    overlayDiv.id = 'quiz-solver-overlay';
    document.body.appendChild(overlayDiv);

    overlayDiv.addEventListener('click', handleCropClick);
    document.addEventListener('keydown', handleEsc);
}

function handleEsc(e) {
    if (e.key === 'Escape') {
        exitCropMode();
    }
}

function handleCropClick(e) {
    e.stopPropagation();
    e.preventDefault();

    if (!startPoint) {
        // Point 1 - Silent
        startPoint = { x: e.clientX, y: e.clientY };
    } else {
        // Point 2 - Finish
        const endPoint = { x: e.clientX, y: e.clientY };
        finishCrop(startPoint, endPoint);
    }
}

function finishCrop(start, end) {
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);

    if (width < 10 || height < 10) {
        exitCropMode();
        return;
    }

    const cropData = {
        x: left,
        y: top,
        width: width,
        height: height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
    };

    try {
        chrome.runtime.sendMessage({
            action: "Process_CROP",
            area: cropData
        });
        showIndicator("crop"); // Green Dot (Success)
    } catch (err) {
        console.error("QuizSolver: Extension context invalidated. Please refresh the page.", err);
        showIndicator("error"); // Yellow Dot (Error)
        // Fallback: Use standard alert if critical, but stealth implies keeping it quiet.
        // But for context invalidation, the user MUST refresh.
        // We'll rely on the yellow dot + console.
    }

    exitCropMode();
}

function exitCropMode() {
    isCropping = false;
    startPoint = null;
    if (overlayDiv) overlayDiv.remove();
    overlayDiv = null;
    document.removeEventListener('keydown', handleEsc);
}

// --- Answer Display Logic (Stealth) ---
function removeAnswerWindow() {
    const win = document.getElementById('quiz-solver-answer');
    if (win) win.remove();
}

function toggleAnswerWindow() {
    const win = document.getElementById('quiz-solver-answer');
    if (win) {
        win.style.display = win.style.display === 'none' ? 'block' : 'none';
        // Indicate toggle? Maybe not needed as user sees the window.
    }
}

function createAnswerWindow(text) {
    removeAnswerWindow();

    const win = document.createElement('div');
    win.id = 'quiz-solver-answer';
    win.style.display = 'none'; // START HIDDEN as per request

    const content = document.createElement('div');
    content.style.whiteSpace = 'pre-wrap';
    content.textContent = text;

    win.appendChild(content);
    document.body.appendChild(win);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SHOW_ANSWER") {
        createAnswerWindow(request.text);
        showIndicator("answer"); // Blue Dot (Answer Ready)
    } else if (request.action === "ANALYSIS_STARTED") {
        showIndicator("analyze"); // Red Dot (Sent/Processing)
    } else if (request.action === "ANALYSIS_ERROR") {
        showIndicator("error"); // Yellow Dot (Error)
        // Optionally show error text in window too?
        console.error("QuizSolver Error:", request.text);
    }
});
