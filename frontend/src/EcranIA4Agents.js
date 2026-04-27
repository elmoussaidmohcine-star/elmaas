// ELMAAS — EcranIA4Agents.js
// Visualisation des 4 niveaux d'IA jouant entre eux
// CHESS (niv1) vs ELMAASYON (niv2) vs ELMAAS (niv3) vs GM 2500+ (niv4)

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Board from "./Board";
import { t } from "./translations";
import "./App.css";

const API = "https://elmaas-backend.onrender.com";

const AGENTS = [
  { id: 1, nom: "CHESS", couleur: "#666666", desc: "Niveau 1 - Aléatoire" },
  { id: 2, nom: "ELMAASYON", couleur: "#4488ff", desc: "Niveau 2 - Stratégique" },
  { id: 3, nom: "ELMAAS", couleur: "#ff8800", desc: "Niveau 3 - Expert" },
  { id: 4, nom: "GM 2500+", couleur: "#ffd700", desc: "Niveau 4 - Grandmaster" }
];

const MATCHUPS = [
  { rouge: 1, noir: 2, label: "CHESS vs ELMAASYON" },
  { rouge: 1, noir: 3, label: "CHESS vs ELMAAS" },
  { rouge: 1, noir: 4, label: "CHESS vs GM 2500+" },
  { rouge: 2, noir: 3, label: "ELMAASYON vs ELMAAS" },
  { rouge: 2, noir: 4, label: "ELMAASYON vs GM 2500+" },
  { rouge: 3, noir: 4, label: "ELMAAS vs GM 2500+" },
];

