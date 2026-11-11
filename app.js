(function (global) {
  'use strict';

  const Dict = global.KidWordsDict;
  const Audio = global.KidWordsAudio;
  const Store = global.KidWordsStore;

  let state = Store.loadState();

  const ui = {
    activeView: 'library',
    selectedTopicId: 'all',
    searchQuery: '',
    boxFilter: 'all',
    // Add form visual state
    draftImageType: 'emoji',
    draftImageValue: '✨',
    userEditedVi: false,
    userEditedTopic: false,
    userEditedSticker: false,
    userEditedExample: false,
    translateTimer: null,
    bulkParsed: [],
    // Study state
    studyMode: 'spell',
    spellDifficulty: 'easy', // easy (2 hints) | medium (1 hint) | hard (0 hints)
    session: null
  };

  // ---------- Helpers ----------
  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    const container = $('toast-container');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 2800);
  }

  function getTopicMeta(topicId) {
    const all = Store.getAllTopics(state);
    return all.find((t) => t.id === topicId) || { id: 'other', nameVi: 'Chủ đề khác', nameEn: 'General', icon: '✨', color: '#F1F5F9' };
  }

  function renderVisualHtml(imageType, imageValue, fallbackEmoji = '✨') {
    if (imageType === 'color' && imageValue) {
      return `<div class="visual-color-dot" style="background:${escapeHtml(imageValue)}"></div>`;
    }
    if ((imageType === 'dataUrl' || imageType === 'url') && imageValue) {
      return `<img class="visual-img" src="${escapeHtml(imageValue)}" alt="Minh họa" onerror="this.outerHTML='<span class=visual-emoji>${fallbackEmoji}</span>'" />`;
    }
    return `<span class="visual-emoji">${escapeHtml(imageValue || fallbackEmoji)}</span>`;
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function speakBtnClick(text, rate = 0.92) {
    const ok = Audio.speakEnglish(text, rate);
    if (!ok) showToast('Trình duyệt này chưa hỗ trợ đọc giọng nói.');
  }

  // ---------- Header & Navigation ----------
  function renderHeaderStats() {
    $('stat-streak').textContent = state.stats.streak || 0;
    $('stat-stars').textContent = state.stats.stars || 0;

    const dueCount = state.cards.filter((c) => Store.isCardDue(c)).length;
    const badge = $('due-nav-badge');
    if (dueCount > 0) {
      badge.textContent = dueCount;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    $('due-count-hero').textContent = dueCount;
    const goal = state.stats.dailyGoal || 10;
    const done = state.stats.todayCount || 0;
    $('daily-goal-text').textContent = `${done}/${goal}`;
    const pct = Math.min(100, Math.round((done / goal) * 100));
    $('daily-goal-bar').style.width = pct + '%';
  }

  function switchView(viewName) {
    ui.activeView = viewName;
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    document.querySelectorAll('.view').forEach((sec) => {
      sec.classList.toggle('active', sec.id === 'view-' + viewName);
    });

    if (viewName === 'library') renderLibrary();
    if (viewName === 'study') renderStudySetup();
    if (viewName === 'add') renderAddViewInit();
    if (viewName === 'progress') renderProgressView();
  }

  // ---------- View 1: Library & Topics ----------
  function renderLibrary() {
    renderHeaderStats();
    const topics = Store.getAllTopics(state);
    const grid = $('topics-grid');
    grid.innerHTML = '';

    // "All words" summary card + per-topic cards
    topics.forEach((topic) => {
      const cardsInTopic = state.cards.filter((c) => c.topicId === topic.id);
      if (cardsInTopic.length === 0 && topic.id === 'other') return;

      const mastered = cardsInTopic.filter((c) => (c.box || 1) >= 4).length;
      const pct = cardsInTopic.length ? Math.round((mastered / cardsInTopic.length) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'topic-card' + (ui.selectedTopicId === topic.id ? ' selected' : '');
      card.innerHTML = `
        <div class="topic-top">
          <div class="topic-emoji" style="background:${topic.color || '#F1F5F9'}">${escapeHtml(topic.icon)}</div>
          <span class="topic-count">${cardsInTopic.length} từ</span>
        </div>
        <div class="topic-name">${escapeHtml(topic.nameVi)}</div>
        <div class="topic-name-en">${escapeHtml(topic.nameEn)} • ${pct}% thuộc</div>
        <div class="topic-progress-bar">
          <div class="topic-progress-fill" style="width:${pct}%"></div>
        </div>
      `;
      card.addEventListener('click', () => {
        ui.selectedTopicId = ui.selectedTopicId === topic.id ? 'all' : topic.id;
        renderLibrary();
      });
      grid.appendChild(card);
    });

    renderWordList();
  }

  function renderWordList() {
    const q = ui.searchQuery.trim().toLowerCase();
    const boxF = ui.boxFilter;
    let filtered = state.cards.filter((c) => {
      if (ui.selectedTopicId !== 'all' && c.topicId !== ui.selectedTopicId) return false;
      if (q && !c.en.toLowerCase().includes(q) && !c.vi.toLowerCase().includes(q)) return false;
      if (boxF === 'due' && !Store.isCardDue(c)) return false;
      if (['1', '2', '3', '4', '5'].includes(boxF) && String(c.box || 1) !== boxF) return false;
      return true;
    });

    const titleEl = $('word-list-title');
    if (ui.selectedTopicId === 'all') {
      titleEl.textContent = 'Tất cả từ vựng';
    } else {
      const meta = getTopicMeta(ui.selectedTopicId);
      titleEl.textContent = `${meta.icon} Chủ đề: ${meta.nameVi}`;
    }
    $('word-list-count').textContent = `${filtered.length} từ`;

    const cardsGrid = $('cards-grid');
    if (filtered.length === 0) {
      cardsGrid.innerHTML = `<div class="empty-hint" style="grid-column:1/-1;padding:40px 10px;">Chưa có từ nào phù hợp. Bấm <strong>"+ Thêm từ mới"</strong> để bổ sung nhé!</div>`;
      return;
    }

    cardsGrid.innerHTML = '';
    filtered.forEach((c) => {
      const topic = getTopicMeta(c.topicId);
      const box = c.box || 1;
      const el = document.createElement('div');
      el.className = 'vocab-card';
      el.innerHTML = `
        <div class="vocab-card-top">
          <span class="box-badge box-${box}">Hộp ${box}${box === 5 ? ' 🌟' : ''}</span>
          <div class="vocab-card-actions">
            <button class="mini-btn btn-speak" title="Nghe phát âm">🔊</button>
            <button class="mini-btn btn-edit" title="Sửa thẻ">✏️</button>
            <button class="mini-btn btn-del" title="Xóa thẻ">🗑️</button>
          </div>
        </div>
        <div class="vocab-visual">${renderVisualHtml(c.imageType, c.imageValue)}</div>
        <div class="vocab-en-row">
          <span class="vocab-en">${escapeHtml(c.en)}</span>
        </div>
        <div class="vocab-vi">${escapeHtml(c.vi)}</div>
        <div class="vocab-topic-tag">${escapeHtml(topic.icon)} ${escapeHtml(topic.nameVi)}</div>
      `;
      el.querySelector('.btn-speak').addEventListener('click', () => speakBtnClick(c.en));
      el.querySelector('.btn-edit').addEventListener('click', () => openEditModal(c.id));
      el.querySelector('.btn-del').addEventListener('click', () => {
        if (confirm(`Xóa từ "${c.en}" (${c.vi})?`)) {
          Store.deleteCard(state, c.id);
          renderLibrary();
          showToast('Đã xóa thẻ từ.');
        }
      });
      cardsGrid.appendChild(el);
    });
  }

  // ---------- Edit Modal ----------
  function populateTopicSelect(selectEl, includeNewCustom = false) {
    const topics = Store.getAllTopics(state);
    selectEl.innerHTML = topics
      .map((t) => `<option value="${t.id}">${escapeHtml(t.icon)} ${escapeHtml(t.nameVi)} (${escapeHtml(t.nameEn)})</option>`)
      .join('');
    if (includeNewCustom) {
      selectEl.innerHTML += `<option value="__new_custom__">➕ Tạo chủ đề mới...</option>`;
    }
  }

  function openEditModal(cardId) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    populateTopicSelect($('edit-topic'), false);
    $('edit-id').value = card.id;
    $('edit-en').value = card.en;
    $('edit-vi').value = card.vi;
    $('edit-topic').value = card.topicId;
    $('edit-example').value = card.example || '';
    $('edit-sticker').value = card.imageValue || '✨';
    $('edit-modal').hidden = false;
  }

  // ---------- View 3: Add New Words ----------
  function renderAddViewInit() {
    populateTopicSelect($('inp-topic'), true);
    renderQuickStickers();
    updateAddPreview();
  }

  function renderQuickStickers() {
    const row = $('quick-stickers-row');
    const samples = ['🐶', '🐱', '🍎', '🍌', '✏️', '📖', '🎒', '☀️', '🌈', '🚗', '⚽', '👕', '🏠', '🌟'];
    row.innerHTML = samples
      .map((e) => `<button type="button" class="sticker-chip" data-emoji="${e}">${e}</button>`)
      .join('');
    row.querySelectorAll('.sticker-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.userEditedSticker = true;
        ui.draftImageType = 'emoji';
        ui.draftImageValue = btn.dataset.emoji;
        updateAddPreview();
      });
    });
  }

  const translationCache = {};

  async function translateEnToViOnline(word) {
    const key = word.trim().toLowerCase();
    if (!key) return '';
    if (translationCache[key] !== undefined) return translationCache[key];

    // 1. Primary: Google Translate public gtx endpoint
    try {
      const resp = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        const text = (data && data[0] ? data[0].map((item) => (item && item[0]) || '').join('') : '')
          .trim()
          .toLowerCase();
        if (text && text !== key) {
          translationCache[key] = text;
          return text;
        }
      }
    } catch (_) {}

    // 2. Fallback: MyMemory
    try {
      const resp = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`
      );
      if (resp.ok) {
        const data = await resp.json();
        const translated = (data && data.responseData && data.responseData.translatedText) || '';
        const clean = translated.trim().toLowerCase();
        if (clean && clean !== key && !/mymemory|invalid/i.test(clean)) {
          translationCache[key] = clean;
          return clean;
        }
      }
    } catch (_) {}

    return '';
  }

  async function fetchOnlineSpellSuggestion(word) {
    try {
      const resp = await fetch(
        `https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(word)}&srinfo=suggestion&srlimit=1&format=json&origin=*`
      );
      if (!resp.ok) return '';
      const data = await resp.json();
      const sug = (data && data.query && data.query.searchinfo && data.query.searchinfo.suggestion) || '';
      const clean = sug.trim().toLowerCase();
      if (!clean || clean === word.toLowerCase()) return '';
      return clean;
    } catch (_) {
      return '';
    }
  }

  function renderSpellingSuggestions(suggestions) {
    const box = $('spell-suggest-box');
    if (!box) return;
    if (!suggestions || suggestions.length === 0) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML =
      `<span>🤔 Có phải bạn muốn viết:</span>` +
      suggestions
        .map(
          (s) =>
            `<button type="button" class="suggest-pill" data-word="${escapeHtml(s.word)}">${escapeHtml(s.word)}${s.vi ? ` (${escapeHtml(s.vi)})` : ''}</button>`
        )
        .join('');
    box.querySelectorAll('.suggest-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        $('inp-en').value = btn.dataset.word;
        ui.userEditedVi = false;
        ui.userEditedTopic = false;
        ui.userEditedSticker = false;
        ui.userEditedExample = false;
        renderSpellingSuggestions([]);
        runAutoDetect(true, true);
      });
    });
  }

  function runAutoDetect(allowOnlineTranslate = true, clearUnmatchedVi = true) {
    if (ui.translateTimer) {
      clearTimeout(ui.translateTimer);
      ui.translateTimer = null;
    }

    const en = $('inp-en').value;
    const vi = $('inp-vi').value;
    const res = Dict.autoClassifyWord(en, vi);

    if (!ui.userEditedVi && (res.matched || clearUnmatchedVi)) {
      $('inp-vi').value = res.matched && res.suggestedVi ? res.suggestedVi : '';
    }
    if (!ui.userEditedExample && (res.matched || clearUnmatchedVi)) {
      $('inp-example').value = res.matched && res.example ? res.example : '';
    }
    if (!ui.userEditedTopic) {
      $('inp-topic').value = res.topic;
      $('custom-topic-wrap').hidden = true;
    }
    if (!ui.userEditedSticker) {
      if (res.colorHex) {
        ui.draftImageType = 'color';
        ui.draftImageValue = res.colorHex;
      } else {
        ui.draftImageType = 'emoji';
        ui.draftImageValue = res.emoji;
      }
    }

    const topicMeta = getTopicMeta($('inp-topic').value);
    const trimmedEn = en.trim();
    if (trimmedEn) {
      $('auto-detect-status').textContent = res.matched
        ? `✨ Nhận diện từ chuẩn lớp 3 → Chủ đề: ${topicMeta.icon} ${topicMeta.nameVi}`
        : `🤖 Tự phân loại vào chủ đề: ${topicMeta.icon} ${topicMeta.nameVi}`;
    } else {
      $('auto-detect-status').textContent = 'Gõ từ tiếng Anh để hệ thống tự tìm chủ đề, nghĩa & hình minh họa.';
    }

    const localSuggestions = res.matched ? [] : Dict.findSpellingSuggestions(trimmedEn);
    if (allowOnlineTranslate || res.matched || localSuggestions.length > 0) {
      renderSpellingSuggestions(localSuggestions);
    }

    updateAddPreview();

    // Online fallback translation + spell suggestion for words not yet in built-in Grade 3 dictionary
    if (allowOnlineTranslate && !res.matched && trimmedEn.length >= 2) {
      const requestedWord = trimmedEn;
      ui.translateTimer = setTimeout(async () => {
        if ($('inp-en').value.trim() !== requestedWord) return;
        const shouldTranslate = !ui.userEditedVi;
        if (shouldTranslate) {
          $('auto-detect-status').textContent = '⏳ Đang tra nghĩa tiếng Việt...';
        }
        const [translatedVi, onlineSug] = await Promise.all([
          shouldTranslate ? translateEnToViOnline(requestedWord) : Promise.resolve(''),
          localSuggestions.length === 0 && requestedWord.length >= 3
            ? fetchOnlineSpellSuggestion(requestedWord)
            : Promise.resolve('')
        ]);

        if ($('inp-en').value.trim() !== requestedWord) return;

        if (onlineSug && !localSuggestions.some((s) => s.word === onlineSug)) {
          renderSpellingSuggestions([...localSuggestions, { word: onlineSug, vi: '' }]);
        }

        if (shouldTranslate && !ui.userEditedVi) {
          if (translatedVi) {
            $('inp-vi').value = translatedVi;
            runAutoDetect(false, false);
          } else {
            const fallbackTopic = getTopicMeta($('inp-topic').value);
            $('auto-detect-status').textContent = `🤖 Tự phân loại vào chủ đề: ${fallbackTopic.icon} ${fallbackTopic.nameVi} (hãy nhập nghĩa tiếng Việt)`;
          }
        }
      }, 320);
    }
  }

  function updateAddPreview() {
    const en = $('inp-en').value.trim() || 'English word';
    const vi = $('inp-vi').value.trim() || 'Nghĩa tiếng Việt';
    const ex = $('inp-example').value.trim();
    const topicVal = $('inp-topic').value;
    if (topicVal === '__new_custom__') {
      const customName = $('inp-custom-topic').value.trim() || 'Chủ đề mới';
      $('prev-topic').textContent = `🏷️ ${customName}`;
    } else {
      const meta = getTopicMeta(topicVal);
      $('prev-topic').textContent = `${meta.icon} ${meta.nameVi}`;
    }
    $('prev-en').textContent = en;
    $('prev-vi').textContent = vi;
    $('prev-ex').textContent = ex ? `"${ex}"` : '';
    $('prev-visual').innerHTML = renderVisualHtml(ui.draftImageType, ui.draftImageValue);
  }

  function resizeImageToDataUrl(file, maxSize = 300) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/webp', 0.82));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function fetchWikipediaThumbnail() {
    const word = $('inp-en').value.trim();
    if (!word) {
      showToast('Hãy nhập từ tiếng Anh trước nhé!');
      return;
    }
    const btn = $('btn-fetch-wiki-img');
    const oldText = btn.textContent;
    btn.textContent = '⏳ Đang tìm...';
    btn.disabled = true;
    try {
      const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`);
      if (!resp.ok) throw new Error('not found');
      const data = await resp.json();
      const thumb = data.thumbnail && data.thumbnail.source;
      if (!thumb) throw new Error('no image');
      ui.userEditedSticker = true;
      ui.draftImageType = 'url';
      ui.draftImageValue = thumb;
      updateAddPreview();
      showToast('Đã tìm thấy hình minh họa!');
    } catch (_) {
      showToast('Không tìm thấy ảnh online cho từ này. Bạn có thể chọn Sticker hoặc tải ảnh lên.');
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  }

  function parseBulkInput(rawText) {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results = [];
    lines.forEach((line) => {
      let en = '';
      let vi = '';
      const sepMatch = line.match(/^(.+?)\s*(?:-|:|\||–|=|\t)\s*(.+)$/);
      if (sepMatch) {
        en = sepMatch[1].trim();
        vi = sepMatch[2].trim();
      } else {
        en = line.trim();
      }
      if (!en) return;
      const cls = Dict.autoClassifyWord(en, vi);
      const finalVi = vi || cls.suggestedVi || '(chưa có nghĩa)';
      results.push({
        en,
        vi: finalVi,
        topicId: cls.topic,
        imageType: cls.colorHex ? 'color' : 'emoji',
        imageValue: cls.colorHex || cls.emoji,
        example: cls.example || ''
      });
    });
    return results;
  }

  // ---------- View 2: Study Setup & Sessions ----------
  function renderStudySetup() {
    $('study-setup').hidden = false;
    $('study-stage').hidden = true;
    $('study-summary').hidden = true;

    const sel = $('study-topic-select');
    const current = sel.value || 'all';
    const topics = Store.getAllTopics(state);
    let html = `<option value="all">🌟 Tất cả chủ đề (${state.cards.length} từ)</option>`;
    topics.forEach((t) => {
      const count = state.cards.filter((c) => c.topicId === t.id).length;
      if (count > 0) {
        html += `<option value="${t.id}">${escapeHtml(t.icon)} ${escapeHtml(t.nameVi)} (${count} từ)</option>`;
      }
    });
    sel.innerHTML = html;
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  }

  function buildStudyDeck(topicId, filterType, limit) {
    let pool = state.cards.filter((c) => topicId === 'all' || c.topicId === topicId);
    if (filterType === 'box12') {
      const b12 = pool.filter((c) => (c.box || 1) <= 2);
      if (b12.length > 0) pool = b12;
    } else if (filterType === 'smart') {
      // Due cards first, then lower box first, shuffled within same priority
      const now = Date.now();
      pool = shuffle(pool).sort((a, b) => {
        const aDue = Store.isCardDue(a, now) ? 0 : 1;
        const bDue = Store.isCardDue(b, now) ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return (a.box || 1) - (b.box || 1);
      });
    } else {
      pool = shuffle(pool);
    }
    return pool.slice(0, Math.max(1, limit));
  }

  function startStudySession(mode, overrideCards = null) {
    const topicId = $('study-topic-select').value || 'all';
    const filterType = $('study-filter-select').value || 'smart';
    const limit = parseInt($('study-limit-select').value, 10) || 8;
    const deck = overrideCards || buildStudyDeck(topicId, filterType, limit);

    if (deck.length === 0) {
      showToast('Chủ đề này chưa có từ nào. Hãy thêm từ mới trước nhé!');
      return;
    }
    if (mode === 'match' && deck.length < 2) {
      showToast('Trò chơi ghép cặp cần ít nhất 2 từ vựng.');
      return;
    }

    ui.studyMode = mode;
    ui.session = {
      mode,
      deck,
      index: 0,
      correctCount: 0,
      starsEarned: 0,
      mistakes: [],
      useTiles: $('opt-word-tiles').checked
    };

    $('study-setup').hidden = true;
    $('study-summary').hidden = true;
    $('study-stage').hidden = false;
    renderCurrentStage();
  }

  function updateStageProgress(current, total) {
    const pct = total ? Math.round((current / total) * 100) : 0;
    $('stage-progress-fill').style.width = pct + '%';
    $('stage-progress-text').textContent = `${Math.min(current + 1, total)} / ${total}`;
  }

  function renderCurrentStage() {
    const s = ui.session;
    if (!s) return;

    if (s.mode === 'match') {
      renderMatchStage();
      return;
    }

    if (s.index >= s.deck.length) {
      finishStudySession();
      return;
    }

    updateStageProgress(s.index, s.deck.length);
    const card = s.deck[s.index];

    if (s.mode === 'spell') renderSpellStage(card);
    else if (s.mode === 'flashcard') renderFlashcardStage(card);
    else if (s.mode === 'quiz') renderQuizStage(card);
  }

  // ----- Mode 1: Nhìn hình & nghĩa -> Ghi chữ (Easy: 2 hints, Medium: 1 hint, Hard: 0 hints) -----
  function computeHintIndices(word, difficulty) {
    const typablePositions = [];
    for (let i = 0; i < word.length; i++) {
      if (/[a-z0-9]/i.test(word[i])) typablePositions.push(i);
    }
    if (difficulty === 'hard' || typablePositions.length === 0) return new Set();

    const maxAllowed = Math.max(1, typablePositions.length - 1);
    const targetCount = difficulty === 'easy' ? Math.min(2, maxAllowed) : Math.min(1, maxAllowed);

    const set = new Set();
    // Always reveal first letter for clear Grade 3 scaffolding
    set.add(typablePositions[0]);
    if (targetCount >= 2 && typablePositions.length >= 3) {
      const midIdx = Math.floor(typablePositions.length * 0.6);
      set.add(typablePositions[midIdx]);
    } else if (targetCount >= 2 && typablePositions.length === 2) {
      set.add(typablePositions[1]);
    }
    return set;
  }

  function renderSpellStage(card) {
    const controls = $('stage-mode-controls');
    controls.innerHTML = `
      <select id="live-diff-select" class="select-sm" title="Đổi độ khó">
        <option value="easy" ${ui.spellDifficulty === 'easy' ? 'selected' : ''}>🌱 Dễ (Gợi ý 2 chữ)</option>
        <option value="medium" ${ui.spellDifficulty === 'medium' ? 'selected' : ''}>🌿 Vừa (Gợi ý 1 chữ)</option>
        <option value="hard" ${ui.spellDifficulty === 'hard' ? 'selected' : ''}>🔥 Khó (Xóa hết chữ)</option>
      </select>
    `;
    $('live-diff-select').addEventListener('change', (e) => {
      ui.spellDifficulty = e.target.value;
      renderSpellStage(card);
    });

    const target = card.en.trim();
    const diff = ui.spellDifficulty;
    const hintSet = computeHintIndices(target, diff);
    const topic = getTopicMeta(card.topicId);

    // State per slot for Easy/Medium
    const userLetters = new Array(target.length).fill('');
    hintSet.forEach((idx) => {
      userLetters[idx] = target[idx];
    });

    const arena = $('stage-arena');
    arena.innerHTML = `
      <div class="spell-card">
        <div class="spell-prompt-top">
          <span class="preview-topic-badge">${escapeHtml(topic.icon)} ${escapeHtml(topic.nameVi)}</span>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-spell-speak">🔊 Nghe phát âm</button>
            <button type="button" class="btn btn-outline btn-sm" id="btn-spell-slow">🐢 Chậm</button>
          </div>
        </div>

        <div class="spell-visual-box">${renderVisualHtml(card.imageType, card.imageValue)}</div>
        <div class="spell-vi-meaning">${escapeHtml(card.vi)}</div>
        <div class="spell-example-hint" id="spell-ex-hint">${card.example ? 'Gợi ý: ' + escapeHtml(card.example.replace(new RegExp(card.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '_____')) : 'Hãy viết từ tiếng Anh tương ứng:'}</div>

        <div id="spell-input-area"></div>

        <div id="spell-tiles-tray" class="word-tiles-tray"></div>

        <div class="spell-controls">
          <button type="button" class="btn btn-outline btn-sm" id="btn-extra-hint">💡 Gợi ý +1 chữ</button>
          <button type="button" class="btn btn-outline btn-sm" id="btn-clear-input">↺ Xóa viết lại</button>
          <button type="button" class="btn btn-primary" id="btn-check-spell">Kiểm tra ✓</button>
        </div>

        <div id="spell-feedback"></div>
      </div>
    `;

    $('btn-spell-speak').addEventListener('click', () => speakBtnClick(card.en, 0.92));
    $('btn-spell-slow').addEventListener('click', () => speakBtnClick(card.en, 0.65));

    let checked = false;
    let usedTileIndices = []; // tracks tile button index placed into slot index
    const slotToTile = {};

    function getTypableEmptyIndices() {
      const res = [];
      for (let i = 0; i < target.length; i++) {
        if (/[a-z0-9]/i.test(target[i]) && !hintSet.has(i) && !userLetters[i]) res.push(i);
      }
      return res;
    }

    function getLastFilledEditableIndex() {
      for (let i = target.length - 1; i >= 0; i--) {
        if (/[a-z0-9]/i.test(target[i]) && !hintSet.has(i) && userLetters[i]) return i;
      }
      return -1;
    }

    // Build scrambled tiles for Grade 3 support
    const missingLetters = [];
    for (let i = 0; i < target.length; i++) {
      if (/[a-z0-9]/i.test(target[i]) && !hintSet.has(i)) {
        missingLetters.push(target[i].toLowerCase());
      }
    }
    const extraDistractors = diff === 'hard' ? [] : shuffle(['a', 'e', 'i', 'o', 's', 't', 'r', 'n'].filter((ch) => !missingLetters.includes(ch))).slice(0, 2);
    const tilePool = shuffle([...missingLetters, ...extraDistractors]);

    function renderTiles() {
      const tray = $('spell-tiles-tray');
      if (!ui.session.useTiles || diff === 'hard') {
        tray.innerHTML = '';
        return;
      }
      tray.innerHTML = tilePool
        .map((ch, idx) => `<button type="button" class="letter-tile ${usedTileIndices.includes(idx) ? 'used' : ''}" data-tidx="${idx}">${escapeHtml(ch)}</button>`)
        .join('');
      tray.querySelectorAll('.letter-tile').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (checked) return;
          const tidx = parseInt(btn.dataset.tidx, 10);
          const empties = getTypableEmptyIndices();
          if (empties.length === 0) return;
          const pos = empties[0];
          userLetters[pos] = tilePool[tidx];
          usedTileIndices.push(tidx);
          slotToTile[pos] = tidx;
          renderSlots();
          renderTiles();
        });
      });
    }

    function renderSlots() {
      const container = $('spell-input-area');
      if (diff === 'hard') {
        container.innerHTML = `
          <div class="hard-input-wrap">
            <input type="text" id="hard-spell-input" class="input hard-input" placeholder="Gõ từ tiếng Anh..." autocomplete="off" autocapitalize="none" spellcheck="false" />
          </div>
          <div id="hard-extra-hint-text" class="hint-text"></div>
        `;
        const inp = $('hard-spell-input');
        inp.focus();
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (!checked) checkAnswer();
            else nextCard();
          }
        });
        return;
      }

      // Easy / Medium letter slots + hidden input for mobile keyboard
      const firstEmpty = getTypableEmptyIndices()[0];
      let html = `<div class="letter-slots-wrap" id="slots-click-zone">`;
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (ch === ' ') {
          html += `<div class="letter-space"></div>`;
          continue;
        }
        if (!/[a-z0-9]/i.test(ch)) {
          html += `<div class="letter-slot is-hint">${escapeHtml(ch)}</div>`;
          continue;
        }
        const isHint = hintSet.has(i);
        const val = userLetters[i];
        const cls = ['letter-slot'];
        if (isHint) cls.push('is-hint');
        else if (val) cls.push('is-filled');
        if (!checked && i === firstEmpty) cls.push('is-active');

        html += `<div class="${cls.join(' ')}" data-pos="${i}">${escapeHtml(val)}</div>`;
      }
      html += `</div><input type="text" id="mobile-slot-proxy" class="hidden-typer" autocomplete="off" autocapitalize="none" spellcheck="false" />`;
      container.innerHTML = html;

      const proxy = $('mobile-slot-proxy');
      $('slots-click-zone').addEventListener('click', () => proxy.focus());
      // Tap filled slot to remove letter
      container.querySelectorAll('.letter-slot.is-filled').forEach((slotEl) => {
        slotEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (checked) return;
          const pos = parseInt(slotEl.dataset.pos, 10);
          userLetters[pos] = '';
          if (slotToTile[pos] !== undefined) {
            usedTileIndices = usedTileIndices.filter((t) => t !== slotToTile[pos]);
            delete slotToTile[pos];
          }
          renderSlots();
          renderTiles();
        });
      });

      proxy.focus();
      proxy.addEventListener('input', () => {
        if (checked) return;
        const val = proxy.value;
        proxy.value = '';
        for (const ch of val) {
          if (/[a-z0-9]/i.test(ch)) {
            const empties = getTypableEmptyIndices();
            if (empties.length > 0) {
              userLetters[empties[0]] = ch.toLowerCase();
            }
          }
        }
        renderSlots();
      });

      proxy.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (checked) return;
          const last = getLastFilledEditableIndex();
          if (last !== -1) {
            userLetters[last] = '';
            if (slotToTile[last] !== undefined) {
              usedTileIndices = usedTileIndices.filter((t) => t !== slotToTile[last]);
              delete slotToTile[last];
            }
            renderSlots();
            renderTiles();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (!checked) checkAnswer();
          else nextCard();
        }
      });
    }

    function getUserAnswer() {
      if (diff === 'hard') {
        const el = $('hard-spell-input');
        return Dict.normalizeText(el ? el.value : '');
      }
      let built = '';
      for (let i = 0; i < target.length; i++) {
        if (target[i] === ' ') built += ' ';
        else if (!/[a-z0-9]/i.test(target[i])) built += target[i];
        else built += userLetters[i] || '_';
      }
      return Dict.normalizeText(built);
    }

    let hardHintCount = 0;
    $('btn-extra-hint').addEventListener('click', () => {
      if (checked) return;
      if (diff === 'hard') {
        hardHintCount = Math.min(target.length, hardHintCount + 1);
        const revealed = target.slice(0, hardHintCount);
        $('hard-extra-hint-text').textContent = `💡 Chữ cái đầu: "${revealed}..." (${target.replace(/\s/g, '').length} chữ cái)`;
        $('hard-spell-input').focus();
        return;
      }
      const candidates = [];
      for (let i = 0; i < target.length; i++) {
        if (/[a-z0-9]/i.test(target[i]) && !hintSet.has(i) && userLetters[i].toLowerCase() !== target[i].toLowerCase()) {
          candidates.push(i);
        }
      }
      if (candidates.length === 0) return;
      const pick = candidates[0];
      hintSet.add(pick);
      userLetters[pick] = target[pick];
      renderSlots();
    });

    $('btn-clear-input').addEventListener('click', () => {
      if (checked) return;
      if (diff === 'hard') {
        $('hard-spell-input').value = '';
        $('hard-spell-input').focus();
        return;
      }
      for (let i = 0; i < target.length; i++) {
        if (!hintSet.has(i) && /[a-z0-9]/i.test(target[i])) userLetters[i] = '';
      }
      usedTileIndices = [];
      Object.keys(slotToTile).forEach((k) => delete slotToTile[k]);
      renderSlots();
      renderTiles();
    });

    function nextCard() {
      ui.session.index += 1;
      renderCurrentStage();
    }

    function checkAnswer() {
      if (checked) return;
      const guess = getUserAnswer();
      const expected = Dict.normalizeText(target);
      if (!guess || guess.includes('_')) {
        showToast('Bé hãy điền đủ các chữ cái trước khi kiểm tra nhé!');
        return;
      }

      checked = true;
      const isRight = guess === expected;
      const fb = $('spell-feedback');
      $('btn-check-spell').hidden = true;

      if (diff !== 'hard') {
        document.querySelectorAll('.letter-slot').forEach((el) => {
          el.classList.remove('is-active');
          el.classList.add(isRight ? 'is-correct' : 'is-wrong');
        });
      }

      if (isRight) {
        Audio.playCorrect();
        setTimeout(() => Audio.speakEnglish(card.en, 0.92), 250);
        const stars = diff === 'hard' ? 4 : diff === 'medium' ? 3 : 2;
        Store.recordPracticeResult(state, card.id, true, stars);
        ui.session.correctCount += 1;
        ui.session.starsEarned += stars;
        renderHeaderStats();

        fb.innerHTML = `
          <div class="feedback-banner feedback-ok">
            <div>🎉 Chính xác! <strong>${escapeHtml(card.en)}</strong> — ${escapeHtml(card.vi)} (+${stars} ⭐)</div>
            <button type="button" class="btn btn-success" id="btn-spell-next">Từ tiếp theo →</button>
          </div>
        `;
      } else {
        Audio.playWrong();
        setTimeout(() => Audio.speakEnglish(card.en, 0.78), 300);
        Store.recordPracticeResult(state, card.id, false, 0);
        ui.session.mistakes.push(card);
        renderHeaderStats();

        fb.innerHTML = `
          <div class="feedback-banner feedback-err">
            <div>
              💡 Chưa đúng rồi! Đáp án đúng là: <strong style="font-size:1.15rem;">${escapeHtml(card.en)}</strong> (${escapeHtml(card.vi)})
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-outline btn-sm" id="btn-retype-remember">✍️ Gõ lại 1 lần cho nhớ</button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-spell-next">Tiếp tục →</button>
            </div>
          </div>
        `;
        $('btn-retype-remember').addEventListener('click', () => {
          checked = false;
          fb.innerHTML = '';
          $('btn-check-spell').hidden = false;
          if (diff === 'hard') {
            $('hard-spell-input').value = '';
            $('hard-spell-input').focus();
          } else {
            for (let i = 0; i < target.length; i++) {
              if (!hintSet.has(i) && /[a-z0-9]/i.test(target[i])) userLetters[i] = '';
            }
            usedTileIndices = [];
            renderSlots();
            renderTiles();
          }
        });
      }

      $('btn-spell-next').addEventListener('click', nextCard);
      $('btn-spell-next').focus();
    }

    $('btn-check-spell').addEventListener('click', checkAnswer);
    renderSlots();
    renderTiles();
  }

  // ----- Mode 2: Flip Flashcard -----
  function renderFlashcardStage(card) {
    $('stage-mode-controls').innerHTML = `<span class="pill-count">Nhấn vào thẻ để lật</span>`;
    const topic = getTopicMeta(card.topicId);
    const arena = $('stage-arena');

    arena.innerHTML = `
      <div class="flip-container">
        <div class="flip-card" id="active-flip-card">
          <div class="flip-face flip-front">
            <span class="preview-topic-badge">${escapeHtml(topic.icon)} ${escapeHtml(topic.nameVi)}</span>
            <div class="spell-visual-box">${renderVisualHtml(card.imageType, card.imageValue)}</div>
            <div class="flip-en">${escapeHtml(card.en)}</div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-fc-speak">🔊 Nghe chuẩn</button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-fc-slow">🐢 Nghe chậm</button>
            </div>
            <div class="flip-tip">👆 Bấm vào thẻ để xem nghĩa tiếng Việt</div>
          </div>

          <div class="flip-face flip-back">
            <span class="preview-topic-badge">${escapeHtml(topic.icon)} ${escapeHtml(topic.nameVi)}</span>
            <div class="flip-vi">${escapeHtml(card.vi)}</div>
            <div class="flip-en" style="font-size:1.5rem;">${escapeHtml(card.en)}</div>
            ${card.example ? `<div class="flip-ex">💬 "${escapeHtml(card.example)}"</div>` : ''}
            <button type="button" class="btn btn-outline btn-sm" id="btn-fc-speak-back">🔊 Nghe lại</button>
          </div>
        </div>
      </div>

      <div class="flashcard-actions">
        <button type="button" class="btn btn-danger-outline" id="btn-fc-hard">❌ Chưa nhớ (Hộp 1)</button>
        <button type="button" class="btn btn-outline" id="btn-fc-flip">🔄 Lật thẻ</button>
        <button type="button" class="btn btn-success" id="btn-fc-know">⭐ Đã thuộc (+2 ⭐)</button>
      </div>
    `;

    const flipCard = $('active-flip-card');
    function toggleFlip() {
      flipCard.classList.toggle('is-flipped');
    }

    flipCard.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      toggleFlip();
    });
    $('btn-fc-flip').addEventListener('click', toggleFlip);
    $('btn-fc-speak').addEventListener('click', () => speakBtnClick(card.en, 0.92));
    $('btn-fc-slow').addEventListener('click', () => speakBtnClick(card.en, 0.65));
    $('btn-fc-speak-back').addEventListener('click', () => speakBtnClick(card.en, 0.92));

    // Auto pronounce new card gently
    Audio.speakEnglish(card.en, 0.9);

    $('btn-fc-hard').addEventListener('click', () => {
      Store.recordPracticeResult(state, card.id, false, 0);
      ui.session.mistakes.push(card);
      renderHeaderStats();
      ui.session.index += 1;
      renderCurrentStage();
    });

    $('btn-fc-know').addEventListener('click', () => {
      Audio.playCorrect();
      Store.recordPracticeResult(state, card.id, true, 2);
      ui.session.correctCount += 1;
      ui.session.starsEarned += 2;
      renderHeaderStats();
      ui.session.index += 1;
      renderCurrentStage();
    });
  }

  // ----- Mode 3: Listening & Picture Quiz -----
  function renderQuizStage(card) {
    $('stage-mode-controls').innerHTML = `<span class="pill-count">Chọn đáp án đúng</span>`;
    const distractors = shuffle(state.cards.filter((c) => c.id !== card.id)).slice(0, 3);
    const options = shuffle([card, ...distractors]);

    const arena = $('stage-arena');
    arena.innerHTML = `
      <div class="spell-card">
        <div class="spell-prompt-top">
          <span class="preview-topic-badge">🎧 Nghe &amp; nhìn hình chọn từ tiếng Anh</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-quiz-speak">🔊 Nghe lại</button>
        </div>
        <div class="spell-visual-box">${renderVisualHtml(card.imageType, card.imageValue)}</div>
        <div class="spell-vi-meaning">${escapeHtml(card.vi)}</div>
        <div class="quiz-options" id="quiz-options">
          ${options.map((opt) => `<button type="button" class="quiz-opt" data-id="${opt.id}">${escapeHtml(opt.en)}</button>`).join('')}
        </div>
        <div id="quiz-feedback"></div>
      </div>
    `;

    $('btn-quiz-speak').addEventListener('click', () => speakBtnClick(card.en, 0.9));
    Audio.speakEnglish(card.en, 0.9);

    let answered = false;
    $('quiz-options').querySelectorAll('.quiz-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const isRight = btn.dataset.id === card.id;
        $('quiz-options').querySelectorAll('.quiz-opt').forEach((b) => {
          b.disabled = true;
          if (b.dataset.id === card.id) b.classList.add('opt-correct');
        });
        if (!isRight) btn.classList.add('opt-wrong');

        if (isRight) {
          Audio.playCorrect();
          Store.recordPracticeResult(state, card.id, true, 2);
          ui.session.correctCount += 1;
          ui.session.starsEarned += 2;
        } else {
          Audio.playWrong();
          Store.recordPracticeResult(state, card.id, false, 0);
          ui.session.mistakes.push(card);
        }
        renderHeaderStats();

        $('quiz-feedback').innerHTML = `
          <div class="feedback-banner ${isRight ? 'feedback-ok' : 'feedback-err'}">
            <div>${isRight ? '🎉 Tuyệt vời! (+2 ⭐)' : `💡 Đáp án đúng là <strong>${escapeHtml(card.en)}</strong>`}</div>
            <button type="button" class="btn btn-primary btn-sm" id="btn-quiz-next">Tiếp tục →</button>
          </div>
        `;
        $('btn-quiz-next').addEventListener('click', () => {
          ui.session.index += 1;
          renderCurrentStage();
        });
      });
    });
  }

  // ----- Mode 4: Memory Match Game -----
  function renderMatchStage() {
    const s = ui.session;
    const roundCards = s.deck.slice(0, 6);
    $('stage-mode-controls').innerHTML = `<span class="pill-count">Ghép ${roundCards.length} cặp</span>`;
    updateStageProgress(0, roundCards.length);

    const tiles = [];
    roundCards.forEach((c) => {
      tiles.push({ pairId: c.id, kind: 'en', card: c });
      tiles.push({ pairId: c.id, kind: 'vi', card: c });
    });
    const shuffled = shuffle(tiles);

    const arena = $('stage-arena');
    arena.innerHTML = `<div class="match-grid" id="match-grid"></div>`;
    const grid = $('match-grid');

    let selectedEl = null;
    let matchedCount = 0;
    let lock = false;

    shuffled.forEach((t, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'match-tile';
      btn.dataset.pairId = t.pairId;
      btn.dataset.kind = t.kind;
      btn.dataset.idx = idx;

      if (t.kind === 'en') {
        btn.innerHTML = `<span style="font-size:1.25rem;color:var(--primary-dark);">${escapeHtml(t.card.en)}</span><span style="font-size:0.75rem;color:var(--text-muted);">🔊 Tiếng Anh</span>`;
      } else {
        const iconHtml = t.card.imageType === 'emoji' ? `<span style="font-size:1.85rem;">${escapeHtml(t.card.imageValue)}</span>` : '';
        btn.innerHTML = `${iconHtml}<span>${escapeHtml(t.card.vi)}</span>`;
      }

      btn.addEventListener('click', () => {
        if (lock || btn.classList.contains('matched')) return;
        if (t.kind === 'en') Audio.speakEnglish(t.card.en, 0.95);

        if (!selectedEl) {
          selectedEl = btn;
          btn.classList.add('selected');
          return;
        }
        if (selectedEl === btn) {
          btn.classList.remove('selected');
          selectedEl = null;
          return;
        }

        const first = selectedEl;
        const second = btn;
        const samePair = first.dataset.pairId === second.dataset.pairId && first.dataset.kind !== second.dataset.kind;

        if (samePair) {
          Audio.playCorrect();
          first.classList.remove('selected');
          first.classList.add('matched');
          second.classList.add('matched');
          selectedEl = null;
          matchedCount += 1;
          s.correctCount += 1;
          s.starsEarned += 2;
          Store.recordPracticeResult(state, t.pairId, true, 2);
          renderHeaderStats();
          updateStageProgress(matchedCount, roundCards.length);

          if (matchedCount >= roundCards.length) {
            setTimeout(finishStudySession, 550);
          }
        } else {
          Audio.playWrong();
          lock = true;
          second.classList.add('shake');
          first.classList.add('shake');
          setTimeout(() => {
            first.classList.remove('selected', 'shake');
            second.classList.remove('shake');
            selectedEl = null;
            lock = false;
          }, 420);
        }
      });

      grid.appendChild(btn);
    });
  }

  function finishStudySession() {
    const s = ui.session;
    Audio.playFanfare();
    $('study-stage').hidden = true;
    $('study-summary').hidden = false;

    const total = s.mode === 'match' ? Math.min(6, s.deck.length) : s.deck.length;
    const acc = total ? Math.round((s.correctCount / total) * 100) : 100;

    $('sum-correct').textContent = `${s.correctCount}/${total}`;
    $('sum-accuracy').textContent = `${acc}%`;
    $('sum-stars').textContent = `+${s.starsEarned} ⭐`;
    $('summary-subtitle').textContent =
      acc >= 80
        ? 'Bé nhớ bài rất tốt! Tiếp tục phát huy nhé!'
        : 'Rất cố gắng! Ôn lại những từ vừa nhầm một lượt nữa sẽ nhớ lâu lắm đó.';

    const uniqueMistakes = [];
    const seen = new Set();
    s.mistakes.forEach((m) => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        uniqueMistakes.push(m);
      }
    });

    const mBox = $('summary-mistakes-box');
    const retryBtn = $('btn-retry-mistakes');
    if (uniqueMistakes.length > 0) {
      mBox.hidden = false;
      retryBtn.hidden = false;
      $('summary-mistakes-list').innerHTML = uniqueMistakes
        .map((m) => `<span class="mistake-chip">${escapeHtml(m.en)} — ${escapeHtml(m.vi)}</span>`)
        .join('');
      retryBtn.onclick = () => startStudySession(s.mode, uniqueMistakes);
    } else {
      mBox.hidden = true;
      retryBtn.hidden = true;
    }
  }

  // ---------- View 4: Progress & Science ----------
  function renderProgressView() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    state.cards.forEach((c) => {
      const b = Math.min(5, Math.max(1, c.box || 1));
      counts[b] += 1;
    });

    const boxMeta = [
      { b: 1, title: 'Hộp 1', desc: 'Mới / Ôn mỗi ngày', cls: 'box-1' },
      { b: 2, title: 'Hộp 2', desc: 'Ôn sau 1 ngày', cls: 'box-2' },
      { b: 3, title: 'Hộp 3', desc: 'Ôn sau 3 ngày', cls: 'box-3' },
      { b: 4, title: 'Hộp 4', desc: 'Ôn sau 7 ngày', cls: 'box-4' },
      { b: 5, title: 'Hộp 5 🌟', desc: 'Thành thạo (14 ngày)', cls: 'box-5' }
    ];

    $('leitner-boxes').innerHTML = boxMeta
      .map(
        (m) => `
      <div class="leitner-box">
        <span class="box-badge ${m.cls}">${m.title}</span>
        <div class="leitner-num">${counts[m.b]}</div>
        <div class="leitner-lbl">từ vựng</div>
        <div class="leitner-sub">${m.desc}</div>
      </div>`
      )
      .join('');

    const hard = state.cards
      .filter((c) => (c.wrongCount || 0) > 0)
      .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
      .slice(0, 12);

    const hardEl = $('hard-words-list');
    if (hard.length === 0) {
      hardEl.innerHTML = `<span class="section-sub">Chưa có từ hay nhầm nào! Bé hãy bắt đầu luyện tập để hệ thống thống kê nhé.</span>`;
    } else {
      hardEl.innerHTML = hard
        .map(
          (c) => `
        <div class="hard-word-pill">
          <span>${c.imageType === 'emoji' ? escapeHtml(c.imageValue) : '📌'}</span>
          <strong>${escapeHtml(c.en)}</strong>
          <span>(${escapeHtml(c.vi)})</span>
          <span style="color:var(--red);">• sai ${c.wrongCount} lần</span>
          <button type="button" class="mini-btn" data-speak="${escapeHtml(c.en)}">🔊</button>
        </div>`
        )
        .join('');
      hardEl.querySelectorAll('[data-speak]').forEach((btn) => {
        btn.addEventListener('click', () => speakBtnClick(btn.dataset.speak));
      });
    }
  }

  // ---------- Event Wiring ----------
  function bindEvents() {
    // Top nav & brand
    $('btn-go-home').addEventListener('click', () => switchView('library'));
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    $('btn-sound-toggle').addEventListener('click', () => {
      const next = !Audio.isSoundEnabled();
      Audio.setSoundEnabled(next);
      $('btn-sound-toggle').textContent = next ? '🔊' : '🔇';
      showToast(next ? 'Đã bật hiệu ứng âm thanh' : 'Đã tắt hiệu ứng âm thanh');
    });

    // Library actions
    $('btn-start-due').addEventListener('click', () => {
      switchView('study');
      $('study-topic-select').value = 'all';
      $('study-filter-select').value = 'smart';
      startStudySession('flashcard');
    });

    $('btn-quick-spell').addEventListener('click', () => {
      switchView('study');
      startStudySession('spell');
    });

    $('btn-view-all-words').addEventListener('click', () => {
      ui.selectedTopicId = 'all';
      ui.searchQuery = '';
      ui.boxFilter = 'all';
      $('search-words').value = '';
      $('filter-box').value = 'all';
      renderLibrary();
    });

    $('btn-goto-add').addEventListener('click', () => switchView('add'));
    $('search-words').addEventListener('input', (e) => {
      ui.searchQuery = e.target.value;
      renderWordList();
    });
    $('filter-box').addEventListener('change', (e) => {
      ui.boxFilter = e.target.value;
      renderWordList();
    });
    $('btn-study-this-topic').addEventListener('click', () => {
      switchView('study');
      if (ui.selectedTopicId !== 'all') {
        $('study-topic-select').value = ui.selectedTopicId;
      }
      startStudySession('spell');
    });

    // Study Setup controls
    $('setup-difficulty-pills').querySelectorAll('.diff-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        $('setup-difficulty-pills').querySelectorAll('.diff-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        ui.spellDifficulty = pill.dataset.diff;
      });
    });

    document.querySelectorAll('.btn-start-mode').forEach((btn) => {
      btn.addEventListener('click', () => startStudySession(btn.dataset.mode));
    });

    $('btn-exit-study').addEventListener('click', () => renderStudySetup());
    $('btn-back-setup').addEventListener('click', () => renderStudySetup());
    $('btn-play-again').addEventListener('click', () => {
      if (ui.session) startStudySession(ui.session.mode);
      else renderStudySetup();
    });

    // Add View tabs
    document.querySelectorAll('[data-addtab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-addtab]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const isSingle = tab.dataset.addtab === 'single';
        $('add-single-panel').hidden = !isSingle;
        $('add-bulk-panel').hidden = isSingle;
      });
    });

    // Single word auto-detect & form
    $('inp-en').addEventListener('input', () => {
      ui.userEditedVi = false;
      ui.userEditedTopic = false;
      ui.userEditedSticker = false;
      ui.userEditedExample = false;
      runAutoDetect(true);
    });
    $('inp-vi').addEventListener('input', () => {
      ui.userEditedVi = Boolean($('inp-vi').value.trim());
      if (!ui.userEditedTopic) runAutoDetect(false, false);
      else updateAddPreview();
    });
    $('inp-example').addEventListener('input', () => {
      ui.userEditedExample = Boolean($('inp-example').value.trim());
      updateAddPreview();
    });
    $('inp-topic').addEventListener('change', () => {
      ui.userEditedTopic = true;
      const isCustom = $('inp-topic').value === '__new_custom__';
      $('custom-topic-wrap').hidden = !isCustom;
      updateAddPreview();
    });
    $('inp-custom-topic').addEventListener('input', updateAddPreview);
    $('btn-preview-speak').addEventListener('click', () => {
      const w = $('inp-en').value.trim();
      if (w) speakBtnClick(w);
    });

    $('btn-fetch-wiki-img').addEventListener('click', fetchWikipediaThumbnail);
    $('btn-apply-img-url').addEventListener('click', () => {
      const url = $('inp-img-url').value.trim();
      if (!url) return;
      ui.userEditedSticker = true;
      ui.draftImageType = 'url';
      ui.draftImageValue = url;
      updateAddPreview();
    });

    $('inp-img-file').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await resizeImageToDataUrl(file);
        ui.userEditedSticker = true;
        ui.draftImageType = 'dataUrl';
        ui.draftImageValue = dataUrl;
        updateAddPreview();
        showToast('Đã tải ảnh minh họa!');
      } catch (_) {
        showToast('Không đọc được ảnh này.');
      }
    });

    $('form-add-word').addEventListener('submit', (e) => {
      e.preventDefault();
      const en = $('inp-en').value.trim();
      const vi = $('inp-vi').value.trim();
      if (!en || !vi) return;

      let topicId = $('inp-topic').value;
      if (topicId === '__new_custom__') {
        topicId = Store.ensureCustomTopic(state, $('inp-custom-topic').value);
      }

      const res = Store.addCard(state, {
        en,
        vi,
        topicId,
        imageType: ui.draftImageType,
        imageValue: ui.draftImageValue,
        example: $('inp-example').value.trim()
      });

      const meta = getTopicMeta(topicId);
      showToast(
        res && res.updated
          ? `Đã cập nhật từ "${en}" trong chủ đề ${meta.nameVi}!`
          : `✅ Đã thêm "${en}" vào chủ đề ${meta.icon} ${meta.nameVi}!`
      );

      // Reset form
      $('form-add-word').reset();
      ui.userEditedVi = false;
      ui.userEditedTopic = false;
      ui.userEditedSticker = false;
      ui.userEditedExample = false;
      ui.draftImageType = 'emoji';
      ui.draftImageValue = '✨';
      $('custom-topic-wrap').hidden = true;
      renderSpellingSuggestions([]);
      populateTopicSelect($('inp-topic'), true);
      updateAddPreview();
      renderHeaderStats();
    });

    // Sticker Picker Modal
    function renderStickerGrid(filter = '') {
      const q = filter.trim().toLowerCase();
      const items = Dict.STICKER_CATALOG.filter((it) => !q || it.k.includes(q));
      $('sticker-grid').innerHTML = items
        .map((it) => `<button type="button" class="sticker-option" data-emoji="${it.e}">${it.e}</button>`)
        .join('');
      $('sticker-grid').querySelectorAll('.sticker-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          ui.userEditedSticker = true;
          ui.draftImageType = 'emoji';
          ui.draftImageValue = btn.dataset.emoji;
          updateAddPreview();
          $('sticker-modal').hidden = true;
        });
      });
    }

    $('btn-open-sticker-picker').addEventListener('click', () => {
      $('sticker-search').value = '';
      renderStickerGrid('');
      $('sticker-modal').hidden = false;
      $('sticker-search').focus();
    });
    $('sticker-search').addEventListener('input', (e) => renderStickerGrid(e.target.value));
    $('btn-close-sticker').addEventListener('click', () => ($('sticker-modal').hidden = true));

    // Bulk Import
    $('btn-bulk-sample').addEventListener('click', () => {
      $('bulk-textarea').value =
        'lion - con sư tử\nstrawberry - quả dâu tây\nruler - cái thước kẻ\nsunny - trời nắng\nteacher\nbicycle\nrobot';
    });

    $('btn-bulk-analyze').addEventListener('click', async () => {
      const btn = $('btn-bulk-analyze');
      const parsed = parseBulkInput($('bulk-textarea').value);
      const list = $('bulk-preview-list');

      if (parsed.length === 0) {
        ui.bulkParsed = [];
        $('bulk-count-label').textContent = '0 từ';
        list.innerHTML = `<div class="empty-hint">Chưa có từ hợp lệ nào.</div>`;
        $('btn-bulk-save').disabled = true;
        return;
      }

      const needTranslate = parsed.filter((p) => p.vi === '(chưa có nghĩa)');
      if (needTranslate.length > 0) {
        btn.disabled = true;
        btn.textContent = '⏳ Đang dịch & phân loại...';
        await Promise.all(
          needTranslate.map(async (item) => {
            const translated = await translateEnToViOnline(item.en);
            if (translated) {
              item.vi = translated;
              const reCls = Dict.autoClassifyWord(item.en, translated);
              item.topicId = reCls.topic;
              item.imageType = reCls.colorHex ? 'color' : 'emoji';
              item.imageValue = reCls.colorHex || reCls.emoji;
            }
          })
        );
        btn.disabled = false;
        btn.textContent = '🔍 Phân tích & Phân loại chủ đề';
      }

      ui.bulkParsed = parsed;
      $('bulk-count-label').textContent = `${parsed.length} từ`;
      list.innerHTML = parsed
        .map((p) => {
          const meta = getTopicMeta(p.topicId);
          return `<div class="bulk-row"><span>${escapeHtml(p.imageValue)} <strong>${escapeHtml(p.en)}</strong> — ${escapeHtml(p.vi)}</span><span class="box-badge box-4">${escapeHtml(meta.icon)} ${escapeHtml(meta.nameVi)}</span></div>`;
        })
        .join('');
      $('btn-bulk-save').disabled = false;
    });

    $('btn-bulk-save').addEventListener('click', () => {
      if (!ui.bulkParsed.length) return;
      ui.bulkParsed.forEach((p) => Store.addCard(state, p));
      showToast(`🎉 Đã lưu ${ui.bulkParsed.length} từ vào các chủ đề tương ứng!`);
      ui.bulkParsed = [];
      $('bulk-textarea').value = '';
      $('bulk-preview-list').innerHTML = `<div class="empty-hint">Đã lưu thành công!</div>`;
      $('bulk-count-label').textContent = '0 từ';
      $('btn-bulk-save').disabled = true;
      renderHeaderStats();
    });

    // Edit Modal Events
    $('btn-close-edit').addEventListener('click', () => ($('edit-modal').hidden = true));
    $('btn-cancel-edit').addEventListener('click', () => ($('edit-modal').hidden = true));
    $('edit-img-file').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const dataUrl = await resizeImageToDataUrl(file);
      $('edit-sticker').value = dataUrl;
    });
    $('form-edit-word').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = $('edit-id').value;
      const stickerVal = $('edit-sticker').value.trim() || '✨';
      let imageType = 'emoji';
      if (stickerVal.startsWith('data:image')) imageType = 'dataUrl';
      else if (/^https?:\/\//i.test(stickerVal)) imageType = 'url';
      else if (/^#[0-9a-f]{3,6}$/i.test(stickerVal)) imageType = 'color';

      Store.updateCard(state, id, {
        en: $('edit-en').value.trim(),
        vi: $('edit-vi').value.trim(),
        topicId: $('edit-topic').value,
        example: $('edit-example').value.trim(),
        imageType,
        imageValue: stickerVal
      });
      $('edit-modal').hidden = true;
      renderLibrary();
      showToast('Đã lưu thay đổi thẻ từ!');
    });

    // Progress & Backup Events
    $('btn-export-data').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `kidwords-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    $('inp-import-json').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (!parsed || !Array.isArray(parsed.cards)) throw new Error('Invalid');
          state = parsed;
          Store.saveState(state);
          renderProgressView();
          renderHeaderStats();
          showToast('Đã khôi phục dữ liệu thành công!');
        } catch (_) {
          showToast('File sao lưu không hợp lệ.');
        }
      };
      reader.readAsText(file);
    });

    $('btn-reset-demo').addEventListener('click', () => {
      if (confirm('Khôi phục lại bộ 38 từ mẫu lớp 3 ban đầu? (Các từ bạn tự thêm sẽ bị xóa)')) {
        Store.resetToDemo(state);
        renderProgressView();
        renderHeaderStats();
        showToast('Đã khôi phục bộ từ mẫu lớp 3!');
      }
    });

    $('btn-share-deck').addEventListener('click', async () => {
      const customCards = state.cards.filter((c) => !String(c.id || '').startsWith('starter_'));
      const sourceCards = customCards.length > 0 ? customCards : state.cards.slice(0, 15);
      const compactCards = sourceCards.map((c) => ({
        en: c.en,
        vi: c.vi,
        topicId: c.topicId,
        imageType: c.imageType === 'dataUrl' ? 'emoji' : c.imageType,
        imageValue: c.imageType === 'dataUrl' ? '✨' : c.imageValue,
        example: c.example || ''
      }));
      const payload = {
        topics: state.customTopics || [],
        cards: compactCards
      };
      try {
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        const baseUrl = window.location.href.split('#')[0];
        const shareUrl = `${baseUrl}#share=${encoded}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          showToast(`🔗 Đã copy link chứa ${compactCards.length} từ! Gửi link này cho bé mở là học được ngay.`);
        } else {
          prompt('Copy đường link dưới đây để gửi cho bé:', shareUrl);
        }
      } catch (_) {
        showToast('Không tạo được link chia sẻ. Hãy dùng nút Xuất file sao lưu.');
      }
    });
  }

  function importFromShareHash() {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#share=')) return;
    try {
      const encoded = hash.slice('#share='.length);
      const jsonStr = decodeURIComponent(escape(atob(encoded)));
      const payload = JSON.parse(jsonStr);
      if (payload && Array.isArray(payload.topics)) {
        payload.topics.forEach((t) => {
          if (t && t.id && !Store.getAllTopics(state).some((x) => x.id === t.id)) {
            state.customTopics.push(t);
          }
        });
      }
      let addedCount = 0;
      if (payload && Array.isArray(payload.cards)) {
        payload.cards.forEach((c) => {
          if (c && c.en && c.vi) {
            Store.addCard(state, c);
            addedCount += 1;
          }
        });
      }
      Store.saveState(state);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (addedCount > 0) {
        showToast(`🎉 Đã nhận ${addedCount} từ vựng mới từ link chia sẻ!`);
      }
    } catch (_) {
      showToast('Link chia sẻ không hợp lệ hoặc bị cắt ngắn.');
    }
  }

  // ---------- Init ----------
  function init() {
    importFromShareHash();
    bindEvents();
    renderLibrary();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
