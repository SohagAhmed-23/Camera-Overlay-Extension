// check_installation.js

// Set a global variable on the page
window.extensionData = {
    installed: true,
    message: "Record is processing"
};

// Or trigger a custom event
const event = new CustomEvent('extensionInstalled', { 
    detail: {
        installed: true,
        message: "Record is processing"
    }
});
window.dispatchEvent(event);
