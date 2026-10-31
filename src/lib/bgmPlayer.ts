// 🎵 파티세리 미니룸 BGM & 자연의 소리 앰비언스 신디사이저
// - 외부 MP3 다운로드/CORS/용량 문제 없는 100% 순수 Web Audio API 실시간 합성 엔진
// - 4대 감성 트랙:
//   1. 🌊 ocean: 잔잔한 바다 파도 소리 (핑크 노이즈 바이쿼드 필터 스위프)
//   2. 🌲 forest: 평화로운 숲속 바람과 작은 새소리
//   3. 🎵 classical: 에릭 사티 '짐노페디 No.1' 감성 클래식 오르골
//   4. 🍰 waltz: 달콤 파티세리의 오후 햇살 왈츠 (오리지널)

export type BgmTrack = 'waltz' | 'ocean' | 'forest' | 'classical'

export interface BgmTrackInfo {
  id: BgmTrack
  name: string
  sub: string
  icon: string
}

export const BGM_TRACKS: BgmTrackInfo[] = [
  { id: 'waltz', name: '파티세리 왈츠', sub: '달콤한 햇살 오르골', icon: '🍰' },
  { id: 'ocean', name: '바다 파도소리', sub: '잔잔한 파도 힐링 ASMR', icon: '🌊' },
  { id: 'forest', name: '숲속의 바람', sub: '상쾌한 숲과 작은 새소리', icon: '🌲' },
  { id: 'classical', name: '짐노페디 오르골', sub: '차분한 클래식 멜로디', icon: '🎵' },
]

class MiniRoomBgmEngine {
  private ctx: AudioContext | null = null
  private isPlaying: boolean = false
  private currentTrack: BgmTrack = 'waltz'
  private timerId: number | null = null
  private ambientTimerId: number | null = null
  private step: number = 0

  // 1. 파티세리 왈츠 멜로디
  private waltzMelody: { note: number; dur: number }[] = [
    { note: 523.25, dur: 0.4 }, // C5
    { note: 659.25, dur: 0.3 }, // E5
    { note: 587.33, dur: 0.3 }, // D5
    { note: 523.25, dur: 0.6 }, // C5
    { note: 440.0, dur: 0.3 },  // A4
    { note: 392.0, dur: 0.3 },  // G4
    { note: 329.63, dur: 0.4 }, // E4
    { note: 392.0, dur: 0.4 },  // G4
    { note: 440.0, dur: 0.4 },  // A4
    { note: 523.25, dur: 0.8 }, // C5
    { note: 587.33, dur: 0.4 }, // D5
    { note: 659.25, dur: 0.6 }, // E5
    { note: 523.25, dur: 0.4 }, // C5
    { note: 392.0, dur: 0.6 },  // G4
    { note: 440.0, dur: 0.4 },  // A4
    { note: 523.25, dur: 1.0 }, // C5
  ]

  // 2. 클래식 '짐노페디 No.1' 테마 오르골 멜로디
  private classicalMelody: { note: number; dur: number }[] = [
    { note: 369.99, dur: 0.9 }, // F#4
    { note: 440.0, dur: 0.9 },  // A4
    { note: 493.88, dur: 0.9 }, // B4
    { note: 440.0, dur: 0.9 },  // A4
    { note: 369.99, dur: 1.2 }, // F#4
    { note: 329.63, dur: 0.9 }, // E4
    { note: 293.66, dur: 0.9 }, // D4
    { note: 369.99, dur: 1.4 }, // F#4
    { note: 440.0, dur: 0.9 },  // A4
    { note: 493.88, dur: 0.9 }, // B4
    { note: 554.37, dur: 1.2 }, // C#5
    { note: 493.88, dur: 0.9 }, // B4
    { note: 440.0, dur: 1.4 },  // A4
  ]

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('myroom_bgm_track') as BgmTrack | null
      if (saved && ['waltz', 'ocean', 'forest', 'classical'].includes(saved)) {
        this.currentTrack = saved
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    return this.ctx
  }

