document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('acceptButton').addEventListener('click', () => {
        chrome.storage.local.set({ 'termsAccepted': true }, () => {
            window.close();
        });
    });
});
