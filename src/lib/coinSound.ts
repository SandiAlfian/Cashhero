/* eslint-disable @typescript-eslint/no-explicit-any */

let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined' && typeof self === 'undefined') return null
  if (sharedCtx) return sharedCtx
  const g = (typeof window !== 'undefined' ? window : self) as any
  const Ctor: typeof AudioContext | undefined = g.AudioContext || g.webkitAudioContext
  if (!Ctor) return null
  sharedCtx = new Ctor()
  return sharedCtx
}

export function playCoinSound() {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  const now = ctx.currentTime

  const master = ctx.createGain()
  master.gain.setValueAtTime(0.9, now)
  master.connect(ctx.destination)

  const coinTimes = [0.000, 0.035, 0.072, 0.098, 0.130, 0.160, 0.192, 0.220]

  coinTimes.forEach((delay, idx) => {
    const t = now + delay
    const density = 1.0 - idx * 0.06

    const iDur = 0.025 + Math.random() * 0.015
    const iBuf = ctx.createBuffer(1, ctx.sampleRate * iDur, ctx.sampleRate)
    const iData = iBuf.getChannelData(0)
    for (let j = 0; j < iData.length; j++) {
      const env = Math.exp(-j / (ctx.sampleRate * 0.004))
      const mod = 0.5 + 0.5 * Math.sin(j * 0.04 + idx * 1.7)
      iData[j] = (Math.random() * 2 - 1) * env * mod
    }
    const iSrc = ctx.createBufferSource()
    iSrc.buffer = iBuf
    const iGain = ctx.createGain()
    iGain.gain.setValueAtTime(0.30 * density, t)
    iGain.gain.exponentialRampToValueAtTime(0.001, t + iDur)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1200 + Math.random() * 1500
    bp.Q.value = 1.0 + Math.random() * 0.5
    iSrc.connect(bp)
    bp.connect(iGain)
    iGain.connect(master)
    iSrc.start(t)
    iSrc.stop(t + iDur)

    const mOsc = ctx.createOscillator()
    const mGain = ctx.createGain()
    mOsc.type = 'sine'
    const mFreq = 1800 + Math.random() * 2500 + idx * 120
    mOsc.frequency.setValueAtTime(mFreq, t)
    mOsc.frequency.exponentialRampToValueAtTime(mFreq * 0.3, t + 0.04)
    mGain.gain.setValueAtTime(0.05 * density, t)
    mGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
    mOsc.connect(mGain)
    mGain.connect(master)
    mOsc.start(t)
    mOsc.stop(t + 0.04)

    const thOsc = ctx.createOscillator()
    const thGain = ctx.createGain()
    thOsc.type = 'sine'
    thOsc.frequency.setValueAtTime(200 + Math.random() * 150, t + 0.008)
    thOsc.frequency.exponentialRampToValueAtTime(60, t + 0.05)
    thGain.gain.setValueAtTime(0.06 * density, t + 0.008)
    thGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    thOsc.connect(thGain)
    thGain.connect(master)
    thOsc.start(t + 0.008)
    thOsc.stop(t + 0.05)

    const sOsc = ctx.createOscillator()
    const sGain = ctx.createGain()
    sOsc.type = 'triangle'
    sOsc.frequency.setValueAtTime(mFreq * 2.2, t + 0.003)
    sOsc.frequency.exponentialRampToValueAtTime(mFreq * 0.8, t + 0.015)
    sGain.gain.setValueAtTime(0.015 * density, t + 0.003)
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015)
    sOsc.connect(sGain)
    sGain.connect(master)
    sOsc.start(t + 0.003)
    sOsc.stop(t + 0.015)

    if (idx < coinTimes.length - 1 && Math.random() > 0.3) {
      const bt = t + 0.025 + Math.random() * 0.02
      const bDur = 0.012
      const bBuf = ctx.createBuffer(1, ctx.sampleRate * bDur, ctx.sampleRate)
      const bData = bBuf.getChannelData(0)
      for (let j = 0; j < bData.length; j++) bData[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.003))
      const bSrc = ctx.createBufferSource()
      bSrc.buffer = bBuf
      const bGain = ctx.createGain()
      bGain.gain.setValueAtTime(0.04, bt)
      bGain.gain.exponentialRampToValueAtTime(0.001, bt + bDur)
      bSrc.connect(bGain)
      bGain.connect(master)
      bSrc.start(bt)
      bSrc.stop(bt + bDur)
    }
  })

  const cOsc = ctx.createOscillator()
  const cGain = ctx.createGain()
  cOsc.type = 'sine'
  cOsc.frequency.setValueAtTime(300, now)
  cOsc.frequency.linearRampToValueAtTime(450, now + 0.08)
  cOsc.frequency.linearRampToValueAtTime(250, now + 0.18)
  cOsc.frequency.linearRampToValueAtTime(380, now + 0.30)
  cOsc.frequency.linearRampToValueAtTime(200, now + 0.42)
  cGain.gain.setValueAtTime(0.08, now + 0.02)
  cGain.gain.linearRampToValueAtTime(0.15, now + 0.10)
  cGain.gain.linearRampToValueAtTime(0.10, now + 0.22)
  cGain.gain.linearRampToValueAtTime(0.12, now + 0.32)
  cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
  cOsc.connect(cGain)
  cGain.connect(master)
  cOsc.start(now)
  cOsc.stop(now + 0.45)

  for (let s = 0; s < 20; s++) {
    const st = now + 0.20 + Math.random() * 0.18
    const sFreq = 1500 + Math.random() * 3500
    const sOsc = ctx.createOscillator()
    const sGain = ctx.createGain()
    sOsc.type = 'sine'
    sOsc.frequency.setValueAtTime(sFreq, st)
    sOsc.frequency.exponentialRampToValueAtTime(sFreq * 0.2, st + 0.012)
    sGain.gain.setValueAtTime(0.02 + Math.random() * 0.025, st)
    sGain.gain.exponentialRampToValueAtTime(0.001, st + 0.012)
    sOsc.connect(sGain)
    sGain.connect(master)
    sOsc.start(st)
    sOsc.stop(st + 0.012)
  }

  const fOsc = ctx.createOscillator()
  const fGain = ctx.createGain()
  fOsc.type = 'sine'
  fOsc.frequency.setValueAtTime(350, now + 0.30)
  fOsc.frequency.exponentialRampToValueAtTime(150, now + 0.50)
  fGain.gain.setValueAtTime(0.04, now + 0.30)
  fGain.gain.exponentialRampToValueAtTime(0.001, now + 0.50)
  fOsc.connect(fGain)
  fGain.connect(master)
  fOsc.start(now + 0.30)
  fOsc.stop(now + 0.50)
}
