'use client'

// Tactical sound synthesizer using Web Audio API (zero external sound file dependencies)
class SoundSystem {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('oil_sound_enabled')
      this.enabled = stored !== null ? stored === 'true' : true
    }
  }

  private initCtx() {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setEnabled(val: boolean) {
    this.enabled = val
    if (typeof window !== 'undefined') {
      localStorage.setItem('oil_sound_enabled', String(val))
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled)
    if (this.enabled) {
      this.playBeep(880, 0.08, 'sine')
    }
    return this.enabled
  }

  // Play subtle tactical UI click
  public playClick() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // Play high-tech scan sweep
  public playScan() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.02, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
    } catch {}
  }

  // Play critical hazard alert chime
  public playAlert() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const freqs = [740, 920, 740]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.1)
        gain.gain.setValueAtTime(0.06, now + idx * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.09)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.1)
        osc.stop(now + idx * 0.1 + 0.09)
      })
    } catch {}
  }

  // Play success chime
  public playSuccess() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const freqs = [523.25, 659.25, 783.99, 1046.5]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.05)
        gain.gain.setValueAtTime(0.03, now + idx * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.05)
        osc.stop(now + idx * 0.05 + 0.12)
      })
    } catch {}
  }

  // Helper beep
  public playBeep(freq: number = 800, duration: number = 0.08, type: OscillatorType = 'sine') {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.03, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }

  // Play high-tech microphone activation cue (ascending dual tone)
  public playMicStart() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const tones = [587.33, 880] // D5 -> A5
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.07)
        gain.gain.setValueAtTime(0.04, now + idx * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.07)
        osc.stop(now + idx * 0.07 + 0.1)
      })
    } catch {}
  }

  // Play microphone deactivation cue (descending soft tone)
  public playMicStop() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const tones = [880, 523.25] // A5 -> C5
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.06)
        gain.gain.setValueAtTime(0.035, now + idx * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.09)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.06)
        osc.stop(now + idx * 0.06 + 0.09)
      })
    } catch {}
  }
}

export const sound = new SoundSystem()
