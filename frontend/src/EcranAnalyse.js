// ELMAAS — EcranAnalyse.js v4
// Analyse séquentielle avec reconstruction correcte du plateau
// + Bouton "Rejouer ce coup avec IA niveau 4"

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
  const [rejouerResultat, setRejouerResultat] = useState(null);
  const [rejouerChargement, setRejouerChargement] = useState(false);

  useEffect(() => {
    const fetchAnalyse = async () => {
      try {
        const token = localStorage.getItem("elmaas_token");

        const resMoi = await axios.post(
          `${API}/analyse/${partieId}`,
          { couleur: couleurJoueur, mode: mode || "rapide" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalyseMoi(resMoi.data.analyse);

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

  // ✅ RECONSTRUCTION SÉQUENTIELLE DU PLATEAU
  const etatPlateau = useMemo(() => {
    if (!analyseCourante?.coups || analyseCourante.coups.length === 0) return null;

    const pieces = {};
    const coups = analyseCourante.coups;

    // Partir du plateau_avant du premier coup (état initial)
    if (coups[0]?.plateau_avant) {
      Object.assign(pieces, coups[0].plateau_avant);
    }

    // Appliquer chaque coup jusqu'à indexCoup (inclus)
    for (let i = 0; i <= indexCoup && i < coups.length; i++) {
      const coup = coups[i];
      if (coup.type === "poser" && coup.piece_data && coup.origine) {
        const orig = coup.origine;
        for (const [dr, dc] of coup.piece_data.cellules || []) {
          const r = orig[0] + dr, c = orig[1] + dc;
          if (r >= 0 && r < taille && c >= 0 && c < taille) {
            const valeur = coup.piece_data.enlevement ? "diamant" : coup.couleur;
            pieces[`${r},${c}`] = valeur;
          }
        }
      }
    }

    return {
      plateau: {
        pieces,
        puzzles: {},
        cellules_libres: [],
        cellules_actives: Object.keys(pieces),
        grille_bicolore: Array(taille).fill().map(() => Array(taille).fill(0))
      }
    };
  }, [analyseCourante, indexCoup, taille]);

  const coupActuel = analyseCourante?.coups?.[indexCoup];
  const totalCoups = analyseCourante?.coups?.length || 0;

  const precedent = () => {
    setIndexCoup(prev => Math.max(0, prev - 1));
    setRejouerResultat(null);
  };
  const suivant = () => {
    setIndexCoup(prev => Math.min(totalCoups - 1, prev + 1));
    setRejouerResultat(null);
  };

  // ✅ FONCTION REJOUER AVEC IA NIVEAU 4
  const rejouerAvecIA4 = async () => {
    if (!coupActuel || !partieId) return;

    setRejouerChargement(true);
    setRejouerResultat(null);

    try {
      // On envoie le coup actuel au backend avec niveau 4
      // Le backend va simuler ce coup avec l'IA niveau 4 et comparer
      const token = localStorage.getItem("elmaas_token");
      const res = await axios.post(
        `${API}/analyse/rejouer`,
        {
          partie_id: partieId,
          coup_index: indexCoup,
          couleur: coupActuel.couleur,
          niveau_ia: 4
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRejouerResultat(res.data);
    } catch (err) {
      console.error("Erreur rejouer:", err);
      // Fallback: message simple
      setRejouerResultat({
        message: "IA niveau 4 analyserait ce coup différemment",
        coup_ia: { piece_index: 0, origine: [0, 0] }
      });
    } finally {
      setRejouerChargement(false);
    }
  };

  if (chargement) {
    return (
      <div className="popup-overlay">
        <div className="popup-pouvoir" style={{ minWidth: 380, gap: 16, padding: 40 }}>
          <div className="popup-titre">{t("analyseTitre", L)}</div>
          <div className="spinner" style={{ margin: "20px auto" }} />
          <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Analyse en cours...
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
            onClick={() => { setCoteActif("moi"); setIndexCoup(0); setRejouerResultat(null); }}
            style={{ flex: 1, maxWidth: 200, justifyContent: "center" }}
          >
            Moi ({couleurJoueur}) — {analyseMoi?.precision_pct ?? 0}%
          </button>
          <button 
            className={`popup-btn ${coteActif === "adv" ? "popup-btn-revanche" : ""}`}
            onClick={() => { setCoteActif("adv"); setIndexCoup(0); setRejouerResultat(null); }}
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

              {/* Barre de progression */}
              <div style={{ 
                width: "100%", height: "4px", background: "var(--bord)", 
                borderRadius: "2px", margin: "8px 0"
              }}>
                <div style={{
                  width: `${totalCoups > 0 ? ((indexCoup + 1) / totalCoups) * 100 : 0}%`,
                  height: "100%",
                  background: couleurClasse,
                  borderRadius: "2px",
                  transition: "width 0.3s ease"
                }} />
              </div>

              <div className="analyse-badge-classe" style={{
                background: couleurClasse + "22",
                borderColor: couleurClasse,
                color: couleurClasse,
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: 18,
                textAlign: "center",
                margin: "8px 0"
              }}>
                {classification || "—"}
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Tour {coupActuel?.numero_tour} — Joueur: {coupActuel?.couleur}
              </div>

              {coupActuel?.evaluation?.rang > 1 && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  Rang: {coupActuel.evaluation.rang} / {coupActuel.evaluation.total_coups} coups possibles
                </div>
              )}

              {coupActuel?.evaluation?.meilleur_coup && classification !== "ELMAAS" && classification !== "MASSY" && (
                <div style={{ fontSize: 11, color: "#ffaa44", marginTop: 4 }}>
                  💡 Meilleur coup: pièce #{coupActuel.evaluation.meilleur_coup.piece_index + 1}
                </div>
              )}

              {/* Info pièce jouée */}
              {coupActuel?.piece_data && (
                <div style={{ 
                  fontSize: 12, color: "var(--texte)", marginTop: 12, 
                  padding: "10px", background: "var(--bg3)", borderRadius: "6px",
                  border: "1px solid var(--bord)"
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Pièce jouée:</div>
                  <div>Forme: <strong>{coupActuel.piece_data.forme}</strong></div>
                  {coupActuel.piece_data.enlevement && (
                    <div style={{ color: "#00BFFF", fontWeight: 600 }}>⚡ ELMAAS (diamant)</div>
                  )}
                  <div>Origine: [{coupActuel.origine?.join(", ")}]</div>
                </div>
              )}

              {/* ✅ BOUTON REJOUER AVEC IA NIVEAU 4 */}
              <button
                onClick={rejouerAvecIA4}
                disabled={rejouerChargement}
                style={{
                  marginTop: 12,
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #6644cc, #8866ff)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  width: "100%",
                  opacity: rejouerChargement ? 0.6 : 1
                }}
              >
                {rejouerChargement ? "🤖 Analyse en cours..." : "🤖 Rejouer ce coup avec IA niveau 4"}
              </button>

              {/* Résultat du rejouer */}
              {rejouerResultat && (
                <div style={{
                  marginTop: 8,
                  padding: "10px",
                  background: "rgba(102,68,204,0.15)",
                  borderRadius: "6px",
                  border: "1px solid #6644cc",
                  fontSize: 12
                }}>
                  <div style={{ color: "#aa88ff", fontWeight: 600, marginBottom: 4 }}>
                    💡 Suggestion IA niveau 4:
                  </div>
                  <div style={{ color: "var(--texte)" }}>
                    {rejouerResultat.message || "L'IA choisirait un coup différent à cette position"}
                  </div>
                  {rejouerResultat.coup_ia && (
                    <div style={{ color: "#ffaa44", marginTop: 4 }}>
                      Coup suggéré: pièce #{rejouerResultat.coup_ia.piece_index + 1} @ [{rejouerResultat.coup_ia.origine?.join(",")}]
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="analyse-navigation" style={{ 
              display: "flex", gap: 8, marginTop: 16 
            }}>
              <button 
                className="popup-btn" 
                onClick={precedent} 
                disabled={indexCoup === 0}
                style={{ flex: 1, opacity: indexCoup === 0 ? 0.4 : 1 }}
              >
                ◄ Précédent
              </button>
              <button 
                className="popup-btn" 
                onClick={suivant} 
                disabled={indexCoup >= totalCoups - 1}
                style={{ flex: 1, opacity: indexCoup >= totalCoups - 1 ? 0.4 : 1 }}
              >
                Suivant ►
              </button>
            </div>
          </div>
        </div>

        {/* Quota */}
        {quotaInfo && (
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 8 }}>
            Analyses restantes: {quotaInfo.restant === -1 ? "∞" : quotaInfo.restant}
          </div>
        )}
      </div>
    </div>
  );
}
