// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
// NEW: Import additional functions for chat manipulation
import { generate, appendMessage, saveChat, eventSource, event_types } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "autochat";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default settings for the extension
const defaultSettings = {
    enabled: false,
    minTime: 5,
    maxTime: 10,
    messageTemplate: "It has been {seconds} seconds since the last message. Time for another one!\n\nWhat are your thoughts on this?",
    repeatCount: null
};

// Timer variables
let timerInterval = null;
let currentCountdown = 0;
let lastCountdownDuration = 0;
// NEW: Track the number of messages sent
let messagesSent = 0;

// Function to load settings into the UI
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    if (extension_settings[extensionName].minTime > extension_settings[extensionName].maxTime) {
        console.warn(`[${extensionName}] Invalid settings detected. minTime was greater than maxTime. Correcting...`);
        extension_settings[extensionName].maxTime = extension_settings[extensionName].minTime;
        saveSettingsDebounced();
    }

    if (isNaN(extension_settings[extensionName].maxTime) || extension_settings[extensionName].maxTime <= 0) {
        console.warn(`[${extensionName}] Invalid maxTime detected. Defaulting to 3600.`);
        extension_settings[extensionName].maxTime = 3600;
        saveSettingsDebounced();
    }

    $("#autochat_enabled").prop("checked", extension_settings[extensionName].enabled);
    $("#autochat_min_time").val(extension_settings[extensionName].minTime);
    $("#autochat_max_time").val(extension_settings[extensionName].maxTime);
    $("#autochat_message_template").val(extension_settings[extensionName].messageTemplate);
    const repeatCount = extension_settings[extensionName].repeatCount;
    $("#autochat_repeat_count").val(repeatCount === null ? "" : repeatCount);
}

// Event handler for the checkbox
function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);

    if (value) {
        startTimer();
    } else {
        stopTimer();
    }
}

// Event handler for minimum time input
function onMinTimeChange(event) {
    let newMinTime = Number($(event.target).val());
    let currentMaxTime = extension_settings[extensionName].maxTime;

    if (newMinTime > currentMaxTime) {
        console.warn(`[${extensionName}] Minimum time cannot be greater than maximum time. Adjusting max time.`);
        currentMaxTime = newMinTime;
        $("#autochat_max_time").val(currentMaxTime);
    }

    extension_settings[extensionName].minTime = newMinTime;
    extension_settings[extensionName].maxTime = currentMaxTime;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Times saved - Min: ${newMinTime}, Max: ${currentMaxTime}`);
}

// Event handler for maximum time input
function onMaxTimeChange(event) {
    let inputVal = $(event.target).val();
    let newMaxTime;
    let currentMinTime = extension_settings[extensionName].minTime;

    if (inputVal === "" || isNaN(Number(inputVal))) {
        console.warn(`[${extensionName}] Maximum time is blank or invalid. Defaulting to 3600.`);
        newMaxTime = 3600;
        $("#autochat_max_time").val(newMaxTime);
    } else {
        newMaxTime = Number(inputVal);
    }

    if (newMaxTime < currentMinTime) {
        console.warn(`[${extensionName}] Maximum time cannot be less than minimum time. Adjusting min time.`);
        currentMinTime = newMaxTime;
        $("#autochat_min_time").val(currentMinTime);
    }

    extension_settings[extensionName].minTime = currentMinTime;
    extension_settings[extensionName].maxTime = newMaxTime;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Times saved - Min: ${currentMinTime}, Max: ${newMaxTime}`);
}

// Event handler for message template textarea
function onMessageTemplateChange(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].messageTemplate = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Message template saved.`);
}

// Event handler for repeat count input
function onRepeatCountChange(event) {
    let inputVal = $(event.target).val();
    let newRepeatCount;

    if (inputVal === "") {
        console.warn(`[${extensionName}] Repeat count is blank. Setting to infinite.`);
        newRepeatCount = null;
    } else {
        newRepeatCount = Number(inputVal);
    }

    extension_settings[extensionName].repeatCount = newRepeatCount;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Repeat count saved:`, newRepeatCount === null ? "Infinite" : newRepeatCount);
}

