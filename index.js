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
let isFirstRun = true;
let timerStartTime = 0;

// Function to load settings into the UI
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    if (extension_settings[extensionName].throttleSafety && extension_settings[extensionName].minTime < 120) {
        console.warn(`[${extensionName}] Throttle safety is enabled but minTime is less than 120. Setting minTime to 120.`);
        extension_settings[extensionName].minTime = 120;
        saveSettingsDebounced();
    }

    if (extension_settings[extensionName].throttleSafety && extension_settings[extensionName].startupTime < 120) {
        console.warn(`[${extensionName}] Throttle safety is enabled but startupTime is less than 120. Setting startupTime to 120.`);
        extension_settings[extensionName].startupTime = 120;
        saveSettingsDebounced();
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
        stopTimer(true);
    }
}

// UPDATED: Event handler for minimum time input (now using 'change' event)
function onMinTimeChange(event) {
    let newMinTime = Number($(event.target).val());
    let currentMaxTime = extension_settings[extensionName].maxTime;
    const isThrottleEnabled = extension_settings[extensionName].throttleSafety;

    if (isThrottleEnabled && newMinTime < 120) {
        console.warn(`[${extensionName}] Throttle safety is enabled. Minimum time cannot be less than 120 seconds. Setting to 120.`);
        newMinTime = 120;
        $("#autochat_min_time").val(newMinTime);
    }

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

// UPDATED: Event handler for maximum time input (now using 'change' event)
function onMaxTimeChange(event) {
    let inputVal = $(event.target).val();
    let newMaxTime;
    let currentMinTime = extension_settings[extensionName].minTime;
    const isThrottleEnabled = extension_settings[extensionName].throttleSafety;

    if (inputVal === "" || isNaN(Number(inputVal))) {
        console.warn(`[${extensionName}] Maximum time is blank or invalid. Defaulting to 3600.`);
        newMaxTime = 3600;
        $("#autochat_max_time").val(newMaxTime);
    } else {
        newMaxTime = Number(inputVal);
    }

    if (isThrottleEnabled && newMaxTime < 120) {
        console.warn(`[${extensionName}] Throttle safety is enabled. Maximum time cannot be less than 120 seconds. Setting to 120.`);
        newMaxTime = 120;
        $("#autochat_max_time").val(newMaxTime);
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

// UPDATED: Event handler for startup time input (now using 'change' event)
function onStartupTimeChange(event) {
    let inputVal = $(event.target).val();
    let newStartupTime;
    const isThrottleEnabled = extension_settings[extensionName].throttleSafety;

    if (inputVal === "" || isNaN(Number(inputVal))) {
        console.warn(`[${extensionName}] Startup time is blank or invalid. Defaulting to 120.`);
        newStartupTime = 120;
        $("#autochat_startup_time").val(newStartupTime);
    } else {
        newStartupTime = Number(inputVal);
    }

    if (isThrottleEnabled && newStartupTime < 120) {
        console.warn(`[${extensionName}] Throttle safety is enabled. Startup time cannot be less than 120 seconds. Setting to 120.`);
        newStartupTime = 120;
        $("#autochat_startup_time").val(newStartupTime);
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

// UPDATED: Event handler for repeat count input (now using 'change' event)
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
    
    if (value) {
        console.log(`[${extensionName}] Throttle safety enabled.`);
        let needsSave = false;

        if (extension_settings[extensionName].minTime < 120) {
            console.warn(`[${extensionName}] Setting minimum time to 120 seconds.`);
            extension_settings[extensionName].minTime = 120;
            $("#autochat_min_time").val(120);
            needsSave = true;
        }

        if (extension_settings[extensionName].startupTime < 120) {
            console.warn(`[${extensionName}] Setting startup time to 120 seconds.`);
            extension_settings[extensionName].startupTime = 120;
            $("#autochat_startup_time").val(120);
            needsSave = true;
        }
        
        if (extension_settings[extensionName].maxTime < 120) {
            console.warn(`[${extensionName}] Setting maximum time to 120 seconds.`);
            extension_settings[extensionName].maxTime = 120;
            $("#autochat_max_time").val(120);
            needsSave = true;
        }

        if (needsSave) {
            saveSettingsDebounced();
        }
    }
    
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
    stopTimer(false);

    const minTime = extension_settings[extensionName].minTime;
    const maxTime = extension_settings[extensionName].maxTime;
    const startupTime = extension_settings[extensionName].startupTime;

    if (isFirstRun) {
        lastCountdownDuration = startupTime;
        isFirstRun = false;
        console.log(`[${extensionName}] First run detected. Starting timer at startup time: ${lastCountdownDuration} seconds.`);
    } else {
        lastCountdownDuration = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
        console.log(`[${extensionName}] Subsequent run. Starting timer at random time: ${lastCountdownDuration} seconds.`);
    }
    
    timerStartTime = performance.now();

    timerInterval = setInterval(() => {
        const elapsedTime = (performance.now() - timerStartTime) / 1000;
        currentCountdown = Math.max(0, Math.ceil(lastCountdownDuration - elapsedTime));

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
                stopTimer(true);
                messagesSent = 0;
                $("#autochat_enabled").prop("checked", false);
                extension_settings[extensionName].enabled = false;
                saveSettingsDebounced();
            } else {
                startTimer();
            }
        }
    }, 250);
}

// Function to stop the timer
function stopTimer(isManualStop = false) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log(`[${extensionName}] Timer stopped.`);
        $("#autochat_timer_display").text("Timer: Stopped");
        messagesSent = 0;
        if (isManualStop) {
            isFirstRun = true;
        }
        timerStartTime = 0;
    }
}

// Extension initialization
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        $("#autochat_enabled").on("input", onCheckboxChange);
        // UPDATED: Changed 'input' to 'change' for number fields
        $("#autochat_min_time").on("change", onMinTimeChange);
        $("#autochat_max_time").on("change", onMaxTimeChange);
        $("#autochat_startup_time").on("change", onStartupTimeChange);
        $("#autochat_message_template").on("input", onMessageTemplateChange);
        $("#autochat_repeat_count").on("change", onRepeatCountChange);
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
