import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource } from "../../../../script.js";

const extensionName = "autochat";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

let autochatTimerId = null;

const defaultSettings = {
    enabled: false,
    minSeconds: 5,
    maxSeconds: 60,
    message: "{{user}} has not responded in the last {seconds} seconds.",
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
}

function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);

    if (value) {
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

function startAutochatTimer() {
    if (autochatTimerId) {
        clearTimeout(autochatTimerId);
    }
    const minSec = extension_settings[extensionName].minSeconds;
    const maxSec = extension_settings[extensionName].maxSeconds;
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

        console.log(`[${extensionName}] Timer ended! Sending message via prompt:`, finalMessage);
        toastr.success("Message sent!");

        if (finalMessage) {
            const $sendTextarea = $("#send_textarea");
            const $sendButton = $("#send_but");

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

        if (extension_settings[extensionName].enabled) {
            console.log(`[${extensionName}] Restarting timer...`);
            startAutochatTimer();
        }
    }, randomSeconds * 1000);
}

// UPDATED: Added validation
function onMinSecondsChange(event) {
    const value = parseInt($(event.target).val(), 10);
    const maxSec = extension_settings[extensionName].maxSeconds;

    if (!isNaN(value) && value > 0) {
        if (value >= maxSec) {
            toastr.error("Minimum seconds must be less than Maximum seconds.");
            // Reset the input to the last valid value
            $(event.target).val(extension_settings[extensionName].minSeconds);
        } else {
            extension_settings[extensionName].minSeconds = value;
            saveSettingsDebounced();
        }
    }
}

// UPDATED: Added validation
function onMaxSecondsChange(event) {
    const value = parseInt($(event.target).val(), 10);
    const minSec = extension_settings[extensionName].minSeconds;

    if (!isNaN(value) && value > 0) {
        if (value <= minSec) {
            toastr.error("Maximum seconds must be greater than Minimum seconds.");
            // Reset the input to the last valid value
            $(event.target).val(extension_settings[extensionName].maxSeconds);
        } else {
            extension_settings[extensionName].maxSeconds = value;
            saveSettingsDebounced();
        }
    }
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
        $("#autochat-message").on("input", onMessageChange);
        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
