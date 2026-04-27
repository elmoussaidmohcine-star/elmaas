// ELMAAS — EcranAnalyse.js
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Board from "./Board";
import { t } from "./translations";

const API = "https://elmaas.up.railway.app";

const COULEURS_CLASSE = {
  ELMAAS:    "#ffd700",
  ELMAASYON: "#88ff88",
  MASSY:     "#44cc44",
  NOTMESSY:  "#88aaff",
  MISSED:    "#ffaa44",
  CHESS:     "#ff4422",
};

const DESCRIPTIONS_CLASSE = {
  ELMAAS:    { symbole: "◆", desc: "Coup brillant — le meilleur possible avec gain fort" },
  ELMAASYON: { symbole: "★", desc: "Excellent coup — top 3 avec bon gain" },
  MASSY:     { symbole: "●", desc: "Meilleur coup objectif" },
  NOTMESSY:  { symbole: "○", desc: "Bon coup — ecart minimal avec l'optimal" },
  MISSED:    { symbole: "△", desc: "Occasion ratee" },
  CHESS:     { symbole: "✕", desc: "Erreur grave — perte nette significative" },
};

export default function EcranAnalyse({ partieId, couleurJoueur, mode, pixelsPhoto, taille, onFermer, L }) {
  const [analyse, setAnalyse]       = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur]         = useState(null);
  const [indexCoup, setIndexCoup]   = useState(0);
  const [quotaInfo, setQuotaInfo]   = useState(null);
  const [filtre, setFiltre]         = useState("tous"); // "tous" | "moi" | "adversaire"

  // Charger l'analyse (toutes les couleurs)
  useEffect(() => {
    const fetchAnalyse = async () => {
      try {
        const token = localStorage.getItem("elmaas_token");
        const res = await axios.post(
          `${API}/analyse/${partieId}`,
          { couleur: null, mode: mode || "rapide" }, // null = toutes les couleurs
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalyse(res.data.analyse);
        setQuotaInfo({ restant: res.data.quota_restant, plan: res.data.plan });
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
  }, [partieId]);

  // Coups filtrés selon le sélecteur
  const coupsFiltres = useMemo(() => {
    if (!analyse?.coups) return [];
    if (filtre === "moi")        return analyse.coups.filter(c => c.couleur === couleurJoueur);
    if (filtre === "adversaire") return analyse.coups.filter(c => c.couleur !== couleurJoueur);
    return analyse.coups;
  }, [analyse, filtre, couleurJoueur]);

  // Stats filtrées
  const statsFiltrees = useMemo(() => {
    const s = { ELMAAS: 0, ELMAASYON: 0, MASSY: 0, NOTMESSY: 0, MISSED: 0, CHESS: 0 };
    coupsFiltres.forEach(c => {
      const cls = c.evaluation?.classification;
      if (cls && s[cls] !== undefined) s[cls]++;
    });
    return s;
  }, [coupsFiltres]);

  // Précision filtrée
  const precisionFiltree = useMemo(() => {
    const total = Object.values(statsFiltrees).reduce((a, b) => a + b, 0);
    if (!total) return 0;
    const poids = { ELMAAS: 100, ELMAASYON: 90, MASSY: 85, NOTMESSY: 70, MISSED: 40, CHESS: 15 };
    return (Object.entries(statsFiltrees).reduce((acc, [k, v]) => acc + (poids[k] || 0) * v, 0) / total).toFixed(1);
  }, [statsFiltrees]);

  // Reset index quand le filtre change
  useEffect(() => { setIndexCoup(0); }, [filtre]);

  const coupActuel = coupsFiltres[indexCoup] || null;
  const classification = coupActuel?.evaluation?.classification;
  const couleurClasse = COULEURS_CLASSE[classification] || "var(--muted)";
  const estMonCoup = coupActuel?.couleur === couleurJoueur;

  const precedent = () => setIndexCoup(i => Math.max(0, i - 1));
  const suivant   = () => setIndexCoup(i => Math.min(coupsFiltres.length - 1, i + 1));

  // ── Etats de chargement / erreur ────────────────────────────
  if (chargement) {
    return (
      <div className="popup-overlay">
        <div className="popup-pouvoir" style={{ minWidth: 380, gap: 16, padding: 40 }}>
          <div className="popup-titre">Game analysis</div>
          <div className="spinner" style={{ margin: "20px auto" }} />
          <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Analyse en cours... (peut prendre quelques secondes)
          </div>
        </div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="popup-overlay" onClick={onFermer}>
        <div className="popup-pouvoir" onClick={e => e.stopPropagation()}>
          <div className="popup-titre">Game analysis</div>
          <div className="popup-sous-titre">
            {erreur.type === "quota" ? "Quota d'analyses atteint pour aujourd'hui" : erreur.message}
          </div>
          <button className="popup-btn" onClick={onFermer}>Fermer</button>
        </div>
      </div>
    );
  }

  if (!analyse || !analyse.coups.length) {
    return (
      <div className="popup-overlay" onClick={onFermer}>
        <div className="popup-pouvoir" onClick={e => e.stopPropagation()}>
          <div className="popup-titre">Game analysis</div>
          <div style={{ color: "var(--muted)" }}>Aucun coup a analyser.</div>
          <button className="popup-btn" onClick={onFermer}>Fermer</button>
        </div>
      </div>
    );
  }

  // ── Rendu principal ─────────────────────────────────────────
  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">

        {/* Header */}
        <div className="analyse-header">
          <div className="analyse-titre">Game analysis</div>
          <div className="analyse-precision">
            <span style={{ fontSize: 22, fontWeight: 900 }}>{precisionFiltree}%</span>
            <small style={{ color: "var(--muted)" }}>précision</small>
          </div>
          <button className="btn-reset" onClick={onFermer}>Close</button>
        </div>

        {/* Légende catégories */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 16px", borderBottom: "1px solid var(--bord)" }}>
          {Object.entries(DESCRIPTIONS_CLASSE).map(([cls, info]) => (
            <div key={cls} title={info.desc} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 20,
              border: `1.5px solid ${COULEURS_CLASSE[cls]}`,
              background: COULEURS_CLASSE[cls] + "18",
              cursor: "help", fontSize: 11,
            }}>
              <span style={{ fontWeight: 900, color: COULEURS_CLASSE[cls] }}>{info.symbole}</span>
              <span style={{ fontWeight: 700, color: COULEURS_CLASSE[cls] }}>{cls}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "var(--muted)", alignSelf: "center" }}>Survolez pour la definition</div>
        </div>

        {/* Sélecteur de filtre */}
        <div style={{ display: "flex", gap: 8, padding: "8px 16px", borderBottom: "1px solid var(--bord)" }}>
          {[
            { key: "tous",        label: `Tous (${analyse.coups.length})` },
            { key: "moi",         label: `Mes coups (${analyse.coups.filter(c => c.couleur === couleurJoueur).length})` },
            { key: "adversaire",  label: `Adversaire (${analyse.coups.filter(c => c.couleur !== couleurJoueur).length})` },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setFiltre(key)}
              style={{
                padding: "4px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                border: filtre === key ? "1.5px solid var(--accent)" : "1px solid var(--bord)",
                background: filtre === key ? "var(--accent)" : "var(--bg2)",
                color: filtre === key ? "#000" : "var(--texte)",
                fontWeight: filtre === key ? 700 : 400,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Stats filtrées */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 16px", borderBottom: "1px solid var(--bord)" }}>
          {Object.entries(statsFiltrees).map(([cls, nb]) => nb > 0 && (
            <div key={cls} style={{
              padding: "2px 8px", borderRadius: 12,
              border: `1px solid ${COULEURS_CLASSE[cls]}`,
              color: COULEURS_CLASSE[cls], fontSize: 11,
            }}>
              {nb} {cls}
            </div>
          ))}
        </div>

        {/* Corps */}
        {coupsFiltres.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Aucun coup dans ce filtre.
          </div>
        ) : (
          <div className="analyse-corps">

            {/* Plateau */}
            <div className="analyse-plateau">
              <Board
                etat={{
                  plateau: {
                    pieces: coupActuel?.plateau_avant || {},
                    puzzles: {},
                    cellules_libres: [],
                    cellules_actives: [],
                    grille_bicolore: Array(taille).fill(null).map(() => Array(taille).fill(0)),
                  }
                }}
                taille={taille}
                pixelsPhoto={pixelsPhoto}
                onPoserPiece={null}
              />
            </div>

            {/* Panneau droit */}
            <div className="analyse-panneau">

              {/* Indicateur joueur */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
                padding: "4px 10px", borderRadius: 20,
                background: (coupActuel?.couleur === "rouge" ? "#ff4422" : "#4488ff") + "22",
                border: `1px solid ${coupActuel?.couleur === "rouge" ? "#ff4422" : "#4488ff"}`,
                alignSelf: "center",
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: coupActuel?.couleur === "rouge" ? "#ff4422" : "#4488ff",
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--texte)" }}>
                  {estMonCoup ? "Votre coup" : "Coup adversaire"}
                </span>
              </div>

              {/* Navigation */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <button className="popup-btn" onClick={precedent} disabled={indexCoup === 0}>◄</button>
                <span style={{ fontSize: 13, color: "var(--muted)", minWidth: 80, textAlign: "center" }}>
                  Coup {indexCoup + 1} / {coupsFiltres.length}
                </span>
                <button className="popup-btn" onClick={suivant} disabled={indexCoup >= coupsFiltres.length - 1}>►</button>
              </div>

              {/* Badge classification */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 8,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 16px", borderRadius: 20,
                  background: couleurClasse + "22",
                  border: `2px solid ${couleurClasse}`,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: couleurClasse }}>
                    {DESCRIPTIONS_CLASSE[classification]?.symbole}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: 14, color: couleurClasse }}>
                    {classification}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", textAlign: "center", maxWidth: 180 }}>
                  {DESCRIPTIONS_CLASSE[classification]?.desc}
                </div>
              </div>

              {/* Infos du coup */}
              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 6 }}>
                Tour {coupActuel?.numero_tour} — {coupActuel?.couleur}
              </div>
              {coupActuel?.evaluation?.rang > 0 && (
                <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                  Rang : {coupActuel.evaluation.rang} / {coupActuel.evaluation.total_coups}
                </div>
              )}
              {coupActuel?.evaluation?.gain > 0 && (
                <div style={{ fontSize: 11, color: "#88ff88", textAlign: "center" }}>
                  +{coupActuel.evaluation.gain} cellule{coupActuel.evaluation.gain > 1 ? "s" : ""} gagnee{coupActuel.evaluation.gain > 1 ? "s" : ""}
                </div>
              )}
              {coupActuel?.evaluation?.meilleur_coup &&
               classification !== "ELMAAS" && classification !== "MASSY" && (
                <div style={{ fontSize: 11, color: "#ffaa44", textAlign: "center" }}>
                  Meilleur : piece #{coupActuel.evaluation.meilleur_coup.piece_index + 1} en ({coupActuel.evaluation.meilleur_coup.origine.join(",")})
                </div>
              )}
              {coupActuel?.evaluation?.score_optimal != null && (
                <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                  Score : {coupActuel.evaluation.score_joue?.toFixed(1)} / optimal : {coupActuel.evaluation.score_optimal?.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quota */}
        {quotaInfo?.restant >= 0 && (
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: "6px 0" }}>
            Analyses restantes aujourd'hui : {quotaInfo.restant} ({quotaInfo.plan})
          </div>
        )}
      </div>
    </div>
  );
}