let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = (type) => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    if (type === 'correct') {
      // Pleasant double beep (C5 -> E5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'incorrect') {
      // Low buzz (150Hz down to 100Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.25);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'complete') {
      // Triumphant arpeggio (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    }
  } catch (e) {
    console.warn("Web Audio API sound play failed:", e);
  }
};

export const vibrate = (pattern = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

let cachedVoices = [];
let currentAudio = null;
let activeSessionId = 0;
let currentTimeoutId = null;

// Warm up and cache browser voices (handles Chrome asynchronous getVoices behavior)
function loadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
    }
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// Immediately stop all speech synthesis, audio streams, and pending timers
export const stopSpeech = () => {
  activeSessionId++; // Invalidate any running audio session callbacks
  if (currentTimeoutId) {
    clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.onplay = null;
    } catch (e) {}
    currentAudio = null;
  }
};

// Find the best quality voice for a given language tag (e.g. 'en-US' or 'en-GB')
export const getBestVoice = (targetLang) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  if (!cachedVoices || cachedVoices.length === 0) {
    loadVoices();
  }

  const voices = cachedVoices;
  if (!voices || voices.length === 0) return null;

  const target = targetLang.toLowerCase().replace('_', '-');
  const targetPrefix = target.split('-')[0];

  // Filter matching voices by language
  const matches = voices.filter(v => {
    if (!v.lang) return false;
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === target || vLang.startsWith(target) || vLang.startsWith(targetPrefix);
  });

  if (matches.length === 0) return null;

  // Rank candidate voices by quality indicators
  const scored = matches.map(voice => {
    let score = 0;
    const name = (voice.name || '').toLowerCase();
    const vLang = (voice.lang || '').toLowerCase().replace('_', '-');

    // Exact lang match preference (e.g., en-US vs en-GB)
    if (vLang === target) score += 10;
    else if (vLang.startsWith(target)) score += 8;

    // Google network voices are exceptionally natural in Web Speech API
    if (name.includes('google')) score += 30;

    // Natural / Neural / Online voices (Edge & Chrome high quality voices)
    if (name.includes('natural') || name.includes('online') || name.includes('neural')) score += 25;
    if (name.includes('enhanced') || name.includes('premium') || name.includes('super')) score += 20;

    // Non-local (cloud) service indicates higher quality web voice engine
    if (voice.localService === false) score += 15;

    // Standard high quality iOS / macOS / Windows built-in voices
    if (name.includes('samantha') || name.includes('daniel') || name.includes('karen') || name.includes('aria') || name.includes('jenny') || name.includes('guy')) score += 5;

    return { voice, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.voice || null;
};

// Pure Web Speech API fallback function
export const speakWebSpeech = (text, options = {}, sessionId = null) => {
  if (sessionId !== null && sessionId !== activeSessionId) return;
  if (!('speechSynthesis' in window)) return;
  
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  const accent = options.accent || localStorage.getItem('eng_app_voice_accent') || 'US';
  const lang = accent === 'UK' ? 'en-GB' : 'en-US';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = options.rate && options.rate > 0.9 ? options.rate : 0.95;
  if (options.pitch) utterance.pitch = options.pitch;

  const voice = getBestVoice(lang);
  if (voice) utterance.voice = voice;

  utterance.onstart = () => {
    if ((sessionId === null || sessionId === activeSessionId) && options.onstart) {
      options.onstart();
    }
  };

  utterance.onend = () => {
    if ((sessionId === null || sessionId === activeSessionId) && options.onend) {
      options.onend();
    }
  };

  utterance.onerror = (e) => {
    if ((sessionId === null || sessionId === activeSessionId) && options.onerror) {
      options.onerror(e);
    }
  };

  window.speechSynthesis.speak(utterance);
};

// Global text-to-speech speaking utility with Multi-Source Audio Engine & session locking to eliminate overlapping audio
export const speak = (text, options = {}) => {
  if (!text || !text.trim()) return;

  // Stop all active audio and cancel any running session/timer
  stopSpeech();

  const sessionId = ++activeSessionId;

  const accent = options.accent || localStorage.getItem('eng_app_voice_accent') || 'US';
  const lang = accent === 'UK' ? 'en-GB' : 'en-US';
  const youdaoType = accent === 'UK' ? 1 : 2;
  const trimmed = text.trim();
  const encoded = encodeURIComponent(trimmed);

  // Multi-source cloud audio streams for real human voice quality
  if (trimmed.length <= 250) {
    const sources = [
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encoded}`,
      `https://dict.youdao.com/dictvoice?audio=${encoded}&type=${youdaoType}`
    ];

    let srcIndex = 0;

    const tryPlaySource = () => {
      // If a newer speak() request was triggered, abort immediately
      if (sessionId !== activeSessionId) return;

      if (srcIndex >= sources.length) {
        if (sessionId === activeSessionId) {
          currentAudio = null;
          speakWebSpeech(trimmed, options, sessionId);
        }
        return;
      }

      const currentSrc = sources[srcIndex++];
      const audio = new Audio(currentSrc);
      currentAudio = audio;
      audio.playbackRate = 1.0;

      let hasHandledFailure = false;
      const handleFailure = () => {
        if (hasHandledFailure) return;
        hasHandledFailure = true;

        if (sessionId === activeSessionId) {
          currentAudio = null;
          tryPlaySource();
        }
      };

      audio.onplay = () => {
        if (sessionId === activeSessionId && options.onstart) {
          options.onstart();
        }
      };

      audio.onended = () => {
        if (sessionId === activeSessionId) {
          currentAudio = null;
          if (options.onend) options.onend();
        }
      };

      audio.onerror = handleFailure;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          handleFailure();
        });
      }
    };

    tryPlaySource();
    return;
  }

  speakWebSpeech(trimmed, options, sessionId);
};

// Compares pronunciation by speaking US, then UK with a brief pause
export const speakCompare = (text, onFinish) => {
  stopSpeech();
  const compareSessionId = activeSessionId + 1; // Next speak will set activeSessionId to compareSessionId

  speak(text, {
    accent: 'US',
    onend: () => {
      if (compareSessionId === activeSessionId) {
        currentTimeoutId = setTimeout(() => {
          if (compareSessionId === activeSessionId) {
            speak(text, {
              accent: 'UK',
              onend: () => {
                if (compareSessionId === activeSessionId && onFinish) {
                  onFinish();
                }
              }
            });
          }
        }, 650);
      }
    }
  });
};

