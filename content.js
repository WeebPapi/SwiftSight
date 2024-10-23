let boldnessPercentage = 50 // Default to 50%
let isReaderActive = false

console.log("Content script loaded")

function injectStyles() {
  const style = document.createElement("style")
  style.textContent = `
    .bionic-word {
      display: inline !important;
    }
    .bionic-word strong {
      font-weight: bold !important;
      color: inherit !important;
      background-color: inherit !important;
      font-family: inherit !important;
      font-size: inherit !important;
    }
  `
  document.head.appendChild(style)
}

function applyBionicReading(element) {
  const text = element.textContent
  const words = text.split(/\s+/)
  const bionicWords = words.map((word) => {
    const boldLength = Math.ceil(word.length * (boldnessPercentage / 100))
    const boldPart = word.slice(0, boldLength)
    const regularPart = word.slice(boldLength)
    return `<span class="bionic-word"><strong>${boldPart}</strong>${regularPart}</span>`
  })
  element.innerHTML = bionicWords.join(" ")
}

function processParagraphs() {
  if (!isReaderActive) return

  const elements = document.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6, li, td, th"
  )
  elements.forEach((element) => {
    // Skip elements that only contain images or have already been processed
    if (
      element.querySelector("img") ||
      element.classList.contains("bionic-processed")
    )
      return

    element.classList.add("bionic-processed")
    const originalHTML = element.innerHTML
    element.setAttribute("data-original-html", originalHTML)

    // Process anchor elements separately
    const anchors = element.querySelectorAll("a")
    anchors.forEach(processBionicAnchor)

    // Process the remaining text
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )
    const textNodes = []
    while (walker.nextNode()) {
      if (walker.currentNode.parentElement.tagName !== "A") {
        textNodes.push(walker.currentNode)
      }
    }
    textNodes.forEach((node) => {
      if (node.textContent.trim()) {
        const span = document.createElement("span")
        span.innerHTML = applyBionicReadingToText(node.textContent)
        node.parentNode.replaceChild(span, node)
      }
    })
  })
}

function removeBionicReading() {
  const processedElements = document.querySelectorAll(".bionic-processed")
  processedElements.forEach((element) => {
    const originalHTML = element.getAttribute("data-original-html")
    if (originalHTML) {
      element.innerHTML = originalHTML
    }
    element.classList.remove("bionic-processed")
    element.removeAttribute("data-original-html")
  })
}

function toggleReader() {
  isReaderActive = !isReaderActive
  if (isReaderActive) {
    injectStyles()
    processParagraphs()
  } else {
    removeBionicReading()
  }
}

function applyBionicReadingToText(text) {
  const words = text.split(/\s+/)
  return words
    .map((word) => {
      const boldLength = Math.ceil(word.length * (boldnessPercentage / 100))
      const boldPart = word.slice(0, boldLength)
      const regularPart = word.slice(boldLength)
      return `<span class="bionic-word" style="display: inline !important;"><strong style="font-weight: bold !important; color: inherit !important; background-color: inherit !important; font-family: inherit !important; font-size: inherit !important;">${boldPart}</strong>${regularPart}</span>`
    })
    .join(" ")
}

function applyToSelection() {
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const selectedContent = range.cloneContents()
    const tempDiv = document.createElement("div")
    tempDiv.appendChild(selectedContent)

    // Process text nodes within the selected content
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )
    const nodesToReplace = []
    while (walker.nextNode()) {
      nodesToReplace.push(walker.currentNode)
    }

    nodesToReplace.forEach((node) => {
      if (node.textContent.trim()) {
        const span = document.createElement("span")
        span.innerHTML = applyBionicReadingToText(node.textContent)
        node.parentNode.replaceChild(span, node)
      }
    })

    // Replace the selection with the processed content
    range.deleteContents()
    range.insertNode(tempDiv)

    // Remove the temporary div, keeping its contents
    while (tempDiv.firstChild) {
      tempDiv.parentNode.insertBefore(tempDiv.firstChild, tempDiv)
    }
    tempDiv.parentNode.removeChild(tempDiv)
  }
}

function processBionicAnchor(anchor) {
  const originalHref = anchor.getAttribute("href")
  const originalTarget = anchor.getAttribute("target")
  const originalStyle = anchor.getAttribute("style")

  const bionicText = applyBionicReadingToText(anchor.textContent)

  anchor.innerHTML = bionicText
  anchor.setAttribute("href", originalHref)
  if (originalTarget) {
    anchor.setAttribute("target", originalTarget)
  }
  if (originalStyle) {
    anchor.setAttribute("style", originalStyle)
  }
  anchor.style.color = "" // Reset to default link color
  anchor.style.textDecoration = "" // Reset to default underline
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleReader") {
    toggleReader()
  } else if (request.action === "updateBoldness") {
    boldnessPercentage = parseInt(request.boldness)
    if (isReaderActive) {
      removeBionicReading()
      processParagraphs()
    }
  } else if (request.action === "applyToSelection") {
    injectStyles() // Ensure styles are injected
    applyToSelection()
  }
})

// Initial setup
chrome.storage.sync.get(["boldness", "isReaderActive"], function (result) {
  boldnessPercentage = result.boldness || 50
  isReaderActive = result.isReaderActive || false
  if (isReaderActive) {
    injectStyles()
    processParagraphs()
  }
})
