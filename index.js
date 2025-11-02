// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "autochat";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default settings for the extension
const defaultSettings = {
    enabled: false,
    minTime: 5,
    maxTime: 10,
    startupTime: 120,
    messageTemplate: "It has been {seconds} seconds since the last message. Time for another one!\n\nWhat are your thoughts on this?",
    repeatCount: null,
    throttleSafety: true
};

// Timer variables
let timerInterval = null;
let currentCountdown = 0;
let lastCountdownDuration = 0;
let messagesSent = 0;
// Flag to detect the first run after a page load
let isFirstRun = true;

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

    if (isNaN(extension_settings[extensionName].startupTime) || extension_settings[extensionName].startupTime <= 0) {
        console.warn(`[${extensionName}] Invalid startupTime detected. Defaulting to 120.`);
        extension_settings[extensionName].startupTime = 120;
        saveSettingsDebounced();
    }

    $("#autochat_enabled").prop("checked", extension_settings[extensionName].enabled);
    $("#autochat_min_time").val(extension_settings[extensionName].minTime);
    $("#autochat_max_time").val(extension_settings[extensionName].maxTime);
    $("#autochat_startup_time").val(extension_settings[extensionName].startupTime);
    $("#autochat_message_template").val(extension_settings[extensionName].messageTemplate);
    const repeatCount = extension_settings[extensionName].repeatCount;
    $("#autochat_repeat_count").val(repeatCount === null ? "" : repeatCount);
    $("#autochat_throttle_safety").prop("checked", extension_settings[extensionName].throttleSafety);
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
        // FIXED: Pass 'true' to indicate this is a manual stop
        stopTimer(true);
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

// Event handler for startup time input
function onStartupTimeChange(event) {
    let inputVal = $(event.target).val();
    let newStartupTime;

    if (inputVal === "" || isNaN(Number(inputVal))) {
        console.warn(`[${extensionName}] Startup time is blank or invalid. Defaulting to 120.`);
        newStartupTime = 120;
        $("#autochat_startup_time").val(newStartupTime);
    } else {
        newStartupTime = Number(inputVal);
    }

    extension_settings[extensionName].startupTime = newStartupTime;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Startup time saved:`, newStartupTime);
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

// Event handler for throttle safety checkbox
function onThrottleSafetyChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].throttleSafety = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Throttle safety setting saved:`, value);
}

// Simplified function to send a message to the chat
function sendMessage(message) {
    try {
        const chatInput = $("#send_textarea");
        chatInput.val(message);
        $("#send_but").trigger('click');
        console.log(`[${extensionName}] Message sent to chat:`, message);
    } catch (error) {
        console.error(`[${extensionName}] Failed to send message:`, error);
    }
}

// Function to start the timer
function startTimer() {
    // FIXED: Do not reset the first run flag on automatic restarts
    stopTimer(false);

    const minTime = extension_settings[extensionName].minTime;
    const maxTime = extension_settings[extensionName].maxTime;
    const startupTime = extension_settings[extensionName].startupTime;

    // Check if this is the first run after loading
    if (isFirstRun) {
        lastCountdownDuration = startupTime;
        isFirstRun = false; // Set flag to false for subsequent runs
        console.log(`[${extensionName}] First run detected. Starting timer at startup time: ${lastCountdownDuration} seconds.`);
    } else {
        lastCountdownDuration = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
        console.log(`[${extensionName}] Subsequent run. Starting timer at random time: ${lastCountdownDuration} seconds.`);
    }
    
    currentCountdown = lastCountdownDuration;

    $("#autochat_timer_display").text(`Timer: ${currentCountdown}s`);

    timerInterval = setInterval(() => {
        currentCountdown--;
        $("#autochat_timer_display").text(`Timer: ${currentCountdown}s`);

        if (currentCountdown <= 0) {
            console.log(`[${extensionName}] Timer finished!`);
            
            const template = extension_settings[extensionName].messageTemplate;
            const processedMessage = template.replace(/{seconds}/g, lastCountdownDuration);
            
            sendMessage(processedMessage);
            
            messagesSent++;
            
            const repeatCount = extension_settings[extensionName].repeatCount;
            if (repeatCount !== null && messagesSent >= repeatCount) {
                console.log(`[${extensionName}] Repeat limit reached. Stopping timer.`);
                // FIXED: Pass 'true' to indicate this is a manual stop
                stopTimer(true);
                messagesSent = 0;
                $("#autochat_enabled").prop("checked", false);
                extension_settings[extensionName].enabled = false;
                saveSettingsDebounced();
            } else {
                startTimer();
            }
        }
    }, 1000);
}

// FIXED: Function to stop the timer
function stopTimer(isManualStop = false) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log(`[${extensionName}] Timer stopped.`);
        $("#autochat_timer_display").text("Timer: Stopped");
        messagesSent = 0;
        // Only reset the first run flag if it was a manual stop
        if (isManualStop) {
            isFirstRun = true;
        }
    }
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
        $("#autochat_startup_time").on("input", onStartupTimeChange);
        $("#autochat_message_template").on("input", onMessageTemplateChange);
        $("#autochat_repeat_count").on("input", onRepeatCountChange);
        $("#autochat_throttle_safety").on("input", onThrottleSafetyChange);
       
        loadSettings();

        if (extension_settings[extensionName].enabled) {
            startTimer();
        }
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
