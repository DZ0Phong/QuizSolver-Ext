// Background Service Worker

let creating; // Promise keeper to prevent race conditions

async function setupOffscreenDocument(path) {
    // Check if offscreen document exists
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return;
    }

    // Create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['BLOBS'], // We use it for Image/Canvas processing
            justification: 'Processing screenshots and running Puter.js',
        });
        await creating;
        creating = null;
    }
}

chrome.runtime.onInstalled.addListener(() => {
    setupOffscreenDocument('offscreen.html');
});

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "Process_CROP") {
        // Content script sent crop coordinates. 
        // We capture the visible tab first.
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) {
                console.error("Capture failed:", chrome.runtime.lastError);
                return;
            }

            // Send full image + coords to Offscreen for cropping
            setupOffscreenDocument('offscreen.html').then(() => {
                chrome.runtime.sendMessage({
                    target: 'offscreen',
                    action: 'CROP_AND_STORE',
                    dataUrl: dataUrl,
                    area: request.area
                });
            });
        });
    }

    else if (request.action === "ANALYZE_LAST_CROP") {
        // Trigger analysis in Offscreen
        setupOffscreenDocument('offscreen.html').then(() => {
            chrome.runtime.sendMessage({
                target: 'offscreen',
                action: 'ANALYZE_IMAGE'
            });
        });
    }

    else if (request.action === "SHOW_ANSWER" ||
        request.action === "ANALYSIS_STARTED" ||
        request.action === "ANALYSIS_ERROR") {

        // Forward offscreen status/results to Active Tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, request, () => {
                    // Suppress "Receiving end does not exist" error
                    if (chrome.runtime.lastError) {
                        console.log("Tab not ready or content script missing:", chrome.runtime.lastError.message);
                    }
                });
            }
        });
    }
});
