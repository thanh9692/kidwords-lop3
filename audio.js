(function (global) {
  'use strict';

  let sfxEnabled = true;
  let audioCtx = null;
  let cachedVoice = null;

  function getCtx() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function pickEnglishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const preferred =
      voices.find((v) => v.lang === 'en-US' && /samantha|alex|google|aria|jenny|natural/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en-')) ||
      voices[0];
    cachedVoice = preferred || null;
    return cachedVoice;
  }

  if ('speechSynthesis' in window) {
    pickEnglishVoice();
    window.speechSynthesis.onvoiceschanged = pickEnglishVoice;
  }

  function speakEnglish(text, rate = 0.92) {
    if (!text || !('speechSynthesis' in window)) return false;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = rate;
      utter.pitch = 1.05;
      const voice = cachedVoice || pickEnglishVoice();
      if (voice) utter.voice = voice;
      window.speechSynthesis.speak(utter);
      return true;
    } catch (_) {
      return false;
    }
  }

  function playTone(freq, duration, type = 'sine', startOffset = 0, gainVal = 0.14) {
    if (!sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playCorrect() {
    playTone(523.25, 0.12, 'triangle', 0, 0.14); // C5
    playTone(659.25, 0.14, 'triangle', 0.09, 0.14); // E5
    playTone(783.99, 0.22, 'triangle', 0.18, 0.15); // G5
  }

  function playWrong() {
    playTone(260, 0.14, 'sine', 0, 0.12);
    playTone(210, 0.2, 'sine', 0.12, 0.12);
  }

  function playFanfare() {
    playTone(523.25, 0.12, 'triangle', 0, 0.15);
    playTone(659.25, 0.12, 'triangle', 0.1, 0.15);
    playTone(783.99, 0.12, 'triangle', 0.2, 0.15);
    playTone(1046.5, 0.35, 'triangle', 0.3, 0.17);
  }

  function setSoundEnabled(enabled) {
    sfxEnabled = Boolean(enabled);
  }

  function isSoundEnabled() {
    return sfxEnabled;
  }

  global.KidWordsAudio = {
    speakEnglish,
    playCorrect,
    playWrong,
    playFanfare,
    setSoundEnabled,
    isSoundEnabled
  };
})(window);
