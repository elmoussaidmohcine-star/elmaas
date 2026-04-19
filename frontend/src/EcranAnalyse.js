// ELMAAS — EcranAnalyse.js
// Écran qui rejoue la partie coup par coup avec classifications
// Place ce fichier dans frontend/src/EcranAnalyse.js

import { useState, useEffect } from "react";
import axios from "axios";
import Board from "./Board";
import { t, CLASSIFICATION_COUP } from "./translations";

const API = "https://elmaas.up.railway.app";
const COULEURS_CLASSE = {
  ELMAAS:    "#ffd700",
  ELMAASYON: "#88ff88",
  MASSY:     "#44cc44",
  NOTMESSY:  "#88aaff",
  MISSED:    "#ffaa44",
  CHESS:     "#ff4422",
};

export default function EcranAnalyse({ partieId, couleurJoueur, pixelsPhoto, taille, onFermer, L }) {
  const [analyse, setAnalyse] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [indexCoup, setIndexCoup] = useState(0);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [coupActuel, setCoupActuel] = useState(null);
  const [modeRetenter, setModeRetenter] = useState(false);

  useEffect(() => {
    const fetchAnalyse = async () => {
      try {
        const token = localStorage.getItem("elmaas_token");
        const res = await axios.post(
          `${API}/analyse/${partieId}`,
          { couleur: couleurJoueur },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalyse(res.data.analyse);
        setQuotaInfo({
          restant: res.data.quota_restant,
          plan: res.data.plan
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
  }, [partieId, couleurJoueur]);

  useEffect(() => {
    if (analyse && analyse.coups[indexCoup]) {
      setCoupActuel(analyse.coups[indexCoup]);
    }
  }, [analyse, indexCoup]);

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

  if (!analyse || !analyse.coups.length) {
    return (
      <div className="popup-overlay" onClick={onFermer}>
        <div className="popup-pouvoir" onClick={e => e.stopPropagation()}>
          <div className="popup-titre">{t("analyseTitre", L)}</div>
          <div style={{ color: "var(--muted)" }}>Aucun coup à analyser.</div>
          <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
        </div>
      </div>
    );
  }

  const classification = coupActuel?.evaluation?.classification;
  const couleurClasse = COULEURS_CLASSE[classification] || "var(--muted)";
  if (showAnalyse) {
      return (
        <EcranAnalyse
          partieId={partieId}
          couleurJoueur={monRole === "joueur2" ? "noir" : "rouge"}
          pixelsPhoto={pixelsPhoto}
          taille={taille}
          L={L}
          onFermer={() => setShowAnalyse(false)}
        />
      );
    }
  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">
        {/* Header */}
        <div className="analyse-header">
          <div className="analyse-titre">{t("analyseTitre", L)}</div>
          <div className="analyse-precision">
            {analyse.precision_pct}% <small>précision</small>
          </div>
          <button className="btn-reset" onClick={onFermer}>{t("fermer", L)}</button>
        </div>

        {/* Stats récapitulatives */}
        <div className="analyse-stats">
          {Object.entries(analyse.stats).map(([cls, nb]) => nb > 0 && (
            <div key={cls} className="stat-badge" style={{ borderColor: COULEURS_CLASSE[cls], color: COULEURS_CLASSE[cls] }}>
              <span className="stat-nb">{nb}</span>
              <span className="stat-label">{cls}</span>
            </div>
          ))}
        </div>

        {/* Zone de lecture */}
        <div className="analyse-corps">
          <div className="analyse-plateau">
            <Board
              etat={{ plateau: { pieces: {}, puzzles: {}, cellules_libres: [], cellules_actives: [], grille_bicolore: Array(taille).fill().map(() => Array(taille).fill(0)) } }}
              taille={taille}
              pixelsPhoto={pixelsPhoto}
              onPoserPiece={null}
            />
          </div>

          <div className="analyse-panneau">
            <div className="analyse-coup-info">
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {t("coupSur", L)} {indexCoup + 1} / {analyse.coups.length}
              </div>
              <div className="analyse-badge-classe" style={{
                background: couleurClasse + "22",
                borderColor: couleurClasse,
                color: couleurClasse
              }}>
                {classification}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Tour {coupActuel?.numero_tour} — {coupActuel?.couleur}
              </div>
              {coupActuel?.evaluation?.rang > 1 && (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Rang du coup : {coupActuel.evaluation.rang}/{coupActuel.evaluation.total_coups}
                </div>
              )}
              {coupActuel?.evaluation?.meilleur_coup && classification !== "ELMAAS" && classification !== "MASSY" && (
                <div style={{ fontSize: 11, color: "#ffaa44" }}>
                  Meilleur : pièce #{coupActuel.evaluation.meilleur_coup.piece_index + 1} en ({coupActuel.evaluation.meilleur_coup.origine.join(",")})
                </div>
              )}
            </div>

            <div className="analyse-navigation">
              <button className="popup-btn" onClick={precedent} disabled={indexCoup === 0}>◄</button>
              <button className="popup-btn" onClick={suivant} disabled={indexCoup >= analyse.coups.length - 1}>►</button>
            </div>

            <button className="popup-btn popup-btn-revanche"
              onClick={() => setModeRetenter(true)}
              style={{ marginTop: 12 }}>
              {t("rejouerCoup", L)}
            </button>
          </div>
        </div>

        {/* Quota */}
        {quotaInfo && quotaInfo.restant >= 0 && (
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 8 }}>
            Analyses restantes aujourd'hui : {quotaInfo.restant} ({quotaInfo.plan})
          </div>
        )}

        {modeRetenter && (
          <div className="popup-overlay" onClick={() => setModeRetenter(false)}>
            <div className="popup-pouvoir" onClick={e => e.stopPropagation()}>
              <div className="popup-titre">Rejouer ce coup</div>
              <div className="popup-sous-titre">
                Reprendre la partie à partir du coup {indexCoup + 1} contre l'IA Expert ?
              </div>
              <div className="popup-options" style={{ flexDirection: "row", gap: 10 }}>
                <button className="popup-btn popup-btn-revanche" style={{ flex: 1 }}
                  onClick={() => {
                    // TODO : endpoint backend pour recréer partie à ce point
                    // Pour l'instant : placeholder
                    alert("Fonctionnalité en cours d'implémentation — le frontend est prêt.");
                    setModeRetenter(false);
                  }}>
                  Oui, jouer
                </button>
                <button className="popup-btn" style={{ flex: 1 }} onClick={() => setModeRetenter(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
