// WebAudio synth: every sound is an oscillator envelope, no files and no network.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    const AudioCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioCtor) return null;
    try {
      context = new AudioCtor();
    } catch {
      return null;
    }
    return context;
  }

  function tone(frequency, duration, options = {}) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime + (options.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    if (options.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, options.slideTo), now + duration);
    const volume = options.gain ?? 0.06;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function play(name) {
    switch (name) {
      case 'start':
        tone(330, 0.16, { type: 'triangle', gain: 0.05 });
        tone(494, 0.2, { type: 'triangle', gain: 0.05, delay: 0.12 });
        break;
      case 'intro':
        tone(220, 0.12, { type: 'sine', gain: 0.035 });
        break;
      case 'spotted':
        tone(880, 0.1, { type: 'square', gain: 0.035 });
        tone(660, 0.14, { type: 'square', gain: 0.035, delay: 0.11 });
        break;
      case 'loot':
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: 'triangle', gain: 0.05, delay: i * 0.07 }));
        break;
      case 'emp':
        tone(1200, 0.5, { type: 'sawtooth', gain: 0.035, slideTo: 90 });
        tone(90, 0.4, { type: 'sine', gain: 0.05, delay: 0.06 });
        break;
      case 'smoke':
        tone(260, 0.32, { type: 'triangle', gain: 0.045, slideTo: 120 });
        break;
      case 'noise':
        tone(1320, 0.09, { type: 'square', gain: 0.03 });
        tone(990, 0.1, { type: 'square', gain: 0.025, delay: 0.11 });
        break;
      case 'denied':
        tone(150, 0.08, { type: 'square', gain: 0.025 });
        break;
      case 'step':
        tone(110, 0.035, { type: 'sine', gain: 0.012 });
        break;
      case 'caught':
        tone(420, 0.75, { type: 'sawtooth', gain: 0.07, slideTo: 55 });
        tone(70, 0.9, { type: 'sine', gain: 0.09, delay: 0.12 });
        break;
      case 'getaway':
        [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'triangle', gain: 0.045, delay: i * 0.11 }));
        break;
      default:
        break;
    }
  }

  return {
    ensure,
    play,
    isMuted: () => muted,
    toggleMute() {
      muted = !muted;
      return muted;
    },
  };
}
