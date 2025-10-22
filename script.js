(function(){
  const STORAGE_KEY = 'megafone_frases';
  const defaultPhrases = [
    'Auxiliar de limpeza, frente de caixa.',
    'Atenção clientes: o mercado fechará em 10 minutos.',
    'Promoção relâmpago na seção de hortifruti!',
    'Gerente de loja, favor dirigir-se ao caixa.',
    'Equipe de reposição, por favor, setor de bebidas.',
    'Atenção: operação de frente de caixa iniciando agora.',
  ];

  // Ícones SVG consistentes
  function icon(name){
    const wrap = (inner) => `<span class="btn-ico" aria-hidden="true"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" aria-hidden="true">${inner}</svg></span>`;
    switch(name){
      case 'play': return wrap('<polygon points="5 3 19 12 5 21 5 3"></polygon>');
      case 'stop': return wrap('<rect x="6" y="6" width="12" height="12" rx="2"></rect>');
      case 'volume': return wrap('<polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5"></polygon>');
      case 'bookmark': return wrap('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>');
      case 'trash': return wrap('<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 13a2 2 0 0 1 -2 2H8a2 2 0 0 1 -2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>');
      case 'edit': return wrap('<path d="M12 20h9"></path><path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z"></path>');
      default: return wrap('<circle cx="12" cy="12" r="6"></circle>');
    }
  }

  const els = {
    voiceSelect: document.getElementById('voiceSelect'),
    rate: document.getElementById('rate'),
    pitch: document.getElementById('pitch'),
    volume: document.getElementById('volume'),
    rateVal: document.getElementById('rateVal'),
    pitchVal: document.getElementById('pitchVal'),
    volumeVal: document.getElementById('volumeVal'),
    testVoiceBtn: document.getElementById('testVoiceBtn'),
    stopBtn: document.getElementById('stopBtn'),
    voiceStatus: document.getElementById('voiceStatus'),
    phrasesContainer: document.getElementById('phrasesContainer'),
    newPhrase: document.getElementById('newPhrase'),
    addPhraseBtn: document.getElementById('addPhraseBtn'),
    speakNowBtn: document.getElementById('speakNowBtn'),
    insertNameTokenBtn: document.getElementById('insertNameTokenBtn'),
  };

  let voices = [];
  let selectedVoice = null;

  function loadPhrases(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...defaultPhrases];
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
      return [...defaultPhrases];
    } catch { return [...defaultPhrases]; }
  }
  function savePhrases(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function resolveText(text, name){
    const nome = String(name || '').trim();
    const t = String(text || '');
    // Suporta {NOME} e {nome}
    return t.replace(/\{NOME\}/g, nome || '').replace(/\{nome\}/g, nome || '');
  }

  function insertAtCursor(textarea, token){
    const el = textarea;
    const val = String(el.value || '');
    const start = el.selectionStart ?? val.length;
    const end = el.selectionEnd ?? val.length;
    const needsSpace = start > 0 && !(/\s/.test(val[start-1] || ''));
    const insert = (needsSpace ? ' ' : '') + token;
    el.value = val.slice(0, start) + insert + val.slice(end);
    const newPos = start + insert.length;
    try { el.setSelectionRange(newPos, newPos); } catch {}
    el.focus();
  }

  function renderPhrases(){
    const list = loadPhrases();
    els.phrasesContainer.innerHTML = '';
    list.forEach((text, idx) => {
      const card = document.createElement('div');
      card.className = 'phrase-card';

      const p = document.createElement('div');
      p.className = 'phrase-text';
      p.textContent = text;

      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const speakBtn = document.createElement('button');
      speakBtn.className = 'btn btn-primary';
      speakBtn.innerHTML = icon('volume') + ' Falar';
      speakBtn.addEventListener('click', () => speak(text, speakBtn));

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-tertiary';
      editBtn.innerHTML = icon('edit') + ' Editar';
      editBtn.addEventListener('click', () => {
        const input = document.createElement('textarea');
        input.className = 'edit-input';
        input.rows = 3;
        input.value = text;

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-secondary';
        saveBtn.innerHTML = icon('bookmark') + ' Salvar';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-danger';
        cancelBtn.innerHTML = icon('stop') + ' Cancelar';

        // Substitui conteúdo do cartão por modo edição
        card.innerHTML = '';
        const editWrap = document.createElement('div');
        editWrap.className = 'edit-wrap';
        editWrap.appendChild(input);

        const editActions = document.createElement('div');
        editActions.className = 'card-actions';
        editActions.appendChild(saveBtn);
        editActions.appendChild(cancelBtn);

        card.appendChild(editWrap);
        card.appendChild(editActions);

        input.focus();
        try { input.setSelectionRange(input.value.length, input.value.length); } catch {}

        const doSave = () => {
          const newText = (input.value || '').trim();
          if (!newText) return;
          const updated = loadPhrases();
          updated[idx] = newText;
          savePhrases(updated);
          renderPhrases();
        };
        saveBtn.addEventListener('click', doSave);
        cancelBtn.addEventListener('click', () => renderPhrases());
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-danger';
      removeBtn.innerHTML = icon('trash') + ' Remover';
      removeBtn.addEventListener('click', () => {
        const updated = loadPhrases();
        updated.splice(idx, 1);
        savePhrases(updated);
        renderPhrases();
      });

      actions.appendChild(speakBtn);
      actions.appendChild(editBtn);
      actions.appendChild(removeBtn);

      card.appendChild(p);
      card.appendChild(actions);
      els.phrasesContainer.appendChild(card);
    });
  }

  function populateVoices(){
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  
    const brVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('pt-br'));
    const ptVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('pt') && !v.lang.toLowerCase().startsWith('pt-br'));
    const usable = [...brVoices, ...ptVoices];
  
    els.voiceSelect.innerHTML = '';
  
    if (!usable.length){
      els.voiceStatus.textContent = 'Nenhuma voz pt‑BR/pt encontrada. Verifique seu navegador.';
      return;
    }
  
    usable.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${v.name} (${v.lang})`;
      els.voiceSelect.appendChild(opt);
    });
  
    let setIndex = 0;
    if (selectedVoice) {
      const found = usable.findIndex(v => v.name === selectedVoice.name && v.lang === selectedVoice.lang);
      if (found >= 0) setIndex = found;
    }
  
    els.voiceSelect.value = String(setIndex);
    selectedVoice = usable[setIndex];
  
    els.voiceStatus.textContent = `Vozes (pt/pt‑BR): ${usable.length} • Selecionada: ${selectedVoice.name} (${selectedVoice.lang})`;
  }

  function speak(text, sourceEl){
    if (!('speechSynthesis' in window)){
      alert('Seu navegador não suporta síntese de voz. Tente o Chrome ou Edge.');
      return;
    }
    const trimmed = String(text || '').trim();
    if (!trimmed){ return; }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(trimmed);

    utter.lang = 'pt-BR';
    utter.rate = parseFloat(els.rate.value || '1');
    utter.pitch = parseFloat(els.pitch.value || '1');
    utter.volume = parseFloat(els.volume.value || '1');

    // Seleção de voz
    try {
      const idx = parseInt(els.voiceSelect.value, 10);
      const brVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('pt-br'));
      const ptVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('pt') && !v.lang.toLowerCase().startsWith('pt-br'));
      const usable = [...brVoices, ...ptVoices];
      utter.voice = selectedVoice || usable[idx] || null;
      if (utter.voice && utter.voice.lang) {
        utter.lang = utter.voice.lang;
      }
    } catch {}

    utter.onstart = () => { try { sourceEl && sourceEl.classList.add('speaking'); } catch {} };
    const clearSpeaking = () => { try { sourceEl && sourceEl.classList.remove('speaking'); } catch {} };
    utter.onend = clearSpeaking;
    utter.onerror = clearSpeaking;

    window.speechSynthesis.speak(utter);
  }

  function init(){
    // Atualizar mostradores
    const updateLabels = () => {
      els.rateVal.textContent = els.rate.value;
      els.pitchVal.textContent = els.pitch.value;
      els.volumeVal.textContent = els.volume.value;
    };
    updateLabels();
    ['input', 'change'].forEach(evt => {
      els.rate.addEventListener(evt, updateLabels);
      els.pitch.addEventListener(evt, updateLabels);
      els.volume.addEventListener(evt, updateLabels);
    });

    // Vozes
    if ('speechSynthesis' in window){
      populateVoices();
      window.speechSynthesis.onvoiceschanged = () => populateVoices();
      els.voiceSelect.addEventListener('change', () => {
        try {
          const idx = parseInt(els.voiceSelect.value, 10);
          const brVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('pt-br'));
          const ptVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('pt') && !v.lang.toLowerCase().startsWith('pt-br'));
          const usable = [...brVoices, ...ptVoices];
          selectedVoice = usable[idx] || null;
          if (selectedVoice) {
            els.voiceStatus.textContent = `Voz selecionada: ${selectedVoice.name} (${selectedVoice.lang})`;
          }
        } catch {}
      });
    } else {
      els.voiceStatus.textContent = 'Síntese de voz não suportada neste navegador.';
    }

    // Render inicial
    renderPhrases();

    // Ações
    els.testVoiceBtn.innerHTML = icon('volume') + ' Testar voz';
    els.stopBtn.innerHTML = icon('stop') + ' Parar fala';
    els.speakNowBtn.innerHTML = icon('play') + ' Falar agora';
    els.addPhraseBtn.innerHTML = icon('bookmark') + ' Salvar como botão';
    if (els.insertNameTokenBtn) {
      els.insertNameTokenBtn.innerHTML = icon('edit') + ' Inserir {nome}';
    }

    els.testVoiceBtn.addEventListener('click', () => speak('Teste de voz. Esta é uma voz brasileira feminina.', els.testVoiceBtn));
    els.stopBtn.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      document.querySelectorAll('.btn.speaking').forEach(b => b.classList.remove('speaking'));
    });

    els.speakNowBtn.addEventListener('click', () => speak(els.newPhrase.value, els.speakNowBtn));
    if (els.insertNameTokenBtn) {
      els.insertNameTokenBtn.addEventListener('click', () => insertAtCursor(els.newPhrase, '{nome}'));
    }
    els.addPhraseBtn.addEventListener('click', () => {
      const text = (els.newPhrase.value || '').trim();
      if (text.length < 1) return;
      const list = loadPhrases();
      list.unshift(text);
      savePhrases(list);
      els.newPhrase.value = '';
      renderPhrases();
    });

    // Atalhos: números 1-9 falam as primeiras frases
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLTextAreaElement) return; // não atrapalhar digitação
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= 9){
        const list = loadPhrases();
        const phrase = list[n-1];
        if (phrase) speak(phrase);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  // Registrar service worker para PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service worker registrado:', reg.scope))
        .catch(err => console.warn('Falha ao registrar service worker:', err));
    });
  }
})();