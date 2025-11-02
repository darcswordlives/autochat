import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource } from "../../../../script.js";

const extensionName = "autochat";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

let autochatTimerId = null;
let currentRepeatCount = 0;

const defaultSettings = {
    enabled: false,
    minSeconds: 5,
    maxSeconds: 3600,
    message: "{{user}} has not responded in the last {seconds} seconds.",
    repeats: "",
};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    if (extension_settings[extensionName].message === "The autochat timer has finished.") {
        extension_settings[extensionName].message = defaultSettings.message;
        saveSettingsDebounced();
        console.log(`[${extensionName}] Updated default message for existing user.`);
    }

    $("#autochat-enabled").prop("checked", extension_settings[extensionName].enabled);
    $("#autochat-min-seconds").val(extension_settings[extensionName].minSeconds);
    $("#autochat-max-seconds").val(extension_settings[extensionName].maxSeconds);
    $("#autochat-message").val(extension_settings[extensionName].message);
    $("#autochat-repeats").val(extension_settings[extensionName].repeats);

    if (extension_settings[extensionName].enabled) {
        console.log(`[${extensionName}] Extension was enabled on startup. Starting initial timer.`);
        currentRepeatCount = 0;
        startInitialTimer();
    }
}

function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);

    if (value) {
        currentRepeatCount = 0;
        startAutochatTimer();
    } else {
        stopAutochatTimer();
    }
}

function stopAutochatTimer() {
    if (autochatTimerId) {
        clearTimeout(autochatTimerId);
        autochatTimerId = null;
        console.log(`[${extensionName}] Timer stopped.`);
        toastr.info("Autochat timer stopped.");
    }
}

function startInitialTimer() {
    if (autochatTimerId) {
        clearTimeout(autochatTimerId);
    }
    const maxSec = parseInt(extension_settings[extensionName].maxSeconds, 10) || 3600;
    const minSec = extension_settings[extensionName].minSeconds;

    if (minSec >= maxSec) {
        console.error(`[${extensionName}] Invalid range on startup: min (${minSec}) >= max (${maxSec}). Disabling.`);
        $("#autochat-enabled").prop("checked", false);
        extension_settings[extensionName].enabled = false;
        saveSettingsDebounced();
        return;
    }

    console.log(`[${extensionName}] Initial startup timer started for ${maxSec} seconds.`);
    toastr.info(`Autochat enabled. Starting initial timer for ${maxSec} seconds.`);

    autochatTimerId = setTimeout(() => {
        const messageTemplate = extension_settings[extensionName].message;
        const finalMessage = messageTemplate.replace('{seconds}', maxSec);
        handleTimerEnd(finalMessage);
    }, maxSec * 1000);
}

function startAutochatTimer() {
    if (autochatTimerId) {
        clearTimeout(autochatTimerId);
    }
    const minSec = extension_settings[extensionName].minSeconds;
    const maxSec = parseInt(extension_settings[extensionName].maxSeconds, 10) || 3600;

    if (minSec >= maxSec) {
        toastr.error("Minimum seconds must be less than Maximum seconds.");
        console.error(`[${extensionName}] Invalid range: min (${minSec}) >= max (${maxSec})`);
        $("#autochat-enabled").prop("checked", false);
        extension_settings[extensionName].enabled = false;
        saveSettingsDebounced();
        return;
    }
    const randomSeconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;
    console.log(`[${extensionName}] Timer started for ${randomSeconds} seconds.`);
    toastr.info(`Timer started for ${randomSeconds} seconds.`);

    autochatTimerId = setTimeout(() => {
        const messageTemplate = extension_settings[extensionName].message;
        const finalMessage = messageTemplate.replace('{seconds}', randomSeconds);
        handleTimerEnd(finalMessage);
    }, randomSeconds * 1000);
}

function handleTimerEnd(finalMessage) {
    if (finalMessage) {
        console.log(`[${extensionName}] Timer ended! Sending message via prompt:`, finalMessage);
        toastr.success("Message sent!");

        const $sendTextarea = $("#send_textarea");
        const $sendButton = $("#send_but";

        if ($sendTextarea.length > 0 && $sendButton.length > 0) {
            $sendTextarea.val(finalMessage);
            $sendTextarea.trigger('input');
            $sendButton.trigger('click');
        } else {
            console.error(`[${extensionName}] Could not find send textarea or button.`);
        }
    } else {
        console.warn(`[${extensionName}] Timer ended, but the message was empty.`);
    }

    currentRepeatCount++;
    const totalRepeats = parseInt(extension_settings[extensionName].repeats, 10) || 0;

    if (totalRepeats > 0 && currentRepeatCount >= totalRepeats) {
        console.log(`[${extensionName}] Repeat limit of ${totalRepeats} reached. Stopping timer.`);
        toastr.info("Autochat finished all repeats.");
        $("#autochat-enabled").prop("checked", false);
        extension_settings[extensionName].enabled = false;
        saveSettingsDebounced();
        return;
    }

    if (extension_settings[extensionName].enabled) {
        console.log(`[${extensionName}] Restarting timer... (${currentRepeatCount}/${totalRepeats || '∞'})`);
        startAutochatTimer();
    }
}

function onMinSecondsChange(event) {
    const newMin = parseInt($(event.target).val(), 10);
    const currentMax = parseInt(extension_settings[extensionName].maxSeconds, 10) || 3600;
    const maxInput = $("#autochat-max-seconds");

    if (!isNaN(newMin) && newMin > 0) {
        extension_settings[extensionName].minSeconds = newMin;

        if (newMin >= currentMax) {
            const newMax = newMin + 1;
            extension_settings[extensionName].maxSeconds = newMax;
            maxInput.val(newMax);
        }
        saveSettingsDebounced();
    }
}

function onMaxSecondsChange(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].maxSeconds = value;
    saveSettingsDebounced();
}

function onRepeatsChange(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].repeats = value;
    saveSettingsDebounced();
}

function onMessageChange(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].message = value;
    saveSettingsDebounced();
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
        $("#autochat-enabled").on("input", onCheckboxChange);
        $("#autochat-min-seconds").on("input", onMinSecondsChange);
        $("#autochat-max-seconds").on("input", onMaxSecondsChange);
        $("#autochat-repeats").on("input", onRepeatsChange);
        $("#autochat-message").on("input", onMessageChange);
        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
