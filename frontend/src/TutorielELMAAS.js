// ELMAAS — TutorielELMAAS.js
// Tutoriel interactif post-première connexion, multilingue, ignorable

import { useState, useMemo } from "react";
import Board from "./Board";
import { t, getSloganAleatoire } from "./translations";

/* ═══════════════════════════════════════════════════════════
   MINI-PIÈCE (version locale pour le tutoriel)
   ═══════════════════════════════════════════════════════════ */
function MiniPieceDemo({ piece, couleur, scale = 1 }) {
  if (!piece) return null;
  const cells = piece.cellules || [];
  const maxR = Math.max(0, ...cells.map(([r]) => r));
  const maxC = Math.max(0, ...cells.map(([, c]) => c));
  const S = 10 * scale;

  const estELMAAS = piece.enlevement === true;
  let coul;
  if (estELMAAS) coul = "#00BFFF";
  else coul = couleur === "rouge" ? "var(--rouge-c)" : couleur === "noir" ? "var(--noir-c)" : "#888";

  return (
    <div style={{
      position: "relative", width: (maxC + 1) * S + 6, height: (maxR + 1) * S + 6,
      padding: 3, borderRadius: 5, border: `1.5px solid ${coul}44`,
      background: "rgba(255,255,255,0.03)", flexShrink: 0
    }}>
      {cells.map(([r, c], i) => (
        <div key={i} style={{
          position: "absolute", top: r * S + 3, left: c * S + 3,
          width: S - 2, height: S - 2, borderRadius: 2, background: coul,
          boxShadow: `0 0 3px ${coul}55`
        }} />
      ))}
      {estELMAAS && (
        <div style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7,
          borderRadius: "50%", background: "#00BFFF", boxShadow: "0 0 4px #00BFFF" }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GÉNÉRATION DU PLATEAU DE DÉMO
   ═══════════════════════════════════════════════════════════ */
function genererPixelsDemo(taille) {
  const pixels = [];
  for (let r = 0; r < taille; r++) {
    const row = [];
    for (let c = 0; c < taille; c++) {
      const rr = Math.floor(80 + r * 10 + c * 2);
      const gg = Math.floor(100 + c * 8 + r * 3);
      const bb = Math.floor(160 + r * 5);
      row.push([rr, gg, bb]);
    }
    pixels.push(row);
  }
  return pixels;
}

function genererEtatDemo() {
  const taille = 14;
  const puzzles = {
    "p1": { id: "p1", cellules: [[2,2],[2,3],[3,2],[3,3]], type_couleur: "mono_rouge", complete_par: "rouge", brise: false, ordre_completion: 1, parent_id: null },
    "p2": { id: "p2", cellules: [[2,8],[2,9],[3,8],[3,9]], type_couleur: "mono_noir", complete_par: null, brise: false, ordre_completion: 0, parent_id: null },
    "p3": { id: "p3", cellules: [[6,4],[6,5],[7,4],[7,5],[8,4],[8,5]], type_couleur: "mixte", complete_par: null, brise: false, ordre_completion: 0, parent_id: null },
    "p4": { id: "p4", cellules: [[6,4],[6,5],[7,4]], type_couleur: "mono_rouge", complete_par: null, brise: false, ordre_completion: 0, parent_id: "p3" },
  };

  const pieces = {};
  // Puzzle rouge complet
  puzzles.p1.cellules.forEach(([r,c]) => pieces[`${r},${c}`] = "rouge");
  // Puzzle noir partiel (2/4 posées)
  pieces[`2,8`] = "noir";
  pieces[`3,8`] = "noir";
  // Puzzle mixte (incomplet) — rouge + noir
  pieces[`6,4`] = "rouge";
  pieces[`6,5`] = "noir";
  pieces[`7,4`] = "rouge";
  pieces[`7,5`] = "noir";
  pieces[`8,4`] = "rouge";
  pieces[`8,5`] = null; // case vide du mixte
  // ELMAAS posé sur une case du puzzle noir adverse
  pieces[`3,9`] = "diamant";

  const cellulesActives = new Set();
  Object.values(puzzles).forEach(p => p.cellules.forEach(c => cellulesActives.add(JSON.stringify(c))));
  const libres = [];
  for (let r=0;r<taille;r++) for (let c=0;c<taille;c++) if (!pieces[`${r},${c}`]) libres.push([r,c]);

  const mainRouge = [
    { forme: "L", cellules: [[0,0],[1,0],[2,0],[2,1]], enlevement: false },
    { forme: "1", cellules: [[0,0]], enlevement: false },
    { forme: "T", cellules: [[0,0],[0,1],[0,2],[1,1]], enlevement: true },
  ];
  const mainNoir = [
    { forme: "I4", cellules: [[0,0],[1,0],[2,0],[3,0]], enlevement: false },
    { forme: "O", cellules: [[0,0],[0,1],[1,0],[1,1]], enlevement: false },
  ];

  return {
    plateau: {
      pieces,
      puzzles,
      cellules_libres: libres,
      cellules_actives: Array.from(cellulesActives).map(s => JSON.parse(s)),
      grille_bicolore: Array(taille).fill().map(() => Array(taille).fill(0))
    },
    joueur1: { couleur: "rouge", main_active: mainRouge, nb_pieces_reserve: 5, serie_actuelle: 2, nb_pieces_posees_depuis_regen: 2, seuil_regen_actuel: 5, pieces_protegees: [] },
    joueur2: { couleur: "noir", main_active: mainNoir, nb_pieces_reserve: 4, serie_actuelle: 0, nb_pieces_posees_depuis_regen: 1, seuil_regen_actuel: 5, pieces_protegees: [] },
    tour_actuel: 0,
    numero_tour: 6,
    manche_terminee: false,
    gagnant: null,
    victoire_immediate: false,
    scores: { rouge: 4, noir: 2, serie_rouge: 2, serie_noir: 0, puzzles_brises: 0, puzzles_rouge: 1, puzzles_noir: 0 }
  };
}

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function TutorielELMAAS({ L, onFermer, onIgnorer }) {
  const [page, setPage] = useState(0);
  const totalPages = 10;

  const taille = 14;
  const pixelsPhoto = useMemo(() => genererPixelsDemo(taille), []);
  const etatDemo = useMemo(() => genererEtatDemo(), []);

  const couleurTexte = "var(--texte)";
  const couleurMuted = "var(--muted)";
  const couleurAccent = "var(--accent-culture)";
  const couleurRouge = "var(--rouge-c)";
  const couleurNoir = "var(--noir-c)";

  const navStyle = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--bord)"
  };
  const btnNav = (disabled) => ({
    padding: "8px 18px", borderRadius: "var(--btn-radius, 4px)",
    border: "1px solid var(--bord)", background: "var(--bg3)", color: "var(--texte)",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1,
    fontFamily: "var(--brush)", fontSize: 14
  });
  const dotStyle = (actif) => ({
    width: 8, height: 8, borderRadius: "50%",
    background: actif ? couleurAccent : "var(--bord)",
    transition: "all 0.2s", cursor: "pointer"
  });

  const renderHeader = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--titre)", fontSize: 22, color: couleurAccent, letterSpacing: "0.1em" }}>
        ELMAAS
      </div>
      <button onClick={onIgnorer} style={{
        background: "none", border: "none", color: couleurMuted, fontSize: 20,
        cursor: "pointer", lineHeight: 1
      }} title={t("tutorielIgnorer", L)}>×</button>
    </div>
  );

  const renderPlateauDemo = (label) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "12px 0" }}>
      <div style={{ fontSize: 11, color: couleurMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--titre)" }}>
        {label}
      </div>
      <div style={{ border: "2px solid var(--bord)", borderRadius: 8, overflow: "hidden", boxShadow: "0 0 30px #00000066", maxWidth: "100%" }}>
        <Board etat={etatDemo} taille={taille} pixelsPhoto={pixelsPhoto} couleurJoueur="rouge" onPoserPiece={null} modeCouleur={1} />
      </div>
    </div>
  );

  const renderMainsDemo = () => (
    <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", margin: "10px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontSize: 11, color: couleurRouge, fontFamily: "var(--titre)", letterSpacing: "0.08em" }}>ROUGE</div>
        <div style={{ display: "flex", gap: 6, padding: 8, background: "var(--bg3)", borderRadius: 6, border: "1px solid var(--bord)" }}>
          {etatDemo.joueur1.main_active.map((p, i) => <MiniPieceDemo key={i} piece={p} couleur="rouge" />)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontSize: 11, color: couleurNoir, fontFamily: "var(--titre)", letterSpacing: "0.08em" }}>NOIR</div>
        <div style={{ display: "flex", gap: 6, padding: 8, background: "var(--bg3)", borderRadius: 6, border: "1px solid var(--bord)" }}>
          {etatDemo.joueur2.main_active.map((p, i) => <MiniPieceDemo key={i} piece={p} couleur="noir" />)}
        </div>
      </div>
    </div>
  );

  const renderBadge = (text, color) => (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4,
      background: `${color}18`, border: `1px solid ${color}44`,
      color, fontSize: 11, fontWeight: 700, fontFamily: "var(--titre)",
      letterSpacing: "0.04em", marginRight: 6
    }}>{text}</span>
  );

  const pages = [
    // ── Page 0 : Bienvenue ──────────────────────────────────
    () => (
      <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto", padding: "20px 0" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 32, color: couleurTexte, marginBottom: 8, letterSpacing: "0.06em" }}>
          {t("tutorielBienvenue", L)}
        </div>
        <div style={{ fontSize: 14, color: couleurMuted, fontFamily: "var(--brush)", marginBottom: 24, fontStyle: "italic" }}>
          {getSloganAleatoire(L)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <button className="btn-valider" style={{ minWidth: 240 }} onClick={() => setPage(1)}>
            {t("tutorielCommencer", L)}
          </button>
          <button className="popup-btn" style={{ minWidth: 240, justifyContent: "center" }} onClick={onIgnorer}>
            {t("tutorielIgnorer", L)}
          </button>
        </div>
      </div>
    ),

    // ── Page 1 : Le plateau ─────────────────────────────────
    () => (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 10, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielPlateauTitre", L)}
        </div>
        {renderPlateauDemo(t("tutorielPlateauLabel", L))}
        <div style={{ fontSize: 13, color: couleurTexte, lineHeight: 1.7, fontFamily: "var(--brush)", textAlign: "center", marginTop: 8 }}>
          {t("tutorielPlateauDesc", L)}
        </div>
      </div>
    ),

    // ── Page 2 : Puzzles unicolores ─────────────────────────
    () => (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 10, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielPuzzleUniTitre", L)}
        </div>
        {renderPlateauDemo(t("tutorielPuzzleUniLabel", L))}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "10px 0", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg3)", borderRadius: 6, border: "1px solid var(--bord)" }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: couleurRouge }} />
            <span style={{ fontSize: 12, color: couleurTexte, fontFamily: "var(--brush)" }}>{t("tutorielPuzzleUniRouge", L)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg3)", borderRadius: 6, border: "1px solid var(--bord)" }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: couleurNoir }} />
            <span style={{ fontSize: 12, color: couleurTexte, fontFamily: "var(--brush)" }}>{t("tutorielPuzzleUniNoir", L)}</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: couleurTexte, lineHeight: 1.7, fontFamily: "var(--brush)", textAlign: "center" }}>
          {t("tutorielPuzzleUniDesc", L)}
        </div>
      </div>
    ),

    // ── Page 3 : Puzzles bicolores ──────────────────────────
    () => (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 10, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielPuzzleBiTitre", L)}
        </div>
        {renderPlateauDemo(t("tutorielPuzzleBiLabel", L))}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg3)", borderRadius: 6, border: `1px solid ${couleurRouge}44` }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: couleurRouge }} />
            <span style={{ fontSize: 12, color: couleurRouge, fontFamily: "var(--brush)" }}>+</span>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: couleurNoir }} />
            <span style={{ fontSize: 12, color: couleurTexte, fontFamily: "var(--brush)" }}>{t("tutorielPuzzleBiMixte", L)}</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: couleurTexte, lineHeight: 1.7, fontFamily: "var(--brush)", textAlign: "center" }}>
          {t("tutorielPuzzleBiDesc", L)}
        </div>
      </div>
    ),

    // ── Page 4 : Score & intersections ────────────────────
    () => (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 12, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielScoreTitre", L)}
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }}>
          <div style={{ textAlign: "center", padding: "12px 20px", background: "var(--bg3)", borderRadius: 8, border: `1px solid ${couleurRouge}33` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: couleurRouge, fontFamily: "var(--titre)" }}>4</div>
            <div style={{ fontSize: 11, color: couleurMuted, fontFamily: "var(--brush)" }}>{t("rouge", L)}</div>
          </div>
          <div style={{ textAlign: "center", padding: "12px 20px", background: "var(--bg3)", borderRadius: 8, border: `1px solid ${couleurNoir}33` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: couleurNoir, fontFamily: "var(--titre)" }}>2</div>
            <div style={{ fontSize: 11, color: couleurMuted, fontFamily: "var(--brush)" }}>{t("noir", L)}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: couleurTexte, lineHeight: 1.7, fontFamily: "var(--brush)", textAlign: "center" }}>
          {t("tutorielScoreDesc", L)}
        </div>
      </div>
    ),

    // ── Page 5 : Sur-puzzles ────────────────────────────────
    () => (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 12, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielSurpuzzleTitre", L)}
        </div>
        <div style={{ padding: 16, background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--bord)", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 60, height: 60, border: `2px dashed ${couleurRouge}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <span style={{ color: couleurRouge, fontSize: 10, fontFamily: "var(--titre)" }}>PARENT</span>
              </div>
              <span style={{ fontSize: 10, color: couleurMuted }}>{t("tutorielSurpuzzleParent", L)}</span>
            </div>
            <div style={{ color: couleurAccent, fontSize: 20 }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 40, height: 40, border: `2px solid ${couleurRouge}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <span style={{ color: couleurRouge, fontSize: 9, fontFamily: "var(--titre)" }}>SUB</span>
              </div>
              <span style={{ fontSize: 10, color: couleurMuted }}>{t("tutorielSurpuzzleSub", L)}</span>
            </div>
            <div style={{ color: couleurAccent, fontSize: 20 }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 60, height: 60, border: `2px solid ${couleurNoir}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", background: `${couleurNoir}11` }}>
                <span style={{ color: couleurNoir, fontSize: 10, fontFamily: "var(--titre)" }}>VOLÉ</span>
              </div>
              <span style={{ fontSize: 10, color: couleurMuted }}>{t("tutorielSurpuzzleVole", L)}</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: couleurTexte, lineHeight: 1.7, fontFamily: "var(--brush)", textAlign: "center" }}>
          {t("tutorielSurpuzzleDesc", L)}
        </div>
      </div>
    ),

    // ── Page 6 : Actions par tour ───────────────────────────
    () => (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 14, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielActionsTitre", L)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { key: "poser", color: couleurRouge, icon: "▣" },
            { key: "repiocher", color: "#aa88ff", icon: "↻" },
            { key: "scout", color: "#44cc88", icon: "◉" },
          ].map(({ key, color, icon }) => (
            <div key={key} style={{ padding: 16, background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--bord)", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: "var(--titre)", fontSize: 14, color, marginBottom: 6, letterSpacing: "0.04em" }}>
                {t(`tutorielAction${key.charAt(0).toUpperCase() + key.slice(1)}Titre`, L)}
              </div>
              <div style={{ fontSize: 12, color: couleurMuted, lineHeight: 1.6, fontFamily: "var(--brush)" }}>
                {t(`tutorielAction${key.charAt(0).toUpperCase() + key.slice(1)}Desc`, L)}
              </div>
            </div>
          ))}
        </div>
        {renderMainsDemo()}
      </div>
    ),

    // ── Page 7 : Pièces ELMAAS ──────────────────────────────
    () => (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 12, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielElmaasTitre", L)}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <MiniPieceDemo piece={{ forme: "T", cellules: [[0,0],[0,1],[0,2],[1,1]], enlevement: true }} couleur="rouge" scale={1.4} />
            <span style={{ fontSize: 11, color: "#00BFFF", fontFamily: "var(--brush)" }}>ELMAAS</span>
          </div>
          <div style={{ color: couleurAccent, fontSize: 24 }}>→</div>
          <div style={{ width: 40, height: 40, borderRadius: 4, background: "#00BFFF", boxShadow: "0 0 12px #00BFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>VIDE</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: couleurTexte, lineHeight: 1.7, fontFamily: "var(--brush)", textAlign: "center" }}>
          {t("tutorielElmaasDesc", L)}
        </div>
      </div>
    ),

    // ── Page 8 : Séries & fin de manche ─────────────────────
    () => (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 20, color: couleurAccent, marginBottom: 14, letterSpacing: "0.06em", textAlign: "center" }}>
          {t("tutorielSeriesTitre", L)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 14, background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--bord)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3].map(i => <div key={i} style={{ width: 28, height: 28, borderRadius: 4, background: couleurRouge, boxShadow: `0 0 6px ${couleurRouge}` }} />)}
            </div>
            <div>
              <div style={{ fontSize: 13, color: couleurRouge, fontWeight: 700, fontFamily: "var(--titre)" }}>×3</div>
              <div style={{ fontSize: 11, color: couleurMuted, fontFamily: "var(--brush)" }}>{t("tutorielSerie3Desc", L)}</div>
            </div>
          </div>
          <div style={{ padding: 14, background: "var(--bg3)", borderRadius: 8, border: `1px solid ${couleurRouge}44`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3,4,5].map(i => <div key={i} style={{ width: 28, height: 28, borderRadius: 4, background: couleurRouge, boxShadow: `0 0 8px ${couleurRouge}` }} />)}
            </div>
            <div>
              <div style={{ fontSize: 13, color: couleurRouge, fontWeight: 700, fontFamily: "var(--titre)" }}>×5</div>
              <div style={{ fontSize: 11, color: couleurMuted, fontFamily: "var(--brush)" }}>{t("tutorielSerie5Desc", L)}</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: couleurTexte, lineHeight: 1.7, fontFamily: "var(--brush)", textAlign: "center" }}>
          {t("tutorielFinDesc", L)}
        </div>
      </div>
    ),

    // ── Page 9 : Récap & Go ─────────────────────────────────
    () => (
      <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto", padding: "20px 0" }}>
        <div style={{ fontFamily: "var(--titre)", fontSize: 26, color: couleurTexte, marginBottom: 12, letterSpacing: "0.06em" }}>
          {t("tutorielRecapTitre", L)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, fontSize: 12, color: couleurMuted, fontFamily: "var(--brush)", lineHeight: 1.6 }}>
          <div>• {t("tutorielRecap1", L)}</div>
          <div>• {t("tutorielRecap2", L)}</div>
          <div>• {t("tutorielRecap3", L)}</div>
          <div>• {t("tutorielRecap4", L)}</div>
          <div>• {t("tutorielRecap5", L)}</div>
        </div>
        <button className="btn-valider" style={{ minWidth: 260, fontSize: 18 }} onClick={onFermer}>
          {t("tutorielJouer", L)} →
        </button>
        <div style={{ marginTop: 12 }}>
          <button className="popup-btn" style={{ justifyContent: "center", fontSize: 12 }} onClick={() => setPage(1)}>
            {t("tutorielRelire", L)}
          </button>
        </div>
      </div>
    ),
  ];

  return (
    <div style={{
      minHeight: "100dvh", background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "16px 12px", overflowY: "auto"
    }}>
      <div style={{ width: "100%", maxWidth: 800 }}>
        {renderHeader()}
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", gap: 4 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} style={dotStyle(page === i)} onClick={() => setPage(i)} />
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {pages[page]()}
        </div>
        <div style={navStyle}>
          <button style={btnNav(page === 0)} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            ← {t("tutorielPrecedent", L)}
          </button>
          <span style={{ fontSize: 11, color: couleurMuted, fontFamily: "var(--brush)" }}>
            {page + 1} / {totalPages}
          </span>
          <button style={btnNav(page === totalPages - 1)} onClick={() => {
            if (page === totalPages - 1) onFermer();
            else setPage(p => Math.min(totalPages - 1, p + 1));
          }} disabled={page === totalPages - 1 && false}>
            {page === totalPages - 1 ? `${t("tutorielJouer", L)} →` : `${t("tutorielSuivant", L)} →`}
          </button>
        </div>
      </div>
    </div>
  );
}