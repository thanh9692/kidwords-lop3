(function (global) {
  'use strict';

  const STORAGE_KEY = 'kidwords_grade3_v1';
  const DAY_MS = 24 * 60 * 60 * 1000;
  // Leitner Box review intervals in days
  const BOX_INTERVALS_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function createInitialState() {
    return {
      cards: global.KidWordsDict.buildStarterCards(),
      customTopics: [],
      stats: {
        stars: 0,
        streak: 0,
        lastStudyDate: null,
        todayDate: todayStr(),
        todayCount: 0,
        dailyGoal: 10,
        totalCorrect: 0,
        totalPracticed: 0
      }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const init = createInitialState();
        saveState(init);
        return init;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.cards)) {
        return createInitialState();
      }
      if (!Array.isArray(parsed.customTopics)) parsed.customTopics = [];
      if (!parsed.stats) parsed.stats = createInitialState().stats;
      // Reset daily counter if day changed
      const today = todayStr();
      if (parsed.stats.todayDate !== today) {
        parsed.stats.todayDate = today;
        parsed.stats.todayCount = 0;
      }
      return parsed;
    } catch (_) {
      return createInitialState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save state to localStorage:', err);
    }
  }

  function getAllTopics(state) {
    return [...global.KidWordsDict.DEFAULT_TOPICS, ...(state.customTopics || [])];
  }

  function ensureCustomTopic(state, nameVi) {
    const clean = (nameVi || '').trim();
    if (!clean) return 'other';
    const existing = getAllTopics(state).find(
      (t) => t.nameVi.toLowerCase() === clean.toLowerCase()
    );
    if (existing) return existing.id;

    const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    state.customTopics.push({
      id,
      nameVi: clean,
      nameEn: 'Custom Topic',
      icon: '🏷️',
      color: '#F1F5F9'
    });
    saveState(state);
    return id;
  }

  function addCard(state, payload) {
    const enClean = (payload.en || '').trim();
    const viClean = (payload.vi || '').trim();
    if (!enClean || !viClean) return null;

    // Prevent exact duplicate English word in same topic (update instead or allow?)
    const existing = state.cards.find(
      (c) => c.en.toLowerCase() === enClean.toLowerCase()
    );
    if (existing) {
      existing.vi = viClean;
      existing.topicId = payload.topicId || existing.topicId;
      existing.imageType = payload.imageType || existing.imageType;
      existing.imageValue = payload.imageValue || existing.imageValue;
      existing.example = payload.example !== undefined ? payload.example : existing.example;
      saveState(state);
      return { card: existing, updated: true };
    }

    const card = {
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      en: enClean,
      vi: viClean,
      topicId: payload.topicId || 'other',
      imageType: payload.imageType || 'emoji',
      imageValue: payload.imageValue || '✨',
      example: (payload.example || '').trim(),
      box: 1,
      nextReviewAt: Date.now(),
      correctCount: 0,
      wrongCount: 0,
      createdAt: Date.now()
    };
    state.cards.unshift(card);
    saveState(state);
    return { card, updated: false };
  }

  function updateCard(state, id, updates) {
    const card = state.cards.find((c) => c.id === id);
    if (!card) return null;
    Object.assign(card, updates);
    saveState(state);
    return card;
  }

  function deleteCard(state, id) {
    state.cards = state.cards.filter((c) => c.id !== id);
    saveState(state);
  }

  function isCardDue(card, now = Date.now()) {
    return (card.nextReviewAt || 0) <= now;
  }

  function touchStreakAndGoal(state, starReward = 0) {
    const today = todayStr();
    const stats = state.stats;
    if (stats.todayDate !== today) {
      stats.todayDate = today;
      stats.todayCount = 0;
    }
    stats.todayCount += 1;
    stats.stars += starReward;

    if (stats.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - DAY_MS);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if (stats.lastStudyDate === yStr) {
        stats.streak += 1;
      } else {
        stats.streak = 1;
      }
      stats.lastStudyDate = today;
    }
  }

  function recordPracticeResult(state, cardId, isCorrect, starBonus = 2) {
    const card = state.cards.find((c) => c.id === cardId);
    const now = Date.now();
    state.stats.totalPracticed += 1;

    if (isCorrect) {
      state.stats.totalCorrect += 1;
      touchStreakAndGoal(state, starBonus);
      if (card) {
        card.correctCount = (card.correctCount || 0) + 1;
        card.box = Math.min(5, (card.box || 1) + 1);
        const days = BOX_INTERVALS_DAYS[card.box] || 1;
        card.nextReviewAt = now + days * DAY_MS;
      }
    } else {
      touchStreakAndGoal(state, 0);
      if (card) {
        card.wrongCount = (card.wrongCount || 0) + 1;
        card.box = 1;
        card.nextReviewAt = now;
      }
    }
    saveState(state);
  }

  function resetToDemo(state) {
    const fresh = createInitialState();
    state.cards = fresh.cards;
    state.customTopics = [];
    state.stats = fresh.stats;
    saveState(state);
  }

  global.KidWordsStore = {
    loadState,
    saveState,
    getAllTopics,
    ensureCustomTopic,
    addCard,
    updateCard,
    deleteCard,
    isCardDue,
    recordPracticeResult,
    resetToDemo,
    BOX_INTERVALS_DAYS
  };
})(window);
