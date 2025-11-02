# Autochat

A powerful and flexible extension for SillyTavern that automatically sends a message on behalf of the user or a character after a random amount of time. Perfect for simulating AFK triggers, timed events, or character proactivity.

## Features

-   **Dual Sender Support**: Choose to send messages as either `{{user}}` or `{{char}}`, each with their own customizable message template.
-   **Configurable Timer Range**: Set a minimum and maximum number of seconds for a random countdown.
-   **Smart Defaults**: Leave the "Maximum Seconds" field blank to default to 3600 (1 hour). Leave "Repeats" blank for infinite loops.
-   **Dynamic Messages**: Use the `{seconds}` placeholder in your message templates to include the actual random time chosen for that specific countdown.
-   **Repeat Control**: Set the number of times the timer should run.
-   **Throttle Protection**: Enabled by default, this prevents more than one message from being sent within a 2-minute window to avoid spam.
-   **Smart Validation**: The minimum and maximum fields automatically adjust to prevent invalid ranges.
-   **Persistent State**: If the extension is enabled when SillyTavern is closed, it will automatically start a countdown on the next launch.
-   **Natural Message Sending**: Messages are sent via the user's prompt box, just as if you typed them yourself.

## Installation

### Method 1: Local Install

1.  Navigate to your SillyTavern installation directory.
2.  Go to `public/scripts/extensions/third-party/`.
3.  Create a new folder named `autochat`.
4.  Place the provided extension files inside this folder.
5.  Refresh SillyTavern.

### Method 2: GitHub Install

1.  Upload the extension files to a new public GitHub repository.
2.  In SillyTavern, go to `Extensions` -> `Install Extension`.
3.  Paste the GitHub URL and click `Install`.
4.  Refresh SillyTavern.

## How to Use

1.  **Open Settings**: Go to the Extensions menu and find "Autochat" in the right-hand panel.
2.  **Configure Timer**:
    *   Set the **Minimum Seconds** and **Maximum Seconds**.
    *   If the "Maximum Seconds" field is left blank, it will default to 3600.
3.  **Set Repeats**:
    *   Enter the number of times you want the timer to run in the **Number of Repeats** field.
    *   Leave this field blank for infinite repeats.
4.  **Choose Sender**:
    *   Select `{{user}}` or `{{char}}` to decide who will send the message.
5.  **Write Your Message**:
    *   Fill in the corresponding message box for your chosen sender.
    *   Use the `{seconds}` placeholder for dynamic timing information.
6.  **Start the Timer**:
    *   Check the **Enable Autochat** box to begin the countdown.
7.  **Stop the Timer**: Uncheck the **Enable Autochat** box or wait for the repeat limit to be reached.

## Important Notes

-   **Throttle Protection**: This feature is on by default and is highly recommended to prevent spam in short-interval scenarios.
-   **Auto-Start on Load**: If enabled on shutdown, the timer will start automatically using the maximum duration.
