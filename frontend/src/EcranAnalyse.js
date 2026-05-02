import { useState, useEffect, useMemo, useCallback } from "react";
import Board from "./Board";

// ─── Classifications : chiffres romains, style antiquité ───
const CLASSIF = {
  ELMAAS:    { bg: "linear-gradient(135deg,#6600cc,#9933ff)", border: "#9933ff", text: "#fff", label: "Coup parfait", mark: "I" },
  ELMAASYON: { bg: "linear-gradient(135deg,#1144cc,#4477ff)", border: "#4477ff", text: "#fff", label: "Excellent coup", mark: "II" },
  MASSY:     { bg: "linear-gradient(135deg,#006688,#00aacc)", border: "#00aacc", text: "#fff", label: "Bon coup", mark: "III" },
  NOTMESSY:  { bg: "linear-gradient(135deg,#226600,#44aa00)", border: "#44aa00", text: "#fff", label: "Coup correct", mark: "IV" },
  MISSED:    { bg: "linear-gradient(135deg,#885500,#ddaa00)", border: "#ddaa00", text: "#fff", label: "Opportunite ratee", mark: "V" },
  CHESS:     { bg: "linear-gradient(135deg,#880000,#cc2200)", border: "#cc2200", text: "#fff", label: "Mauvais coup", mark: "VI" },
};

const ORDRE_CLASSIF = ["ELMAAS", "ELMAASYON", "MASSY", "NOTMESSY", "MISSED", "CHESS"];

// ─── Mini piece pour l analyse ───
function MiniPieceAnalyse({ piece, couleur }) {
  if (!piece) return null;
  const cells = piece.cellules || [];
  const maxR = Math.max(0, ...cells.map(([r]) => r));
  const maxC = Math.max(0, ...cells.map(([, c]) => c));
  const S = 9;
  const estELMAAS = piece.enlevement === true;
  const coul = estELMAAS ? "#00BFFF" : (couleur === "rouge" ? "var(--rouge-c)" : "var(--noir-c)");
  const bg = estELMAAS ? "rgba(0,191,255,0.06)" : "rgba(255,255,255,0.03)";

  return (
    <div style={{ position: "relative", width: (maxC + 1) * S + 6, height: (maxR + 1) * S + 6, padding: 3, borderRadius: 5, border: `1px solid ${coul}33`, background: bg, flexShrink: 0 }}>
      {cells.map(([r, c], i) => (
        <div key={i} style={{ position: "absolute", top: r * S + 3, left: c * S + 3, width: S - 1, height: S - 1, borderRadius: 2, background: coul, boxShadow: `0 0 3px ${coul}55` }} />
      ))}
      {estELMAAS && <div style={{ position: "absolute", top: -2, right: -2, width: 5, height: 5, borderRadius: "50%", background: "#00BFFF" }} />}
    </div>
  );
}

