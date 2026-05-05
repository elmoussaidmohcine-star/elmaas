// ============================================================
//  ELMAAS — audio.js  v2.0
//  Sons physiques réels — WAV modélisés (goutte, verre, zellige, bois, fer)
//  Zéro copyright — générés algorithmiquement
//
//  Structure fichiers attendue :
//    public/sounds/drop.wav          — goutte d'eau
//    public/sounds/place.wav         — verre cristal
//    public/sounds/place_elmaas.wav  — zellige sur sol
//    public/sounds/puzzle.wav        — bois noble (3 coups)
//    public/sounds/serie.wav         — métal forgé
//    public/sounds/victory.wav       — verre + métal (victoire)
//    public/sounds/defeat.wav        — bois grave + cloche
//    public/sounds/warning.wav       — fer léger
//    public/sounds/waiting.wav       — petite goutte (attente)
//    public/sounds/analyse.wav       — petits clics bois
//
//  API :
//    play(name)       — jouer un son
//    setVolume(0–1)   — volume global
//    setMute(bool)    — couper/activer
//    setLangue(0–3)   — identité culturelle (légères variations)
//    isMuted()
//    initAudio()      — à appeler sur premier geste utilisateur
//    preloadAll()     — précharger tous les sons
// ============================================================

let _ctx = null;
let _volume = 0.55;
let _muted = false;
let _langue = 0;
const _buffers = {};
const _loading = {};

// Paramètres culturels : [volumeMult, pitchMult, reverbMix, lpFreq|null]
const CULTURAL = [
  [1.0,  1.0,  0.20, null],  // FR — élégant, neutre
  [0.88, 1.04, 0.10, null],  // EN — sec, plus aigu
  [1.08, 0.93, 0.35, 800],   // AR — reverb longue, plus grave, filtre doux
  [1.15, 0.97, 0.18, null],  // ES — plus fort, organique
];

function getCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return null; }
  }
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

export function initAudio() {
  getCtx();
}

function loadBuffer(name) {
  if (_buffers[name] || _loading[name]) return;
  _loading[name] = true;
  fetch(`/sounds/${name}.wav`)
    .then(r => { if (!r.ok) throw new Error(name); return r.arrayBuffer(); })
    .then(ab => {
      const c = getCtx();
      if (!c) return;
      return c.decodeAudioData(ab);
    })
    .then(buf => { _buffers[name] = buf; delete _loading[name]; })
    .catch(() => { delete _loading[name]; });
}

const ALL_SOUNDS = ["drop","place","place_elmaas","puzzle","serie","victory","defeat","warning","waiting","analyse"];

export function preloadAll() {
  if (!getCtx()) return;
  ALL_SOUNDS.forEach(loadBuffer);
}

function makeReverb(ctx, seconds = 1.2, decay = 2.5) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, decay);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

function playBuffer(name, options = {}) {
  if (_muted) return;
  const c = getCtx();
  if (!c) return;
  const buf = _buffers[name];
  if (!buf) { loadBuffer(name); return; }

  const [volMult, pitchMult, reverbMix, lpFreq] = CULTURAL[_langue] || CULTURAL[0];
  const vol   = (options.volume ?? 1.0) * _volume * volMult;
  const pitch = (options.pitch  ?? 1.0) * pitchMult;
  const rev   = options.reverb !== undefined ? options.reverb : reverbMix;

  const source = c.createBufferSource();
  source.buffer = buf;
  source.playbackRate.value = pitch;

  const gainNode = c.createGain();
  gainNode.gain.value = vol;

  let lastNode = source;
  if (lpFreq) {
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = lpFreq;
    source.connect(filt);
    lastNode = filt;
  }
  lastNode.connect(gainNode);

  if (rev > 0.01) {
    const dry = c.createGain(); dry.gain.value = 1 - rev * 0.5;
    gainNode.connect(dry); dry.connect(c.destination);
    const wet = c.createGain(); wet.gain.value = rev;
    const conv = makeReverb(c, 1.5, 2.5);
    gainNode.connect(wet); wet.connect(conv); conv.connect(c.destination);
  } else {
    gainNode.connect(c.destination);
  }

  source.start(c.currentTime + 0.01);
}

