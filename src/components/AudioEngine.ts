// Proc-audio lutenist engine utilizing FM synthesis for pristine acoustic string plucking simulations.

export const CHORD_FREQUENCIES: Record<string, number[]> = {
  "G": [98.0, 196.0, 246.9, 293.7, 392.0],       // G2, G3, B3, D4, G4
  "C": [130.8, 196.0, 261.6, 329.6, 523.3],      // C3, G3, C4, E4, C5
  "D": [146.8, 220.0, 293.7, 369.9, 587.3],      // D3, A3, D4, F#4, D5
  "Em": [82.4, 164.8, 196.0, 246.9, 329.6],      // E2, E3, G3, B3, E4
  "Am": [110.0, 220.0, 261.6, 329.6, 440.0],      // A2, A3, C4, E4, A4
  "F": [87.3, 174.6, 261.6, 349.2, 440.0],       // F2, F3, C4, F4, A4
  "Cmaj7": [130.8, 196.0, 261.6, 329.6, 493.9],  // C3, G3, C4, E4, B4
  "Gmaj7": [98.0, 196.0, 246.9, 293.7, 381.9],   // G2, G3, B3, D4, F#4
  "A": [110.0, 220.0, 277.2, 329.6, 440.0],       // A2, A3, C#4, E4, A4
  "E": [82.4, 164.8, 246.9, 329.6, 415.3],       // E2, E3, B3, E4, G#4
  "Bm": [123.5, 246.9, 293.7, 369.9, 493.9],     // B2, B3, D4, F#4, B4
  "B": [123.5, 246.9, 277.2, 369.9, 493.9],      // B2, B3, D#4, F#4, B4
  "Dm": [146.8, 220.0, 293.7, 349.2, 587.3],     // D3, A3, D4, F4, D5
};

export class AudioLuteEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNotes: { carrier: OscillatorNode; modulator: OscillatorNode; gain: GainNode }[] = [];
  private strumInterval: number | null = null;
  private currentChord: string = "G";
  private audioVolume: number = 0.5;

  constructor() {}

  // Lazily initialize context on first user click to bypass browser policy policies
  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioCtxClass) {
        throw new Error("Web Audio API not supported in this browser.");
      }
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.audioVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public setVolume(volume: number) {
    this.audioVolume = volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  // Decodes and plays raw base64 generated speech
  public async playSpeechIntro(base64Audio: string): Promise<Promise<void>> {
    const audioCtx = this.initContext();
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Promise((resolve, reject) => {
      audioCtx.decodeAudioData(bytes.buffer, (buffer) => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        
        // Connect to master gain controller
        if (this.masterGain) {
          source.connect(this.masterGain);
        } else {
          source.connect(audioCtx.destination);
        }
        
        source.start(0);
        source.onended = () => resolve();
      }, (err) => {
        console.error("Failed to decode speech:", err);
        reject(err);
      });
    });
  }

  // Synthesizes a high-quality lute string pluck using FM modulation curves
  public pluckString(frequency: number, time: number, velocity: number = 0.6) {
    if (!this.ctx || !this.masterGain) return;

    // FM Pluck logic:
    // Carrier oscillator renders fundamental tone, Mudulator crafts metallic, plucked string transients
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    
    const carrierGain = this.ctx.createGain();
    const modulationGain = this.ctx.createGain();

    carrier.type = "sine";
    modulator.type = "triangle";

    carrier.frequency.setValueAtTime(frequency, time);
    // Modulator at triple frequency creates bell/lute timber resonance
    modulator.frequency.setValueAtTime(frequency * 3, time);

    // Exponential pluck gain outline
    carrierGain.gain.setValueAtTime(0, time);
    carrierGain.gain.linearRampToValueAtTime(velocity * 0.4, time + 0.01);
    carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

    // Modulator depth envelope creates initial string strike excitement
    modulationGain.gain.setValueAtTime(frequency * 4.0, time);
    modulationGain.gain.exponentialRampToValueAtTime(0.1, time + 0.12);

    // FM routing connections
    modulator.connect(modulationGain);
    modulationGain.connect(carrier.frequency);
    carrier.connect(carrierGain);
    carrierGain.connect(this.masterGain);

    // Start oscillations
    modulator.start(time);
    carrier.start(time);

    // Stop oscillations to save CPU cycles
    modulator.stop(time + 1.9);
    carrier.stop(time + 1.9);

    const noteObj = { carrier, modulator, gain: carrierGain };
    this.activeNotes.push(noteObj);

    // Clean up active reference tags
    setTimeout(() => {
      this.activeNotes = this.activeNotes.filter(n => n !== noteObj);
    }, 2000);
  }

  // Triggers a beautiful strummed folk chord arpeggio based on the selected guitar root notes
  public strumChord(chord: string, time: number) {
    const cleanChord = chord ? chord.trim() : "G";
    const frequencies = CHORD_FREQUENCIES[cleanChord] || CHORD_FREQUENCIES["G"];
    
    // Pluck notes with micro timeline delays to mock human physical pick strumming
    frequencies.forEach((freq, idx) => {
      const strumDelay = idx * 0.045; // Strum duration offset across strings
      const stringVelocity = 0.8 - (idx * 0.06); // Subtle dynamic decay on top strings
      this.pluckString(freq, time + strumDelay, stringVelocity);
    });
  }

  // Starts the interactive playing clock to mock real strum rhythms
  public startLutePlayback(getChordAtTime: () => string) {
    this.initContext();
    this.stopLutePlayback();

    const bpm = 92;
    const beatDuration = 60 / bpm; // duration of one beat in seconds

    let currentSchedulerTime = this.ctx!.currentTime;
    
    const tick = () => {
      if (!this.ctx) return;
      const lookAhead = 0.1;
      
      while (currentSchedulerTime < this.ctx.currentTime + lookAhead) {
        // Retrieve current chord mapping from parent state
        const activeChord = getChordAtTime();
        
        // Complex folk acoustic flatpicking strumming rhythm:
        // Beat 1: Bass Note root strum
        // Beat 1.5: Light Arpeggio Pluck on string 3-4
        // Beat 2: Warm Full Strum
        // Beat 2.5: High G pluck
        this.strumChord(activeChord, currentSchedulerTime);
        
        // Schedule arpeggio plucks
        const frequencies = CHORD_FREQUENCIES[activeChord] || CHORD_FREQUENCIES["G"];
        if (frequencies.length >= 3) {
          const highLuteNote1 = frequencies[frequencies.length - 1];
          const highLuteNote2 = frequencies[frequencies.length - 2];
          this.pluckString(highLuteNote1, currentSchedulerTime + beatDuration * 0.5, 0.25);
          this.pluckString(highLuteNote2, currentSchedulerTime + beatDuration * 0.75, 0.2);
        }

        currentSchedulerTime += beatDuration;
      }
    };

    // Keep the schedule looping
    this.strumInterval = window.setInterval(tick, 50);
  }

  public stopLutePlayback() {
    if (this.strumInterval) {
      clearInterval(this.strumInterval);
      this.strumInterval = null;
    }
    // Fade out any ringing strings instantly
    this.activeNotes.forEach(note => {
      try {
        note.gain.gain.setValueAtTime(0.0001, this.ctx?.currentTime || 0);
      } catch (err) {}
    });
    this.activeNotes = [];
  }
}

export const luteEngineInstance = new AudioLuteEngine();
