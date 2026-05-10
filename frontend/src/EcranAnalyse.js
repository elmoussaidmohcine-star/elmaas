import { useState, useEffect, useMemo, useCallback } from "react";
import Board from "./Board";
import { t } from "./translations";

const CLASSIF = {
  ELMAAS:    { bg: "#1a0a2e", border: "#9933ff", text: "#d4aaff", labelKey: "classifElmaasLabel",    mark: "I"   },
  ELMAASYON: { bg: "#0a1a3e", border: "#4477ff", text: "#aaccff", labelKey: "classifElmaasyonLabel", mark: "II"  },
  MASSY:     { bg: "#0a2e2e", border: "#00aacc", text: "#aaffee", labelKey: "classifMassyLabel",     mark: "III" },
  NOTMESSY:  { bg: "#1a2e0a", border: "#44aa00", text: "#ccffaa", labelKey: "classifNotmessyLabel",  mark: "IV"  },
  MISSED:    { bg: "#2e1a0a", border: "#ddaa00", text: "#ffeeaa", labelKey: "classifMissedLabel",    mark: "V"   },
  CHESS:     { bg: "#2e0a0a", border: "#cc2200", text: "#ffaaaa", labelKey: "classifChessLabel",     mark: "VI"  },
};

const ORDRE_CLASSIF = ["ELMAAS", "ELMAASYON", "MASSY", "NOTMESSY", "MISSED", "CHESS"];

function MiniPieceAnalyse({ piece, couleur }) {
  if (!piece) return null;
  const cells = piece.cellules || [];
  const maxR = Math.max(0, ...cells.map(([r]) => r));
  const maxC = Math.max(0, ...cells.map(([, c]) => c));
  const S = 7;
  const estELMAAS = piece.enlevement === true;
  const coul = estELMAAS ? "#00BFFF" : (couleur === "rouge" ? "var(--rouge-c)" : "var(--noir-c)");

  return (
    <div style={{
      position: "relative", width: (maxC + 1) * S + 2, height: (maxR + 1) * S + 2,
      padding: 1, borderRadius: 3, border: `1px solid ${coul}33`,
      background: "rgba(255,255,255,0.02)", flexShrink: 0
    }}>
      {cells.map(([r, c], i) => (
        <div key={i} style={{
          position: "absolute", top: r * S + 1, left: c * S + 1,
          width: S - 1, height: S - 1, borderRadius: 1, background: coul,
          boxShadow: `0 0 1px ${coul}44`
        }} />
      ))}
      {estELMAAS && (
        <div style={{ position: "absolute", top: -2, right: -2, width: 3, height: 3, borderRadius: "50%", background: "#00BFFF" }} />
      )}
    </div>
  );
}