// ── Sons ─────────────────────────────────────────────────────

function sound_drop()         { playBuffer("drop",         { volume: 0.85, reverb: CULTURAL[_langue][2]*1.5 }); }
function sound_place()        { playBuffer("place",        { volume: 0.70, pitch: 0.92+Math.random()*0.16 }); }
function sound_place_elmaas() { playBuffer("place_elmaas", { volume: 0.80 }); }
function sound_puzzle()       { playBuffer("puzzle",       { volume: 0.75 }); }
function sound_serie()        { playBuffer("serie",        { volume: 0.65, reverb: CULTURAL[_langue][2]*1.8 }); }
function sound_victory()      { playBuffer("victory",      { volume: 0.70, reverb: CULTURAL[_langue][2]*2.0 }); }
function sound_defeat()       { playBuffer("defeat",       { volume: 0.60, reverb: CULTURAL[_langue][2]*2.5 }); }
function sound_warning()      { playBuffer("warning",      { volume: 0.55 }); }
function sound_waiting()      { playBuffer("waiting",      { volume: 0.50, pitch: 0.88+Math.random()*0.24 }); }
function sound_analyse()      { playBuffer("analyse",      { volume: 0.55 }); }

function sound_hover() {
  if (_muted) return;
  const c = getCtx(); if (!c) return;
  const t = c.currentTime;
  const g = c.createGain(); g.gain.value = 0.04 * _volume;
  const filt = c.createBiquadFilter(); filt.type="bandpass"; filt.frequency.value=2200; filt.Q.value=6;
  g.connect(filt); filt.connect(c.destination);
  const buf = c.createBuffer(1, Math.floor(0.04*c.sampleRate), c.sampleRate);
  const d = buf.getChannelData(0); for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const src = c.createBufferSource(); src.buffer=buf; src.connect(g);
  g.gain.setValueAtTime(0.04*_volume, t); g.gain.exponentialRampToValueAtTime(0.0001, t+0.04);
  src.start(t);
}

function sound_click() {
  if (_muted) return;
  const c = getCtx(); if (!c) return;
  if (_buffers["place"]) {
    const src = c.createBufferSource(); src.buffer=_buffers["place"]; src.playbackRate.value=0.75;
    const g = c.createGain(); g.gain.value=0.25*_volume;
    src.connect(g); g.connect(c.destination);
    src.start(c.currentTime); src.stop(c.currentTime+0.08);
  }
}

function sound_turn() {
  if (_muted) return;
  const c = getCtx(); if (!c) return;
  if (_buffers["warning"]) {
    const src = c.createBufferSource(); src.buffer=_buffers["warning"]; src.playbackRate.value=0.65;
    const g = c.createGain(); g.gain.value=0.30*_volume;
    src.connect(g); g.connect(c.destination); src.start(c.currentTime);
  }
}

// ── API publique ──────────────────────────────────────────────

const SOUNDS = { drop:sound_drop, place:sound_place, place_elmaas:sound_place_elmaas,
  puzzle:sound_puzzle, serie:sound_serie, victory:sound_victory, defeat:sound_defeat,
  warning:sound_warning, waiting:sound_waiting, analyse:sound_analyse,
  hover:sound_hover, click:sound_click, turn:sound_turn };

export function play(name) {
  if (_muted) return;
  try { SOUNDS[name]?.(); } catch(e) {}
}

export function setVolume(v) { _volume = Math.max(0, Math.min(1, v)); }
export function setMute(v)   { _muted = !!v; }
export function setLangue(l) { _langue = (l>=0&&l<=3) ? l : 0; }
export function isMuted()    { return _muted; }
export function isEnabled()  { return !_muted; }