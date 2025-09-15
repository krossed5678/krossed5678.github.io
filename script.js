const chatButton = document.getElementById("chat-button");
const chatContainer = document.getElementById("chat-container");
const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const TIDIO_KEY = "l9fczj4tk7zdvr7wdf2yyqle2ua5jht3";

// Toggle chat open/close
chatButton.addEventListener("click", () => {
  chatContainer.classList.toggle("open");
  chatButton.classList.toggle("open");

  // Change icon
  if (chatButton.classList.contains("open")) {
    chatButton.textContent = "✖";
  } else {
    chatButton.textContent = "💬";
  }
});

// Send message
sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  addMessage(msg, "user");
  chatInput.value = "";

  // Show typing indicator
  const typingEl = addTypingIndicator();

  // Fake bot reply
  setTimeout(() => {
    removeTypingIndicator(typingEl);
    addMessage("This is a demo bot response. Imagine me answering FAQs!", "bot");
  }, 1500);
}

function addMessage(text, sender) {
  const msgEl = document.createElement("div");
  msgEl.classList.add("message", sender);
  msgEl.textContent = text;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
  const typingEl = document.createElement("div");
  typingEl.classList.add("message", "bot", "typing");
  typingEl.innerHTML = `<span></span><span></span><span></span>`;
  chatMessages.appendChild(typingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typingEl;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}