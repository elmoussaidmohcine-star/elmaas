// ============================================================
// ELMAAS — audio.js
// Philosophie sonore corrigée
//
// → Minimalisme premium
// → Sons courts
// → Pas de peur
// → Pas de drones cosmiques
// → Silence dominant
// → Texture luxe / verre / céramique / interface premium
// ============================================================

let _ctx = null;
let _volume = 0.12;
let _muted = false;
let _langue = 0;

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────

function ctx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }

  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }

  return _ctx;
}

function gain(v = 1) {
  const c = ctx();
  if (!c) return null;

  const g = c.createGain();
  g.gain.value = v * _volume * (_muted ? 0 : 1);
  g.connect(c.destination);

  return g;
}

function osc(type, freq, g, start, duration) {
  const c = ctx();
  if (!c || !g) return;

  const o = c.createOscillator();

  o.type = type;
  o.frequency.setValueAtTime(freq, start);

  o.connect(g);

  o.start(start);
  o.stop(start + duration);

  return o;
}

function tinyReverb(seconds = 0.35, decay = 2) {
  const c = ctx();
  if (!c) return null;

  const convolver = c.createConvolver();

  const rate = c.sampleRate;
  const length = rate * seconds;

  const impulse = c.createBuffer(2, length, rate);

  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);

    for (let i = 0; i < length; i++) {
      data[i] =
        (Math.random() * 2 - 1) *
        Math.pow(1 - i / length, decay);
    }
  }

  convolver.buffer = impulse;

  return convolver;
}

// ─────────────────────────────────────────────────────────────
// IDENTITÉ CULTURELLE
// ─────────────────────────────────────────────────────────────

// FR → verre / luxe / calme
// EN → tech / précis / sec
// AR → eau / cuivre / chaleur légère
// ES → artistique / organique / vivant

function cultural() {
  return [
    { pitch: 1.00, rev: 0.45, attack: 0.8 },
    { pitch: 1.05, rev: 0.18, attack: 1.2 },
    { pitch: 0.92, rev: 0.55, attack: 0.7 },
    { pitch: 0.97, rev: 0.30, attack: 1.0 },
  ][_langue] || { pitch: 1, rev: 0.3, attack: 1 };
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

function randomize(freq) {
  return freq * (0.985 + Math.random() * 0.03);
}

function envelope(g, start, peak, end, duration) {
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.01);
  g.gain.exponentialRampToValueAtTime(
    end,
    start + duration
  );
}

// ─────────────────────────────────────────────────────────────
// SONS
// ─────────────────────────────────────────────────────────────

// ===== DROP =====

function sound_drop() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;
  const { pitch, rev } = cultural();

  const g = gain(0.03);

  const o = osc(
    "sine",
    randomize(620 * pitch),
    g,
    t,
    0.28
  );

  o.frequency.exponentialRampToValueAtTime(
    320 * pitch,
    t + 0.22
  );

  envelope(g, t, 0.025, 0.0001, 0.28);

  // petite résonance élégante
  const r = tinyReverb(rev);

  if (r) {
    const rg = c.createGain();
    rg.gain.value = 0.05;

    rg.connect(r);
    r.connect(c.destination);

    const ro = osc(
      "sine",
      640 * pitch,
      rg,
      t,
      0.4
    );

    ro.frequency.exponentialRampToValueAtTime(
      280 * pitch,
      t + 0.3
    );
  }
}

// ===== PLACE =====

function sound_place() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;
  const { pitch } = cultural();

  const g = gain(0.018);

  const o = osc(
    "triangle",
    randomize(420 * pitch),
    g,
    t,
    0.08
  );

  envelope(g, t, 0.018, 0.0001, 0.08);

  o.frequency.exponentialRampToValueAtTime(
    280 * pitch,
    t + 0.08
  );
}

// ===== DIAMANT ELMAAS =====

function sound_place_elmaas() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;
  const { pitch } = cultural();

  const freqs = [1200, 1800, 2400];

  freqs.forEach((f, i) => {
    const g = gain(0.012 - i * 0.002);

    osc(
      "sine",
      randomize(f * pitch),
      g,
      t + i * 0.015,
      0.35
    );

    envelope(
      g,
      t + i * 0.015,
      0.012,
      0.0001,
      0.35
    );
  });
}

// ===== PUZZLE =====

