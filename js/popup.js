document.addEventListener('DOMContentLoaded', () => {
    const masterSwitch = document.getElementById('masterSwitch');
    const statusMessage = document.getElementById('statusMessage');
    const keyCrop = document.getElementById('keyCrop');
    const keyAnalyze = document.getElementById('keyAnalyze');
    const keyShow = document.getElementById('keyShow');
    const saveBtn = document.getElementById('saveBtn');
    const loginBtn = document.getElementById('loginBtn');

    // Load settings
    chrome.storage.local.get(['isActive', 'keyCrop', 'keyAnalyze', 'keyShow'], (result) => {
        masterSwitch.checked = result.isActive !== false; // Default true
        updateStatus(masterSwitch.checked);

        keyCrop.value = result.keyCrop || '7';
        keyAnalyze.value = result.keyAnalyze || '8';
        keyShow.value = result.keyShow || '9';
    });

    // Toggle Handler
    masterSwitch.addEventListener('change', () => {
        const isActive = masterSwitch.checked;
        chrome.storage.local.set({ isActive });
        updateStatus(isActive);
    });

    function updateStatus(active) {
        statusMessage.textContent = active ? 'Extension Enabled' : 'Extension Disabled';
        statusMessage.style.color = active ? '#4CAF50' : '#aaa';
    }

    // Save Handler
    saveBtn.addEventListener('click', () => {
        const config = {
            keyCrop: keyCrop.value.toUpperCase(),
            keyAnalyze: keyAnalyze.value.toUpperCase(),
            keyShow: keyShow.value.toUpperCase()
        };

        if (!config.keyCrop || !config.keyAnalyze || !config.keyShow) {
            statusMessage.textContent = "Keys cannot be empty!";
            statusMessage.style.color = "red";
            return;
        }

        chrome.storage.local.set(config, () => {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = "Saved!";
            setTimeout(() => {
                saveBtn.textContent = originalText;
            }, 1000);
        });
    });

    // Login Handler (Puter Auth)
    loginBtn.addEventListener('click', async () => {
        loginBtn.textContent = "Logging in... (Keep open)";
        loginBtn.disabled = true;

        try {
            // Puter.js automatically handles the popup and token storage
            const user = await puter.auth.signIn();

            // If successful, the token is in localStorage, shared with Offscreen
            loginBtn.textContent = "Logged in as " + (user.username || "User");
            statusMessage.textContent = "Authentication Successful!";
            statusMessage.style.color = "#4CAF50";

            // Save state to storage for persistence indicators
            chrome.storage.local.set({ puterUser: user.username });

        } catch (error) {
            console.error("Login failed", error);
            loginBtn.textContent = "Login Failed - Try Again";
            loginBtn.disabled = false;
            statusMessage.textContent = "Error: " + (error.message || "Auth failed");
            statusMessage.style.color = "red";
        }
    });

    // Check if already logged in
    if (puter.auth.isSignedIn()) {
        puter.auth.getUser().then(user => {
            loginBtn.textContent = "Logged in as " + (user.username || "User");
            loginBtn.disabled = true;
        });
    }
});
