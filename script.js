let llm;                     // oggetto WebLLM

// NOTE: HuggingFace model files by default send CORS headers that allow only
//       requests originating from https://huggingface.co. When hosting this
//       page on GitHub Pages (or any other domain) the browser will block
//       fetches due to CORS, resulting in an error such as the one reported
//       "Errore nel caricamento del modello."  To avoid this you must provide
//       a model URL that serves the weights with permissive CORS headers (e.g.
//       host them yourself through the same origin as the page).
//
//       A simple approach is to download the entire model directory from
//       HuggingFace, add it to your repo (e.g. in a "model" subfolder) and
//       point MODEL_URL at the local path.  For example:
//         const MODEL_URL = "./model/";
//
//       The example below still points at the HuggingFace remote for
//       illustration, but will fail when the page is loaded from GitHub Pages.
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

  if (typeof WebLLM === "undefined") {
    // il CDN non è stato caricato correttamente
    appendMessage(
      "Errore: WebLLM non è definito. Controlla la connessione al CDN " +
        "e che la libreria sia inclusa prima di `script.js`.",
      "bot"
    );
    console.error("WebLLM global non trovato, libreria CDN non caricata.");
    return;
  }

  try {
    // inizializza WebLLM
    llm = await WebLLM.load({
      model: MODEL_URL,
    });
    // elimina il messaggio di caricamento sostituendolo
    chatContainer.innerHTML = "";
    appendMessage("Modello pronto! Scrivi qualcosa.", "bot");
  } catch (e) {
    // Log completo per consentire il debug in console; verrà spesso contenere
    // un messaggio CORS o network che spiega cosa non è andato a buon fine.
    console.error("impossibile caricare il modello", e);

    let msg = "Errore nel caricamento del modello.";
    if (e?.message && e.message.match(/cors|network/i)) {
      msg += " Probabilmente si tratta di un problema CORS: i file del modello " +
             "devono essere serviti con Access-Control-Allow-Origin=* o dallo " +
             "stesso dominio della pagina (vedi commenti in script.js).";
    }
    appendMessage(msg, "bot");
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
