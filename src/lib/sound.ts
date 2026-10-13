// Sound utility for Pomodoro timer notifications using Web Audio API

const SOUND_STORAGE_KEY = 'focusmate_sound_enabled';

/**
 * Check whether Pomodoro sound notifications are enabled.
 * Defaults to true.
 */
export function isPomodoroSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

/**
 * Toggle or set Pomodoro sound notification setting.
 */
export function setPomodoroSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage issues
  }
}

/**
 * Play a soothing, rich bell chime notification when Pomodoro countdown finishes.
 * Uses Web Audio API for zero-latency, high reliability, and no external assets needed.
 */
export function playTimerFinishSound(type: 'focus' | 'break' = 'focus'): void {
  if (typeof window === 'undefined') return;
  if (!isPomodoroSoundEnabled()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Melodic chime notes for celebratory / focus complete
    // C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1047Hz)
    const notes = type === 'focus' 
      ? [
          { freq: 523.25, time: 0.0, duration: 0.8, volume: 0.25 },
          { freq: 659.25, time: 0.15, duration: 0.8, volume: 0.28 },
          { freq: 783.99, time: 0.30, duration: 0.9, volume: 0.30 },
          { freq: 1046.50, time: 0.45, duration: 1.4, volume: 0.35 },
          { freq: 783.99, time: 1.05, duration: 0.8, volume: 0.25 },
          { freq: 1046.50, time: 1.25, duration: 1.6, volume: 0.38 },
        ]
      : [
          // Break finish chime: gentle 3-tone chime
          { freq: 659.25, time: 0.0, duration: 0.8, volume: 0.25 },
          { freq: 783.99, time: 0.2, duration: 0.9, volume: 0.28 },
          { freq: 880.00, time: 0.4, duration: 1.3, volume: 0.32 },
        ];

    notes.forEach(({ freq, time, duration, volume }) => {
      const startTime = ctx.currentTime + time;

      // Primary tone (sine wave for clean bell sound)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Warm harmonic overtone (triangle wave at 2x frequency)
      const overtone = ctx.createOscillator();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, startTime);

      // Main gain envelope: fast attack, exponential bell decay
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      // Overtone gain envelope
      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0, startTime);
      overtoneGain.gain.linearRampToValueAtTime(volume * 0.25, startTime + 0.015);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      overtone.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);

      overtone.start(startTime);
      overtone.stop(startTime + duration);
    });

    // Clean up AudioContext resource after chime finishes
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 3500);
  } catch (error) {
    console.warn('Unable to play Pomodoro sound:', error);
  }
}