  // 맑고 투명한 오르골 건반 합성
  private playMusicBoxNote(freq: number, dur: number) {
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(freq * 2.0, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.exponentialRampToValueAtTime(0.24, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 1.8)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2800, now)

      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(filter)
      filter.connect(ctx.destination)

      osc.start(now)
      osc2.start(now)
      osc.stop(now + dur * 2.0)
      osc2.stop(now + dur * 2.0)
    } catch {}
  }

  // 🌊 파도 소리 실시간 합성 (핑크 노이즈 버퍼 + 스위프 로우패스 필터)
  private playWaveCycle() {
    const ctx = this.getAudioContext()
    if (!ctx || !this.isPlaying || this.currentTrack !== 'ocean') return

    try {
      const now = ctx.currentTime
      const bufferSize = ctx.sampleRate * 4.5
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06
        b6 = white * 0.115926
      }

      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(180, now)
      filter.frequency.exponentialRampToValueAtTime(750, now + 2.0)
      filter.frequency.exponentialRampToValueAtTime(140, now + 4.5)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.18, now + 2.0)
      gain.gain.linearRampToValueAtTime(0.001, now + 4.5)

      whiteNoise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      whiteNoise.start(now)
      whiteNoise.stop(now + 4.6)

      this.ambientTimerId = window.setTimeout(() => {
        this.playWaveCycle()
      }, 4200)
    } catch {}
  }

  // 🌲 숲속 바람 & 작은 새소리 실시간 합성
  private playForestCycle() {
    const ctx = this.getAudioContext()
    if (!ctx || !this.isPlaying || this.currentTrack !== 'forest') return

    try {
      const now = ctx.currentTime

      // 은은한 숲속 솔바람
      const bufferSize = ctx.sampleRate * 4.0
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.03
      }
      const wind = ctx.createBufferSource()
      wind.buffer = noiseBuffer
      const windFilter = ctx.createBiquadFilter()
      windFilter.type = 'bandpass'
      windFilter.frequency.setValueAtTime(450, now)
      windFilter.Q.setValueAtTime(2.5, now)

      const windGain = ctx.createGain()
      windGain.gain.setValueAtTime(0.01, now)
      windGain.gain.linearRampToValueAtTime(0.12, now + 1.8)
      windGain.gain.linearRampToValueAtTime(0.01, now + 4.0)

      wind.connect(windFilter)
      windFilter.connect(windGain)
      windGain.connect(ctx.destination)
      wind.start(now)
      wind.stop(now + 4.1)

      // 귀여운 아기새 지저귐 (짹짹 주파수 변조)
      setTimeout(() => {
        if (!this.isPlaying || this.currentTrack !== 'forest') return
        const t = ctx.currentTime
        const bird = ctx.createOscillator()
        const bGain = ctx.createGain()
        bird.type = 'sine'
        bird.frequency.setValueAtTime(2800, t)
        bird.frequency.exponentialRampToValueAtTime(3600, t + 0.06)
        bird.frequency.exponentialRampToValueAtTime(2900, t + 0.12)
        bGain.gain.setValueAtTime(0.001, t)
        bGain.gain.linearRampToValueAtTime(0.08, t + 0.03)
        bGain.gain.linearRampToValueAtTime(0.0001, t + 0.14)

        bird.connect(bGain)
        bGain.connect(ctx.destination)
        bird.start(t)
        bird.stop(t + 0.15)
      }, 900)

      this.ambientTimerId = window.setTimeout(() => {
        this.playForestCycle()
      }, 3800)
    } catch {}
  }

  // 트랙 변경
  public setTrack(track: BgmTrack) {
    this.currentTrack = track
    if (typeof window !== 'undefined') {
      localStorage.setItem('myroom_bgm_track', track)
    }
    if (this.isPlaying) {
      this.stop()
      this.start()
    }
  }

  public getTrack(): BgmTrack {
    return this.currentTrack
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop()
      return false
    } else {
      this.start()
      return true
    }
  }

  public play() {
    this.start()
  }

  public start() {
    if (this.isPlaying) return
    const ctx = this.getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    this.isPlaying = true
    this.step = 0

    if (this.currentTrack === 'ocean') {
      this.playWaveCycle()
    } else if (this.currentTrack === 'forest') {
      this.playForestCycle()
    } else {
      // 오르골 멜로디 계열 (waltz, classical)
      const melody = this.currentTrack === 'classical' ? this.classicalMelody : this.waltzMelody
      const tick = () => {
        if (!this.isPlaying) return
        const item = melody[this.step % melody.length]
        this.playMusicBoxNote(item.note, item.dur)
        this.step++
        this.timerId = window.setTimeout(tick, item.dur * 850)
      }
      tick()
    }
  }

  public stop() {
    this.isPlaying = false
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId)
      this.timerId = null
    }
    if (this.ambientTimerId !== null) {
      window.clearTimeout(this.ambientTimerId)
      this.ambientTimerId = null
    }
  }

  public getStatus(): boolean {
    return this.isPlaying
  }
}

export const miniRoomBgm = new MiniRoomBgmEngine()
