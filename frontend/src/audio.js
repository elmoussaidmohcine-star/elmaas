// ============================================================
//  ELMAAS — audio.js
//  Système sonore complet — Web Audio API pure, zéro fichier
//  Philosophie : silence + événements rares + identité culturelle
//
//  L = 0 (FR) · 1 (EN) · 2 (AR) · 3 (ES)
//
//  Sons disponibles :
//    play("drop")        — début de partie / apparition plateau
//    play("place")       — pose d'une pièce
//    play("place_elmaas")— pose d'une pièce ELMAAS (diamant)
//    play("puzzle")      — complétion d'un puzzle
//    play("serie")       — série (combo)
//    play("victory")     — victoire
//    play("defeat")      — défaite
//    play("hover")       — survol bouton
//    play("click")       — clic bouton
//    play("turn")        — changement de tour
//    play("analyse")     — lancement analyse
//    play("waiting")     — son d'attente adversaire (rare, appelable en boucle)
//    play("warning")     — timer faible
//
//  Contrôle :
//    setVolume(0–1)
//    setMute(bool)
//    setLangue(0|1|2|3)
//    isEnabled()
// ============================================================

let _ctx = null;
let _volume = 0.18;
let _muted = false;
let _langue = 0;  // 0=FR 1=EN 2=AR 3=ES

// Lazy init du contexte (doit être dans un geste utilisateur)
function ctx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

function gain(val) {
  const c = ctx();
  if (!c) return null;
  const g = c.createGain();
  g.gain.value = val * _volume * (_muted ? 0 : 1);
  g.connect(c.destination);
  return g;
}

function osc(type, freq, gainNode, startTime, duration, fadeOut = true) {
  const c = ctx();
  if (!c || !gainNode) return;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  o.connect(gainNode);
  o.start(startTime);
  o.stop(startTime + duration);
  if (fadeOut) {
    gainNode.gain.setValueAtTime(gainNode.gain.value, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  }
  return o;
}

function noise(gainNode, startTime, duration) {
  const c = ctx();
  if (!c || !gainNode) return;
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = c.createBufferSource();
  source.buffer = buffer;
  source.connect(gainNode);
  source.start(startTime);
  source.stop(startTime + duration);
}

function reverb(seconds = 1.5, decay = 2) {
  const c = ctx();
  if (!c) return null;
  const convolver = c.createConvolver();
  const rate = c.sampleRate;
  const length = rate * seconds;
  const impulse = c.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  convolver.buffer = impulse;
  return convolver;
}

// ── Variations culturelles ────────────────────────────────────
// FR=0 : verre, marbre, luxe, résonance longue
// EN=1 : digital, froid, sec, précis
// AR=2 : souffle, espace, profondeur, résonance sacrée longue
// ES=3 : dramatique, chaud, organique, attaque marquée

function culturalParams() {
  // [reverbTime, reverbDecay, volumeMult, pitchMult, attackSharpness]
  const map = [
    [2.0, 2.5, 1.0, 1.0,  0.8],  // FR — longue résonance, doux
    [0.6, 3.5, 0.9, 1.05, 1.2],  // EN — court, précis, légèrement plus aigu
    [3.5, 1.8, 1.1, 0.88, 0.5],  // AR — très long, grave, soufflé
    [1.2, 2.0, 1.2, 0.95, 1.5],  // ES — attaque marquée, chaud
  ];
  return map[_langue] || map[0];
}

// ════════════════════════════════════════════════════════════
// SONS INDIVIDUELS
// ════════════════════════════════════════════════════════════

function sound_drop() {
  // Goutte d'eau métallique — début de partie
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.05;

  // Corps de la goutte — sinusoïde qui descend
  const g1 = gain(0.03 * vm);
  const o1 = c.createOscillator();
  o1.type = "sine";
  o1.frequency.setValueAtTime(480 * pm, t);
  o1.frequency.exponentialRampToValueAtTime(180 * pm, t + 0.18);
  o1.connect(g1);
  o1.start(t);
  o1.stop(t + 0.6);
  g1.gain.setValueAtTime(0.10 * vm, t);
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

  // Harmonique secondaire
  const g2 = gain(0.01 * vm);
  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.setValueAtTime(960 * pm, t);
  o2.frequency.exponentialRampToValueAtTime(360 * pm, t + 0.12);
  o2.connect(g2);
  o2.start(t);
  o2.stop(t + 0.3);
  g2.gain.setValueAtTime(0.04 * vm, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

  // Réverbération
  const rev = reverb(rt, rd);
  if (rev) {
    const g3 = c.createGain();
    g3.gain.value = 0.2 * vm;
    g3.connect(rev);
    rev.connect(c.destination);
    const o3 = c.createOscillator();
    o3.type = "sine";
    o3.frequency.setValueAtTime(480 * pm, t + 0.02);
    o3.frequency.exponentialRampToValueAtTime(120 * pm, t + 0.4);
    o3.connect(g3);
    o3.start(t + 0.02);
    o3.stop(t + rt + 0.5);
    g3.gain.setValueAtTime(0.2 * vm, t + 0.02);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + rt + 0.5);
  }

  // AR uniquement : souffle grave en plus
  if (_langue === 2) {
    const gn = gain(0.02);
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 200;
    gn.connect(filt);
    filt.connect(c.destination);
    noise(gn, t + 0.05, 0.8);
    gn.gain.setValueAtTime(0.08, t + 0.05);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
  }
}

function sound_place() {
  // Pose d'une pièce — tok sec et noble
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm, atk] = culturalParams();
  const t = c.currentTime + 0.01;

  const g1 = gain(0.02 * vm);
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = 600 * pm;
  filt.Q.value = 1.5;
  g1.connect(filt);
  filt.connect(c.destination);

  noise(g1, t, 0.06 / atk);
  g1.gain.setValueAtTime(0.08 * vm, t);
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

  // Résonance courte
  const g2 = gain(0.01 * vm);
  osc("sine", 280 * pm, g2, t + 0.01, 0.2);
}

