const chatButton = document.getElementById("chat-button");
const chatContainer = document.getElementById("chat-container");
const closeBtn = document.getElementById("close-btn");
const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

// Toggle chat
chatButton.addEventListener("click", () => {
  chatContainer.classList.toggle("hidden");
});

closeBtn.addEventListener("click", () => {
  chatContainer.classList.add("hidden");
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

  // Fake bot reply
  setTimeout(() => {
    addMessage("This is a demo bot response. Imagine me answering FAQs!", "bot");
  }, 600);
}

function addMessage(text, sender) {
  const msgEl = document.createElement("div");
  msgEl.classList.add("message", sender);
  msgEl.textContent = text;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}