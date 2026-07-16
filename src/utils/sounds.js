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

// Global text-to-speech speaking utility with US/UK support
export const speak = (text, options = {}) => {
  if (!('speechSynthesis' in window)) {
    console.warn("speechSynthesis not supported on this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  
  const accent = options.accent || localStorage.getItem('eng_app_voice_accent') || 'US';
  const lang = accent === 'UK' ? 'en-GB' : 'en-US';
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = options.rate || 0.85; // slightly slower for learners
  if (options.pitch) utterance.pitch = options.pitch;
  
  if (window.speechSynthesis.getVoices) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang.startsWith(lang.toLowerCase());
    });
    if (voice) {
      utterance.voice = voice;
    }
  }

  if (options.onstart) utterance.onstart = options.onstart;
  if (options.onend) utterance.onend = options.onend;
  if (options.onerror) utterance.onerror = options.onerror;
  
  window.speechSynthesis.speak(utterance);
};

// Compares pronunciation by speaking US, then UK with a brief pause
export const speakCompare = (text, onFinish) => {
  if (!('speechSynthesis' in window)) {
    console.warn("speechSynthesis not supported on this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  
  const rate = 0.85;
  const uttUS = new SpeechSynthesisUtterance(text);
  uttUS.lang = 'en-US';
  uttUS.rate = rate;
  
  const uttUK = new SpeechSynthesisUtterance(text);
  uttUK.lang = 'en-GB';
  uttUK.rate = rate;
  
  if (window.speechSynthesis.getVoices) {
    const voices = window.speechSynthesis.getVoices();
    const voiceUS = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith('en-us'));
    const voiceUK = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith('en-gb'));
    if (voiceUS) uttUS.voice = voiceUS;
    if (voiceUK) uttUK.voice = voiceUK;
  }
  
  uttUS.onend = () => {
    setTimeout(() => {
      window.speechSynthesis.speak(uttUK);
    }, 600);
  };
  
  if (onFinish) {
    uttUK.onend = onFinish;
  }
  
  window.speechSynthesis.speak(uttUS);
};

