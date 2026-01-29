# QuizSolver Extension (Stealth Edition)

A minimalist, stealthy browser extension to help solve quizzes using AI. It captures screenshots, extracts text (OCR), and provides answers anonymously using Puter.js AI.

## Features
*   **Stealth Mode**: Minimal UI, invisible crop selection, tiny status indicators.
*   **OCR & AI**: Uses `gpt-4o-mini` (via Puter.js) for fast, accurate text extraction and answering.
*   **Custom Hotkeys**: Configurable keys for Crop, Analyze, and Show Answer.
*   **Secure**: Runs locally (Offscreen document), requires personal Puter account (free tier).

## Installation
1.  **Clone/Download** this repository.
2.  Open Chrome and go to `chrome://extensions`.
3.  Enable **Developer Mode** (top right).
4.  Click **Load unpacked**.
5.  Select the folder containing this `manifest.json`.

## Usage
1.  **Login**: Click the extension icon -> "Login to Puter". (Create a free account at [puter.com](https://puter.com) if needed).
2.  **Enable**: Ensure the master switch is ON.
3.  **Shortcuts** (Default):
    *   `7`: **Crop**. Click Top-Left, then Bottom-Right of the question. (Green Status Dot)
    *   `8`: **Analyze**. Sends the screenshot to AI. (Red Status Dot)
    *   `9`: **Show/Hide Answer**. Toggles the answer text. (Blue Status Dot)

## Stealth Indicators
*   **Green Dot** (Bottom-Right): Screenshot Captured.
*   **Red Box** (Bottom-Right): Analyzing...
*   **Blue Dot** (Bottom-Right): Answer Ready.
*   **Yellow Dot**: Error (e.g., Not logged in, Out of funds).

## Credits
*   Built with [Puter.js](https://docs.puter.com/) for AI capabilities.
*   Designed for educational testing purposes.