function sound_place_elmaas() {
  // Pièce ELMAAS (diamant) — tintement cristallin + souffle
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.01;

  // Tintement principal
  const g1 = gain(0.3 * vm);
  osc("sine", 1800 * pm, g1, t, 1.2);
  g1.gain.setValueAtTime(0.3 * vm, t);
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

  // Harmonique froide
  const g2 = gain(0.01 * vm);
  osc("triangle", 2400 * pm, g2, t, 0.8);
  g2.gain.setValueAtTime(0.04 * vm, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

  // Souffle grave (toutes langues, plus marqué en AR)
  const gn = gain(0.02 * (_langue === 2 ? 1.8 : 1));
  const filt = c.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = 3000;
  gn.connect(filt);
  filt.connect(c.destination);
  noise(gn, t, 0.3);
  gn.gain.setValueAtTime(0.06, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

  // Réverb
  const rev = reverb(rt * 1.2, rd);
  if (rev) {
    const gr = c.createGain();
    gr.gain.value = 0.04 * vm;
    gr.connect(rev);
    rev.connect(c.destination);
    osc("sine", 1800 * pm, gr, t, 1.5);
    gr.gain.setValueAtTime(0.18 * vm, t);
    gr.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  }
}

function sound_puzzle() {
  // Complétion d'un puzzle — plusieurs pièces qui s'alignent
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.01;

  // Séquence montante : 3 tintements
  const freqs = [440, 554, 659].map(f => f * pm);
  const delays = [0, 0.12, 0.24];

  freqs.forEach((freq, i) => {
    const g = gain(0.02 * vm);
    const dt = t + delays[i];
    osc("sine", freq, g, dt, 0.8);
    g.gain.setValueAtTime(0.22 * vm, dt);
    g.gain.exponentialRampToValueAtTime(0.0001, dt + 0.8);

    // Harmonique
    const g2 = gain(0.02 * vm);
    osc("triangle", freq * 2, g2, dt, 0.4);
    g2.gain.setValueAtTime(0.08 * vm, dt);
    g2.gain.exponentialRampToValueAtTime(0.0001, dt + 0.4);
  });

  // Réverb sur le dernier
  const rev = reverb(rt, rd);
  if (rev) {
    const gr = c.createGain();
    gr.gain.value = 0.03 * vm;
    gr.connect(rev);
    rev.connect(c.destination);
    osc("sine", freqs[2], gr, t + 0.24, 1.2);
    gr.gain.setValueAtTime(0.15 * vm, t + 0.24);
    gr.gain.exponentialRampToValueAtTime(0.0001, t + 0.24 + 1.2);
  }
}

function sound_serie() {
  // Série (combo) — vibration harmonique montante, cosmique
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.01;

  // Accord parfait qui monte
  [1, 1.25, 1.5, 2].forEach((ratio, i) => {
    const g = gain(0.05 * vm * (1 - i * 0.1));
    const dt = t + i * 0.06;
    osc("sine", 330 * pm * ratio, g, dt, 1.5 - i * 0.1);
    g.gain.setValueAtTime(0.18 * vm, dt);
    g.gain.exponentialRampToValueAtTime(0.0001, dt + 1.5);
  });

  // Shimmer haute fréquence
  const gs = gain(0.02 * vm);
  osc("sine", 2200 * pm, gs, t + 0.2, 1.2);
  gs.gain.setValueAtTime(0, t + 0.2);
  gs.gain.linearRampToValueAtTime(0.02 * vm, t + 0.4);
  gs.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
}

function sound_victory() {
  // Victoire — froide et inévitable, résonance lumineuse
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.05;

  // Onde montante lente
  const g1 = gain(0.0001);
  const o1 = c.createOscillator();
  o1.type = "sine";
  o1.frequency.setValueAtTime(220 * pm, t);
  o1.frequency.linearRampToValueAtTime(440 * pm, t + 2.5);
  o1.connect(g1);
  o1.start(t);
  o1.stop(t + 4.0);
  g1.gain.setValueAtTime(0.0001, t);
  g1.gain.linearRampToValueAtTime(0.09 * vm, t + 1.2);
  g1.gain.linearRampToValueAtTime(0.07 * vm, t + 2.5);
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);

  // Harmonique froide
  const g2 = gain(0.0001);
  const o2 = c.createOscillator();
  o2.type = "triangle";
  o2.frequency.setValueAtTime(330 * pm, t + 0.5);
  o2.frequency.linearRampToValueAtTime(660 * pm, t + 3.0);
  o2.connect(g2);
  o2.start(t + 0.5);
  o2.stop(t + 4.5);
  g2.gain.setValueAtTime(0.0001, t + 0.5);
  g2.gain.linearRampToValueAtTime(0.04 * vm, t + 1.5);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);

  // Tintement cristallin final
  const g3 = gain(0.07 * vm);
  osc("sine", 880 * pm, g3, t + 2.0, 2.5);
  g3.gain.setValueAtTime(0.0001, t + 2.0);
  g3.gain.linearRampToValueAtTime(0.07 * vm, t + 2.2);
  g3.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);

  // Réverb profonde
  const rev = reverb(rt * 1.5, rd * 0.7);
  if (rev) {
    const gr = c.createGain();
    gr.gain.value = 0.04 * vm;
    gr.connect(rev);
    rev.connect(c.destination);
    const or = c.createOscillator();
    or.type = "sine";
    or.frequency.setValueAtTime(220 * pm, t);
    or.frequency.linearRampToValueAtTime(440 * pm, t + 2.5);
    or.connect(gr);
    or.start(t);
    or.stop(t + 5);
    gr.gain.setValueAtTime(0, t);
    gr.gain.linearRampToValueAtTime(0.2 * vm, t + 1.5);
    gr.gain.exponentialRampToValueAtTime(0.0001, t + 5);
  }

  // AR : souffle grave supplémentaire
  if (_langue === 2) {
    const gn = gain(0.02);
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 300;
    gn.connect(filt);
    filt.connect(c.destination);
    noise(gn, t + 1.0, 2.0);
    gn.gain.setValueAtTime(0, t + 1.0);
    gn.gain.linearRampToValueAtTime(0.015, t + 1.5);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
  }
}