// NEW: Function to send a message to the chat
function sendMessage(message) {
    try {
        const context = getContext();
        
        // Create a message object
        const messageObject = {
            name: context.name1, // User's name
            is_user: true,
            is_name: true,
            send_date: getMessageTimeStamp(),
            mes: message
        };
        
        // Add the message to the chat
        context.chat.push(messageObject);
        
        // Update the UI
        appendMessage(messageObject);
        
        // Save the chat
        saveChat();
        
        console.log(`[${extensionName}] Message sent to chat:`, message);
    } catch (error) {
        console.error(`[${extensionName}] Failed to send message:`, error);
    }
}

// UPDATED: Function to start the timer
function startTimer() {
    stopTimer();

    const minTime = extension_settings[extensionName].minTime;
    const maxTime = extension_settings[extensionName].maxTime;

    lastCountdownDuration = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    currentCountdown = lastCountdownDuration;

    console.log(`[${extensionName}] Timer started for ${currentCountdown} seconds.`);
    $("#autochat_timer_display").text(`Timer: ${currentCountdown}s`);

    timerInterval = setInterval(() => {
        currentCountdown--;
        $("#autochat_timer_display").text(`Timer: ${currentCountdown}s`);

        if (currentCountdown <= 0) {
            console.log(`[${extensionName}] Timer finished!`);
            
            // Process the message template
            const template = extension_settings[extensionName].messageTemplate;
            const processedMessage = template.replace(/{seconds}/g, lastCountdownDuration);
            
            // NEW: Send the message to the chat
            sendMessage(processedMessage);
            
            // Increment the message counter
            messagesSent++;
            
            // Check if we've reached the repeat limit (if set)
            const repeatCount = extension_settings[extensionName].repeatCount;
            if (repeatCount !== null && messagesSent >= repeatCount) {
                console.log(`[${extensionName}] Repeat limit reached. Stopping timer.`);
                stopTimer();
                // Reset the counter for next time
                messagesSent = 0;
                // Uncheck the enabled box
                $("#autochat_enabled").prop("checked", false);
                extension_settings[extensionName].enabled = false;
                saveSettingsDebounced();
            } else {
                // Restart the timer
                startTimer();
            }
        }
    }, 1000);
}

// UPDATED: Function to stop the timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log(`[${extensionName}] Timer stopped.`);
        $("#autochat_timer_display").text("Timer: Stopped");
        // Reset the message counter
        messagesSent = 0;
    }
}

// Event handler for the test button
function onButtonClick() {
    const isEnabled = extension_settings[extensionName].enabled;
    const minTime = extension_settings[extensionName].minTime;
    const maxTime = extension_settings[extensionName].maxTime;
    const template = extension_settings[extensionName].messageTemplate;
    const repeatCount = extension_settings[extensionName].repeatCount;
    toastr.info(
        `AutoChat is ${isEnabled ? "enabled" : "disabled"}\nMin time: ${minTime}s | Max time: ${maxTime}s\nRepeats: ${repeatCount === null ? "Infinite" : repeatCount}`,
        "AutoChat Status"
    );
    console.log(`[${extensionName}] Test button clicked.`);
}

// Extension initialization
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        $("#autochat_enabled").on("input", onCheckboxChange);
        $("#autochat_min_time").on("input", onMinTimeChange);
        $("#autochat_max_time").on("input", onMaxTimeChange);
        $("#autochat_message_template").on("input", onMessageTemplateChange);
        $("#autochat_repeat_count").on("input", onRepeatCountChange);
        $("#autochat_test_button").on("click", onButtonClick);
       
        loadSettings();

        if (extension_settings[extensionName].enabled) {
            startTimer();
        }
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
