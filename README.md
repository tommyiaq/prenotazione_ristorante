# WebLLM Static Chatbot

This repository contains a minimal static webpage demonstrating a browser-only
WebLLM chatbot. It does **not** require any server-side components or API
tokens; all inference happens client-side via WebGPU / WASM.

## Files

* `index.html` – simple chat UI and explanatory comments.
* `script.js` – ES module that imports WebLLM from the CDN and initializes the
  engine.

## Usage

1. **Download a model** that has been compiled for MLC WebGPU. Typical files
   include:
   * `model.wasm` (the compiled Wasm library)
   * `mlc-chat-config.json` (chat configuration)
   * tensor shards (`*.safetensors` or similar)
   * tokenizer files (`tokenizer.json` or `tokenizer.model`)

2. Place the model directory in the repository (e.g. `./model/`).

3. In `script.js` set the `MODEL_URL` constant to point at the directory:
   ```js
   const MODEL_URL = "./model/";
   ```

4. Also ensure the `model_lib` field in the configuration points to the WASM
   file, e.g.:  `model_lib: MODEL_URL + "model.wasm"`.

5. Host the files on a single origin (GitHub Pages, local web server, etc.) so
   that the browser can load weights and wasm without CORS errors.

6. Open `index.html` in a WebGPU-compatible browser and start chatting.

## CORS and Model Hosting

Browsers enforce cross-origin rules when fetching the model assets. The
HuggingFace CDN does **not** set permissive CORS headers, so attempting to use
`MODEL_URL` that points to a `https://huggingface.co/.../resolve/main/` path
will usually fail with network errors. Workarounds:

* Serve the model files from the same domain as the page (recommended).
* Configure your server or CDN to send `Access-Control-Allow-Origin: *`.

## Troubleshooting

* **`ModelNotFoundError`** – usually due to an incorrect `model_id` or
  missing entry in `appConfig.model_list`.
* **`MissingModelError: Missing model_lib`** – configuration did not include a
  `model_lib` URL. See step 4 above.
* **`Errore nel caricamento del modello` / CORS errors** – see the notes above
  about hosting and headers.

## Notes

This example uses the library published at `https://esm.run/@mlc-ai/web-llm`.
The API is asynchronous and returns a `MLCEngine` instance via
`CreateMLCEngine(modelId, config)`.

If you run into further errors, inspect the browser console; the script
already prints helpful messages for CORS and network failures.