function sound_puzzle() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  [520, 660, 840].forEach((f, i) => {
    const g = gain(0.018);

    osc(
      "sine",
      randomize(f),
      g,
      t + i * 0.06,
      0.25
    );

    envelope(
      g,
      t + i * 0.06,
      0.018,
      0.0001,
      0.25
    );
  });
}

// ===== COMBO =====

function sound_serie() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  [440, 560, 720].forEach((f, i) => {
    const g = gain(0.015);

    osc(
      "triangle",
      randomize(f),
      g,
      t + i * 0.04,
      0.2
    );

    envelope(
      g,
      t + i * 0.04,
      0.015,
      0.0001,
      0.2
    );
  });
}

// ===== VICTORY =====

function sound_victory() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  [520, 720, 980].forEach((f, i) => {
    const g = gain(0.022);

    osc(
      "sine",
      randomize(f),
      g,
      t + i * 0.08,
      0.45
    );

    envelope(
      g,
      t + i * 0.08,
      0.022,
      0.0001,
      0.45
    );
  });
}

// ===== DEFEAT =====

function sound_defeat() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  const g = gain(0.02);

  const o = osc(
    "triangle",
    randomize(360),
    g,
    t,
    0.5
  );

  o.frequency.exponentialRampToValueAtTime(
    180,
    t + 0.5
  );

  envelope(g, t, 0.02, 0.0001, 0.5);
}

// ===== HOVER =====

function sound_hover() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  const g = gain(0.004);

  osc(
    "sine",
    randomize(1600),
    g,
    t,
    0.03
  );

  envelope(g, t, 0.004, 0.0001, 0.03);
}

// ===== CLICK =====

function sound_click() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  const g = gain(0.012);

  osc(
    "triangle",
    randomize(520),
    g,
    t,
    0.05
  );

  envelope(g, t, 0.012, 0.0001, 0.05);
}

// ===== TURN =====

function sound_turn() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  const g = gain(0.01);

  osc(
    "sine",
    randomize(760),
    g,
    t,
    0.12
  );

  envelope(g, t, 0.01, 0.0001, 0.12);
}

// ===== ANALYSE =====

function sound_analyse() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  [1000, 1200, 900].forEach((f, i) => {
    const g = gain(0.008);

    osc(
      "square",
      randomize(f),
      g,
      t + i * 0.05,
      0.06
    );

    envelope(
      g,
      t + i * 0.05,
      0.008,
      0.0001,
      0.06
    );
  });
}

// ===== WAITING =====

function sound_waiting() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  const variants = [
    () => {
      const g = gain(0.01);

      osc(
        "sine",
        randomize(420),
        g,
        t,
        0.2
      );

      envelope(g, t, 0.01, 0.0001, 0.2);
    },

    () => {
      const g = gain(0.008);

      osc(
        "triangle",
        randomize(680),
        g,
        t,
        0.15
      );

      envelope(g, t, 0.008, 0.0001, 0.15);
    },

    () => {
      const g = gain(0.006);

      osc(
        "sine",
        randomize(300),
        g,
        t,
        0.25
      );

      envelope(g, t, 0.006, 0.0001, 0.25);
    },
  ];

  variants[Math.floor(Math.random() * variants.length)]();
}

// ===== WARNING =====

function sound_warning() {
  const c = ctx();
  if (!c) return;

  const t = c.currentTime;

  const g = gain(0.014);

  osc(
    "square",
    randomize(1100),
    g,
    t,
    0.04
  );

  envelope(g, t, 0.014, 0.0001, 0.04);
}

// ─────────────────────────────────────────────────────────────
// MAP
// ─────────────────────────────────────────────────────────────

const SOUNDS = {
  drop: sound_drop,
  place: sound_place,
  place_elmaas: sound_place_elmaas,
  puzzle: sound_puzzle,
  serie: sound_serie,
  victory: sound_victory,
  defeat: sound_defeat,
  hover: sound_hover,
  click: sound_click,
  turn: sound_turn,
  analyse: sound_analyse,
  waiting: sound_waiting,
  warning: sound_warning,
};

// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────

export function play(name) {
  if (_muted) return;

  const fn = SOUNDS[name];

  if (!fn) return;

  try {
    fn();
  } catch {}
}

export function setVolume(v) {
  _volume = Math.max(0, Math.min(1, v));
}

export function setMute(v) {
  _muted = !!v;
}

export function setLangue(l) {
  _langue = l >= 0 && l <= 3 ? l : 0;
}

export function isMuted() {
  return _muted;
}

export function isEnabled() {
  return !_muted;
}

export function initAudio() {
  ctx();
}