function sound_defeat() {
  // Défaite — pierre qui tombe lentement, cloche lointaine
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.05;

  // Son grave qui descend
  const g1 = gain(0.09 * vm);
  const o1 = c.createOscillator();
  o1.type = "sine";
  o1.frequency.setValueAtTime(200 * pm, t);
  o1.frequency.exponentialRampToValueAtTime(80 * pm, t + 2.5);
  o1.connect(g1);
  o1.start(t);
  o1.stop(t + 3.5);
  g1.gain.setValueAtTime(0.09 * vm, t + 0.1);
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);

  // Cloche lointaine unique
  const g2 = gain(0.01 * vm);
  osc("sine", 320 * pm, g2, t + 1.2, 3.0);
  g2.gain.setValueAtTime(0.0001, t + 1.2);
  g2.gain.linearRampToValueAtTime(0.04 * vm, t + 1.4);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);

  // Bruit grave filtré — "quelque chose s'éteint"
  const gn = gain(0.01 * vm);
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 150;
  filt.frequency.exponentialRampToValueAtTime(60, t + 2.0);
  gn.connect(filt);
  filt.connect(c.destination);
  noise(gn, t + 0.3, 2.5);
  gn.gain.setValueAtTime(0.02 * vm, t + 0.3);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

  // Réverb longue
  const rev = reverb(rt * 1.8, rd * 0.8);
  if (rev) {
    const gr = c.createGain();
    gr.gain.value = 0.04 * vm;
    gr.connect(rev);
    rev.connect(c.destination);
    osc("sine", 160 * pm, gr, t, 2.5);
    gr.gain.setValueAtTime(0.2 * vm, t);
    gr.gain.exponentialRampToValueAtTime(0.0001, t + rt * 1.8 + 1);
  }
}

