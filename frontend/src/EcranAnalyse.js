import { useState, useEffect, useMemo, useCallback } from "react";
import Board from "./Board";

const taille = 14;

// ─── Thème adaptatif ───
const getTheme = () => {
  const mode = localStorage.getItem("theme") || "dark";
  return mode === "light"
    ? { bg1: "#fff", bg2: "#f5f5f5", bg3: "#eee", text: "#111", bord: "#ddd", rouge: "#D32F2F", vert: "#2E7D32", bleu: "#1565C0" }
    : { bg1: "#1a1a2e", bg2: "#16213e", bg3: "#0f3460", text: "#eee", bord: "#444", rouge: "#ff4444", vert: "#44ff88", bleu: "#4488ff" };
};

export default function EcranAnalyse({
  analyseJoueur,
  analyseAdv,
  couleurJoueur,
  onFermer,
  L = 0,
  pixelsPhoto,
  modeCouleur = false,
}) {
  const theme = useMemo(getTheme, []);
  const [coteActif, setCoteActif] = useState("moi");
  const [indexCoup, setIndexCoup] = useState(0);
  const [showMeilleurCoup, setShowMeilleurCoup] = useState(false);
  const [chargement, setChargement] = useState(false);

  const analyseMoi = coteActif === "moi" ? analyseJoueur : analyseAdv;
  const analyseEnCours = analyseMoi;
  const coups = analyseEnCours?.coups || [];
  const totalCoups = coups.length;

  // ─── Données du coup actuel ───
  const coupActuel = useMemo(() => {
    if (!coups || coups.length === 0) return null;
    return coups[indexCoup] || null;
  }, [coups, indexCoup]);

  const couleurAnalysee = coteActif === "moi" ? couleurJoueur : (couleurJoueur === "rouge" ? "noir" : "rouge");

  // ─── Reconstruire le plateau APRÈS le coup ───
  const buildEtatPlateau = useCallback((pieces, puzzlesData = {}, numeroTour = 0) => {
    if (!pieces || typeof pieces !== "object") return null;
    const piecesClone = { ...pieces };
    const cellulesActives = Object.entries(piecesClone)
      .filter(([k, v]) => v != null)
      .map(([k]) => k.split(",").map(Number));

    // Convertir puzzlesData en dict pour Board
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

  // PLATEAU APRÈS le coup (avec puzzles)
  const etatPlateau = useMemo(() => {
    if (!coupActuel?.plateau_apres) return null;
    return buildEtatPlateau(coupActuel.plateau_apres, coupActuel.puzzles_apres, coupActuel.numero_tour);
  }, [coupActuel, buildEtatPlateau, indexCoup]);

  // PLATEAU DU MEILLEUR COUP (marqueur sur plateau avant + puzzles)
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

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") precedent();
      if (e.key === "ArrowRight") suivant();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [precedent, suivant]);

  // ─── Rendu ───
  if (!analyseJoueur && !analyseAdv) {
    return (
      <div className="ecran-analyse-overlay">
        <div className="ecran-analyse" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <div style={{ color: "var(--muted)", fontSize: 15, textAlign: "center" }}>
            Aucune donnée d'analyse disponible.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: "var(--texte)" }}>
            {L === 0 ? "Analyse de partie" : L === 1 ? "Game Analysis" : L === 2 ? "تحليل اللعبة" : "Análisis de partida"}
          </h2>
          <button onClick={onFermer} style={{ fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Onglets joueurs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => { setCoteActif("moi"); setIndexCoup(0); setShowMeilleurCoup(false); }}
            style={{
              flex: 1, padding: 10,
              background: coteActif === "moi" ? "var(--rouge-c)" : "var(--bg2)",
              color: coteActif === "moi" ? "#fff" : "var(--texte)",
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600
            }}
          >
            {couleurJoueur === "rouge" ? "● Rouge" : "○ Noir"} ({analyseJoueur?.precision_pct ?? 0}%)
          </button>
          <button
            onClick={() => { setCoteActif("adversaire"); setIndexCoup(0); setShowMeilleurCoup(false); }}
            style={{
              flex: 1, padding: 10,
              background: coteActif === "adversaire" ? "var(--rouge-c)" : "var(--bg2)",
              color: coteActif === "adversaire" ? "#fff" : "var(--texte)",
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600
            }}
          >
            {couleurJoueur === "rouge" ? "○ Noir" : "● Rouge"} ({analyseAdv?.precision_pct ?? 0}%)
          </button>
        </div>

        {/* Zone de lecture */}
        <div className="analyse-corps">
          <div className="analyse-plateau">
            {showMeilleurCoup && etatPlateauMeilleur ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: "#aa88ff", fontWeight: 600 }}>
                  {L === 0 ? "Meilleur coup possible" : "Best possible move"}
                </div>
                <Board
                  etat={etatPlateauMeilleur}
                  taille={taille}
                  pixelsPhoto={pixelsPhoto}
                  couleurJoueur={couleurAnalysee}
                  onPoserPiece={null}
                  modeCouleur={modeCouleur}
                />
              </div>
            ) : etatPlateau ? (
              <Board
                etat={etatPlateau}
                taille={taille}
                pixelsPhoto={pixelsPhoto}
                couleurJoueur={couleurAnalysee}
                onPoserPiece={null}
                modeCouleur={modeCouleur}
              />
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
                Chargement du plateau...
              </div>
            )}
          </div>

          <div className="analyse-panneau">
            <div className="analyse-coup-info">
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Coup {indexCoup + 1} / {totalCoups}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: coupActuel?.couleur === "rouge" ? "var(--rouge-c)" : "#aaaaaa" }}>
                {coupActuel?.couleur === "rouge" ? "ROUGE" : "NOIR"} — Tour {coupActuel?.numero_tour ?? "?"}
              </div>
              <div style={{
                display: "inline-block", marginTop: 8, padding: "4px 12px", borderRadius: 6,
                background: coupActuel?.classification === "ELMAAS" ? "#FFD700" :
                             coupActuel?.classification === "ELMAASYON" ? "#C0C0C0" :
                             coupActuel?.classification === "MASSY" ? "#CD7F32" :
                             coupActuel?.classification === "NOTMESSY" ? "#2E7D32" :
                             coupActuel?.classification === "MISSED" ? "#F9A825" :
                             coupActuel?.classification === "CHESS" ? "#E65100" : "#B71C1C",
                color: ["ELMAAS", "ELMAASYON"].includes(coupActuel?.classification) ? "#000" : "#fff",
                fontWeight: 700, fontSize: 13
              }}>
                {coupActuel?.classification || "?"}
              </div>
              {coupActuel?.rang && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  Rang: {coupActuel.rang} / {coupActuel.total_coups_possibles} coups possibles
                </div>
              )}
            </div>

            {/* Bouton meilleur coup */}
            {coupActuel?.meilleur_alternative && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setShowMeilleurCoup(!showMeilleurCoup)}
                  style={{
                    padding: "10px 16px",
                    background: showMeilleurCoup ? "var(--bg3)" : "linear-gradient(135deg, #6644cc, #8866ff)",
                    color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                    fontSize: 14, fontWeight: 600, width: "100%"
                  }}
                >
                  {showMeilleurCoup ? "Cacher" : "Voir le meilleur coup"}
                </button>

                {showMeilleurCoup && (
                  <div style={{ marginTop: 8, padding: 10, background: "rgba(102,68,204,0.15)", borderRadius: 6, border: "1px solid #6644cc", fontSize: 12 }}>
                    <div style={{ color: "#aa88ff", fontWeight: 600, marginBottom: 4 }}>Meilleur coup:</div>
                    <div>Piece #{coupActuel.meilleur_alternative.piece_index + 1}</div>
                    <div style={{ color: "#ffaa44" }}>Origine: [{coupActuel.meilleur_alternative.origine?.join(",")}]</div>
                    {coupActuel.meilleur_alternative.est_elmaas && (
                      <div style={{ color: "#00BFFF" }}>ELMAAS</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={precedent} disabled={indexCoup === 0} style={{ flex: 1, opacity: indexCoup === 0 ? 0.4 : 1 }}>◄ Précédent</button>
              <button onClick={suivant} disabled={indexCoup >= totalCoups - 1} style={{ flex: 1, opacity: indexCoup >= totalCoups - 1 ? 0.4 : 1 }}>Suivant ►</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
