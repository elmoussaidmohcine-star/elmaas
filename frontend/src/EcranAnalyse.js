import { useState, useEffect, useMemo, useCallback } from "react";
import Board from "./Board";
import { t } from "./translations";

// ─── Classifications : chiffres romains, style antiquité ───
const CLASSIF = {
  ELMAAS:    { bg: "#1a0a2e", border: "#9933ff", text: "#d4aaff", labelKey: "classifElmaasLabel",    mark: "I"   },
  ELMAASYON: { bg: "#0a1a3e", border: "#4477ff", text: "#aaccff", labelKey: "classifElmaasyonLabel", mark: "II"  },
  MASSY:     { bg: "#0a2e2e", border: "#00aacc", text: "#aaffee", labelKey: "classifMassyLabel",     mark: "III" },
  NOTMESSY:  { bg: "#1a2e0a", border: "#44aa00", text: "#ccffaa", labelKey: "classifNotmessyLabel",  mark: "IV"  },
  MISSED:    { bg: "#2e1a0a", border: "#ddaa00", text: "#ffeeaa", labelKey: "classifMissedLabel",    mark: "V"   },
  CHESS:     { bg: "#2e0a0a", border: "#cc2200", text: "#ffaaaa", labelKey: "classifChessLabel",     mark: "VI"  },
};

const ORDRE_CLASSIF = ["ELMAAS", "ELMAASYON", "MASSY", "NOTMESSY", "MISSED", "CHESS"];

// ─── Mini piece pour l analyse ───
function MiniPieceAnalyse({ piece, couleur }) {
  if (!piece) return null;
  const cells = piece.cellules || [];
  const maxR = Math.max(0, ...cells.map(([r]) => r));
  const maxC = Math.max(0, ...cells.map(([, c]) => c));
  const S = 8;
  const estELMAAS = piece.enlevement === true;
  const coul = estELMAAS ? "var(--diamant)" : (couleur === "rouge" ? "var(--rouge-c)" : "var(--noir-c)");

  return (
    <div style={{
      position: "relative", width: (maxC + 1) * S + 4, height: (maxR + 1) * S + 4,
      padding: 2, borderRadius: 4, border: `1px solid ${coul}33`,
      background: "rgba(255,255,255,0.02)", flexShrink: 0
    }}>
      {cells.map(([r, c], i) => (
        <div key={i} style={{
          position: "absolute", top: r * S + 2, left: c * S + 2,
          width: S - 1, height: S - 1, borderRadius: 1, background: coul,
          boxShadow: `0 0 2px ${coul}44`
        }} />
      ))}
      {estELMAAS && (
        <div style={{ position: "absolute", top: -2, right: -2, width: 4, height: 4, borderRadius: "50%", background: "var(--diamant)" }} />
      )}
    </div>
  );
}

