// Global audio context singleton
let globalAudioCtx = null;

export const unlockAudio = () => {
  try {
    if (!globalAudioCtx) {
      globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch((err) => console.log("Audio resume error:", err));
    }
  } catch (err) {
    console.log("Audio Context unlock error:", err);
  }
};

// Global click & touch listeners to unlock Web Audio API on first user interaction
if (typeof window !== "undefined") {
  const handleUserGesture = () => {
    unlockAudio();
  };
  window.addEventListener("click", handleUserGesture, { capture: true, passive: true });
  window.addEventListener("touchstart", handleUserGesture, { capture: true, passive: true });
  window.addEventListener("keydown", handleUserGesture, { capture: true, passive: true });
}

/**
 * Plays a crisp, prominent notification chime — ClickUp-style triple-tone.
 * Louder and more distinct than the previous dual-tone.
 */
export const playNotificationChime = () => {
  try {
    unlockAudio();

    if (globalAudioCtx) {
      const now = globalAudioCtx.currentTime;
      const masterGain = globalAudioCtx.createGain();
      masterGain.gain.setValueAtTime(0.6, now);
      masterGain.connect(globalAudioCtx.destination);

      // Note 1: C6 (1046.5 Hz) — bright opening
      const osc1 = globalAudioCtx.createOscillator();
      const gain1 = globalAudioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: E6 (1318.5 Hz) — rising middle
      const osc2 = globalAudioCtx.createOscillator();
      const gain2 = globalAudioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.5, now + 0.1);
      gain2.gain.setValueAtTime(0.001, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.55, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);

      // Note 3: G6 (1568 Hz) — bright resolution
      const osc3 = globalAudioCtx.createOscillator();
      const gain3 = globalAudioCtx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1568, now + 0.2);
      gain3.gain.setValueAtTime(0.001, now + 0.2);
      gain3.gain.linearRampToValueAtTime(0.5, now + 0.22);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now + 0.2);
      osc3.stop(now + 0.7);
    }
  } catch (err) {
    console.warn("Notification sound play failed:", err);
  }
};
