import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource } from "../../../../script.js";

const extensionName = "autochat";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

let autochatTimerId = null;

const defaultSettings = {
    enabled: false,
    minSeconds: 5,
    maxSeconds: 60,
    message: "The autochat timer has finished.",
};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
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
        const message = extension_settings[extensionName].message;
        console.log(`[${extensionName}] Timer ended! Sending message via prompt:`, message);
        toastr.success("Message sent!");

        if (message) {
            // Place the message in the user's prompt box and send it
            const $sendTextarea = $("#send_textarea");
            const $sendButton = $("#send_but");

            if ($sendTextarea.length > 0 && $sendButton.length > 0) {
                $sendTextarea.val(message);
                // Trigger an 'input' event to ensure SillyTavern registers the change
                $sendTextarea.trigger('input');
                // Programmatically click the send button
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

function onMinSecondsChange(event) {
    const value = parseInt($(event.target).val(), 10);
    if (!isNaN(value) && value > 0) {
        extension_settings[extensionName].minSeconds = value;
        saveSettingsDebounced();
    }
}
function onMaxSecondsChange(event) {
    const value = parseInt($(event.target).val(), 10);
    if (!isNaN(value) && value > 0) {
        extension_settings[extensionName].maxSeconds = value;
        saveSettingsDebounced();
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
