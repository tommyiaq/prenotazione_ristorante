// script.js is loaded as an ES module (see index.html).  We import the
// library from the official CDN endpoint using esm.run which exposes the
// `CreateMLCEngine` API.  The library does **not** provide a global variable,
// hence the previous "WebLLM undefined" error when including a nonexisting
// UMD file.
import * as WebLLM from "https://esm.run/@mlc-ai/web-llm";

// for convenience/debugging we also drop it on window
window.WebLLM = WebLLM;

let llm;                     // oggetto MLCEngine

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

  // We can't pass the raw URL directly to CreateMLCEngine; the engine
  // expects a model **ID** that is referenced inside an `appConfig` object.
  // We'll create a tiny config pointing the ID "browser-model" at our
  // HuggingFace URL.  Note this config could also reference a local
  // directory if you host the weights yourself (recommended for CORS).
  const engineConfig = {
    appConfig: {
      model_list: [
        {
          model_id: "browser-model",
          model: MODEL_URL,
          // WebLLM needs the URL of the compiled WebAssembly library for the
          // model.  This file is usually named `model.wasm` (or similar) and
          // lives next to the shard files.  You must ensure the URL you
          // provide is CORS‑accessible from the page's origin as discussed
          // above.  If you host the model locally, point to the local path:
          //    model_lib: "./model/model.wasm"
          // For our example using the HuggingFace repo this would be:
          //    model_lib: MODEL_URL + "model.wasm"
          // Replace with the correct filename for your particular model.
          model_lib: MODEL_URL + "model.wasm",
        },
      ],
    },
  };

  try {
    // instantiate using the custom config and the ID we defined above
    llm = await WebLLM.CreateMLCEngine("browser-model", engineConfig);

    // reset chat and notify ready
    chatContainer.innerHTML = "";
    appendMessage("Modello pronto! Scrivi qualcosa.", "bot");
  } catch (e) {
    console.error("impossibile caricare il modello", e);

    let msg = "Errore nel caricamento del modello.";
    if (e?.message && e.message.match(/cors|network/i)) {
      msg += " Probabilmente si tratta di un problema CORS: i file del modello " +
             "devono essere serviti con Access-Control-Allow-Origin=* o dallo " +
             "stesso dominio della pagina (vedi commenti in script.js).";    } else if (e?.message && e.message.match(/MissingModelWasmError|MissingModelError/)) {
      msg += " Configurazione incompleta: assicurati di specificare `model_lib` " +
             "puntando al file .wasm della libreria del modello (es. `model.wasm`).";    }
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
