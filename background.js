function createContextMenu() {
  chrome.contextMenus.create({
    id: "bionicReader",
    title: "Apply Bionic Reading",
    contexts: ["selection"],
  })
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "bionicReader") {
    chrome.tabs.sendMessage(tab.id, { action: "applyToSelection" })
  }
})

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggleReader" })
})
