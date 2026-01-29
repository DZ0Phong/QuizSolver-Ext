// Offscreen Script
let lastCroppedImage = null;

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.target !== 'offscreen') return;

    if (request.action === 'CROP_AND_STORE') {
        await handleCropAndStore(request.dataUrl, request.area);
    } else if (request.action === 'ANALYZE_IMAGE') {
        await handleAnalyze();
    }
});

async function handleCropAndStore(dataUrl, area) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        // Precise Scaling Calculation
        // captureVisibleTab returns an image at the device's physical resolution.
        // We know the logical window width (CSS pixels) from the content script.
        // Scale = Physical Width / Logical Width

        const scaleX = img.width / area.windowWidth;
        const scaleY = img.height / area.windowHeight;

        const sx = area.x * scaleX;
        const sy = area.y * scaleY;
        const sWidth = area.width * scaleX;
        const sHeight = area.height * scaleY;

        canvas.width = sWidth;
        canvas.height = sHeight;

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

        lastCroppedImage = canvas.toDataURL('image/png');
        console.log("Image cropped and stored. Scale:", scaleX);
    };
    img.src = dataUrl;
}

async function handleAnalyze() {
    if (!lastCroppedImage) {
        chrome.runtime.sendMessage({ action: "ANALYSIS_ERROR", text: "No image captured yet!" });
        return;
    }

    // Indicate that we have the image and are STARTING the upload/analysis
    chrome.runtime.sendMessage({ action: "ANALYSIS_STARTED" });

    try {
        // console.log("Analyzing (OCR)...");

        // 1. Convert Image to Text (OCR)
        const res = await fetch(lastCroppedImage);
        const blob = await res.blob();

        const ocrText = await puter.ai.img2txt(blob);
        // console.log("OCR Result:", ocrText);

        if (!ocrText || !ocrText.trim()) {
            chrome.runtime.sendMessage({ action: "ANALYSIS_ERROR", text: "No text found in image" });
            return;
        }

        // 2. Chat with AI using the extracted text
        // STRICT PROMPT: Answer Only, A/B/C/D preferred.
        const prompt = `Solve this quiz.
Rules:
1. If multiple choice, return ONLY the option letters (e.g. "A", "A B", "C").
2. If distinct options exist but no letters, assign numbers (1, 2, 3...) and return ONLY the numbers.
3. If free text, keep it extremely short (max 5 words).
4. NO EXPLANATION. NO EXTRA TEXT.
Context:
${ocrText}`;

        // Use 'gpt-4o-mini'
        const response = await puter.ai.chat(prompt, { model: 'gpt-4o-mini' });

        // Robust Response Extraction
        let text = "";
        if (typeof response === 'string') {
            text = response;
        } else if (typeof response === 'object') {
            // Handle Stream or Message Object
            if (response.message && response.message.content) {
                text = response.message.content; // Common OpenAI format
            } else if (response.message) {
                text = typeof response.message === 'string' ? response.message : JSON.stringify(response.message);
            } else if (response.text) {
                text = response.text;
            } else {
                // Final Fallback: Pretty print the whole object so we can read it
                text = JSON.stringify(response, null, 2);
            }
        } else {
            text = String(response);
        }

        chrome.runtime.sendMessage({ action: "SHOW_ANSWER", text: text });

    } catch (err) {
        console.error("Puter Error:", err);

        let errorMessage = "Unknown error";

        // Try to parse JSON error if it's a string
        try {
            const errObj = (typeof err === 'string') ? JSON.parse(err) : err;
            if (errObj.error && errObj.error.code === 'insufficient_funds') {
                errorMessage = "Puter Account Out of Funds! Please create a new account or top up.";
            } else if (errObj.message) {
                errorMessage = errObj.message;
            } else if (errObj.error && errObj.error.message) {
                errorMessage = errObj.error.message;
            } else {
                errorMessage = JSON.stringify(err);
            }
        } catch (e) {
            // If parsing failed, just use string
            errorMessage = String(err);
            if (errorMessage.includes("insufficient_funds") || errorMessage.includes("402")) {
                errorMessage = "Puter Account Out of Funds! Please create a new account.";
            }
        }

        chrome.runtime.sendMessage({
            action: "ANALYSIS_ERROR",
            text: "Error: " + errorMessage
        });
    }
}
