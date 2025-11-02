// Import from SillyTavern core
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource } from "../../../../script.js";

// Extension name MUST match folder name
const extensionName = "random-timer";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    minSeconds: 5,
    maxSeconds: 60,
    message: "The random timer has finished.",
};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    $("#random-timer-enabled").prop("checked", extension_settings[extensionName].enabled);
    $("#random-timer-min-seconds").val(extension_settings[extensionName].minSeconds);
    $("#random-timer-max-seconds").val(extension_settings[extensionName].maxSeconds);
    $("#random-timer-message").val(extension_settings[extensionName].message);
}

function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);

    if (value) {
        startRandomTimer();
    }
}

function startRandomTimer() {
    const minSec = extension_settings[extensionName].minSeconds;
    const maxSec = extension_settings[extensionName].maxSeconds;

    if (minSec >= maxSec) {
        toastr.error("Minimum seconds must be less than Maximum seconds.");
        console.error(`[${extensionName}] Invalid range: min (${minSec}) >= max (${maxSec})`);
        $("#random-timer-enabled").prop("checked", false);
        extension_settings[extensionName].enabled = false;
        saveSettingsDebounced();
        return;
    }

    const randomSeconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;

    console.log(`[${extensionName}] Timer started for ${randomSeconds} seconds.`);
    toastr.info(`Timer started for ${randomSeconds} seconds.`);

    setTimeout(() => {
        const message = extension_settings[extensionName].message;
        console.log(`[${extensionName}] Timer ended! Sending message:`, message);
        toastr.success("Message sent!");

        if (message) {
            eventSource.emit('userMessageString', message);
        } else {
            console.warn(`[${extensionName}] Timer ended, but the message was empty. Nothing was sent.`);
        }
    }, randomSeconds * 1000);
}

function onMinSecondsChange(event) {
    const value = parseInt($(event.target).val(), 10);
    if (!isNaN(value) && value > 0) {
        extension_settings[extensionName].minSeconds = value;
        saveSettingsDebounced();
        console.log(`[${extensionName}] Min seconds saved:`, value);
    } else {
        console.warn(`[${extensionName}] Invalid value for min seconds:`, $(event.target).val());
    }
}

function onMaxSecondsChange(event) {
    const value = parseInt($(event.target).val(), 10);
    if (!isNaN(value) && value > 0) {
        extension_settings[extensionName].maxSeconds = value;
        saveSettingsDebounced();
        console.log(`[${extensionName}] Max seconds saved:`, value);
    } else {
        console.warn(`[${extensionName}] Invalid value for max seconds:`, $(event.target).val());
    }
}

function onMessageChange(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].message = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Message saved:`, value);
}

// Extension initialization
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
       
        $("#random-timer-enabled").on("input", onCheckboxChange);
        $("#random-timer-min-seconds").on("input", onMinSecondsChange);
        $("#random-timer-max-seconds").on("input", onMaxSecondsChange);
        $("#random-timer-message").on("input", onMessageChange);
       
        loadSettings();
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
