// ============================================================
//  ELMAAS — App.js
//  Page principale : upload photo → partie → plateau → jeu
// ============================================================

import { useState, useCallback } from "react";
import axios from "axios";
import Board from "./Board";
import "./App.css";

const API = "http://localhost:5000";

// ── Composant upload photo ───────────────────────────────────
function PhotoUploader({ onPartieCreee }) {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [apercu, setApercu] = useState(null);

  const handleFichier = async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    setApercu(URL.createObjectURL(fichier));
    setErreur(null);
    setChargement(true);

    try {
      const formData = new FormData();
      formData.append("photo", fichier);
      const res = await axios.post(`${API}/nouvelle-partie`, formData);
      onPartieCreee(res.data.partie_id, res.data.etat);
    } catch (err) {
      setErreur("Erreur lors de la création de la partie. Vérifie que l'API tourne.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="uploader">
      <div className="uploader-titre">
        <h1 className="titre-jeu">ELMAAS</h1>
        <p className="sous-titre">Importe ta photo. Perds dessus.</p>
      </div>

      <label className="zone-upload" htmlFor="photo-input">
        {apercu ? (
          <img src={apercu} alt="Aperçu" className="apercu-photo" />
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icone">⬡</div>
            <p>Clique ou glisse une photo ici</p>
            <span>JPG, PNG, JPEG</span>
          </div>
        )}
        <input
          id="photo-input"
          type="file"
          accept="image/*"
          onChange={handleFichier}
          style={{ display: "none" }}
        />
      </label>

      {chargement && (
        <div className="chargement">
          <div className="spinner" />
          <p>Génération du plateau depuis ta photo…</p>
        </div>
      )}

      {erreur && <p className="erreur">{erreur}</p>}
    </div>
  );
}

// ── Composant main du joueur ─────────────────────────────────
function Main({ joueur, estActif, onPoserPiece }) {
  return (
    <div className={`main-joueur ${estActif ? "actif" : ""}`}>
      <div className="main-header">
        <div className={`indicateur-couleur ${joueur.couleur}`} />
        <span className="main-titre">
          Joueur {joueur.id + 1} — {joueur.couleur}
        </span>
        {estActif && <span className="badge-tour">Ton tour</span>}
      </div>

      <div className="main-pieces">
        {joueur.main_active.map(([r, c], i) => (
          <div
            key={i}
            className={`piece-main ${joueur.couleur}`}
            onClick={() => estActif && onPoserPiece([r, c])}
            title={`Poser en (${r}, ${c})`}
          >
            <span className="piece-coords">{r},{c}</span>
          </div>
        ))}
        {joueur.main_active.length === 0 && (
          <p className="main-vide">Main vide</p>
        )}
      </div>

      <div className="main-stats">
        <span>Réserve : {joueur.nb_pieces_reserve}</span>
        <span>Série : {joueur.serie_actuelle} 🔥</span>
      </div>
    </div>
  );
}

// ── Composant scores ─────────────────────────────────────────
function Scores({ scores, puzzles }) {
  const nbTotal = Object.values(puzzles || {}).filter(p => !p.brise).length;
  const nbBrises = Object.values(puzzles || {}).filter(p => p.brise).length;

  return (
    <div className="scores">
      <div className="score-item rouge">
        <span className="score-nombre">{scores?.rouge ?? 0}</span>
        <span className="score-label">Rouge</span>
      </div>
      <div className="score-separateur">
        <span className="score-total">{nbTotal} puzzles</span>
        {nbBrises > 0 && (
          <span className="score-brises">⚠ {nbBrises} brisé{nbBrises > 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="score-item noir">
        <span className="score-nombre">{scores?.noir ?? 0}</span>
        <span className="score-label">Noir</span>
      </div>
    </div>
  );
}

// ── Composant actions ────────────────────────────────────────
function Actions({ partieId, etat, onEtatMisAJour, pieceSelectionnee }) {
  const joueur = etat.tour_actuel === 0 ? etat.joueur1 : etat.joueur2;

  const jouer = async (action, extra = {}) => {
    try {
      const body = { action, ...extra };
      const res = await axios.post(`${API}/jouer/${partieId}`, body);
      onEtatMisAJour(res.data.etat);

      if (res.data.victoire_immediate) {
        alert(`🏆 VICTOIRE IMMÉDIATE — ${res.data.gagnant} remporte la manche !`);
      } else if (res.data.manche_terminee) {
        alert(`🏁 Fin de manche — Gagnant : ${res.data.gagnant}`);
      }
    } catch (err) {
      console.error("Erreur action :", err);
    }
  };

  return (
    <div className="actions">
      <button
        className="btn btn-secondaire"
        onClick={() => jouer("repiocher")}
        title="Passer son tour et voir les prochaines pièces"
      >
        ↻ Repiocher
      </button>
      <button
        className="btn btn-scout"
        onClick={() => jouer("scout")}
        title="Voir 10 prochaines pièces (échange 2 aléatoires)"
      >
        ◎ Scout
      </button>
      {pieceSelectionnee && (
        <>
          <button
            className="btn btn-pouvoir"
            onClick={() =>
              jouer("poser", {
                position: pieceSelectionnee,
                pouvoir: "proteger",
                cible_pouvoir: pieceSelectionnee,
              })
            }
          >
            🛡 Protéger
          </button>
          <button
            className="btn btn-pouvoir"
            onClick={() =>
              jouer("poser", {
                position: pieceSelectionnee,
                pouvoir: "echanger",
                cible_pouvoir: pieceSelectionnee,
              })
            }
          >
            ⇄ Échanger
          </button>
        </>
      )}
    </div>
  );
}

// ── App principale ───────────────────────────────────────────
export default function App() {
  const [partieId, setPartieId] = useState(null);
  const [etat, setEtat] = useState(null);
  const [selectionEnCours, setSelectionEnCours] = useState(null);

  const handlePartieCreee = useCallback((id, etatInitial) => {
    setPartieId(id);
    setEtat(etatInitial);
  }, []);

  const handlePoserPiece = useCallback(
    async (position) => {
      if (!partieId) return;
      try {
        const res = await axios.post(`${API}/jouer/${partieId}`, {
          action: "poser",
          position,
          pouvoir: "rien",
        });
        setEtat(res.data.etat);
        setSelectionEnCours(null);

        if (res.data.victoire_immediate) {
          setTimeout(() => alert(`🏆 VICTOIRE IMMÉDIATE — ${res.data.gagnant} !`), 100);
        } else if (res.data.manche_terminee) {
          setTimeout(() => alert(`🏁 Fin de manche — Gagnant : ${res.data.gagnant}`), 100);
        }
      } catch (err) {
        console.error("Erreur pose pièce :", err);
      }
    },
    [partieId]
  );

  const handleEtatMisAJour = useCallback((nouvelEtat) => {
    setEtat(nouvelEtat);
  }, []);

  // Écran d'accueil
  if (!etat) {
    return (
      <div className="app">
        <PhotoUploader onPartieCreee={handlePartieCreee} />
      </div>
    );
  }

  const joueurActif = etat.tour_actuel === 0 ? etat.joueur1 : etat.joueur2;
  const joueurAdverse = etat.tour_actuel === 0 ? etat.joueur2 : etat.joueur1;

  return (
    <div className="app partie-en-cours">
      {/* Header */}
      <header className="app-header">
        <h1 className="titre-jeu-petit">ELMAAS</h1>
        <Scores
          scores={etat.scores}
          puzzles={etat.plateau?.puzzles}
        />
        <button
          className="btn btn-reset"
          onClick={() => { setPartieId(null); setEtat(null); }}
        >
          Nouvelle partie
        </button>
      </header>

      {/* Zone de jeu */}
      <main className="zone-jeu">
        {/* Main joueur adverse (cachée) */}
        <div className="panneau-lateral gauche">
          <Main
            joueur={joueurAdverse}
            estActif={false}
            onPoserPiece={() => {}}
          />
        </div>

        {/* Plateau central */}
        <div className="plateau-central">
          <Board
            etat={etat}
            mainActive={joueurActif.main_active || []}
            onPoserPiece={handlePoserPiece}
            onCelluleSelectionnee={setSelectionEnCours}
            selectionEnCours={selectionEnCours}
            joueurActif={etat.tour_actuel}
          />
        </div>

        {/* Main joueur actif */}
        <div className="panneau-lateral droite">
          <Main
            joueur={joueurActif}
            estActif={true}
            onPoserPiece={handlePoserPiece}
          />
          <Actions
            partieId={partieId}
            etat={etat}
            onEtatMisAJour={handleEtatMisAJour}
            pieceSelectionnee={selectionEnCours}
          />
        </div>
      </main>

      {/* Info tour */}
      <div className="info-tour">
        Tour {etat.numero_tour} —{" "}
        <span className={`couleur-tour ${joueurActif.couleur}`}>
          {joueurActif.couleur}
        </span>{" "}
        joue
        {joueurActif.serie_actuelle >= 3 && (
          <span className="badge-serie">
            🔥 Série {joueurActif.serie_actuelle} !
          </span>
        )}
      </div>
    </div>
  );
}
