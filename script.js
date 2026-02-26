let llm;                     // oggetto WebLLM
const MODEL_URL = "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/resolve/main/";

const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");

function appendMessage(text, cls) {
  const div = document.createElement("div");
  div.className = `message ${cls}`;
  div.textContent = text;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function init() {
  appendMessage("Caricamento modello…", "bot");
  try {
    // inizializza WebLLM
    llm = await WebLLM.load({
      model: MODEL_URL,
    });
    // elimina il messaggio di caricamento sostituendolo
    chatContainer.innerHTML = "";
    appendMessage("Modello pronto! Scrivi qualcosa.", "bot");
  } catch (e) {
    appendMessage("Errore nel caricamento del modello.", "bot");
    console.error(e);
  }
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || !llm) return;
  appendMessage(text, "user");
  userInput.value = "";
  try {
    const resp = await llm.chat.completions.create({
      messages: [{ role: "user", content: text }],
    });
    const botText = resp.choices?.[0]?.message?.content || "";
    appendMessage(botText, "bot");
  } catch (e) {
    appendMessage("Errore di elaborazione.", "bot");
    console.error(e);
  }
}

window.addEventListener("load", init);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});
