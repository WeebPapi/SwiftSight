let isReaderActive = false

document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup DOM loaded")
  const slider = document.getElementById("boldness")
  const sliderValue = document.getElementById("boldness-value")
  const toggleButton = document.getElementById("toggle-reader")

  function updateUI(isActive, boldness) {
    console.log("Updating UI - Active:", isActive, "Boldness:", boldness)
    toggleButton.textContent = isActive ? "Disable Reader" : "Enable Reader"
    toggleButton.classList.toggle("active", isActive)
    slider.value = boldness
    sliderValue.textContent = `${boldness}%`
  }

  chrome.storage.sync.get(["boldness", "isReaderActive"], function (result) {
    console.log("Retrieved storage:", result)
    updateUI(result.isReaderActive || false, result.boldness || 50)
  })

  // Update slider value and save to storage
  slider.addEventListener("input", function () {
    const boldness = slider.value
    console.log("Slider changed:", boldness)
    sliderValue.textContent = `${boldness}%`
    chrome.storage.sync.set({ boldness: boldness })
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateBoldness",
        boldness: boldness,
      })
    })
  })

  // Toggle reader
  toggleButton.addEventListener("click", function () {
    console.log("Toggle button clicked")
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggleReader" })
    })
    chrome.storage.sync.get("isReaderActive", function (result) {
      const newState = !result.isReaderActive
      console.log("Toggling reader state to:", newState)
      chrome.storage.sync.set({ isReaderActive: newState })
      updateUI(newState, slider.value)
    })
  })
})
