// 🎵 파티세리 미니룸 싸이월드 감성 오르골 왈츠 BGM 신디사이저
// - 외부 MP3 다운로드 실패/CORS/용량 문제 없는 순수 Web Audio API 실시간 합성 엔진
// - 따스한 뮤직박스(Music Box) & 셀레스타 톤으로 작곡된 3/4박자 '달콤 파티세리의 오후 햇살 왈츠'

class MiniRoomBgmEngine {
  private ctx: AudioContext | null = null
  private isPlaying: boolean = false
  private timerId: number | null = null
  private step: number = 0

  // 3/4박자 왈츠 멜로디 (주파수 Hz)
  // 도(C4), 미(E4), 솔(G4), 라(A4), 시(B4), 높은도(C5), 높은레(D5), 높은미(E5)
  private melody: { note: number; dur: number }[] = [
    { note: 523.25, dur: 0.4 }, // C5
    { note: 659.25, dur: 0.3 }, // E5
    { note: 587.33, dur: 0.3 }, // D5
    { note: 523.25, dur: 0.6 }, // C5
    { note: 440.0, dur: 0.3 }, // A4
    { note: 392.0, dur: 0.3 }, // G4
    { note: 329.63, dur: 0.4 }, // E4
    { note: 392.0, dur: 0.4 }, // G4
    { note: 440.0, dur: 0.4 }, // A4
    { note: 523.25, dur: 0.8 }, // C5
    { note: 587.33, dur: 0.4 }, // D5
    { note: 659.25, dur: 0.6 }, // E5
    { note: 523.25, dur: 0.4 }, // C5
    { note: 392.0, dur: 0.8 }, // G4
    { note: 349.23, dur: 0.4 }, // F4
    { note: 329.63, dur: 0.4 }, // E4
    { note: 293.66, dur: 0.6 }, // D4
    { note: 261.63, dur: 1.0 }, // C4
  ]

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  // 영롱한 오르골 음표 하나 재생
  private playMusicBoxNote(freq: number, dur: number) {
    try {
      const ctx = this.getAudioContext()
      if (!ctx || ctx.state !== 'running') return

      const now = ctx.currentTime

      // 1. 메인 사인파 (맑은 종소리 느낌)
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      // 2. 부드러운 고음 하모닉스 (오르골 특유의 반짝임)
      const osc2 = ctx.createOscillator()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(freq * 2, now)

      // 게인 엔벨로프 (빠른 어택, 긴 감쇠)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.09, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 1.8)

      // 부드러운 로우패스 필터
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2400, now)

      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(filter)
      filter.connect(ctx.destination)

      osc.start(now)
      osc2.start(now)
      osc.stop(now + dur * 2.0)
      osc2.stop(now + dur * 2.0)
    } catch {
      // Zero-Crash 방어
    }
  }

  // BGM 재생 토글
  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop()
      return false
    } else {
      this.start()
      return true
    }
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

    const tick = () => {
      if (!this.isPlaying) return
      const item = this.melody[this.step % this.melody.length]
      this.playMusicBoxNote(item.note, item.dur)
      this.step++
      this.timerId = window.setTimeout(tick, item.dur * 850)
    }

    tick()
  }

  public stop() {
    this.isPlaying = false
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  public getStatus(): boolean {
    return this.isPlaying
  }
}

export const miniRoomBgm = new MiniRoomBgmEngine()

