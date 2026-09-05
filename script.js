(() => {
  'use strict';

  const API_KEY_STORAGE = 'gemini_api_key';
  const MODEL = 'gemini-2.5-flash-image';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const $ = (id) => document.getElementById(id);

  // ---------- Estado de imágenes cargadas ----------
  // Cada slot guarda { mimeType, data (base64 sin prefijo) }
  const images = { edit: null, a: null, b: null };

  // ---------- Utilidades ----------
  function fileToImagePart(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const [, base64] = dataUrl.split(',');
        resolve({ mimeType: file.type || 'image/png', data: base64, dataUrl });
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  function showToast(msg) {
    const toast = $('toast');
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  }

  function setApiKey(key) {
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
    updateKeyDot();
  }

  function updateKeyDot() {
    $('key-status-dot').classList.toggle('set', !!getApiKey());
  }

  function setError(elId, msg) {
    const el = $(elId);
    if (!msg) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = msg;
  }

  // ---------- Dropzones genéricas ----------
  function setupDropzone({ zoneId, inputId, emptyId, previewId, removeId, slotKey }) {
    const zone = $(zoneId);
    const input = $(inputId);
    const empty = $(emptyId);
    const preview = $(previewId);
    const removeBtn = $(removeId);

    async function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        showToast('Por favor selecciona un archivo de imagen válido.');
        return;
      }
      try {
        const part = await fileToImagePart(file);
        images[slotKey] = part;
        preview.src = part.dataUrl;
        preview.hidden = false;
        empty.hidden = true;
        removeBtn.hidden = false;
      } catch (e) {
        showToast(e.message);
      }
    }

    zone.addEventListener('click', (e) => {
      if (e.target === removeBtn) return;
      input.click();
    });
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', () => handleFile(input.files[0]));

    ['dragenter', 'dragover'].forEach((evt) => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach((evt) => {
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
      });
    });
    zone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      handleFile(file);
    });

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      images[slotKey] = null;
      input.value = '';
      preview.hidden = true;
      preview.removeAttribute('src');
      empty.hidden = false;
      removeBtn.hidden = true;
    });

    return { setFromDataUrl: (part) => {
      images[slotKey] = part;
      preview.src = part.dataUrl;
      preview.hidden = false;
      empty.hidden = true;
      removeBtn.hidden = false;
    } };
  }

  const editZone = setupDropzone({
    zoneId: 'dropzone-edit', inputId: 'file-edit', emptyId: 'dropzone-edit-empty',
    previewId: 'preview-edit', removeId: 'remove-edit', slotKey: 'edit',
  });
  setupDropzone({
    zoneId: 'dropzone-a', inputId: 'file-a', emptyId: 'dropzone-a-empty',
    previewId: 'preview-a', removeId: 'remove-a', slotKey: 'a',
  });
  setupDropzone({
    zoneId: 'dropzone-b', inputId: 'file-b', emptyId: 'dropzone-b-empty',
    previewId: 'preview-b', removeId: 'remove-b', slotKey: 'b',
  });

  // ---------- Tabs ----------
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // ---------- Presets ----------
  document.querySelectorAll('.preset-card').forEach((card) => {
    card.addEventListener('click', () => {
      $('prompt-edit').value = card.dataset.prompt;
      document.querySelector('.tab[data-tab="edit"]').click();
      showToast('Prompt aplicado. Sube una imagen y pulsa "Generar imagen".');
      $('prompt-edit').focus();
    });
  });

  // ---------- Historial ----------
  const historyItems = [];
  function addToHistory(dataUrl) {
    historyItems.unshift(dataUrl);
    const grid = $('history-grid');
    const div = document.createElement('div');
    div.className = 'history-item';
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Resultado anterior';
    div.appendChild(img);
    div.addEventListener('click', () => {
      editZone.setFromDataUrl({ mimeType: 'image/png', data: dataUrl.split(',')[1], dataUrl });
      document.querySelector('.tab[data-tab="edit"]').click();
      showToast('Imagen cargada en la pestaña "Editar imagen".');
    });
    grid.prepend(div);
    $('history-section').hidden = false;
  }

  // ---------- Llamada a la API de Gemini ----------
  async function callGemini(promptText, parts) {
    const apiKey = getApiKey();
    if (!apiKey) {
      $('key-modal-backdrop').classList.add('open');
      throw new Error('Necesitas configurar tu API Key de Gemini primero.');
    }

    const body = {
      contents: [{
        parts: [
          { text: promptText },
          ...parts.map((p) => ({ inlineData: { mimeType: p.mimeType, data: p.data } })),
        ],
      }],
    };

    let response;
    try {
      response = await fetch(`${API_URL}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new Error('No se pudo conectar con la API de Gemini. Revisa tu conexión.');
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = json && json.error && json.error.message
        ? json.error.message
        : `Error de la API (${response.status}).`;
      throw new Error(msg);
    }

    const candidateParts = json && json.candidates && json.candidates[0]
      && json.candidates[0].content && json.candidates[0].content.parts;

    if (!candidateParts) {
      throw new Error('La API no devolvió ningún resultado.');
    }

    const imagePart = candidateParts.find((p) => p.inlineData && p.inlineData.data);
    if (!imagePart) {
      const textPart = candidateParts.find((p) => p.text);
      throw new Error(textPart ? textPart.text : 'La API no devolvió ninguna imagen.');
    }

    const mime = imagePart.inlineData.mimeType || 'image/png';
    return `data:${mime};base64,${imagePart.inlineData.data}`;
  }

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.innerHTML = busy ? `<span class="spin"></span>Generando...` : label;
  }

  // ---------- Editar imagen ----------
  $('btn-generate-edit').addEventListener('click', async () => {
    const btn = $('btn-generate-edit');
    const prompt = $('prompt-edit').value.trim();
    setError('error-edit', '');

    if (!images.edit) { setError('error-edit', 'Sube primero una imagen.'); return; }
    if (!prompt) { setError('error-edit', 'Escribe un prompt describiendo el cambio.'); return; }

    setBusy(btn, true, 'Generar imagen');
    try {
      const resultUrl = await callGemini(prompt, [images.edit]);
      $('result-edit').src = resultUrl;
      $('download-edit').href = resultUrl;
      $('result-edit-wrap').hidden = false;
      addToHistory(resultUrl);
      $('result-edit-wrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      setError('error-edit', e.message);
    } finally {
      setBusy(btn, false, 'Generar imagen');
    }
  });

  $('reuse-edit').addEventListener('click', () => {
    const dataUrl = $('result-edit').src;
    editZone.setFromDataUrl({ mimeType: 'image/png', data: dataUrl.split(',')[1], dataUrl });
    showToast('Resultado cargado como nueva imagen de entrada.');
  });

  // ---------- Combinar imágenes ----------
  $('btn-generate-combine').addEventListener('click', async () => {
    const btn = $('btn-generate-combine');
    const prompt = $('prompt-combine').value.trim();
    setError('error-combine', '');

    if (!images.a || !images.b) { setError('error-combine', 'Sube las dos imágenes (A y B).'); return; }
    if (!prompt) { setError('error-combine', 'Escribe un prompt describiendo cómo combinarlas.'); return; }

    setBusy(btn, true, 'Combinar imágenes');
    try {
      const resultUrl = await callGemini(prompt, [images.a, images.b]);
      $('result-combine').src = resultUrl;
      $('download-combine').href = resultUrl;
      $('result-combine-wrap').hidden = false;
      addToHistory(resultUrl);
      $('result-combine-wrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      setError('error-combine', e.message);
    } finally {
      setBusy(btn, false, 'Combinar imágenes');
    }
  });

  // ---------- Modal API Key ----------
  $('btn-open-key').addEventListener('click', () => {
    $('input-api-key').value = getApiKey();
    $('key-modal-backdrop').classList.add('open');
  });
  $('btn-key-cancel').addEventListener('click', () => {
    $('key-modal-backdrop').classList.remove('open');
  });
  $('key-modal-backdrop').addEventListener('click', (e) => {
    if (e.target === $('key-modal-backdrop')) $('key-modal-backdrop').classList.remove('open');
  });
  $('btn-key-save').addEventListener('click', () => {
    setApiKey($('input-api-key').value.trim());
    $('key-modal-backdrop').classList.remove('open');
    showToast('API Key guardada en este navegador.');
  });
  $('btn-clear-key').addEventListener('click', () => {
    setApiKey('');
    $('input-api-key').value = '';
    showToast('API Key eliminada.');
  });

  updateKeyDot();
  if (!getApiKey()) {
    setTimeout(() => $('key-modal-backdrop').classList.add('open'), 400);
  }
})();
