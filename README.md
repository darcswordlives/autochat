# Autochat

A powerful and flexible extension for SillyTavern that automatically sends a user message after a random amount of time. Perfect for simulating user activity, AFK triggers, or timed events.

## Features

-   **Configurable Timer Range**: Set a minimum and maximum number of seconds for a random countdown.
-   **Customizable Messages**: Define the exact message to be sent. Use the `{seconds}` placeholder to include the actual random time in the message.
-   **Repeat Control**: Set the number of times the timer should run. Use `0` for infinite repeats.
-   **Smart Validation**: The minimum and maximum fields automatically adjust to prevent invalid ranges, ensuring a smooth user experience.
-   **Auto-Restart Loop**: The timer automatically restarts after sending a message until the repeat limit is reached or it's manually disabled.
-   **Persistent State**: If the extension is enabled when SillyTavern is closed, it will automatically start a countdown on the next launch.
-   **Natural Message Sending**: Messages are sent via the user's prompt box, just as if you typed them yourself.
-   **Throttle Protection**: Enabled by default, this prevents more than one message from being sent within a 2-minute window to avoid spam.

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

1.  **Open Settings**: Go to the Extensions menu (puzzle piece icon) and find "Autochat" in the right-hand panel.
2.  **Configure Timer**:
    *   Set the **Minimum Seconds** and **Maximum Seconds** for the random countdown.
    *   The extension will automatically ensure the minimum is always less than the maximum.
3.  **Set Repeats**:
    *   Enter the number of times you want the timer to run in the **Number of Repeats** field.
    *   Enter `0` to make the timer run infinitely until you stop it.
4.  **Write Your Message**:
    *   In the **{{User}} generated message** box, type the message you want to send.
    *   You can use the placeholder `{seconds}` in your message. It will be replaced with the actual random time chosen for that specific countdown.
    *   *Example*: `{{user}} has not responded in the last {seconds} seconds.`
5.  **Start the Timer**:
    *   Check the **Enable Autochat** box to begin the countdown.
    *   The first timer will run for a random duration between your min/max settings.
    *   After the message is sent, the timer will automatically restart for the next cycle.
6.  **Stop the Timer**: Uncheck the **Enable Autochat** box to stop the loop at any time. The timer will also stop automatically if the repeat limit is reached.

## Important Notes

-   **Auto-Start on Load**: If you close SillyTavern with Autochat enabled, it will automatically start a timer (using the maximum duration) the next time you launch SillyTavern.
-   **Message Placeholder**: The `{seconds}` placeholder is a powerful tool for creating dynamic and informative messages.
-   **Throttle Protection**: This feature is on by default and is highly recommended to prevent spam in short-interval scenarios.