function cellulesAbsolues(piece, origine) {
  if (!piece || !origine) return [];
  const [r0, c0] = origine;
  return (piece.cellules || []).map(([dr, dc]) => [r0 + dr, c0 + dc]);
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
    const altPiece = alt?.piece;
    if (altPiece && alt.origine) {
      const abs = cellulesAbsolues(altPiece, alt.origine);
      abs.forEach(([r, c]) => { pieces[`${r},${c}`] = "meilleur_coup"; });
    }
    return buildEtatPlateau(pieces, coupActuel.puzzles_avant, coupActuel.numero_tour);
  }, [showMeilleurCoup, coupActuel, buildEtatPlateau]);

  const precedent = useCallback(() => { setIndexCoup(p => Math.max(0, p - 1)); setShowMeilleurCoup(false); }, []);
  const suivant = useCallback(() => { setIndexCoup(p => Math.min(totalCoups - 1, p + 1)); setShowMeilleurCoup(false); }, [totalCoups]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "ArrowLeft") precedent(); if (e.key === "ArrowRight") suivant(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [precedent, suivant]);

  const compteurPieces = useMemo(() => {
    if (!coupActuel?.plateau_apres) return { rouge: 0, noir: 0 };
    let rouge = 0, noir = 0;
    Object.values(coupActuel.plateau_apres).forEach(v => { if (v === "rouge") rouge++; else if (v === "noir") noir++; });
    return { rouge, noir };
  }, [coupActuel]);

  const classif = coupActuel?.classification;
  const classifInfo = CLASSIF[classif] || { bg: "#222", border: "#666", text: "#fff", labelKey: null, mark: "?" };

  if (!analyseJoueur && !analyseAdv) {
    return (
      <div className="ecran-analyse-overlay">
        <div className="ecran-analyse" style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", fontFamily: "var(--brush)" }}>
            {t("analyseAucunePartie", L)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">

        {/* HEADER */}
        <div className="analyse-header-compact">
          <h2>{t("analyseTitre", L)}</h2>
          <div className="analyse-header-btns">
            <button onClick={() => setShowLegende(v => !v)}>
              {showLegende ? t("analyseCacher", L) : t("analyseLegende", L)}
            </button>
            <button onClick={onFermer}>&times;</button>
          </div>
        </div>

        {/* LEGENDE */}
        {showLegende && (
          <div className="analyse-legende-compact">
            <div className="legende-titre">{t("analyseClassification", L)}</div>
            <div className="legende-classifs">
              {ORDRE_CLASSIF.map(cl => {
                const info = CLASSIF[cl];
                return (
                  <div key={cl} className="legende-classif-item" style={{ background: info.bg, border: `1px solid ${info.border}` }}>
                    <div className="legende-classif-mark" style={{ borderColor: info.text, color: info.text }}>{info.mark}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 10, color: info.text, fontFamily: "var(--titre)" }}>{cl}</div>
                      <div style={{ fontSize: 9, color: `${info.text}aa`, fontFamily: "var(--brush)" }}>{t(info.labelKey, L)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="legende-colors">
              <div className="legende-color-item">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--rouge-c)" }} />
                <span style={{ color: "var(--rouge-c)" }}>Rouge</span>
              </div>
              <div className="legende-color-item">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--noir-c)" }} />
                <span style={{ color: "var(--noir-c)" }}>Noir</span>
              </div>
              <div className="legende-color-item">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#00BFFF" }} />
                <span style={{ color: "#00BFFF" }}>ELMAAS</span>
              </div>
            </div>
          </div>
        )}

        {/* ONGLETS */}
        <div className="analyse-onglets-compact">
          {[
            { key: "moi", label: couleurJoueur === "rouge" ? "Rouge" : "Noir", pct: analyseJoueur?.precision_pct ?? 0 },
            { key: "adversaire", label: couleurJoueur === "rouge" ? "Noir" : "Rouge", pct: analyseAdv?.precision_pct ?? 0 },
          ].map(({ key, label, pct }) => (
            <button key={key} className={coteActif === key ? "actif" : ""}
              onClick={() => { setCoteActif(key); setIndexCoup(0); setShowMeilleurCoup(false); }}>
              {label} <span style={{ opacity: 0.6, fontFamily: "var(--brush)", fontSize: 11 }}>— {pct}%</span>
            </button>
          ))}
        </div>

        {/* CORPS */}
        <div className="analyse-corps">

          {/* PLATEAU + PIÈCES */}
          <div className="analyse-plateau">
            <div className="analyse-scores-ligne">
              <span className="r">Rouge : {compteurPieces.rouge}</span>
              <span className="n">Noir : {compteurPieces.noir}</span>
            </div>

            <div className="analyse-board-wrap">
              <div className="analyse-board-inner">
                {showMeilleurCoup && etatPlateauMeilleur ? (
                  <div className="analyse-best-overlay">
                    <div className="analyse-best-label">{t("analyseMeilleurCoupPossible", L)}</div>
                    <Board etat={etatPlateauMeilleur} taille={taille} pixelsPhoto={pixelsPhoto}
                      couleurJoueur={couleurAnalysee} onPoserPiece={null} modeCouleur={modeCouleur} />
                  </div>
                ) : etatPlateau ? (
                  <Board etat={etatPlateau} taille={taille} pixelsPhoto={pixelsPhoto}
                    couleurJoueur={couleurAnalysee} onPoserPiece={null} modeCouleur={modeCouleur} />
                ) : (
                  <div className="analyse-loading">
                    <div className="loading-text">{t("analyseChargement", L)}</div>
                    <div className="loading-disclaimer">{t("analyseDisclaimer", L)}</div>
                  </div>
                )}
              </div>
            </div>

            {coups.length > 0 && (
              <div className="analyse-disclaimer">{t("analyseDisclaimer", L)}</div>
            )}

            {/* PIÈCES EN MAIN — côte à côte */}
            <div className="analyse-mains-wrap">
              <div className="analyse-main-block" style={{ borderColor: couleurAnalysee === "rouge" ? "rgba(220,60,60,0.2)" : "rgba(160,160,200,0.2)" }}>
                <div className="analyse-main-titre">
                  <div className="dot" style={{ background: couleurAnalysee === "rouge" ? "var(--rouge-c)" : "var(--noir-c)" }} />
                  {coteActif === "moi" ? t("analyseMesPieces", L) : t("analysePiecesAdv", L)}
                  <span>({couleurAnalysee})</span>
                </div>
                <div className="analyse-main-list">
                  {(coupActuel?.main_joueur || []).length > 0 ? (
                    coupActuel.main_joueur.map((piece, i) => <MiniPieceAnalyse key={i} piece={piece} couleur={couleurAnalysee} />)
                  ) : (
                    <span className="analyse-main-empty">{t("analyseAucuneDonneeMain", L)}</span>
                  )}
                </div>
              </div>

              <div className="analyse-main-block" style={{ borderColor: couleurAdv === "rouge" ? "rgba(220,60,60,0.2)" : "rgba(160,160,200,0.2)" }}>
                <div className="analyse-main-titre">
                  <div className="dot" style={{ background: couleurAdv === "rouge" ? "var(--rouge-c)" : "var(--noir-c)" }} />
                  {coteActif === "moi" ? t("analysePiecesAdv", L) : t("analyseMesPieces", L)}
                  <span>({couleurAdv})</span>
                </div>
                <div className="analyse-main-list">
                  {(coupActuel?.main_adversaire || []).length > 0 ? (
                    coupActuel.main_adversaire.map((piece, i) => <MiniPieceAnalyse key={i} piece={piece} couleur={couleurAdv} />)
                  ) : (
                    <span className="analyse-main-empty">{t("analyseAucuneDonneeMain", L)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PANNEAU INFO */}
          <div className="analyse-panneau">

            {/* Navigation */}
            <div className="analyse-nav">
              <button onClick={precedent} disabled={indexCoup === 0}>&larr;</button>
              <div>
                <div className="analyse-nav-label">{t("coupSur", L)}</div>
                <div className="analyse-nav-num">{indexCoup + 1} <span>/ {totalCoups}</span></div>
              </div>
              <button onClick={suivant} disabled={indexCoup >= totalCoups - 1}>&rarr;</button>
            </div>

            {/* Infos coup */}
            <div className="analyse-infos-coup" style={{ borderColor: classifInfo.border + '44' }}>
              <div className="analyse-coup-ligne1">
                <span>{t("analyseTour", L)} <strong>{coupActuel?.numero_tour ?? "?"}</strong> — <strong style={{ color: coupActuel?.couleur === "rouge" ? "var(--rouge-c)" : "var(--noir-c)" }}>{coupActuel?.couleur?.toUpperCase() ?? "?"}</strong></span>
              </div>

              <div className="analyse-classif-badge" style={{ background: classifInfo.bg, border: `1px solid ${classifInfo.border}` }}>
                <div className="analyse-classif-mark" style={{ borderColor: classifInfo.text, color: classifInfo.text }}>{classifInfo.mark}</div>
                <div>
                  <div className="analyse-classif-name" style={{ color: classifInfo.text }}>{classif || "?"}</div>
                  <div className="analyse-classif-label" style={{ color: classifInfo.text + 'aa' }}>{classifInfo.labelKey ? t(classifInfo.labelKey, L) : (classif || "?")}</div>
                </div>
              </div>

              {coupActuel?.rang && (
                <div className="analyse-meta">{t("analyseRang", L)}: <strong>{coupActuel.rang}</strong> / {coupActuel.total_coups_possibles}</div>
              )}

              {coupActuel?.scores_avant && coupActuel?.scores_apres && (
                <div className="analyse-scores-evo">
                  <span>R:{coupActuel.scores_avant.rouge ?? 0} N:{coupActuel.scores_avant.noir ?? 0}</span>
                  <span>→</span>
                  <span>R:{coupActuel.scores_apres.rouge ?? 0} N:{coupActuel.scores_apres.noir ?? 0}</span>
                </div>
              )}

              {coupActuel?.gain_cellules > 0 && (
                <div className="analyse-meta gain">+{coupActuel.gain_cellules} {t("analyseCellules", L)}</div>
              )}

              {coupActuel?.serie_apres > 0 && (
                <div className="analyse-meta serie">{t("analyseSerie", L)}: {coupActuel.serie_avant}→<strong>{coupActuel.serie_apres}</strong></div>
              )}

              {coupActuel?.piece_forme && (
                <div className="analyse-meta">{t("analyseForme", L)}: {coupActuel.piece_forme}{coupActuel.piece_est_elmaas && <span className="elmaas-tag">ELMAAS</span>}</div>
              )}
            </div>

            {/* Meilleur coup */}
            {coupActuel?.meilleur_alternative && !["ELMAAS","ELMAASYON","MASSY"].includes(coupActuel?.classification) && (
              <div className="analyse-best-btn-wrap">
                <button onClick={() => setShowMeilleurCoup(!showMeilleurCoup)} className="analyse-best-btn">
                  {showMeilleurCoup ? t("analyseRetourCoup", L) : t("analyseVoirUnMeilleur", L)}
                </button>
                {showMeilleurCoup && (
                  <div className="analyse-best-detail">
                    <div>{t("analysePiece", L)} #{(coupActuel.meilleur_alternative.piece_index ?? 0) + 1}</div>
                    <div>{t("analyseOrigine", L)}: [{coupActuel.meilleur_alternative.origine?.join(", ")}]</div>
                    {coupActuel.meilleur_alternative.est_elmaas && <div className="elmaas-tag">ELMAAS</div>}
                  </div>
                )}
              </div>
            )}

            {/* Progression */}
            <div className="analyse-progress">
              <div className="analyse-progress-bar">
                <div style={{ width: `${totalCoups > 0 ? ((indexCoup + 1) / totalCoups) * 100 : 0}%` }} />
              </div>
              <div className="analyse-progress-hint">&larr; &rarr; {t("analyseNaviguer", L)}</div>
            </div>
          </div>
        </div>

        {/* RÉCAPITULATIF */}
        {totalCoups > 0 && (() => {
          const stats = {};
          coups.forEach(c => { stats[c.classification] = (stats[c.classification] || 0) + 1; });
          return (
            <div className="analyse-recap-outer">
              <div className="analyse-recap-titre">{t("analyseResume", L)} — {couleurAnalysee?.toUpperCase()} — {analyseEnCours?.precision_pct ?? 0}% {t("analysePrecision", L)}</div>
              <div className="analyse-recap-badges">
                {ORDRE_CLASSIF.map(cl => {
                  const count = stats[cl] || 0;
                  if (count === 0) return null;
                  const info = CLASSIF[cl];
                  const pct = Math.round(count / totalCoups * 100);
                  return (
                    <div key={cl} className="analyse-recap-badge" style={{ background: info.bg, border: `1px solid ${info.border}` }}
                      onClick={() => { const idx = coups.findIndex(c => c.classification === cl); if (idx >= 0) { setIndexCoup(idx); setShowMeilleurCoup(false); } }}
                      title={L === 0 ? `Aller au premier coup ${cl}` : L === 1 ? `Go to first ${cl} move` : L === 2 ? `انتقل إلى أول حركة ${cl}` : `Ir al primer movimiento ${cl}`}>
                      <div className="recap-mark" style={{ borderColor: info.text, color: info.text }}>{info.mark}</div>
                      <span className="recap-name">{cl}</span>
                      <span className="recap-count">{count}x ({pct}%)</span>
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