// UPDATED: Function to send an impersonated message (using reliable sendMessage)
function sendImpersonatedMessage() {
    try {
        if (document.hidden) {
            console.warn(`[${extensionName}] WARNING: The page is not active. Impersonation may fail or be heavily delayed. Please keep the SillyTavern tab active.`);
        }

        console.log(`[${extensionName}] [DEBUG] Starting precise impersonation trigger...`);
        const chatInput = $("#send_textarea");

        if (chatInput.length === 0) {
            console.error(`[${extensionName}] [DEBUG] FAILURE: Could not find the chat input textarea.`);
            return;
        }

        chatInput.val("");
        console.log(`[${extensionName}] [DEBUG] Cleared chat input.`);

        const impersonateButton = document.getElementById('mes_impersonate');
        if (!impersonateButton) {
            console.error(`[${extensionName}] [DEBUG] FAILURE: Could not find the impersonate button with ID 'mes_impersonate'.`);
            return;
        }
        
        console.log(`[${extensionName}] [DEBUG] Found impersonate button. Triggering click.`);
        
        // Use jQuery to trigger the click event
        $(impersonateButton).trigger('click');

        console.log(`[${extensionName}] [DEBUG] Triggered click on impersonate button.`);

        const timeoutMs = 30000;
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const messageText = chatInput.val();

            console.log(`[${extensionName}] [DEBUG] Polling... Elapsed: ${Math.round(elapsedTime/1000)}s, Text found: ${messageText ? 'Yes' : 'No'}`);

            if (messageText && messageText.trim() !== "") {
                clearInterval(checkInterval);
                console.log(`[${extensionName}] AI generated text. Sending via reliable sendMessage function.`);
                // UPDATED: Pass the generated text to our reliable sendMessage function
                sendMessage(messageText);
            } else if (elapsedTime > timeoutMs) {
                clearInterval(checkInterval);
                console.warn(`[${extensionName}] Timed out waiting for AI to generate text after ${timeoutMs / 1000} .}`);
            }
        }, 1000);

    } catch (error) {
        console.error(`[${extensionName}] Failed to send impersonated message:`, error);
    }
}