export default function EcranAnalyse({
  analyseJoueur,
  analyseAdv,
  couleurJoueur,
  onFermer,
  L = 0,
  pixelsPhoto,
  modeCouleur = false,
  taille = 16,
}) {
  const [coteActif, setCoteActif] = useState("moi");
  const [indexCoup, setIndexCoup] = useState(0);
  const [showMeilleurCoup, setShowMeilleurCoup] = useState(false);
  const [showLegende, setShowLegende] = useState(false);

  const analyseEnCours = coteActif === "moi" ? analyseJoueur : analyseAdv;
  const coups = analyseEnCours?.coups || [];
  const totalCoups = coups.length;

  const coupActuel = useMemo(() => {
    if (!coups || coups.length === 0) return null;
    return coups[indexCoup] || null;
  }, [coups, indexCoup]);

  const couleurAnalysee = coteActif === "moi" ? couleurJoueur : (couleurJoueur === "rouge" ? "noir" : "rouge");
  const couleurAdv = couleurAnalysee === "rouge" ? "noir" : "rouge";

  const buildEtatPlateau = useCallback((pieces, puzzlesData = {}, numeroTour = 0) => {
    if (!pieces || typeof pieces !== "object") return null;
    const piecesClone = { ...pieces };
    const cellulesActives = Object.entries(piecesClone)
      .filter(([k, v]) => v != null)
      .map(([k]) => k.split(",").map(Number));

    const puzzlesDict = {};
    if (puzzlesData && Array.isArray(puzzlesData)) {
      puzzlesData.forEach(p => {
        if (p && p.id !== undefined) {
          puzzlesDict[p.id] = { ...p, cellules: p.cellules || [] };
        }
      });
    }

    return {
      plateau: {
        pieces: piecesClone,
        puzzles: puzzlesDict,
        cellules_libres: [],
        cellules_actives: cellulesActives,
        grille_bicolore: Array(taille).fill().map(() => Array(taille).fill(0))
      },
      joueur1: { couleur: "rouge", main_active: [], nb_pieces_reserve: 0, serie_actuelle: 0, nb_pieces_posees_depuis_regen: 0, seuil_regen_actuel: 5, pieces_protegees: [] },
      joueur2: { couleur: "noir", main_active: [], nb_pieces_reserve: 0, serie_actuelle: 0, nb_pieces_posees_depuis_regen: 0, seuil_regen_actuel: 5, pieces_protegees: [] },
      tour_actuel: 0,
      numero_tour: numeroTour,
      manche_terminee: false,
      gagnant: null,
      victoire_immediate: false,
      scores: { rouge: 0, noir: 0 },
    };
  }, [taille]);

  const etatPlateau = useMemo(() => {
    if (!coupActuel?.plateau_apres) return null;
    return buildEtatPlateau(coupActuel.plateau_apres, coupActuel.puzzles_apres, coupActuel.numero_tour);
  }, [coupActuel, buildEtatPlateau, indexCoup]);

  const etatPlateauMeilleur = useMemo(() => {
    if (!showMeilleurCoup || !coupActuel?.meilleur_alternative || !coupActuel?.plateau_avant) return null;
    const pieces = { ...coupActuel.plateau_avant };
    const alt = coupActuel.meilleur_alternative;
    if (alt && alt.origine) {
      pieces[`${alt.origine[0]},${alt.origine[1]}`] = "meilleur_coup";
    }
    return buildEtatPlateau(pieces, coupActuel.puzzles_avant, coupActuel.numero_tour);
  }, [showMeilleurCoup, coupActuel, buildEtatPlateau]);

  const precedent = useCallback(() => {
    setIndexCoup(prev => Math.max(0, prev - 1));
    setShowMeilleurCoup(false);
  }, []);

  const suivant = useCallback(() => {
    setIndexCoup(prev => Math.min(totalCoups - 1, prev + 1));
    setShowMeilleurCoup(false);
  }, [totalCoups]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") precedent();
      if (e.key === "ArrowRight") suivant();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [precedent, suivant]);

  const compteurPieces = useMemo(() => {
    if (!coupActuel?.plateau_apres) return { rouge: 0, noir: 0 };
    let rouge = 0, noir = 0;
    Object.values(coupActuel.plateau_apres).forEach(v => {
      if (v === "rouge") rouge++;
      else if (v === "noir") noir++;
    });
    return { rouge, noir };
  }, [coupActuel]);

  const classif = coupActuel?.classification;
  const classifInfo = CLASSIF[classif] || { bg: "#333", border: "#666", text: "#fff", label: classif || "?", mark: "?" };

  const txtPiecesMoi = ["Mes pieces", "My pieces", "Qati", "Mis piezas"];
  const txtPiecesAdv = ["Pieces adverses", "Opponent pieces", "Qaa al khasm", "Piezas rival"];

  if (!analyseJoueur && !analyseAdv) {
    return (
      <div className="ecran-analyse-overlay">
        <div className="ecran-analyse" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <div style={{ color: "var(--muted)", fontSize: 15, textAlign: "center", fontFamily: "var(--brush)" }}>
            Aucune donnee d analyse disponible.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">

        {/* En-tete */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid var(--bord)", paddingBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: "var(--texte)", fontFamily: "var(--titre)", letterSpacing: "0.05em" }}>
            {L === 0 ? "Analyse de partie" : L === 1 ? "Game Analysis" : L === 2 ? "Tahlil al mubaraa" : "Analisis de partida"}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowLegende(v => !v)}
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--bord)", background: showLegende ? "var(--bg3)" : "transparent", color: "var(--texte)", cursor: "pointer", fontFamily: "var(--brush)" }}>
              {showLegende ? "Cacher" : "Legende"}
            </button>
            <button onClick={onFermer} style={{ fontSize: 20, cursor: "pointer", background: "none", border: "none", color: "var(--muted)", fontFamily: "var(--titre)", lineHeight: 1 }}>
              &times;
            </button>
          </div>
        </div>

        {/* Legende arc-en-ciel */}
        {showLegende && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--bord)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, fontWeight: 600, letterSpacing: "0.15em", fontFamily: "var(--titre)", textTransform: "uppercase" }}>
              Classification des coups
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ORDRE_CLASSIF.map(cl => {
                const info = CLASSIF[cl];
                return (
                  <div key={cl} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: info.bg, border: `1px solid ${info.border}`, boxShadow: cl === "ELMAAS" ? `0 0 14px ${info.border}55` : "none" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${info.text}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: info.text }}>
                      {info.mark}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: info.text, letterSpacing: 0.5, fontFamily: "var(--titre)" }}>{cl}</div>
                      <div style={{ fontSize: 10, color: `${info.text}bb`, fontFamily: "var(--brush)" }}>{info.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, fontFamily: "var(--titre)", letterSpacing: "0.1em" }}>PLATEAU :</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--rouge-c)", boxShadow: "0 0 4px var(--rouge-c)44" }} />
                <span style={{ fontSize: 11, color: "var(--rouge-c)", fontWeight: 600, fontFamily: "var(--brush)" }}>Rouge</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--noir-c)", border: "1px solid var(--noir-c)" }} />
                <span style={{ fontSize: 11, color: "var(--noir-c)", fontWeight: 600, fontFamily: "var(--brush)" }}>Noir</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "#00BFFF", boxShadow: "0 0 6px #00BFFF" }} />
                <span style={{ fontSize: 11, color: "#00BFFF", fontWeight: 600, fontFamily: "var(--brush)" }}>ELMAAS</span>
              </div>
            </div>
          </div>
        )}

        {/* Onglets joueurs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { key: "moi", label: couleurJoueur === "rouge" ? "Rouge" : "Noir", pct: analyseJoueur?.precision_pct ?? 0 },
            { key: "adversaire", label: couleurJoueur === "rouge" ? "Noir" : "Rouge", pct: analyseAdv?.precision_pct ?? 0 },
          ].map(({ key, label, pct }) => (
            <button key={key}
              onClick={() => { setCoteActif(key); setIndexCoup(0); setShowMeilleurCoup(false); }}
              style={{
                flex: 1, padding: 10, background: coteActif === key ? "linear-gradient(135deg,#6600cc,#4477ff)" : "var(--bg2)",
                color: "#fff", border: coteActif === key ? "1px solid #6644cc" : "1px solid var(--bord)",
                borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "var(--titre)", letterSpacing: "0.03em"
              }}>
              {label} — <span style={{ opacity: 0.8, fontFamily: "var(--brush)", fontSize: 13 }}>{pct}% precision</span>
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="analyse-corps">

          {/* Plateau */}
          <div className="analyse-plateau">
            <div style={{ display: "flex", gap: 14, marginBottom: 8, fontSize: 12, fontFamily: "var(--brush)" }}>
              <span style={{ color: "var(--rouge-c)", fontWeight: 600 }}>Rouge : {compteurPieces.rouge}</span>
              <span style={{ color: "var(--noir-c)", fontWeight: 600 }}>Noir : {compteurPieces.noir}</span>
            </div>

            {showMeilleurCoup && etatPlateauMeilleur ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: "#aa88ff", fontWeight: 600, fontFamily: "var(--titre)", letterSpacing: "0.1em" }}>
                  {L === 0 ? "Meilleur coup possible" : "Best possible move"}
                </div>
                <Board etat={etatPlateauMeilleur} taille={taille} pixelsPhoto={pixelsPhoto} couleurJoueur={couleurAnalysee} onPoserPiece={null} modeCouleur={modeCouleur} />
              </div>
            ) : etatPlateau ? (
              <Board etat={etatPlateau} taille={taille} pixelsPhoto={pixelsPhoto} couleurJoueur={couleurAnalysee} onPoserPiece={null} modeCouleur={modeCouleur} />
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: 40, fontFamily: "var(--brush)" }}>
                Chargement du plateau...
              </div>
            )}
          </div>

          {/* Panneau info */}
          <div className="analyse-panneau">

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button onClick={precedent} disabled={indexCoup === 0}
                style={{ padding: "6px 16px", opacity: indexCoup === 0 ? 0.4 : 1, borderRadius: 6, border: "1px solid var(--bord)", background: "var(--bg2)", color: "var(--texte)", cursor: indexCoup === 0 ? "default" : "pointer", fontSize: 18, fontFamily: "var(--titre)" }}>
                &larr;
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--titre)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Coup</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--texte)", fontFamily: "var(--titre)" }}>{indexCoup + 1} <span style={{ color: "var(--muted)", fontSize: 14, fontFamily: "var(--brush)" }}>/ {totalCoups}</span></div>
              </div>
              <button onClick={suivant} disabled={indexCoup >= totalCoups - 1}
                style={{ padding: "6px 16px", opacity: indexCoup >= totalCoups - 1 ? 0.4 : 1, borderRadius: 6, border: "1px solid var(--bord)", background: "var(--bg2)", color: "var(--texte)", cursor: indexCoup >= totalCoups - 1 ? "default" : "pointer", fontSize: 18, fontFamily: "var(--titre)" }}>
                &rarr;
              </button>
            </div>

            {/* Infos coup */}
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${classifInfo.border}44`, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontFamily: "var(--brush)" }}>
                Tour <strong style={{ color: "var(--texte)" }}>{coupActuel?.numero_tour ?? "?"}</strong>
                {" — "}
                <span style={{ color: coupActuel?.couleur === "rouge" ? "var(--rouge-c)" : "var(--noir-c)", fontWeight: 700, fontFamily: "var(--titre)" }}>
                  {coupActuel?.couleur?.toUpperCase() ?? "?"}
                </span>
              </div>

              {/* Badge classification avec chiffre romain */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 8, marginBottom: 10, background: classifInfo.bg, border: `1px solid ${classifInfo.border}`, boxShadow: classif === "ELMAAS" ? `0 0 20px ${classifInfo.border}55` : `0 0 6px ${classifInfo.border}33` }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${classifInfo.text}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: classifInfo.text }}>
                  {classifInfo.mark}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: classifInfo.text, letterSpacing: 1, fontFamily: "var(--titre)" }}>{classif || "?"}</div>
                  <div style={{ fontSize: 10, color: `${classifInfo.text}bb`, fontFamily: "var(--brush)" }}>{classifInfo.label}</div>
                </div>
              </div>

              {coupActuel?.rang && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, fontFamily: "var(--brush)" }}>
                  Rang : <strong style={{ color: "var(--texte)" }}>{coupActuel.rang}</strong> / {coupActuel.total_coups_possibles} coups possibles
                </div>
              )}

              {coupActuel?.scores_avant && coupActuel?.scores_apres && (
                <div style={{ display: "flex", gap: 12, fontSize: 11, marginBottom: 6, fontFamily: "var(--brush)" }}>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Avant </span>
                    <span style={{ color: "var(--rouge-c)" }}>R:{coupActuel.scores_avant.rouge ?? 0}</span>
                    {" "}<span style={{ color: "var(--noir-c)" }}>N:{coupActuel.scores_avant.noir ?? 0}</span>
                  </div>
                  <span style={{ color: "var(--muted)" }}>&rarr;</span>
                  <div>
                    <span style={{ color: "var(--muted)" }}>Apres </span>
                    <span style={{ color: "var(--rouge-c)" }}>R:{coupActuel.scores_apres.rouge ?? 0}</span>
                    {" "}<span style={{ color: "var(--noir-c)" }}>N:{coupActuel.scores_apres.noir ?? 0}</span>
                  </div>
                </div>
              )}

              {coupActuel?.gain_cellules > 0 && (
                <div style={{ fontSize: 11, color: "#44cc88", marginBottom: 4, fontFamily: "var(--brush)" }}>
                  +{coupActuel.gain_cellules} cellules
                </div>
              )}

              {coupActuel?.serie_apres > 0 && (
                <div style={{ fontSize: 11, color: "#ffaa44", marginBottom: 4, fontFamily: "var(--brush)" }}>
                  Serie : {coupActuel.serie_avant} &rarr; <strong>{coupActuel.serie_apres}</strong>
                </div>
              )}

              {coupActuel?.piece_forme && (
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--brush)" }}>
                  Forme : <span style={{ color: "var(--texte)" }}>{coupActuel.piece_forme}</span>
                  {coupActuel.piece_est_elmaas && <span style={{ color: "#00BFFF", marginLeft: 6, fontWeight: 600 }}>ELMAAS</span>}
                </div>
              )}
            </div>

            {/* PIECES DES JOUEURS — au tour exact */}
            <div className="analyse-mains">
              <div className="analyse-main-titre">
                {coteActif === "moi" ? txtPiecesMoi[L] || txtPiecesMoi[0] : txtPiecesAdv[L] || txtPiecesAdv[0]}
                {" "}<span style={{ color: couleurAnalysee === "rouge" ? "var(--rouge-c)" : "var(--noir-c)" }}>({couleurAnalysee})</span>
              </div>
              <div className="analyse-main-list">
                {(coupActuel?.main_joueur || []).map((piece, i) => (
                  <MiniPieceAnalyse key={i} piece={piece} couleur={couleurAnalysee} />
                ))}
                {(coupActuel?.main_joueur || []).length === 0 && (
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--brush)" }}>—</span>
                )}
              </div>

              <div className="analyse-main-titre" style={{ marginTop: 8 }}>
                {coteActif === "moi" ? txtPiecesAdv[L] || txtPiecesAdv[0] : txtPiecesMoi[L] || txtPiecesMoi[0]}
                {" "}<span style={{ color: couleurAdv === "rouge" ? "var(--rouge-c)" : "var(--noir-c)" }}>({couleurAdv})</span>
              </div>
              <div className="analyse-main-list">
                {(coupActuel?.main_adversaire || []).map((piece, i) => (
                  <MiniPieceAnalyse key={i} piece={piece} couleur={couleurAdv} />
                ))}
                {(coupActuel?.main_adversaire || []).length === 0 && (
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--brush)" }}>—</span>
                )}
              </div>
            </div>

            {/* Bouton meilleur coup */}
            {coupActuel?.meilleur_alternative && (
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setShowMeilleurCoup(!showMeilleurCoup)}
                  style={{
                    padding: "10px 16px", background: showMeilleurCoup ? "var(--bg3)" : "linear-gradient(135deg,#6600cc,#9933ff)",
                    color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    width: "100%", fontFamily: "var(--titre)", letterSpacing: "0.03em",
                    boxShadow: showMeilleurCoup ? "none" : "0 0 14px #9933ff44"
                  }}>
                  {showMeilleurCoup ? (L === 0 ? "Revenir au coup joue" : "Back to played move") : (L === 0 ? "Voir le meilleur coup" : "See best move")}
                </button>

                {showMeilleurCoup && (
                  <div style={{ marginTop: 8, padding: 10, background: "rgba(102,0,204,0.12)", borderRadius: 6, border: "1px solid #9933ff44", fontSize: 12, fontFamily: "var(--brush)" }}>
                    <div style={{ color: "#aa88ff", fontWeight: 600, marginBottom: 4, fontFamily: "var(--titre)" }}>Meilleur coup :</div>
                    <div>Piece #{(coupActuel.meilleur_alternative.piece_index ?? 0) + 1}</div>
                    <div style={{ color: "#ffaa44" }}>Origine : [{coupActuel.meilleur_alternative.origine?.join(", ")}]</div>
                    {coupActuel.meilleur_alternative.est_elmaas && (
                      <div style={{ color: "#00BFFF", marginTop: 4, fontWeight: 600 }}>Coup ELMAAS disponible</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Barre de progression */}
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${totalCoups > 0 ? ((indexCoup + 1) / totalCoups) * 100 : 0}%`,
                  background: "linear-gradient(90deg,#6600cc,#4477ff)", borderRadius: 2, transition: "width 0.2s"
                }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "var(--muted)", textAlign: "center", fontFamily: "var(--brush)" }}>
                &larr; &rarr; pour naviguer
              </div>
            </div>
          </div>
        </div>

        {/* Recapitulatif cliquable */}
        {totalCoups > 0 && (() => {
          const stats = {};
          coups.forEach(c => { stats[c.classification] = (stats[c.classification] || 0) + 1; });
          return (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--bord)" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600, fontFamily: "var(--titre)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Resume — {couleurAnalysee?.toUpperCase()} — {analyseEnCours?.precision_pct ?? 0}% precision
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ORDRE_CLASSIF.map(cl => {
                  const count = stats[cl] || 0;
                  if (count === 0) return null;
                  const info = CLASSIF[cl];
                  const pct = Math.round(count / totalCoups * 100);
                  return (
                    <div key={cl}
                      onClick={() => {
                        const idx = coups.findIndex(c => c.classification === cl);
                        if (idx >= 0) { setIndexCoup(idx); setShowMeilleurCoup(false); }
                      }}
                      title={`Aller au premier coup ${cl}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                        background: info.bg, border: `1px solid ${info.border}`, userSelect: "none"
                      }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${info.text}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontSize: 8, fontWeight: 700, color: info.text }}>
                        {info.mark}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "var(--titre)" }}>{cl}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "var(--brush)" }}>{count}x ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