function sound_hover() {
  // Survol bouton — friction légère verre/métal, micro-son
  const c = ctx();
  if (!c) return;
  const [,, vm, pm] = culturalParams();
  const t = c.currentTime;

  const g = gain(0.02 * vm);
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = _langue === 1 ? 3200 : (_langue === 2 ? 1800 : (_langue === 3 ? 2200 : 2600));
  filt.Q.value = 8;
  g.connect(filt);
  filt.connect(c.destination);

  noise(g, t, 0.06);
  g.gain.setValueAtTime(0.015 * vm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
}

function sound_click() {
  // Clic bouton — tok sec
  const c = ctx();
  if (!c) return;
  const [,, vm, pm, atk] = culturalParams();
  const t = c.currentTime;

  const g = gain(0.01 * vm);
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = 800 * pm;
  filt.Q.value = 3;
  g.connect(filt);
  filt.connect(c.destination);

  noise(g, t, 0.05);
  g.gain.setValueAtTime(0.04 * vm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

  const g2 = gain(0.02 * vm);
  osc("sine", 400 * pm, g2, t, 0.1);
  g2.gain.setValueAtTime(0.08 * vm, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
}

function sound_turn() {
  // Changement de tour — tintement discret
  const c = ctx();
  if (!c) return;
  const [,, vm, pm] = culturalParams();
  const t = c.currentTime;

  const g = gain(0.01 * vm);
  osc("sine", 660 * pm, g, t, 0.4);
  g.gain.setValueAtTime(0.12 * vm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
}

function sound_analyse() {
  // Lancement analyse — fragments mathématiques, intelligence silencieuse
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.02;

  // Petits clics logiques en séquence
  const pattern = [0, 0.08, 0.18, 0.32, 0.5];
  const pitches = [880, 1100, 990, 1320, 1100].map(f => f * pm);

  pattern.forEach((delay, i) => {
    const g = gain(0.1 * vm * (1 - i * 0.08));
    const dt = t + delay;
    osc("sine", pitches[i], g, dt, 0.15);
    g.gain.setValueAtTime(0.1 * vm, dt);
    g.gain.exponentialRampToValueAtTime(0.0001, dt + 0.15);
  });

  // Murmure mécanique en fond
  const gn = gain(0.01 * vm);
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = 2000 * pm;
  filt.Q.value = 2;
  gn.connect(filt);
  filt.connect(c.destination);
  noise(gn, t, 0.7);
  gn.gain.setValueAtTime(0.04 * vm, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
}

function sound_waiting() {
  // Attente adversaire — goutte rare, toutes les 15-30s
  // Ce son est RARE — le caller doit gérer l'intervalle
  const c = ctx();
  if (!c) return;
  const [rt, rd, vm, pm] = culturalParams();
  const t = c.currentTime + 0.05;

  // Variation : parfois goutte, parfois pulsation grave, parfois tintement
  const variant = Math.floor(Math.random() * 3);

  if (variant === 0) {
    // Goutte légère
    const g = gain(0.05 * vm);
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(340 * pm, t);
    o.frequency.exponentialRampToValueAtTime(140 * pm, t + 0.15);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.5);
    g.gain.setValueAtTime(0.18 * vm, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    const rev = reverb(rt, rd);
    if (rev) {
      const gr = c.createGain();
      gr.gain.value = 0.1 * vm;
      gr.connect(rev);
      rev.connect(c.destination);
      const or = c.createOscillator();
      or.type = "sine";
      or.frequency.setValueAtTime(340 * pm, t);
      or.frequency.exponentialRampToValueAtTime(140 * pm, t + 0.15);
      or.connect(gr);
      or.start(t);
      or.stop(t + rt + 0.3);
      gr.gain.setValueAtTime(0.1 * vm, t);
      gr.gain.exponentialRampToValueAtTime(0.0001, t + rt + 0.3);
    }
  } else if (variant === 1) {
    // Pulsation grave — radar lent
    const g = gain(0.01 * vm);
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = 55 * pm;
    o.connect(g);
    o.start(t);
    o.stop(t + 0.8);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03 * vm, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  } else {
    // Tintement lointain
    const g = gain(0.1 * vm);
    osc("triangle", 520 * pm, g, t, 1.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1 * vm, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  }
}

function sound_warning() {
  // Timer faible — tick mécanique élégant, PAS une alarme
  const c = ctx();
  if (!c) return;
  const [,, vm, pm] = culturalParams();
  const t = c.currentTime;

  const g = gain(0.2 * vm);
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = 1200 * pm;
  filt.Q.value = 6;
  g.connect(filt);
  filt.connect(c.destination);

  noise(g, t, 0.06);
  g.gain.setValueAtTime(0.04 * vm, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
}

// ════════════════════════════════════════════════════════════
// API PUBLIQUE
// ════════════════════════════════════════════════════════════

const SOUNDS = {
  drop:          sound_drop,
  place:         sound_place,
  place_elmaas:  sound_place_elmaas,
  puzzle:        sound_puzzle,
  serie:         sound_serie,
  victory:       sound_victory,
  defeat:        sound_defeat,
  hover:         sound_hover,
  click:         sound_click,
  turn:          sound_turn,
  analyse:       sound_analyse,
  waiting:       sound_waiting,
  warning:       sound_warning,
};

export function play(name) {
  if (_muted) return;
  const fn = SOUNDS[name];
  if (!fn) return;
  try {
    fn();
  } catch (e) {
    // Silence silencieux
  }
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

// Init contexte au premier geste utilisateur (requis par les navigateurs)
export function initAudio() {
  ctx(); // crée le contexte
}