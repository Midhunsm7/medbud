// Notification sound utilities
// These use the Web Audio API to generate simple notification sounds
// Also supports custom audio files

export class NotificationSound {
  private audioContext: AudioContext | null = null;
  private customAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
      }
    }
  }

  // Play custom audio file
  playCustomSound(audioUrl: string) {
    try {
      if (typeof window === 'undefined') return;
      
      // Stop any currently playing custom sound
      if (this.customAudio) {
        this.customAudio.pause();
        this.customAudio.currentTime = 0;
      }

      this.customAudio = new Audio(audioUrl);
      this.customAudio.volume = 0.7;
      
      const playPromise = this.customAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Custom sound playing');
          })
          .catch((error) => {
            console.error('Error playing custom sound:', error);
            // Fallback to default sound
            this.playNotification();
          });
      }
    } catch (error) {
      console.error('Error in playCustomSound:', error);
      // Fallback to default sound
      this.playNotification();
    }
  }

  // Stop custom sound
  stopCustomSound() {
    try {
      if (this.customAudio) {
        this.customAudio.pause();
        this.customAudio.currentTime = 0;
      }
    } catch (error) {
      console.error('Error stopping custom sound:', error);
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
export const playNotificationSound = () => {
  try {
    getNotificationSound().playNotification();
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const playSuccessSound = () => {
  try {
    getNotificationSound().playSuccess();
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
};

export const playErrorSound = () => {
  try {
    getNotificationSound().playError();
  } catch (error) {
    console.error('Error playing error sound:', error);
  }
};

export const playChimeSound = () => {
  try {
    getNotificationSound().playChime();
  } catch (error) {
    console.error('Error playing chime sound:', error);
  }
};

export const playCustomAlarmSound = (audioUrl: string) => {
  try {
    getNotificationSound().playCustomSound(audioUrl);
  } catch (error) {
    console.error('Error playing custom alarm sound:', error);
    // Fallback to default
    playNotificationSound();
  }
};

export const stopCustomAlarmSound = () => {
  try {
    getNotificationSound().stopCustomSound();
  } catch (error) {
    console.error('Error stopping custom alarm sound:', error);
  }
};

// Made with Bob