export default function EcranIA4Agents({ onFermer, L }) {
  const [matchupActif, setMatchupActif] = useState(0);
  const [partieId, setPartieId] = useState(null);
  const [etat, setEtat] = useState(null);
  const [pixelsPhoto, setPixelsPhoto] = useState(null);
  const [taille, setTaille] = useState(16);
  const [historique, setHistorique] = useState([]);
  const [indexTour, setIndexTour] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [vitesse, setVitesse] = useState(1000); // ms entre les coups
  const timerRef = useRef(null);
  const [scoresManches, setScoresManches] = useState({ rouge: 0, noir: 0 });

  const matchup = MATCHUPS[matchupActif];
  const agentRouge = AGENTS.find(a => a.id === matchup.rouge);
  const agentNoir = AGENTS.find(a => a.id === matchup.noir);

  // Initialiser une nouvelle partie IA vs IA
  const initPartie = useCallback(async () => {
    setEnCours(true);
    setResultat(null);
    setHistorique([]);
    setIndexTour(0);
    setScoresManches({ rouge: 0, noir: 0 });

    try {
      // Créer une partie avec photo fixe
      const formData = new FormData();
      formData.append("prop_j1", "16");
      formData.append("prop_j2", "16");
      formData.append("nom_photo", "demo_ia");
      formData.append("timer_sec", "300");
      formData.append("langue", "fr");

      // Utiliser une photo fixe du backend
      const photoResp = await fetch(`${API}/photo_fixe/city.jpeg`);
      const blob = await photoResp.blob();
      formData.append("photo", blob, "city.jpeg");

      const res = await axios.post(`${API}/nouvelle-partie`, formData);
      setPartieId(res.data.partie_id);
      setEtat(res.data.etat);
      setPixelsPhoto(res.data.pixels_photo);
      setTaille(res.data.taille);
    } catch (err) {
      console.error("Erreur init partie IA:", err);
      setEnCours(false);
    }
  }, [matchupActif]);

  // Jouer un coup IA
  const jouerCoupIA = useCallback(async () => {
    if (!partieId || !etat || etat.manche_terminee) return;

    const tourIA = etat.tour_actuel; // 0 = rouge, 1 = noir
    const niveau = tourIA === 0 ? matchup.rouge : matchup.noir;

    try {
      const res = await axios.post(`${API}/ia/${partieId}`, { niveau });
      const nouvelEtat = res.data.etat;
      setEtat(nouvelEtat);

      // Enregistrer dans l'historique
      setHistorique(prev => [...prev, {
        tour: prev.length,
        couleur: tourIA === 0 ? "rouge" : "noir",
        niveau,
        agent: tourIA === 0 ? agentRouge.nom : agentNoir.nom,
        etat: nouvelEtat
      }]);

      if (res.data.manche_terminee || res.data.victoire_immediate) {
        setResultat({
          gagnant: res.data.gagnant,
          scores: nouvelEtat.scores,
          motif: res.data.victoire_immediate ? "victoire_immediate" : "plateau_plein"
        });
        setEnCours(false);
        return false; // Partie terminée
      }

      return true; // Continue
    } catch (err) {
      console.error("Erreur coup IA:", err);
      setEnCours(false);
      return false;
    }
  }, [partieId, etat, matchup, agentRouge, agentNoir]);

  // Boucle de jeu automatique
  useEffect(() => {
    if (!enCours || !partieId) return;

    const jouer = async () => {
      const continuePartie = await jouerCoupIA();
      if (!continuePartie) {
        clearInterval(timerRef.current);
      }
    };

    timerRef.current = setInterval(jouer, vitesse);
    return () => clearInterval(timerRef.current);
  }, [enCours, partieId, jouerCoupIA, vitesse]);

  // Navigation manuelle dans l'historique
  const etatHistorique = indexTour < historique.length ? historique[indexTour].etat : etat;

  return (
    <div className="app">
      <div style={{ 
        position: "fixed", inset: 0, 
        background: "var(--bg)", 
        display: "flex", flexDirection: "column",
        overflow: "auto"
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", borderBottom: "1px solid var(--bord)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1 style={{ fontFamily: "var(--titre)", fontSize: 24, color: "var(--rouge-c)" }}>
               4 Agents IA
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Match: <strong style={{ color: agentRouge.couleur }}>{agentRouge.nom}</strong> vs 
              <strong style={{ color: agentNoir.couleur }}> {agentNoir.nom}</strong>
            </div>
          </div>
          <button className="btn-reset" onClick={onFermer}>{t("fermer", L)}</button>
        </div>

        {/* Sélection des matchups */}
        <div style={{ 
          display: "flex", gap: 8, padding: "12px 20px", 
          borderBottom: "1px solid var(--bord)", flexWrap: "wrap"
        }}>
          {MATCHUPS.map((m, i) => (
            <button
              key={i}
              className={`ia-btn ${matchupActif === i ? "actif" : ""}`}
              onClick={() => { setMatchupActif(i); setPartieId(null); setEtat(null); setHistorique([]); setResultat(null); }}
              style={{ fontSize: 12 }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Contrôles */}
        <div style={{ 
          display: "flex", gap: 12, padding: "12px 20px",
          borderBottom: "1px solid var(--bord)", alignItems: "center"
        }}>
          <button className="btn-valider" onClick={initPartie} disabled={enCours}>
            {enCours ? "⏳ En cours..." : "▶ Nouvelle partie"}
          </button>

          {enCours && (
            <button className="btn-action" onClick={() => setEnCours(false)}>
              ⏸ Pause
            </button>
          )}

          {!enCours && partieId && (
            <button className="btn-action" onClick={() => setEnCours(true)}>
              ▶ Reprendre
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Vitesse:</span>
            {[500, 1000, 2000, 3000].map(v => (
              <button
                key={v}
                className={`ia-btn-niveau ${vitesse === v ? "actif" : ""}`}
                onClick={() => setVitesse(v)}
                style={{ fontSize: 11, padding: "4px 8px" }}
              >
                {v < 1000 ? "0.5s" : `${v/1000}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Zone de jeu */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Plateau */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
            {etatHistorique ? (
              <Board
                etat={etatHistorique}
                taille={taille}
                pixelsPhoto={pixelsPhoto}
                onPoserPiece={null}
              />
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}></div>
                <div>Clique "Nouvelle partie" pour lancer le match</div>
              </div>
            )}
          </div>

          {/* Panneau latéral */}
          <div style={{ 
            width: 280, minWidth: 280,
            borderLeft: "1px solid var(--bord)",
            padding: 16, overflowY: "auto",
            background: "var(--bg2)"
          }}>
            {/* Scores */}
            {etatHistorique?.scores && (
              <div style={{ 
                display: "flex", gap: 16, justifyContent: "center",
                padding: "12px", background: "var(--bg3)",
                borderRadius: 8, marginBottom: 16
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: agentRouge.couleur, fontSize: 28, fontWeight: 700 }}>
                    {etatHistorique.scores.rouge}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{agentRouge.nom}</div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 20, alignSelf: "center" }}>vs</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: agentNoir.couleur, fontSize: 28, fontWeight: 700 }}>
                    {etatHistorique.scores.noir}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{agentNoir.nom}</div>
                </div>
              </div>
            )}

            {/* Tour actuel */}
            {etatHistorique && (
              <div style={{ 
                padding: "8px 12px", background: "var(--bg3)",
                borderRadius: 6, marginBottom: 16, textAlign: "center"
              }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Tour {etatHistorique.numero_tour} — 
                  <strong style={{ 
                    color: etatHistorique.tour_actuel === 0 ? agentRouge.couleur : agentNoir.couleur 
                  }}>
                    {etatHistorique.tour_actuel === 0 ? agentRouge.nom : agentNoir.nom}
                  </strong>
                </div>
              </div>
            )}

            {/* Résultat */}
            {resultat && (
              <div style={{ 
                padding: 16, background: "var(--bg3)",
                borderRadius: 8, marginBottom: 16,
                border: `2px solid ${resultat.gagnant === "rouge" ? agentRouge.couleur : agentNoir.couleur}`
              }}>
                <div style={{ 
                  fontSize: 20, fontWeight: 700,
                  color: resultat.gagnant === "rouge" ? agentRouge.couleur : agentNoir.couleur,
                  textAlign: "center"
                }}>
                   {resultat.gagnant === "rouge" ? agentRouge.nom : agentNoir.nom} gagne!
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
                  {resultat.motif === "victoire_immediate" ? "Victoire immédiate (série de 5)" : "Plateau plein"}
                </div>
              </div>
            )}

            {/* Historique des coups */}
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              Historique ({historique.length} coups)
            </div>
            <div style={{ 
              maxHeight: 300, overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 4
            }}>
              {historique.map((h, i) => (
                <div 
                  key={i}
                  onClick={() => setIndexTour(i)}
                  style={{ 
                    padding: "6px 10px", borderRadius: 4,
                    background: indexTour === i ? "var(--rouge)22" : "var(--bg3)",
                    cursor: "pointer", fontSize: 11,
                    borderLeft: `3px solid ${h.couleur === "rouge" ? agentRouge.couleur : agentNoir.couleur}`
                  }}
                >
                  <span style={{ color: h.couleur === "rouge" ? agentRouge.couleur : agentNoir.couleur }}>
                    {h.agent}
                  </span>
                  <span style={{ color: "var(--muted)", marginLeft: 4 }}>
                    — Tour {h.tour}
                  </span>
                </div>
              ))}
            </div>

            {/* Légende des agents */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--bord)" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Agents</div>
              {AGENTS.map(agent => (
                <div key={agent.id} style={{ 
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 0", fontSize: 12
                }}>
                  <div style={{ 
                    width: 12, height: 12, borderRadius: 2,
                    background: agent.couleur
                  }} />
                  <span style={{ color: agent.couleur, fontWeight: 600 }}>{agent.nom}</span>
                  <span style={{ color: "var(--muted)" }}>— {agent.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
