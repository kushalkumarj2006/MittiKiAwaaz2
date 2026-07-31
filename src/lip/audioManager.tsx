type AudioStateListener = (isPlaying: boolean) => void;

let audioPlayingState = false;
const listeners: Set<AudioStateListener> = new Set();
let currentAudioElement: HTMLAudioElement | null = null;

export function subscribeAudioState(listener: AudioStateListener) {
  listeners.add(listener);
  listener(audioPlayingState);
  return () => {
    listeners.delete(listener);
  };
}

function setAudioPlaying(playing: boolean) {
  audioPlayingState = playing;
  listeners.forEach((fn) => fn(playing));
}

export function isAudioPlaying(): boolean {
  return audioPlayingState;
}

export function stopAudio() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  setAudioPlaying(false);
}

export function playSpeech(
  text: string,
  langCode: string = 'hi-IN',
  onEnd?: () => void
) {
  stopAudio();
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.95;

  utterance.onstart = () => {
    setAudioPlaying(true);
  };

  utterance.onend = () => {
    setAudioPlaying(false);
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    setAudioPlaying(false);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function registerAudioElement(audioEl: HTMLAudioElement) {
  currentAudioElement = audioEl;
  setAudioPlaying(true);
  audioEl.onended = () => setAudioPlaying(false);
  audioEl.onpause = () => setAudioPlaying(false);
}
