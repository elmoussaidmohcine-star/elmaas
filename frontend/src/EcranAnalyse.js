// ELMAAS — EcranAnalyse.js v2 CORRIGÉ
// Analyse séquentielle avec reconstruction correcte du plateau

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Board from "./Board";
import { t, getSloganAnalyse } from "./translations";

const API = "https://elmaas-backend.onrender.com";
const COULEURS_CLASSE = {
  ELMAAS:    "#ffd700",
  ELMAASYON: "#88ff88",
  MASSY:     "#44cc44",
  NOTMESSY:  "#88aaff",
  MISSED:    "#ffaa44",
  CHESS:     "#ff4422",
};

export default function EcranAnalyse({ partieId, couleurJoueur, mode, pixelsPhoto, taille, onFermer, L }) {
  const [analyseMoi, setAnalyseMoi] = useState(null);
  const [analyseAdv, setAnalyseAdv] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [indexCoup, setIndexCoup] = useState(0);
  const [coteActif, setCoteActif] = useState("moi");
  const [quotaInfo, setQuotaInfo] = useState(null);

  useEffect(() => {
    const fetchAnalyse = async () => {
      try {
        const token = localStorage.getItem("elmaas_token");

        // Analyse MOI
        const resMoi = await axios.post(
          `${API}/analyse/${partieId}`,
          { couleur: couleurJoueur, mode: mode || "rapide" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalyseMoi(resMoi.data.analyse);

        // Analyse ADVERSAIRE (couleur opposée)
        const couleurAdv = couleurJoueur === "rouge" ? "noir" : "rouge";
        const resAdv = await axios.post(
          `${API}/analyse/${partieId}`,
          { couleur: couleurAdv, mode: mode || "rapide" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalyseAdv(resAdv.data.analyse);

        setQuotaInfo({
          restant: resMoi.data.quota_restant,
          plan: resMoi.data.plan
        });
      } catch (err) {
        if (err.response?.status === 429) {
          setErreur({ type: "quota", message: err.response.data.erreur });
        } else if (err.response?.status === 401) {
          setErreur({ type: "auth", message: "Connexion requise" });
        } else {
          setErreur({ type: "generic", message: err.response?.data?.erreur || "Erreur d'analyse" });
        }
      } finally {
        setChargement(false);
      }
    };
    fetchAnalyse();
  }, [partieId, couleurJoueur, mode]);

  const analyseCourante = coteActif === "moi" ? analyseMoi : analyseAdv;
  const couleurAnalysee = coteActif === "moi" ? couleurJoueur : (couleurJoueur === "rouge" ? "noir" : "rouge");

  // ✅ CORRECTION: Reconstruction séquentielle du plateau
  // On applique tous les coups jusqu'à indexCoup pour reconstruire l'état
  const etatPlateau = useMemo(() => {
    if (!analyseCourante?.coups || analyseCourante.coups.length === 0) return null;

    const pieces = {};
    const coupsJusquaIndex = analyseCourante.coups.slice(0, indexCoup + 1);

    // Reconstruire en appliquant chaque coup séquentiellement
    for (const coup of coupsJusquaIndex) {
      if (coup.type === "poser" && coup.piece_data && coup.origine) {
        const orig = coup.origine;
        for (const [dr, dc] of coup.piece_data.cellules || []) {
          const r = orig[0] + dr, c = orig[1] + dc;
          if (r >= 0 && r < taille && c >= 0 && c < taille) {
            // Si c'est une pièce d'enlèvement (ELMAAS), on met "diamant"
            // Sinon on met la couleur du joueur
            const valeur = coup.piece_data.enlevement ? "diamant" : coup.couleur;
            pieces[`${r},${c}`] = valeur;
          }
        }
      } else if (coup.type === "repiocher") {
        // Le repiocher ne change pas le plateau
      }
      // Note: les pouvoirs (échange, extraction) sont appliqués côté serveur
      // et reflétés dans les coups suivants
    }

    return {
      plateau: {
        pieces,
        puzzles: {}, // simplifié - on ne reconstruit pas les puzzles pour l'affichage
        cellules_libres: [],
        cellules_actives: Object.keys(pieces),
        grille_bicolore: Array(taille).fill().map(() => Array(taille).fill(0))
      }
    };
  }, [analyseCourante, indexCoup, taille]);

  const coupActuel = analyseCourante?.coups?.[indexCoup];
  const precedent = () => setIndexCoup(Math.max(0, indexCoup - 1));
  const suivant = () => setIndexCoup(Math.min((analyseCourante?.coups.length || 1) - 1, indexCoup + 1));

  if (chargement) {
    return (
      <div className="popup-overlay">
        <div className="popup-pouvoir" style={{ minWidth: 380, gap: 16, padding: 40 }}>
          <div className="popup-titre">{t("analyseTitre", L)}</div>
          <div className="spinner" style={{ margin: "20px auto" }} />
          <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Analyse en cours... (peut prendre quelques minutes)
          </div>
          <div style={{ fontSize: 11, fontStyle: "italic", color: "var(--muted)", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
            {getSloganAnalyse(L || 0)}
          </div>
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="popup-overlay" onClick={onFermer}>
        <div className="popup-pouvoir" onClick={e => e.stopPropagation()}>
          <div className="popup-titre">{t("analyseTitre", L)}</div>
          <div className="popup-sous-titre">
            {erreur.type === "quota" ? t("analyseQuotaAtteint", L) : erreur.message}
          </div>
          <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
        </div>
      </div>
    );
  }

  const precision = analyseCourante?.precision_pct ?? 0;
  const stats = analyseCourante?.stats || {};
  const classification = coupActuel?.evaluation?.classification;
  const couleurClasse = COULEURS_CLASSE[classification] || "var(--muted)";

  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">
        {/* Header */}
        <div className="analyse-header">
          <div className="analyse-titre">{t("analyseTitre", L)} — {couleurAnalysee.toUpperCase()}</div>
          <div className="analyse-precision">
            {precision}% <small>précision</small>
          </div>
          <button className="btn-reset" onClick={onFermer}>{t("fermer", L)}</button>
        </div>

        {/* Switch joueur */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "8px" }}>
          <button 
            className={`popup-btn ${coteActif === "moi" ? "popup-btn-revanche" : ""}`}
            onClick={() => { setCoteActif("moi"); setIndexCoup(0); }}
            style={{ flex: 1, maxWidth: 200, justifyContent: "center" }}
          >
            Moi ({couleurJoueur}) — {analyseMoi?.precision_pct ?? 0}%
          </button>
          <button 
            className={`popup-btn ${coteActif === "adv" ? "popup-btn-revanche" : ""}`}
            onClick={() => { setCoteActif("adv"); setIndexCoup(0); }}
            style={{ flex: 1, maxWidth: 200, justifyContent: "center" }}
          >
            Adversaire ({couleurJoueur === "rouge" ? "noir" : "rouge"}) — {analyseAdv?.precision_pct ?? 0}%
          </button>
        </div>

        {/* Stats */}
        <div className="analyse-stats">
          {Object.entries(stats).map(([cls, nb]) => nb > 0 && (
            <div key={cls} className="stat-badge" style={{ borderColor: COULEURS_CLASSE[cls], color: COULEURS_CLASSE[cls] }}>
              <span className="stat-nb">{nb}</span>
              <span className="stat-label">{cls}</span>
            </div>
          ))}
        </div>

        {/* ✅ Zone de lecture - Plateau évolutif */}
        <div className="analyse-corps">
          <div className="analyse-plateau">
            {etatPlateau ? (
              <Board
                etat={etatPlateau}
                taille={taille}
                pixelsPhoto={pixelsPhoto}
                onPoserPiece={null}
              />
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center" }}>Chargement du plateau...</div>
            )}
          </div>

          <div className="analyse-panneau">
            <div className="analyse-coup-info">
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Coup {indexCoup + 1} / {analyseCourante?.coups.length || 0}
              </div>
              <div className="analyse-badge-classe" style={{
                background: couleurClasse + "22",
                borderColor: couleurClasse,
                color: couleurClasse
              }}>
                {classification || "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Tour {coupActuel?.numero_tour} — {coupActuel?.couleur}
              </div>
              {coupActuel?.evaluation?.rang > 1 && (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Rang : {coupActuel.evaluation.rang}/{coupActuel.evaluation.total_coups}
                </div>
              )}
              {coupActuel?.evaluation?.meilleur_coup && classification !== "ELMAAS" && classification !== "MASSY" && (
                <div style={{ fontSize: 11, color: "#ffaa44" }}>
                  Meilleur : pièce #{coupActuel.evaluation.meilleur_coup.piece_index + 1}
                </div>
              )}

              {/* ✅ Info sur la pièce jouée */}
              {coupActuel?.piece_data && (
                <div style={{ fontSize: 11, color: "var(--texte)", marginTop: 8, padding: "6px", background: "var(--bg3)", borderRadius: "4px" }}>
                  <div>Forme: <strong>{coupActuel.piece_data.forme}</strong></div>
                  {coupActuel.piece_data.enlevement && (
                    <div style={{ color: "#00BFFF" }}>⚡ ELMAAS (diamant)</div>
                  )}
                  <div>Origine: [{coupActuel.origine?.join(", ")}]</div>
                </div>
              )}
            </div>

            <div className="analyse-navigation">
              <button className="popup-btn" onClick={precedent} disabled={indexCoup === 0}>◄ Précédent</button>
              <button className="popup-btn" onClick={suivant} disabled={indexCoup >= (analyseCourante?.coups.length || 1) - 1}>Suivant ►</button>
            </div>

            {/* ✅ Barre de progression */}
            <div style={{ width: "100%", height: "4px", background: "var(--bord)", borderRadius: "2px", marginTop: "8px" }}>
              <div style={{
                width: `${((indexCoup + 1) / (analyseCourante?.coups.length || 1)) * 100}%`,
                height: "100%",
                background: couleurClasse,
                borderRadius: "2px",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>
        </div>

        {/* Quota */}
        {quotaInfo && (
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 8 }}>
            Analyses restantes : {quotaInfo.restant === -1 ? "∞" : quotaInfo.restant}
          </div>
        )}
      </div>
    </div>
  );
}
