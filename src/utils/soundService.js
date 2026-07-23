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
 * Plays a crisp, pleasant notification sound chime.
 */
export const playNotificationChime = () => {
  try {
    unlockAudio();

    if (globalAudioCtx) {
      const now = globalAudioCtx.currentTime;

      // Note 1: A5 (880 Hz)
      const osc1 = globalAudioCtx.createOscillator();
      const gain1 = globalAudioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(globalAudioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: E6 (1318.51 Hz) - 100ms offset
      const osc2 = globalAudioCtx.createOscillator();
      const gain2 = globalAudioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, now + 0.1);
      gain2.gain.setValueAtTime(0.001, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.5, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(globalAudioCtx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.8);
    }
  } catch (err) {
    console.warn("Notification sound play failed:", err);
  }
};
