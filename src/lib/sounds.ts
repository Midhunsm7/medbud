// Notification sound utilities
// These use the Web Audio API to generate simple notification sounds

export class NotificationSound {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play a pleasant notification sound
  playNotification() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Create a pleasant two-tone notification
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.setValueAtTime(1000, now + 0.1);

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // Play a success sound
  playSuccess() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Ascending tones for success
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);

    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }

  // Play an error sound
  playError() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Descending tone for error
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.setValueAtTime(300, now + 0.1);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // Play a gentle reminder chime
  playChime() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create multiple oscillators for a richer sound
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G chord
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.type = 'sine';

      const delay = index * 0.05;
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(0.15, now + delay + 0.01);
      gainNode.gain.linearRampToValueAtTime(0.15, now + delay + 0.3);
      gainNode.gain.linearRampToValueAtTime(0, now + delay + 0.6);

      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.6);
    });
  }
}

// Singleton instance
let soundInstance: NotificationSound | null = null;

export const getNotificationSound = (): NotificationSound => {
  if (!soundInstance) {
    soundInstance = new NotificationSound();
  }
  return soundInstance;
};

// Convenience functions
export const playNotificationSound = () => getNotificationSound().playNotification();
export const playSuccessSound = () => getNotificationSound().playSuccess();
export const playErrorSound = () => getNotificationSound().playError();
export const playChimeSound = () => getNotificationSound().playChime();

// Made with Bob
