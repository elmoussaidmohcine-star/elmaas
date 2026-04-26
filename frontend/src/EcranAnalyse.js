// ELMAAS — EcranAnalyse.js
// Écran qui rejoue la partie coup par coup avec classifications
// Place ce fichier dans frontend/src/EcranAnalyse.js

import { useState, useEffect } from "react";
import axios from "axios";
import Board from "./Board";
import { t, CLASSIFICATION_COUP } from "./translations";

const API = "https://elmaas-backend.onrender.com";
const COULEURS_CLASSE = {
  ELMAAS:    "#ffd700",
  ELMAASYON: "#88ff88",
  MASSY:     "#44cc44",
  NOTMESSY:  "#88aaff",
  MISSED:    "#ffaa44",
  CHESS:     "#ff4422",
};

// Descriptions des catégories de coups — sans emojis
const DESCRIPTIONS_CLASSE = {
  ELMAAS:    { symbole: "◆", titre: "ELMAAS",    desc: "Coup brillant — le meilleur possible avec un gain massif (6+ cellules ou serie 3+)" },
  ELMAASYON: { symbole: "★", titre: "ELMAASYON", desc: "Excellent coup — dans le top 3 avec un beau gain (4+ cellules)" },
  MASSY:     { symbole: "●", titre: "MASSY",     desc: "Meilleur coup objectif — optimal mais sans gain spectaculaire" },
  NOTMESSY:  { symbole: "○", titre: "NOTMESSY",  desc: "Bon coup — dans le top 5, ecart minimal avec l'optimal" },
  MISSED:    { symbole: "△", titre: "MISSED",    desc: "Occasion ratee — un meilleur coup etait disponible" },
  CHESS:     { symbole: "✕", titre: "CHESS",     desc: "Erreur grave — perte nette significative ou avantage offert a l'adversaire" },
};

function BarreLegende({ L }) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 16px",
      background: "var(--bg2)", borderRadius: 10, margin: "0 0 12px 0",
      border: "1px solid var(--bord)"
    }}>
      {Object.entries(DESCRIPTIONS_CLASSE).map(([cls, info]) => (
        <div key={cls} title={info.desc} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 20,
          border: `1.5px solid ${COULEURS_CLASSE[cls]}`,
          background: COULEURS_CLASSE[cls] + "18",
          cursor: "help", flexShrink: 0
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: COULEURS_CLASSE[cls] }}>{info.symbole}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COULEURS_CLASSE[cls] }}>{cls}</span>
        </div>
      ))}
      <div style={{ fontSize: 10, color: "var(--muted)", alignSelf: "center", marginLeft: 4 }}>
        Survolez pour la definition
      </div>
    </div>
  );
}

export default function EcranAnalyse({ partieId, couleurJoueur, mode, pixelsPhoto, taille, onFermer, L }) {
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
          { couleur: couleurJoueur, mode: mode || "rapide" },
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

        {/* Légende des catégories */}
        <BarreLegende L={L} />

        <div className="analyse-stats">
          {Object.entries(analyse.stats).map(([cls, nb]) => nb > 0 && (
            <div key={cls} className="stat-badge"
              title={DESCRIPTIONS_CLASSE[cls]?.desc}
              style={{ borderColor: COULEURS_CLASSE[cls], color: COULEURS_CLASSE[cls] }}>
              <span className="stat-nb">{nb}</span>
              <span className="stat-label">{cls}</span>
            </div>
          ))}
        </div>

        {/* Zone de lecture */}
        <div className="analyse-corps">
          <div className="analyse-plateau">
            <Board
              etat={{
                plateau: {
                  pieces: coupActuel?.plateau_avant || {},
                  puzzles: {},
                  cellules_libres: [],
                  cellules_actives: Object.keys(coupActuel?.plateau_avant || {}).map(k => k.split(",").map(Number)),
                  grille_bicolore: Array(taille).fill(null).map(() => Array(taille).fill(0))
                }
              }}
              taille={taille}
              pixelsPhoto={pixelsPhoto}
              onPoserPiece={null}
            />
          </div>

          <div className="analyse-panneau">
            <div className="analyse-coup-info">
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Coup {indexCoup + 1} / {analyse.coups.length}
              </div>

              <div className="analyse-badge-classe" style={{
                background: couleurClasse + "22",
                borderColor: couleurClasse,
                color: couleurClasse,
                display: "flex", alignItems: "center", gap: 8
              }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>{DESCRIPTIONS_CLASSE[classification]?.symbole}</span>
                <span style={{ fontWeight: 700 }}>{classification}</span>
              </div>
              <div style={{
                fontSize: 11, color: "var(--muted)", fontStyle: "italic",
                textAlign: "center", maxWidth: 220, lineHeight: 1.4
              }}>
                {DESCRIPTIONS_CLASSE[classification]?.desc}
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Tour {coupActuel?.numero_tour} — {coupActuel?.couleur}
              </div>
              {coupActuel?.evaluation?.rang > 1 && (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Rang du coup : {coupActuel.evaluation.rang}/{coupActuel.evaluation.total_coups}
                </div>
              )}
              {coupActuel?.evaluation?.gain > 0 && (
                <div style={{ fontSize: 11, color: "#88ff88" }}>
                  +{coupActuel.evaluation.gain} cellule{coupActuel.evaluation.gain > 1 ? "s" : ""} gagnee{coupActuel.evaluation.gain > 1 ? "s" : ""}
                </div>
              )}
              {coupActuel?.evaluation?.meilleur_coup && classification !== "ELMAAS" && classification !== "MASSY" && (
                <div style={{ fontSize: 11, color: "#ffaa44" }}>
                  Meilleur : piece #{coupActuel.evaluation.meilleur_coup.piece_index + 1} en ({coupActuel.evaluation.meilleur_coup.origine.join(",")})
                </div>
              )}
              {coupActuel?.evaluation?.score_optimal != null && coupActuel?.evaluation?.score_joue != null && (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Score joue : {coupActuel.evaluation.score_joue.toFixed(1)} / optimal : {coupActuel.evaluation.score_optimal.toFixed(1)}
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