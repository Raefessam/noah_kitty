/* ==========================================================
   Noah's Kitty Adventure — audio.js
   All sound is generated with the Web Audio API. No external
   audio files are used, keeping the game fully offline-capable.
   ========================================================== */

const AudioEngine = {
  ctx: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  musicNodes: [],
  musicPlaying: false,
  soundOn: true,
  musicOn: true,

  init(){
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.18;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.masterGain);
  },

  resume(){
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  // ---- low level helpers ----
  _osc(freq, type, start, dur, gainNode, glideTo){
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20,glideTo), start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(1, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(start);
    osc.stop(start + dur + 0.02);
    return osc;
  },

  _noiseBurst(start, dur, gainNode, filterFreq){
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * (1 - i/bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = filterFreq || 1200;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(filt); filt.connect(gain); gain.connect(gainNode);
    src.start(start);
    src.stop(start + dur + 0.02);
  },

  // ---- public sound effects ----
  playFootstep(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._noiseBurst(t, 0.06, this.sfxGain, 900 + Math.random()*300);
  },

  playJump(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(340, 'triangle', t, 0.22, this.sfxGain, 700);
  },

  playDoubleJump(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(500, 'triangle', t, 0.22, this.sfxGain, 900);
    this._osc(700, 'sine', t+0.04, 0.18, this.sfxGain, 1100);
  },

  playLand(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._noiseBurst(t, 0.08, this.sfxGain, 300);
  },

  playCollectFish(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(660, 'sine', t, 0.14, this.sfxGain, 990);
    this._osc(990, 'sine', t+0.06, 0.14, this.sfxGain, 1320);
  },

  playCollectStar(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    [880,1108,1318,1760].forEach((f,i)=> this._osc(f,'sine', t + i*0.045, 0.18, this.sfxGain));
  },

  playCollectHeart(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(523, 'sine', t, 0.2, this.sfxGain, 660);
    this._osc(659, 'sine', t+0.08, 0.2, this.sfxGain, 784);
  },

  playHurt(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(220, 'sawtooth', t, 0.25, this.sfxGain, 110);
  },

  playMenuClick(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    this._osc(500, 'square', t, 0.06, this.sfxGain, 640);
  },

  playCheckpoint(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    [523,659,784].forEach((f,i)=> this._osc(f,'triangle', t + i*0.06, 0.15, this.sfxGain));
  },

  playVictory(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    [523,659,784,1046,1318].forEach((f,i)=> this._osc(f,'sine', t + i*0.11, 0.3, this.sfxGain));
  },

  playGameOver(){
    if (!this.soundOn || !this.ctx) return;
    const t = this.ctx.currentTime;
    [440,392,330,262].forEach((f,i)=> this._osc(f,'sine', t + i*0.16, 0.3, this.sfxGain));
  },

  // ---- gentle looping background music (simple pentatonic melody) ----
  startMusic(){
    if (!this.ctx || !this.musicOn || this.musicPlaying) return;
    this.musicPlaying = true;
    const notes = [523,587,659,784,880,784,659,587];
    let step = 0;
    const playStep = () => {
      if (!this.musicPlaying) return;
      const t = this.ctx.currentTime;
      const freq = notes[step % notes.length];
      this._osc(freq, 'sine', t, 0.5, this.musicGain);
      this._osc(freq*0.5, 'triangle', t, 0.5, this.musicGain);
      step++;
      this._musicTimer = setTimeout(playStep, 420);
    };
    playStep();
  },

  stopMusic(){
    this.musicPlaying = false;
    if (this._musicTimer) clearTimeout(this._musicTimer);
  },

  setSoundOn(v){ this.soundOn = v; },
  setMusicOn(v){
    this.musicOn = v;
    if (!v) this.stopMusic();
    else this.startMusic();
  }
};
