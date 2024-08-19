// Listener to receive messages from the webpage
window.addEventListener("message", function(event) {
    // Ensure the message is coming from the webpage
    if (event.source !== window) return;

    // Message received from the webpage
    if (event.data.type && event.data.type === "SEND_DATA_TO_EXTENSION") {
        // Forward the data to the extension's background script
        chrome.runtime.sendMessage(event.data.payload, function(response) {
            console.log("Response from the extension:", response);
        });
    }
}, false);
