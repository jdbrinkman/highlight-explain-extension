let explainBtn = null;

document.addEventListener("selectionchange", () => {
  const selectedText = window.getSelection().toString().trim();

  if (selectedText.length > 10) {
    if (!explainBtn) {
      explainBtn = document.createElement("button");
      explainBtn.innerText = "Explain";
      explainBtn.setAttribute("aria-label", "Explain selected text");
      explainBtn.style.position = "absolute";
      explainBtn.style.zIndex = 9999;
      explainBtn.style.backgroundColor = "#000";
      explainBtn.style.color = "#fff";
      explainBtn.style.fontSize = "18px";
      explainBtn.style.borderRadius = "24px";
      document.body.appendChild(explainBtn);

      explainBtn.addEventListener("click", async () => {
        const text = window.getSelection().toString();
        chrome.runtime.sendMessage({ action: "explain", text });
      });
    }

    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();
    explainBtn.style.top = `${window.scrollY + rect.top - 40}px`;
    explainBtn.style.left = `${rect.left}px`;
    explainBtn.style.display = "block";
  } else if (explainBtn) {
    explainBtn.style.display = "none";
  }
});
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "showTooltip") {
      const tooltip = document.createElement("div");
      tooltip.innerText = msg.summary;
      tooltip.setAttribute("role", "dialog");
      tooltip.style.position = "absolute";
      tooltip.style.top = `${explainBtn.offsetTop + 50}px`;
      tooltip.style.left = `${explainBtn.offsetLeft}px`;
      tooltip.style.maxWidth = "400px";
      tooltip.style.background = "#fff";
      tooltip.style.color = "#000";
      tooltip.style.padding = "16px";
      tooltip.style.borderRadius = "8px";
      tooltip.style.fontSize = "16px";
      tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      document.body.appendChild(tooltip);
    }
  });
  