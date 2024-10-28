chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "searchLibGen",
        title: "Search LibGen for \"%s\"",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "searchLibGen") {
        chrome.action.openPopup();
    }
});