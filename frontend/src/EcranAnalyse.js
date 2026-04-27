// ELMAAS — EcranAnalyse.js (CORRIGÉ)
// Analyse des DEUX joueurs avec plateau évolutif

import { useState, useEffect } from "react";
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
  const [coteActif, setCoteActif] = useState("moi"); // "moi" ou "adv"
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [etatsPlateau, setEtatsPlateau] = useState([]); // état après chaque coup

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

  // Construire l'état du plateau pour le coup actuel
  const analyse = coteActif === "moi" ? analyseMoi : analyseAdv;
  const coupActuel = analyse?.coups?.[indexCoup];

  // Reconstruire l'état du plateau à partir du snapshot
  const etatPlateau = (() => {
    if (!coupActuel?.plateau_avant) return null;
    const pieces = {};
    for (const [cle, val] of Object.entries(coupActuel.plateau_avant)) {
      pieces[cle] = val;
    }
    // Ajouter le coup actuel
    if (coupActuel.type === "poser" && coupActuel.piece_data) {
      const orig = coupActuel.origine;
      for (const [dr, dc] of coupActuel.piece_data.cellules || []) {
        const r = orig[0] + dr, c = orig[1] + dc;
        pieces[`${r},${c}`] = coupActuel.couleur;
      }
    }
    return {
      plateau: {
        pieces,
        puzzles: {}, // simplifié
        cellules_libres: [],
        cellules_actives: Object.keys(pieces),
        grille_bicolore: Array(taille).fill().map(() => Array(taille).fill(0))
      }
    };
  })();

  const precedent = () => setIndexCoup(Math.max(0, indexCoup - 1));
  const suivant = () => setIndexCoup(Math.min((analyse?.coups.length || 1) - 1, indexCoup + 1));

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

  const analyseCourante = coteActif === "moi" ? analyseMoi : analyseAdv;
  const precision = analyseCourante?.precision_pct ?? 0;
  const stats = analyseCourante?.stats || {};
  const classification = coupActuel?.evaluation?.classification;
  const couleurClasse = COULEURS_CLASSE[classification] || "var(--muted)";
  const couleurLabel = coteActif === "moi" ? couleurJoueur : (couleurJoueur === "rouge" ? "noir" : "rouge");

  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">
        {/* Header */}
        <div className="analyse-header">
          <div className="analyse-titre">{t("analyseTitre", L)} — {couleurLabel.toUpperCase()}</div>
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

        {/* Zone de lecture */}
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
            </div>

            <div className="analyse-navigation">
              <button className="popup-btn" onClick={precedent} disabled={indexCoup === 0}>◄ Précédent</button>
              <button className="popup-btn" onClick={suivant} disabled={indexCoup >= (analyseCourante?.coups.length || 1) - 1}>Suivant ►</button>
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