// ─── Cellules absolues d une piece ───
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
      abs.forEach(([r, c]) => {
        pieces[`${r},${c}`] = "meilleur_coup";
      });
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
  const classifInfo = CLASSIF[classif] || { bg: "#222", border: "#666", text: "#fff", labelKey: null, mark: "?" };

  if (!analyseJoueur && !analyseAdv) {
    return (
      <div className="ecran-analyse-overlay">
        <div className="ecran-analyse" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <div style={{ color: "var(--muted)", fontSize: 15, textAlign: "center", fontFamily: "var(--brush)" }}>
            {t("analyseAucunePartie", L)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">

        {/* En-tete */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10
        }}>
          <h2 style={{
            margin: 0, fontSize: 22, color: "var(--texte)",
            fontFamily: "var(--titre)", letterSpacing: "0.08em", fontWeight: 400
          }}>
            {t("analyseTitre", L)}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowLegende(v => !v)}
              style={{
                fontSize: 11, padding: "6px 12px", borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.15)",
                background: showLegende ? "rgba(255,255,255,0.06)" : "transparent",
                color: "var(--texte)", cursor: "pointer", fontFamily: "var(--titre)",
                letterSpacing: "0.1em", textTransform: "uppercase"
              }}>
              {showLegende ? t("analyseCacher", L) : t("analyseLegende", L)}
            </button>
            <button onClick={onFermer} style={{
              fontSize: 20, cursor: "pointer", background: "none", border: "none",
              color: "var(--muted)", fontFamily: "var(--titre)", lineHeight: 1
            }}>
              &times;
            </button>
          </div>
        </div>

        {/* Legende */}
        {showLegende && (
          <div style={{
            marginBottom: 16, padding: 14, borderRadius: 8,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)"
          }}>
            <div style={{
              fontSize: 10, color: "var(--muted)", marginBottom: 10,
              fontWeight: 600, letterSpacing: "0.2em", fontFamily: "var(--titre)", textTransform: "uppercase"
            }}>
            {t("analyseClassification", L)}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ORDRE_CLASSIF.map(cl => {
                const info = CLASSIF[cl];
                return (
                  <div key={cl} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px", borderRadius: 6,
                    background: info.bg, border: `1px solid ${info.border}`
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `1px solid ${info.text}`, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700,
                      color: info.text
                    }}>
                      {info.mark}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: 700, fontSize: 12, color: info.text,
                        letterSpacing: 0.5, fontFamily: "var(--titre)"
                      }}>{cl}</div>
                      <div style={{ fontSize: 10, color: `${info.text}aa`, fontFamily: "var(--brush)" }}>{t(info.labelKey, L)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{
                fontSize: 10, color: "var(--muted)", fontWeight: 600,
                fontFamily: "var(--titre)", letterSpacing: "0.15em", textTransform: "uppercase"
              }}>{t("analysePlateau", L)} :</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--rouge-c)" }} />
                <span style={{ fontSize: 10, color: "var(--rouge-c)", fontWeight: 600, fontFamily: "var(--brush)" }}>Rouge</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--noir-c)" }} />
                <span style={{ fontSize: 10, color: "var(--noir-c)", fontWeight: 600, fontFamily: "var(--brush)" }}>Noir</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--diamant)" }} />
                <span style={{ fontSize: 10, color: "var(--diamant)", fontWeight: 600, fontFamily: "var(--brush)" }}>ELMAAS</span>
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { key: "moi", label: couleurJoueur === "rouge" ? "Rouge" : "Noir", pct: analyseJoueur?.precision_pct ?? 0 },
            { key: "adversaire", label: couleurJoueur === "rouge" ? "Noir" : "Rouge", pct: analyseAdv?.precision_pct ?? 0 },
          ].map(({ key, label, pct }) => (
            <button key={key}
              onClick={() => { setCoteActif(key); setIndexCoup(0); setShowMeilleurCoup(false); }}
              style={{
                flex: 1, padding: 10,
                background: coteActif === key ? "rgba(102,0,204,0.25)" : "rgba(255,255,255,0.02)",
                color: "#fff",
                border: coteActif === key ? "1px solid rgba(153,51,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13,
                fontFamily: "var(--titre)", letterSpacing: "0.05em"
              }}>
              {label} <span style={{ opacity: 0.6, fontFamily: "var(--brush)", fontSize: 12 }}>— {pct}%</span>
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="analyse-corps">

          {/* Colonne plateau */}
          <div className="analyse-plateau">
            <div style={{
              display: "flex", gap: 14, marginBottom: 8, fontSize: 11,
              fontFamily: "var(--brush)", justifyContent: "center"
            }}>
              <span style={{ color: "var(--rouge-c)", fontWeight: 600 }}>Rouge : {compteurPieces.rouge}</span>
              <span style={{ color: "var(--noir-c)", fontWeight: 600 }}>Noir : {compteurPieces.noir}</span>
            </div>

            {showMeilleurCoup && etatPlateauMeilleur ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
                <div style={{
                  fontSize: 11, color: "#aa88ff", fontWeight: 600,
                  fontFamily: "var(--titre)", letterSpacing: "0.1em", textTransform: "uppercase"
                }}>
                  {t("analyseMeilleurCoupPossible", L)}
                </div>
                <div style={{ overflow: "auto", maxWidth: "100%" }}>
                  <Board
                    etat={etatPlateauMeilleur}
                    taille={taille}
                    pixelsPhoto={pixelsPhoto}
                    couleurJoueur={couleurAnalysee}
                    onPoserPiece={null}
                    modeCouleur={modeCouleur}
                  />
                </div>
              </div>
            ) : etatPlateau ? (
              <div style={{ overflow: "auto", maxWidth: "100%" }}>
                <Board
                  etat={etatPlateau}
                  taille={taille}
                  pixelsPhoto={pixelsPhoto}
                  couleurJoueur={couleurAnalysee}
                  onPoserPiece={null}
                  modeCouleur={modeCouleur}
                />
              </div>
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: 40, fontFamily: "var(--brush)" }}>
                {t("analyseChargement", L)}
              </div>
            )}

            {/* ── PIÈCES EN MAIN — sous le plateau ── */}
            <div style={{
              width: "100%", marginTop: 14,
              display: "flex", flexDirection: "column", gap: 10
            }}>
              {/* Joueur analysé */}
              <div style={{
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${couleurAnalysee === "rouge" ? "rgba(220,60,60,0.2)" : "rgba(160,160,200,0.2)"}`,
              }}>
                <div style={{
                  fontSize: 10, color: "var(--muted)", textTransform: "uppercase",
                  letterSpacing: "0.15em", fontFamily: "var(--titre)",
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 6
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: couleurAnalysee === "rouge" ? "var(--rouge-c)" : "var(--noir-c)"
                  }} />
                  {coteActif === "moi" ? t("analyseMesPieces", L) : t("analysePiecesAdv", L)}
                  <span style={{ color: couleurAnalysee === "rouge" ? "var(--rouge-c)" : "var(--noir-c)", fontWeight: 600 }}>
                    ({couleurAnalysee})
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start", minHeight: 22 }}>
                  {(coupActuel?.main_joueur || []).length > 0 ? (
                    coupActuel.main_joueur.map((piece, i) => (
                      <MiniPieceAnalyse key={i} piece={piece} couleur={couleurAnalysee} />
                    ))
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--brush)", fontStyle: "italic" }}>
                      {t("analyseAucuneDonneeMain", L)}
                    </span>
                  )}
                </div>
              </div>

              {/* Adversaire */}
              <div style={{
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${couleurAdv === "rouge" ? "rgba(220,60,60,0.2)" : "rgba(160,160,200,0.2)"}`,
              }}>
                <div style={{
                  fontSize: 10, color: "var(--muted)", textTransform: "uppercase",
                  letterSpacing: "0.15em", fontFamily: "var(--titre)",
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 6
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: couleurAdv === "rouge" ? "var(--rouge-c)" : "var(--noir-c)"
                  }} />
                  {coteActif === "moi" ? t("analysePiecesAdv", L) : t("analyseMesPieces", L)}
                  <span style={{ color: couleurAdv === "rouge" ? "var(--rouge-c)" : "var(--noir-c)", fontWeight: 600 }}>
                    ({couleurAdv})
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start", minHeight: 22 }}>
                  {(coupActuel?.main_adversaire || []).length > 0 ? (
                    coupActuel.main_adversaire.map((piece, i) => (
                      <MiniPieceAnalyse key={i} piece={piece} couleur={couleurAdv} />
                    ))
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--brush)", fontStyle: "italic" }}>
                      {t("analyseAucuneDonneeMain", L)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne info */}
          <div className="analyse-panneau">

            {/* Navigation */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12
            }}>
              <button onClick={precedent} disabled={indexCoup === 0}
                style={{
                  padding: "6px 14px", opacity: indexCoup === 0 ? 0.3 : 1,
                  borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)", color: "var(--texte)",
                  cursor: indexCoup === 0 ? "default" : "pointer",
                  fontSize: 16, fontFamily: "var(--titre)"
                }}>
                &larr;
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 10, color: "var(--muted)", fontFamily: "var(--titre)",
                  letterSpacing: "0.15em", textTransform: "uppercase"
                }}>{t("coupSur", L)}</div>
                <div style={{
                  fontSize: 22, fontWeight: 700, color: "var(--texte)", fontFamily: "var(--titre)"
                }}>
                  {indexCoup + 1} <span style={{ color: "var(--muted)", fontSize: 13, fontFamily: "var(--brush)" }}>/ {totalCoups}</span>
                </div>
              </div>
              <button onClick={suivant} disabled={indexCoup >= totalCoups - 1}
                style={{
                  padding: "6px 14px", opacity: indexCoup >= totalCoups - 1 ? 0.3 : 1,
                  borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)", color: "var(--texte)",
                  cursor: indexCoup >= totalCoups - 1 ? "default" : "pointer",
                  fontSize: 16, fontFamily: "var(--titre)"
                }}>
                &rarr;
              </button>
            </div>

            {/* Infos coup */}
            <div style={{
              padding: 12, borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${classifInfo.border}44`, marginBottom: 10
            }}>
              <div style={{
                fontSize: 11, color: "var(--muted)", marginBottom: 8,
                fontFamily: "var(--brush)"
              }}>
                {t("analyseTour", L)} <strong style={{ color: "var(--texte)" }}>{coupActuel?.numero_tour ?? "?"}</strong>
                {" — "}
                <span style={{
                  color: coupActuel?.couleur === "rouge" ? "var(--rouge-c)" : "var(--noir-c)",
                  fontWeight: 700, fontFamily: "var(--titre)"
                }}>
                  {coupActuel?.couleur?.toUpperCase() ?? "?"}
                </span>
              </div>

              {/* Badge classification */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "7px 12px", borderRadius: 6, marginBottom: 8,
                background: classifInfo.bg,
                border: `1px solid ${classifInfo.border}`
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: `1.5px solid ${classifInfo.text}`, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
                  color: classifInfo.text
                }}>
                  {classifInfo.mark}
                </div>
                <div>
                  <div style={{
                    fontWeight: 700, fontSize: 14, color: classifInfo.text,
                    letterSpacing: 1, fontFamily: "var(--titre)"
                  }}>{classif || "?"}</div>
                  <div style={{ fontSize: 10, color: `${classifInfo.text}aa`, fontFamily: "var(--brush)" }}>{classifInfo.labelKey ? t(classifInfo.labelKey, L) : (classif || "?")}</div>
                </div>
              </div>

              {coupActuel?.rang && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4, fontFamily: "var(--brush)" }}>
                  {t("analyseRang", L)} : <strong style={{ color: "var(--texte)" }}>{coupActuel.rang}</strong> / {coupActuel.total_coups_possibles} {t("analyseCoupsPossibles", L)}
                </div>
              )}

              {coupActuel?.scores_avant && coupActuel?.scores_apres && (
                <div style={{ display: "flex", gap: 10, fontSize: 10, marginBottom: 4, fontFamily: "var(--brush)" }}>
                  <div>
                    <span style={{ color: "var(--muted)" }}>{t("analyseAvant", L)} </span>
                    <span style={{ color: "var(--rouge-c)" }}>R:{coupActuel.scores_avant.rouge ?? 0}</span>
                    {" "}<span style={{ color: "var(--noir-c)" }}>N:{coupActuel.scores_avant.noir ?? 0}</span>
                  </div>
                  <span style={{ color: "var(--muted)" }}>&rarr;</span>
                  <div>
                    <span style={{ color: "var(--muted)" }}>{t("analyseApres", L)} </span>
                    <span style={{ color: "var(--rouge-c)" }}>R:{coupActuel.scores_apres.rouge ?? 0}</span>
                    {" "}<span style={{ color: "var(--noir-c)" }}>N:{coupActuel.scores_apres.noir ?? 0}</span>
                  </div>
                </div>
              )}

              {coupActuel?.gain_cellules > 0 && (
                <div style={{ fontSize: 10, color: "#44cc88", marginBottom: 2, fontFamily: "var(--brush)" }}>
                  +{coupActuel.gain_cellules} {t("analyseCellules", L)}
                </div>
              )}

              {coupActuel?.serie_apres > 0 && (
                <div style={{ fontSize: 10, color: "#ffaa44", marginBottom: 2, fontFamily: "var(--brush)" }}>
                  {t("analyseSerie", L)} : {coupActuel.serie_avant} &rarr; <strong>{coupActuel.serie_apres}</strong>
                </div>
              )}

              {coupActuel?.piece_forme && (
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--brush)" }}>
                  {t("analyseForme", L)} : <span style={{ color: "var(--texte)" }}>{coupActuel.piece_forme}</span>
                  {coupActuel.piece_est_elmaas && (
                    <span style={{ color: "var(--diamant)", marginLeft: 6, fontWeight: 600 }}>ELMAAS</span>
                  )}
                </div>
              )}
            </div>

            {/* Bouton meilleur coup */}
            {coupActuel?.meilleur_alternative && (
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => setShowMeilleurCoup(!showMeilleurCoup)}
                  style={{
                    padding: "10px 14px",
                    background: showMeilleurCoup ? "rgba(255,255,255,0.04)" : "rgba(102,0,204,0.15)",
                    color: "#fff", border: "1px solid rgba(153,51,255,0.4)",
                    borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    width: "100%", fontFamily: "var(--titre)", letterSpacing: "0.05em"
                  }}>
                  {showMeilleurCoup
                    ? t("analyseRetourCoup", L)
                    : t("analyseVoirMeilleur", L)}
                </button>

                {showMeilleurCoup && (
                  <div style={{
                    marginTop: 8, padding: 10,
                    background: "rgba(102,0,204,0.08)", borderRadius: 6,
                    border: "1px solid rgba(153,51,255,0.25)", fontSize: 11, fontFamily: "var(--brush)"
                  }}>
                    <div style={{
                      color: "#aa88ff", fontWeight: 600, marginBottom: 4,
                      fontFamily: "var(--titre)", letterSpacing: "0.05em"
                    }}>{t("analyseMeilleurCoupLabel", L)} :</div>
                    <div>{t("analysePiece", L)} #{(coupActuel.meilleur_alternative.piece_index ?? 0) + 1}</div>
                    <div style={{ color: "#ffaa44" }}>
                      {t("analyseOrigine", L)} : [{coupActuel.meilleur_alternative.origine?.join(", ")}]
                    </div>
                    {coupActuel.meilleur_alternative.est_elmaas && (
                      <div style={{ color: "var(--diamant)", marginTop: 4, fontWeight: 600 }}>
                        {t("analyseElmaasDisponible", L)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Progression */}
            <div style={{ marginTop: 2 }}>
              <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${totalCoups > 0 ? ((indexCoup + 1) / totalCoups) * 100 : 0}%`,
                  background: "linear-gradient(90deg,#6600cc,#4477ff)",
                  borderRadius: 1, transition: "width 0.2s"
                }} />
              </div>
              <div style={{
                marginTop: 6, fontSize: 9, color: "var(--muted)",
                textAlign: "center", fontFamily: "var(--brush)"
              }}>
                &larr; &rarr; {t("analyseNaviguer", L)}
              </div>
            </div>
          </div>
        </div>

        {/* Recapitulatif */}
        {totalCoups > 0 && (() => {
          const stats = {};
          coups.forEach(c => { stats[c.classification] = (stats[c.classification] || 0) + 1; });
          return (
            <div style={{
              marginTop: 14, padding: 12, borderRadius: 8,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{
                fontSize: 10, color: "var(--muted)", marginBottom: 8,
                fontWeight: 600, fontFamily: "var(--titre)",
                letterSpacing: "0.15em", textTransform: "uppercase"
              }}>
                {t("analyseResume", L)} — {couleurAnalysee?.toUpperCase()} — {analyseEnCours?.precision_pct ?? 0}% {t("analysePrecision", L)}
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
                      title={L === 0 ? `Aller au premier coup ${cl}` : L === 1 ? `Go to first ${cl} move` : L === 2 ? `انتقل إلى أول حركة ${cl}` : `Ir al primer movimiento ${cl}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", borderRadius: 4, cursor: "pointer",
                        background: info.bg, border: `1px solid ${info.border}`,
                        userSelect: "none"
                      }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        border: `1px solid ${info.text}`, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontFamily: "'Cinzel', serif", fontSize: 7, fontWeight: 700,
                        color: info.text
                      }}>
                        {info.mark}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "#fff",
                        fontFamily: "var(--titre)"
                      }}>{cl}</span>
                      <span style={{
                        fontSize: 9, color: "rgba(255,255,255,0.6)",
                        fontFamily: "var(--brush)"
                      }}>{count}x ({pct}%)</span>
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