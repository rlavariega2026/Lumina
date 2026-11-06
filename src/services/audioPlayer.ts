/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MusicConfig } from '../types/gallery';

export interface AmbientPreset {
  key: NonNullable<MusicConfig['presetKey']>;
  name: string;
  genre: string;
  description: string;
  chords: number[][]; // MIDI frequencies
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    key: 'romantic_piano',
    name: 'Piano & Cuerdas Románticas',
    genre: 'Bodas & Romance',
    description: 'Acordes cálidos y etéreos de piano en clave de Re mayor.',
    chords: [
      [293.66, 369.99, 440.0, 587.33], // D major
      [220.0, 329.63, 440.0, 554.37],  // A major
      [246.94, 293.66, 369.99, 493.88], // B minor
      [196.0, 293.66, 392.0, 493.88],  // G major
    ],
  },
  {
    key: 'ambient_acoustic',
    name: 'Atardecer Acústico',
    genre: 'Lifestyle & Recuerdos',
    description: 'Armonías suaves y envolventes inspiradas en guitarra folk.',
    chords: [
      [261.63, 329.63, 392.0, 523.25], // C major
      [196.0, 246.94, 392.0, 493.88],  // G major
      [220.0, 261.63, 329.63, 440.0],  // A minor
      [174.61, 261.63, 349.23, 440.0], // F major
    ],
  },
  {
    key: 'cinematic_strings',
    name: 'Sinfonía Cinemática',
    genre: 'Cinematográfico & Graduación',
    description: 'Texturas orquestales amplias con resonancia espacial.',
    chords: [
      [146.83, 220.0, 293.66, 440.0],  // D5 power chord
      [174.61, 261.63, 349.23, 523.25], // F major
      [196.0, 293.66, 392.0, 587.33],  // G major
      [220.0, 277.18, 329.63, 440.0],  // A minor
    ],
  },
  {
    key: 'celebration_joy',
    name: 'Celebración Dorada',
    genre: 'Fiestas & XV Años',
    description: 'Vibraciones radiantes, acordes suspendidos y alegría festiva.',
    chords: [
      [261.63, 329.63, 440.0, 587.33],
      [293.66, 392.0, 493.88, 659.25],
      [246.94, 329.63, 392.0, 523.25],
      [261.63, 349.23, 440.0, 587.33],
    ],
  },
];

class AudioController {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private synthInterval: number | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.5;
  private activeChordsIndex = 0;

  get playing(): boolean {
    return this.isPlaying;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setTargetAtTime(this.currentVolume, this.audioCtx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.currentVolume;
    }
  }

  play(config: MusicConfig): boolean {
    if (!config.enabled) return false;

    this.stop();
    this.setVolume(config.volume ?? 0.5);

    // If custom audio file uploaded
    if (config.audioUrl) {
      if (!this.audioElement) {
        this.audioElement = new Audio();
      }
      this.audioElement.src = config.audioUrl;
      this.audioElement.loop = config.loop ?? true;
      this.audioElement.volume = this.currentVolume;
      this.audioElement
        .play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch(() => {
          console.warn('Autoplay prevented by browser. Requires user interaction.');
          this.isPlaying = false;
        });
      return true;
    }

    // Otherwise use ambient synthesizer preset
    const presetKey = config.presetKey || 'romantic_piano';
    const preset = AMBIENT_PRESETS.find((p) => p.key === presetKey) || AMBIENT_PRESETS[0];

    try {
      const ctx = this.initAudioContext();
      this.isPlaying = true;
      this.playSyntheticChord(preset.chords[0]);

      this.activeChordsIndex = 0;
      this.synthInterval = window.setInterval(() => {
        if (!this.isPlaying) return;
        this.activeChordsIndex = (this.activeChordsIndex + 1) % preset.chords.length;
        this.playSyntheticChord(preset.chords[this.activeChordsIndex]);
      }, 4500);

      return true;
    } catch (e) {
      console.warn('Could not start web audio:', e);
      return false;
    }
  }

  private playSyntheticChord(freqs: number[]): void {
    if (!this.audioCtx || !this.gainNode) return;
    const now = this.audioCtx.currentTime;

    freqs.forEach((freq, idx) => {
      if (!this.audioCtx || !this.gainNode) return;
      const osc = this.audioCtx.createOscillator();
      const chordGain = this.audioCtx.createGain();

      // Soft sine & triangle for warm ambient sound
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Smooth attack and release envelope
      chordGain.gain.setValueAtTime(0.0001, now);
      chordGain.gain.exponentialRampToValueAtTime(0.08 / freqs.length, now + 1.2);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      osc.connect(chordGain);
      chordGain.connect(this.gainNode);

      osc.start(now);
      osc.stop(now + 4.3);
    });
  }

  stop(): void {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  toggle(config: MusicConfig): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      return this.play(config);
    }
  }
}

export const audioController = new AudioController();
