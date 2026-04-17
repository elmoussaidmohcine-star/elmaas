// ELMAAS App.js v5 — Timers 5min + popup icônes + flux pouvoirs correct
import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Board from "./Board";
import "./App.css";

const API = "https://elmaas.up.railway.app";
// TIMER_INITIAL est maintenant choisi par les joueurs

// ── Auth helpers ─────────────────────────────────────────────
function getToken() { return localStorage.getItem("elmaas_token"); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem("elmaas_user") || "null"); }
  catch { return null; }
}

// ── Écran Auth (Connexion / Inscription) ──────────────────────
function EcranAuth({ onConnecte }) {
  const [mode, setMode] = useState("connexion"); // "connexion" | "inscription"
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async () => {
    setErreur(null);
    setChargement(true);
    try {
      const route = mode === "connexion" ? "/auth/connexion" : "/auth/inscription";
      const body = mode === "connexion"
        ? { email, mot_de_passe: mdp }
        : { email, pseudo, mot_de_passe: mdp };
      const res = await axios.post(`${API}${route}`, body);
      localStorage.setItem("elmaas_token", res.data.token);
      localStorage.setItem("elmaas_user", JSON.stringify(res.data.utilisateur));
      onConnecte(res.data.utilisateur);
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur de connexion");
    } finally { setChargement(false); }
  };

  return (
    <div className="ecran-taille">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">Chess is old, ELMAAS is better than gold</p>
      <div className="lobby-card" style={{ minWidth: 340 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["connexion","inscription"].map(m => (
            <button key={m} className={`ia-btn ${mode===m?"actif":""}`}
              onClick={() => { setMode(m); setErreur(null); }}
              style={{ flex: 1, textTransform: "capitalize" }}>
              {m === "connexion" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>
        {mode === "inscription" && (
          <input className="lobby-input" placeholder="Pseudo" value={pseudo}
            onChange={e => setPseudo(e.target.value)} style={{ marginBottom: 8 }} />
        )}
        <input className="lobby-input" placeholder="Email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} style={{ marginBottom: 8 }} />
        <input className="lobby-input" placeholder="Mot de passe" type="password" value={mdp}
          onChange={e => setMdp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ marginBottom: 8 }} />
        {erreur && <div style={{ color: "#ff6644", fontSize: 13 }}>{erreur}</div>}
        <button className="btn-valider" onClick={handleSubmit} disabled={chargement}>
          {chargement ? "..." : mode === "connexion" ? "Se connecter" : "Créer un compte"}
        </button>
        <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:13, marginTop:4 }}
          onClick={() => onConnecte(null)}>
          Continuer sans compte
        </button>
      </div>
    </div>
  );
}

// ── Écran sélection photo ─────────────────────────────────────
function EcranPhoto2({ prop1, prop2, timerSec, utilisateur, modeIA, onPartieCreee }) {
  const [photosFixees, setPhotosFixees] = useState([]);
  const [photoSelectionnee, setPhotoSelectionnee] = useState(null);
  const [nomPhoto, setNomPhoto] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [apercu, setApercu] = useState(null);

  const peutUploader = !utilisateur
    ? false
    : utilisateur.premium || !utilisateur.photo_perso_utilisee;

  useEffect(() => {
    axios.get(`${API}/photos_fixes`).then(res => setPhotosFixees(res.data.photos));
  }, []);

  const jouerAvecPhoto = async (urlOuFichier, estFichier = false) => {
    setErreur(null);
    setChargement(true);
    try {
      const formData = new FormData();
      formData.append("prop_j1", prop1);
      formData.append("prop_j2", prop2);
      formData.append("nom_photo", modeIA !== "aucune" ? "" : nomPhoto.slice(0, 10));
      formData.append("timer_sec", timerSec);
      if (estFichier) {
        formData.append("photo", urlOuFichier);
        if (utilisateur && !utilisateur.premium) {
          const token = getToken();
          await axios.post(`${API}/consommer_upload`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } else {
        const resp = await fetch(`${API}${urlOuFichier}`);
        const blob = await resp.blob();
        const fichier = new File([blob], "photo_fixe.jpg", { type: blob.type });
        formData.append("photo", fichier);
      }
      const res = await axios.post(`${API}/nouvelle-partie`, formData);
      onPartieCreee(res.data.partie_id, res.data.etat, res.data.pixels_photo, res.data.taille, res.data.timer_sec, res.data.scores_manches);
    } catch (err) {
      setErreur("Erreur lors de la création de la partie.");
    } finally { setChargement(false); }
  };

  const handleFichier = (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setApercu(URL.createObjectURL(fichier));
    setPhotoSelectionnee({ fichier, estFichier: true });
  };

  return (
    <div className="ecran-taille" style={{ gap: 20 }}>
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">Choisissez une photo pour votre plateau</p>

      {/* Nom secret — uniquement en mode multijoueur */}
      {modeIA === "aucune" && (
        <div className="nom-photo-section">
          <label className="nom-photo-label">Nom secret de la photo <span>(max 10 car.)</span></label>
          <input className="nom-photo-input" maxLength={10} placeholder="ex: vacances"
            value={nomPhoto} onChange={e => setNomPhoto(e.target.value)} />
        </div>
      )}

      {/* Grille des 10 photos fixes */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 600 }}>
        {photosFixees.map((url, i) => (
          <div key={i} onClick={() => { setPhotoSelectionnee({ url, estFichier: false }); setApercu(null); }}
            style={{
              width: 100, height: 100, borderRadius: 8, overflow: "hidden", cursor: "pointer",
              border: photoSelectionnee?.url === url ? "3px solid var(--rouge-c)" : "2px solid var(--bord)",
              transition: "all 0.2s",
            }}>
            <img src={`${API}${url}`} alt={`photo ${i+1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>

      {/* Upload photo perso */}
      {utilisateur ? (
        peutUploader ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {utilisateur.premium ? "Premium — uploads illimités" : "1 photo personnelle gratuite disponible"}
            </div>
            <label className="zone-upload" htmlFor="photo-perso-input"
              style={{ width: 200, minHeight: 80, cursor: "pointer" }}>
              {apercu
                ? <img src={apercu} alt="apercu" style={{ width: "100%", height: 80, objectFit: "cover" }} />
                : <div className="upload-placeholder" style={{ fontSize: 13 }}>
                    <div className="upload-icone" style={{ fontSize: 24 }}>+</div>
                    <p>Ma photo</p>
                  </div>}
              <input id="photo-perso-input" type="file" accept="image/*"
                onChange={handleFichier} style={{ display: "none" }} />
            </label>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Photo personnelle utilisée — <span style={{ color: "var(--rouge-c)" }}>Passer Premium pour en uploader plus</span>
          </div>
        )
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Connectez-vous pour uploader votre propre photo
        </div>
      )}

      {erreur && <p className="erreur">{erreur}</p>}
      {chargement && <div className="chargement"><div className="spinner" /><p>Génération...</p></div>}

      {photoSelectionnee && !chargement && (
        <button className="btn-valider"
          onClick={() => jouerAvecPhoto(
            photoSelectionnee.estFichier ? photoSelectionnee.fichier : photoSelectionnee.url,
            photoSelectionnee.estFichier
          )}>
          Jouer avec cette photo
        </button>
      )}
    </div>
  );
}

// ── Écran Classement ELO ──────────────────────────────────────
function EcranClassement({ onFermer, utilisateur }) {
  const [classement, setClassement] = useState([]);
  useEffect(() => {
    axios.get(`${API}/classement`).then(res => setClassement(res.data));
  }, []);
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir" style={{ maxWidth: 480, maxHeight: "80vh", overflowY: "auto", gap: 12 }}>
        <div className="popup-titre">Classement ELO</div>
        {classement.length === 0 && <div style={{ color: "var(--muted)", fontSize: 14 }}>Aucun joueur classé pour l'instant.</div>}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--muted)", borderBottom: "1px solid var(--bord)" }}>
              <th style={{ padding: "4px 8px", textAlign: "left" }}>#</th>
              <th style={{ padding: "4px 8px", textAlign: "left" }}>Pseudo</th>
              <th style={{ padding: "4px 8px", textAlign: "right" }}>ELO</th>
              <th style={{ padding: "4px 8px", textAlign: "right" }}>Parties</th>
              <th style={{ padding: "4px 8px", textAlign: "right" }}>Win%</th>
            </tr>
          </thead>
          <tbody>
            {classement.map((j, i) => (
              <tr key={i} style={{
                borderBottom: "1px solid var(--bord)",
                background: j.pseudo === utilisateur?.pseudo ? "var(--rouge)11" : "transparent"
              }}>
                <td style={{ padding: "6px 8px", color: i < 3 ? "var(--rouge-c)" : "var(--muted)" }}>
                  {i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3" : j.rang}
                </td>
                <td style={{ padding: "6px 8px", color: "var(--texte)", fontWeight: j.pseudo === utilisateur?.pseudo ? 700 : 400 }}>
                  {j.pseudo}
                </td>
                <td style={{ padding: "6px 8px", textAlign: "right", color: "var(--rouge-c)", fontFamily: "monospace" }}>
                  {j.elo}
                </td>
                <td style={{ padding: "6px 8px", textAlign: "right", color: "var(--muted)" }}>{j.parties}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", color: "var(--muted)" }}>{j.ratio}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="popup-btn" onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}

// ── Écran Taille ──────────────────────────────────────────────
const TIMER_OPTIONS = [
  { label: "10 s",  val: 10 },
  { label: "20 s",  val: 20 },
  { label: "30 s",  val: 30 },
  { label: "1 min", val: 60 },
  { label: "2 min", val: 120 },
  { label: "5 min", val: 300 },
];

function EcranTaille({ onValider }) {
  const [prop1, setProp1] = useState(16);
  const [prop2, setProp2] = useState(16);
  const [modeIA, setModeIA] = useState("aucune");
  const [niveauIA, setNiveauIA] = useState(2);
  const [timerSec, setTimerSec] = useState(30);
  const tailleFin = Math.max(10, Math.min(20, prop1 % 2 === 0 ? prop1 : prop1 - 1));
  return (
    <div className="ecran-taille">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">Chess is old, ELMAAS is better than gold</p>
      <p className="sous-titre">Choisissez la taille du plateau</p>
      <div className="taille-inputs">
        <div className="taille-joueur">
          <label>Taille du plateau</label>
          <input type="range" min="10" max="20" step="2" value={prop1} onChange={e => setProp1(Number(e.target.value))} />
          <span className="taille-val">{prop1}</span>
        </div>
        <div className="taille-result">
          <div className="taille-final">{tailleFin}</div>
          <div className="taille-label">plateau</div>
        </div>
      </div>

      <div className="ia-section">
        <div className="ia-titre">Temps par tour</div>
        <div className="ia-options" style={{ flexWrap: "wrap", justifyContent: "center" }}>
          {TIMER_OPTIONS.map(opt => (
            <button key={opt.val}
              className={`ia-btn ${timerSec === opt.val ? "actif" : ""}`}
              onClick={() => setTimerSec(opt.val)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ia-section">
        <div className="ia-titre">Mode IA</div>
        <div className="ia-options">
          {[["aucune","2 joueurs"],["j2","IA joue Noir"],["j1","IA joue Rouge"]].map(([val, label]) => (
            <button key={val} className={`ia-btn ${modeIA === val ? "actif" : ""}`} onClick={() => setModeIA(val)}>{label}</button>
          ))}
        </div>
        {modeIA !== "aucune" && (
          <div className="ia-niveau">
            <span>Niveau IA :</span>
            {[1,2,3].map(n => (
              <button key={n} className={`ia-btn-niveau ${niveauIA === n ? "actif" : ""}`} onClick={() => setNiveauIA(n)}>
                {n === 1 ? "Facile" : n === 2 ? "Moyen" : "Expert"}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="btn-valider" onClick={() => onValider(prop1, prop1, tailleFin, modeIA, niveauIA, timerSec)}>
        Confirmer
      </button>
    </div>
  );
}

// ── Écran Photo ───────────────────────────────────────────────
function EcranPhoto({ prop1, prop2, onPartieCreee, modeMultijoueur, timerSec }) {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [nomPhoto, setNomPhoto] = useState("");
  const handleFichier = async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setApercu(URL.createObjectURL(fichier));
    setErreur(null);
    setChargement(true);
    try {
      const formData = new FormData();
      formData.append("photo", fichier);
      formData.append("prop_j1", prop1);
      formData.append("prop_j2", prop2);
      formData.append("nom_photo", nomPhoto.slice(0, 10));
      formData.append("timer_sec", timerSec || 30);
      const res = await axios.post(`${API}/nouvelle-partie`, formData);
      onPartieCreee(res.data.partie_id, res.data.etat, res.data.pixels_photo, res.data.taille, res.data.timer_sec, res.data.scores_manches);
    } catch (err) {
      setErreur("Erreur lors de la creation de la partie.");
    } finally { setChargement(false); }
  };
  return (
    <div className="uploader">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">Chess is old, ELMAAS is better than gold</p>
      <p className="sous-titre">Importe ta photo. Perds dessus.</p>
      {modeMultijoueur && (
        <div className="nom-photo-section">
          <label className="nom-photo-label">Nom secret de la photo <span>(max 10 car.)</span></label>
          <input className="nom-photo-input" maxLength={10} placeholder="ex: vacances"
            value={nomPhoto} onChange={e => setNomPhoto(e.target.value)} />
          <div className="nom-photo-compte">{nomPhoto.length}/10</div>
        </div>
      )}
      <label className="zone-upload" htmlFor="photo-input">
        {apercu ? <img src={apercu} alt="Apercu" className="apercu-photo" />
          : <div className="upload-placeholder"><div className="upload-icone">+</div><p>Clique ou glisse une photo ici</p></div>}
        <input id="photo-input" type="file" accept="image/*" onChange={handleFichier} style={{ display: "none" }} />
      </label>
      {chargement && <div className="chargement"><div className="spinner" /><p>Generation...</p></div>}
      {erreur && <p className="erreur">{erreur}</p>}
    </div>
  );
}

// ── Écran Lobby ───────────────────────────────────────────────
function EcranLobby({ partieId, monRole, statutConnexion, onRejoindreManuellement }) {
  const [codeSaisi, setCodeSaisi] = useState("");
  if (monRole === "joueur1") {
    return (
      <div className="ecran-lobby">
        <h1 className="titre-jeu">ELMAAS</h1>
        <p className="phrase-jeu">Chess is old, ELMAAS is better than gold</p>
        <div className="lobby-card">
          <div className="lobby-titre">Partie créée</div>
          <div className="lobby-sous">Donne ce code au Joueur 2</div>
          <div className="lobby-code">{partieId}</div>
          <button className="lobby-copier" onClick={() => navigator.clipboard.writeText(partieId)}>Copier le code</button>
          <div className={`lobby-statut ${statutConnexion}`}>
            {statutConnexion === "attente" && "En attente du Joueur 2..."}
            {statutConnexion === "connecte" && "Joueur 2 connecté !"}
            {statutConnexion === "erreur" && "Erreur de connexion"}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="ecran-lobby">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">Chess is old, ELMAAS is better than gold</p>
      <div className="lobby-card">
        <div className="lobby-titre">Rejoindre une partie</div>
        <div className="lobby-sous">Entre le code donné par le Joueur 1</div>
        <input className="lobby-input" placeholder="Code de partie..."
          value={codeSaisi} onChange={e => setCodeSaisi(e.target.value)} />
        <button className="btn-valider" onClick={() => onRejoindreManuellement(codeSaisi.trim())} disabled={!codeSaisi.trim()}>
          Rejoindre
        </button>
        {statutConnexion === "erreur" && <div className="lobby-statut erreur">Partie introuvable</div>}
      </div>
    </div>
  );
}

// ── Timer ─────────────────────────────────────────────────────
function TimerBloc({ secondes, couleur, actif }) {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  const danger = secondes <= 30;
  return (
    <div className={`timer-bloc ${couleur} ${actif ? "actif" : ""}`}>
      <span className="timer-label">{couleur === "rouge" ? "Rouge" : "Noir"}</span>
      <span className={`timer-val${danger && actif ? " danger" : ""}`}>
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── MiniPiece ─────────────────────────────────────────────────
function MiniPiece({ piece, couleur, estSelectionnee, onClick }) {
  if (!piece) return null;
  const cells = piece.cellules || [];
  const maxR = Math.max(0, ...cells.map(([r]) => r));
  const maxC = Math.max(0, ...cells.map(([, c]) => c));
  const S = 10;
  const coul = couleur === "rouge" ? "#cc2200" : "#444444";
  const coulClair = couleur === "rouge" ? "#ff4422" : "#888888";
  return (
    <div onClick={onClick} className={`mini-piece ${estSelectionnee ? "sel" : ""}`}
      style={{ position: "relative", width: (maxC+1)*S+10, height: (maxR+1)*S+10, padding: 5,
        borderRadius: 6, cursor: "pointer", flexShrink: 0,
        border: `2px solid ${estSelectionnee ? coulClair : "#2a2a4a"}`,
        background: estSelectionnee ? `${coul}33` : "#111122", transition: "all 0.15s" }}
      title={piece.forme}>
      {cells.map(([r, c], i) => (
        <div key={i} style={{ position: "absolute", top: r*S+5, left: c*S+5,
          width: S-2, height: S-2, borderRadius: 2, background: coul, boxShadow: `0 0 4px ${coul}88` }} />
      ))}
    </div>
  );
}

// ── Popup Pouvoir avec icônes ─────────────────────────────────
function PopupPouvoir({ onChoisir, serie }) {
  const estSerie3 = serie >= 3;
  const options = [
    { id: "rien",     icone: "", label: "Rien faire",       desc: "Passer directement au tour suivant" },
    { id: "proteger", icone: "", label: "Protéger",         desc: "Une de tes pièces devient invulnérable 1 tour" },
    { id: "echanger", icone: "", label: "Échanger",         desc: "Recolorie une pièce adverse à ta couleur" },
    ...(estSerie3 ? [{ id: "extraire", icone: "", label: `Extraire  (série ${serie} !)`, desc: "Retire jusqu'à 2 pièces du plateau" }] : []),
  ];
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir">
        <div className="popup-titre">{estSerie3 ? ` Série de ${serie} !` : " Puzzle complété !"}</div>
        <div className="popup-sous-titre">Choisissez votre récompense</div>
        <div className="popup-options">
          {options.map(opt => (
            <button key={opt.id}
              className={`popup-btn ${opt.id === "extraire" ? "popup-btn-serie" : ""}`}
              onClick={() => onChoisir(opt.id)}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{opt.icone}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{opt.label}</div>
                <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Popup Scout ───────────────────────────────────────────────
function PopupScout({ pieces, couleur, echanges, onFermer }) {
  return (
    <div className="popup-overlay">
      <div className="popup-scout">
        <div className="popup-titre">Scout — {pieces.length} prochaines pièces</div>
        {echanges && echanges.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
            {echanges.length} pièce{echanges.length > 1 ? "s" : ""} de ta main échangée{echanges.length > 1 ? "s" : ""} aléatoirement
          </div>
        )}
        <div className="scout-pieces">
          {pieces.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <MiniPiece piece={p} couleur={couleur} estSelectionnee={false} onClick={() => {}} />
              <span style={{ fontSize: 9, color: "var(--muted)" }}>{i + 1}</span>
            </div>
          ))}
        </div>
        <button className="popup-btn" onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}

// ── Popup Reconnaissance ──────────────────────────────────────
function PopupReconnaissance({ indice, onTenter, onFermer, tenteeDejaFaite }) {
  const [proposition, setProposition] = useState("");
  const [resultat, setResultat] = useState(null);
  const handleTenter = async () => { const res = await onTenter(proposition); setResultat(res); };
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir">
        <div className="popup-titre"> Reconnaissance</div>
        {!tenteeDejaFaite && !resultat && (
          <>
            <div className="popup-sous-titre">
              Longueur : <strong>{indice?.longueur}</strong> lettres &nbsp; Commence par : <strong>{indice?.premiere_lettre}</strong>
            </div>
            <input className="lobby-input" placeholder="Ton estimation..." maxLength={12}
              value={proposition} onChange={e => setProposition(e.target.value)}
              onKeyDown={e => e.key === "Enter" && proposition.trim() && handleTenter()} />
            <button className="btn-valider" onClick={handleTenter} disabled={!proposition.trim()}>Valider</button>
          </>
        )}
        {resultat && (
          <div style={{ textAlign: "center" }}>
            {resultat.succes
              ? <div style={{ color: "#88ff88", fontSize: 20 }}> Bravo ! Double tour activé !</div>
              : <div style={{ color: "#ff8888" }}> Raté. Le nom était : <strong>{resultat.nom_reel}</strong></div>}
          </div>
        )}
        {tenteeDejaFaite && !resultat && <div style={{ color: "var(--muted)" }}>Tentative déjà utilisée.</div>}
        <button className="popup-btn" onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}

// ── Popup Manuel ──────────────────────────────────────────────
function PopupManuel({ onFermer }) {
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir" style={{ maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}>
        <div className="popup-titre">Manuel ELMAAS</div>
        <div className="manuel-content">
          <div className="manuel-section">
            <div className="manuel-titre-section">Objectif</div>
            <p>Chaque joueur pose des pièces tetrominos sur un plateau généré depuis une photo. Complétez le plus de puzzles à votre couleur pour gagner la manche.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Types de puzzles</div>
            <p><span className="tag-rouge">R</span> Rouge — completé si toutes ses cellules sont rouges (rouge gagne) ou toutes noires (noir gagne). Un melange bloque la completion.</p>
            <p><span className="tag-noir">N</span> Noir — meme logique inversee.</p>
            <p><span className="tag-mixte">R+N</span> Mixte — doit contenir les deux couleurs. Le joueur qui pose la derniere piece le gagne.</p>
            <p>Les puzzles mono ont une taille maximale de 6 cellules. Les puzzles mixtes peuvent etre plus grands.</p>
            <p>Un puzzle brise survient quand une completion cree un conflit de couleur dans une intersection. Il est exclu du score.</p>
            <p>Le tag dans le coin indique le type : R, N ou R+N. Un point central indique une cellule en intersection entre deux puzzles.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Actions par tour</div>
            <p> <strong>Poser</strong> — sélectionne une pièce et clique sur le plateau pour la placer.</p>
            <p> <strong>Repiocher</strong> — passe ton tour, échange ta main contre 5 nouvelles pièces.</p>
            <p> <strong>Scout</strong> — voir 10 prochaines pièces. En échange 2 de ta main sont swappées. Dispo si &gt; 3 pièces en main.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Après un puzzle complété</div>
            <p> <strong>Rien</strong> — passer au tour suivant.</p>
            <p> <strong>Protéger</strong> — clique une de tes pièces. Invulnérable pendant 1 tour.</p>
            <p> <strong>Échanger</strong> — clique une pièce adverse. Elle devient ta couleur. Les pièces protégées sont immunisées.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Séries et bonus</div>
            <p> <strong>3 puzzles d'affilée</strong> — extraire jusqu'à 2 pièces. Si tu extrais une des tiennes → recolorier une pièce adverse.</p>
            <p> <strong>5 puzzles d'affilée</strong> — victoire immédiate !</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">️ Timers</div>
            <p>Chaque joueur dispose de 5 minutes. Le chrono tourne uniquement pendant ton tour. À 0, tu perds.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Pieces disponibles</div>
            <p>10 formes de pieces existent, chacune avec une probabilite d obtention differente :</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginTop: 6, fontSize: 13 }}>
              {[
                ["I2", "2 cases en ligne", "20%"],
                ["I3", "3 cases en ligne", "15%"],
                ["I4", "4 cases en ligne", "8%"],
                ["L",  "Forme L",          "12%"],
                ["J",  "Forme J",          "12%"],
                ["T",  "Forme T",          "12%"],
                ["S",  "Forme S",          "8%"],
                ["Z",  "Forme Z",          "8%"],
                ["O",  "Carre 2x2",        "10%"],
                ["1",  "1 case (rare)",    "5%"],
              ].map(([nom, desc, pct]) => (
                <div key={nom} style={{ display: "flex", gap: 8, alignItems: "center", padding: "3px 0", borderBottom: "1px solid var(--bord)" }}>
                  <span style={{ color: "var(--rouge-c)", fontWeight: 700, minWidth: 24 }}>{nom}</span>
                  <span style={{ color: "var(--muted)", flex: 1 }}>{desc}</span>
                  <span style={{ color: "var(--texte)" }}>{pct}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="manuel-section">
            <div className="manuel-titre-section">Regeneration des pieces</div>
            <p>Les pieces se regenerent automatiquement quand ta reserve est vide. Tu disposes de 5 pieces pour completer au moins un puzzle. Si tu n'y arrives pas : defaite immediate. Si tu reussis, tu regois 10 nouvelles pieces, puis 15 au cycle suivant.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Score et victoire</div>
            <p>Le score est calcule en cellules : chaque cellule d'un puzzle complete compte pour le joueur qui l'a complete, peu importe la couleur des pieces. Le joueur avec le plus de cellules remporte la manche.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Pause et revanche</div>
            <p>N'importe quel joueur peut demander une pause. L'adversaire peut l'accepter ou la refuser. En fin de manche, une revanche peut etre lancee : le plateau est conserve, les roles inverses — le joueur Noir commence toujours en revanche.</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">Reconnaissance (multijoueur)</div>
            <p>Le J1 saisit un nom secret (max 10 car.). Le J2 peut tenter de le deviner a tout moment. Tolerance : 1 faute si longueur inferieure ou egale a 5, sinon 2. Si reussi : bonus double tour.</p>
          </div>
        </div>
        <button className="popup-btn" onClick={onFermer}>Fermer</button>
      </div>
    </div>
  );
}
// ── Popup fin de partie / temps écoulé ────────────────────────
function PopupFinPartie({ titre, message, gagnant, couleurGagnant, onFermer, onRevanche }) {
  return (
    <div className="popup-overlay" onClick={onFermer}>
      <div className="popup-pouvoir popup-fin" onClick={(e) => e.stopPropagation()}>
        <div className="popup-titre">{titre}</div>
        <div className="popup-sous-titre">{message}</div>

        {gagnant && (
          <div className={`popup-gagnant ${couleurGagnant}`}>
             {gagnant} gagne !
          </div>
        )}

        <div className="popup-options-fin">
          {onRevanche && (
            <button className="popup-btn popup-btn-revanche" onClick={onRevanche}>
               Revanche
            </button>
          )}
          <button className="popup-btn" onClick={onFermer}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
// ── App principale ────────────────────────────────────────────
export default function App() {
  const [utilisateur, setUtilisateur] = useState(() => getUser());
  const [showClassement, setShowClassement] = useState(false);
  const [showParametres, setShowParametres] = useState(false);
  const [nbAbandons, setNbAbandons] = useState(() => parseInt(localStorage.getItem("elmaas_abandons") || "0"));
  const [banniJusque, setBanniJusque] = useState(() => localStorage.getItem("elmaas_banni_jusque") || null);
  const [etape, setEtape] = useState(() => getUser() ? "taille" : "auth");
  const [props, setProps] = useState({ j1: 16, j2: 16, taille: 16 });
  const [partieId, setPartieId] = useState(null);
  const [etat, setEtat] = useState(null);
  const [pixelsPhoto, setPixelsPhoto] = useState(null);
  const [taille, setTaille] = useState(16);
  const [pieceIdx, setPieceIdx] = useState(null);
  const [popup, setPopup] = useState(null);
  const [scoutPieces, setScoutPieces] = useState([]);
  const [modeIA, setModeIA] = useState("aucune");
  const [niveauIA, setNiveauIA] = useState(2);
  const [iaEnCours, setIaEnCours] = useState(false);
  const socketRef = useRef(null);
  const [monRole, setMonRole] = useState(null);
  const [statutConnexion, setStatutConnexion] = useState("attente");
  const [modeMultijoueur, setModeMultijoueur] = useState(false);
  const [bonusDoubleActif, setBonusDoubleActif] = useState(false);
  const [bonusUtilise, setBonusUtilise] = useState(false);
  const [reconnaissanceTentee, setReconnaissanceTentee] = useState(false);
  const [indiceReconnaissance, setIndiceReconnaissance] = useState(null);

  // Timers
  const [timerChoisi, setTimerChoisi] = useState(30);
  const [timerRouge, setTimerRouge] = useState(30);
  const [timerNoir, setTimerNoir] = useState(30);
  const [scoresManches, setScoresManches] = useState({ rouge: 0, noir: 0 });
  const [mancheTermineeInfo, setMancheTermineeInfo] = useState(null); // { gagnant, scoreRouge, scoreNoir }
  const [pauseActive, setPauseActive] = useState(false);
  const [demandePauseRecue, setDemandePauseRecue] = useState(null); // couleur demandeur
  const timerRef = useRef(null);

  // Extraction série
  const [extractionsEnCours, setExtractionsEnCours] = useState([]);
  const [pieceADonner, setPieceADonner] = useState(null); // index de ma pièce à donner dans l'échange
  // Quand true : puzzle complété, tour PAS encore passé côté serveur
  const [attenteChoixPouvoir, setAttenteChoixPouvoir] = useState(false);

  // ── Timer synchronisé via timestamp serveur ──
  // Quand le tour change, le serveur envoie timestamp_debut_tour.
  // Les deux clients calculent le temps restant à partir du même timestamp.
  useEffect(() => {
    clearInterval(timerRef.current);
    if (etape !== "jeu" || !etat || etat.manche_terminee || attenteChoixPouvoir || popup) return;
    // En multijoueur, attendre que les deux joueurs soient connectés
    if (modeMultijoueur && statutConnexion !== "connecte") return;
    if (estTourIA) return; // Timer suspendu pendant tour IA

    const tsDebut = etat.timestamp_debut_tour ? etat.timestamp_debut_tour * 1000 : Date.now();

    // Réinitialiser le bon timer au début de chaque tour
    if (etat.tour_actuel === 0) setTimerRouge(timerChoisi);
    else setTimerNoir(timerChoisi);

   timerRef.current = setInterval(() => {
      const ecoule = Math.floor((Date.now() - tsDebut) / 1000);
      const restant = Math.max(0, timerChoisi - ecoule);
      if (etat.tour_actuel === 0) {
        setTimerRouge(restant);
        if (restant <= 0) {
          clearInterval(timerRef.current);
          setPopup({
            type: "temps_ecoule",
            titre: "Temps écoulé",
            message: "Le Rouge n'a pas joué à temps.",
            gagnant: "Noir",
            couleurGagnant: "noir"
          });
        }
      } else {
        setTimerNoir(restant);
        if (restant <= 0) {
          clearInterval(timerRef.current);
          setPopup({
            type: "temps_ecoule",
            titre: "Temps écoulé",
            message: "Le Noir n'a pas joué à temps.",
            gagnant: "Rouge",
            couleurGagnant: "rouge"
          });
        }
      }
    }, 200); 
    return () => clearInterval(timerRef.current);
  }, [etape, etat?.tour_actuel, etat?.manche_terminee, etat?.timestamp_debut_tour, attenteChoixPouvoir, popup, modeMultijoueur, statutConnexion, timerChoisi]);

  // ── WebSocket ──
  useEffect(() => {
    const socket = io(API, { transports: ["polling", "websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => console.log("[ws] Connecte"));
    socket.on("rejoint", (data) => { setEtat(data.etat); });
    socket.on("partie_prete", (data) => {
      setStatutConnexion("connecte");
      setEtat(data.etat);
      setTimeout(() => setEtape("jeu"), 800);
    });
    socket.on("etat_mis_a_jour", (data) => {
      setEtat(data.etat);
      if (data.scores_manches) setScoresManches(data.scores_manches);
      if (data.regeneration) {
        // Afficher une notification de régénération (simple)
        console.log("[ELMAAS] Regeneration:", data.regeneration);
      }
      if (data.manche_terminee && data.gagnant) {
        const scores = calculer_scores_locaux(data.etat);
        setMancheTermineeInfo({ gagnant: data.gagnant, scores });
      }
    });
    socket.on("pause_demandee", (data) => { setDemandePauseRecue(data.couleur); });
    socket.on("pause_active",   () => { setPauseActive(true); setDemandePauseRecue(null); });
    socket.on("pause_terminee", () => { setPauseActive(false); });
    socket.on("pause_refusee",  () => { setDemandePauseRecue(null); });
    socket.on("revanche_lancee", (data) => {
      setEtat(data.etat);
      if (data.scores_manches) setScoresManches(data.scores_manches);
      setMancheTermineeInfo(null);
      setPauseActive(false);
    });
    socket.on("erreur", () => { setStatutConnexion("erreur"); });
    return () => socket.disconnect();
  }, []);

  // Calcule les scores depuis l'état (cellules dans puzzles complétés)
  const calculer_scores_locaux = (etatLocal) => {
    if (!etatLocal) return { rouge: 0, noir: 0 };
    const puzzles = etatLocal.plateau?.puzzles || {};
    let rouge = 0, noir = 0;
    Object.values(puzzles).forEach(p => {
      if (p.brise) return;
      const nb = (p.cellules || []).length;
      if (p.complete_par === "rouge") rouge += nb;
      if (p.complete_par === "noir")  noir  += nb;
    });
    return { rouge, noir };
  };

  const handleTailleValidee = (j1, j2, tailleFin, mode, niveau, timer) => {
    setProps({ j1, j2, taille: tailleFin });
    setModeIA(mode || "aucune");
    setNiveauIA(niveau || 2);
    setTimerChoisi(timer || 30);
    setTimerRouge(timer || 30);
    setTimerNoir(timer || 30);
    setEtape("photo");
  };

  const handlePartieCreee = useCallback((id, etatInit, pixels, t, timerSec, scoresManchesInit) => {
    setPartieId(id); setEtat(etatInit); setPixelsPhoto(pixels); setTaille(t || 16);
    if (timerSec) { setTimerChoisi(timerSec); setTimerRouge(timerSec); setTimerNoir(timerSec); }
    if (scoresManchesInit) setScoresManches(scoresManchesInit);
    if (modeIA !== "aucune") {
      setMonRole("joueur1"); setModeMultijoueur(false); setEtape("jeu");
    } else {
      setMonRole("joueur1"); setModeMultijoueur(true); setEtape("lobby");
      socketRef.current.emit("rejoindre_partie", { partie_id: id, joueur: "joueur1" });
    }
  }, [modeIA]);

  const handleRejoindreManuellement = useCallback(async (id) => {
    if (!id) return;
    setPartieId(id); setMonRole("joueur2"); setModeMultijoueur(true); setEtape("lobby");
    try {
      const res = await axios.get(`${API}/pixels/${id}`);
      setPixelsPhoto(res.data.pixels_photo);
      setTaille(res.data.taille);
      if (res.data.etat) setEtat(res.data.etat);
      if (res.data.indice) setIndiceReconnaissance(res.data.indice);
    } catch (err) { console.error("Pixels introuvables:", err); }
    socketRef.current.emit("rejoindre_partie", { partie_id: id, joueur: "joueur2" });
  }, []);

  const declencherIA = useCallback(async (etatCourant, partieIdCourant, mode, niveau) => {
    if (!partieIdCourant || !etatCourant || mode === "aucune") return;
    const tourIA = mode === "j1" ? 0 : 1;
    if (etatCourant.tour_actuel !== tourIA || etatCourant.manche_terminee) return;
    setIaEnCours(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const res = await axios.post(`${API}/ia/${partieIdCourant}`, { niveau });
      setEtat(res.data.etat);
    } catch (err) { console.error("Erreur IA:", err); }
    finally { setIaEnCours(false); }
  }, []);

  useEffect(() => {
    if (etape === "jeu" && etat && partieId && modeIA !== "aucune" && !iaEnCours && !attenteChoixPouvoir) {
      const tourIA = modeIA === "j1" ? 0 : 1;
      if (etat.tour_actuel === tourIA && !etat.manche_terminee) declencherIA(etat, partieId, modeIA, niveauIA);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat?.tour_actuel, etape, partieId, attenteChoixPouvoir]);

  // ── Dérivés ──
  const joueurActif  = etat ? (etat.tour_actuel === 0 ? etat.joueur1 : etat.joueur2) : null;
  const joueurAdverse = etat ? (etat.tour_actuel === 0 ? etat.joueur2 : etat.joueur1) : null;
  const estTourIA = etat && modeIA !== "aucune" &&
    ((modeIA === "j1" && etat.tour_actuel === 0) || (modeIA === "j2" && etat.tour_actuel === 1));
  const estMonTour = !modeMultijoueur || !monRole ||
    (monRole === "joueur1" && etat?.tour_actuel === 0) ||
    (monRole === "joueur2" && etat?.tour_actuel === 1);

  const enModeCible = ["attente_cible", "attente_extraire", "attente_recoloriage"].includes(popup?.type);

  // Ref sur popup pour éviter closure stale dans les callbacks
  const popupRef = useRef(null);
  useEffect(() => { popupRef.current = popup; }, [popup]);

  // ── Envoyer pouvoir → le serveur passe le tour ──
  const envoyerPouvoir = useCallback(async (body) => {
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, { action: "pouvoir", ...body });
      setEtat(res.data.etat);
      setAttenteChoixPouvoir(false);
      setPopup(null);
      if ((res.data.recoloriages_possibles ?? 0) > 0) {
        setPopup({ type: "attente_recoloriage", message: "Clique sur une pièce adverse pour la recolorier" });
        return;
      }
      await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
    } catch (err) { console.error("Erreur pouvoir:", err); }
  }, [partieId, modeIA, niveauIA, declencherIA]);

  // ── Poser une pièce ──
  const handlePoserPiece = useCallback(async (idx, origine) => {
    if (!partieId || estTourIA || !estMonTour) return;
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, {
        action: "poser", piece_index: idx, origine, pouvoir: "rien",
      });
      setEtat(res.data.etat);
      setPieceIdx(null);

      // Si le double tour a été consommé côté serveur, mettre à jour l'état client
      if (res.data.double_tour_consomme) {
        setBonusDoubleActif(false);
        setBonusUtilise(false);
      }

      if (res.data.scores_manches) setScoresManches(res.data.scores_manches);
      if (res.data.manche_terminee || res.data.victoire_immediate) {
        const scores = calculer_scores_locaux(res.data.etat);
        setMancheTermineeInfo({ gagnant: res.data.gagnant, scores });
        return;
      }

      const puzzlesCompletes = res.data.puzzles_completes || [];
      const attenteServeur = res.data.attente_pouvoir === true;
      if (puzzlesCompletes.length > 0 || attenteServeur) {
        const tourJoueur = res.data.etat?.tour_actuel ?? 0;
        const joueurQuiJoue = tourJoueur === 0 ? res.data.etat?.joueur1 : res.data.etat?.joueur2;
        const serie = joueurQuiJoue?.serie_actuelle ?? 0;
        setAttenteChoixPouvoir(true);
        setPopup({ type: "pouvoir", serie });
      } else {
        await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
      }
    } catch (err) { console.error(err); }
  }, [partieId, estTourIA, estMonTour, bonusDoubleActif, bonusUtilise, monRole, modeIA, niveauIA, declencherIA]);

  // ── Choix dans la popup pouvoir ──
  const handlePouvoir = useCallback((choix) => {
    setPopup(null);
    if (choix === "rien") {
      envoyerPouvoir({ pouvoir: "rien" });
    } else if (choix === "proteger") {
      // Clic direct dans la liste des pièces (panneau gauche)
      setAttenteChoixPouvoir(true);
      setPopup({ type: "attente_cible", pouvoir: "proteger", message: "Clique sur une de tes pièces dans le panneau gauche" });
    } else if (choix === "echanger") {
      setPieceADonner(null);
      setAttenteChoixPouvoir(true);
      setPopup({ type: "attente_cible", pouvoir: "echanger", message: "1) Clique sur ta pièce à donner (vert), puis la pièce adverse à prendre (rouge)" });
    } else if (choix === "extraire") {
      setExtractionsEnCours([]);
      setAttenteChoixPouvoir(true);
      setPopup({ type: "attente_extraire", message: "Clique sur 1 ou 2 pièces sur le plateau, puis Confirmer" });
    }
  }, [envoyerPouvoir]);

  // ── Clic plateau en mode pouvoir ──
  const handleCiblePouvoir = useCallback(async (position) => {
    const p = popupRef.current;
    if (!p) return;

    if (p.type === "attente_extraire") {
      const posKey = `${position[0]},${position[1]}`;
      setExtractionsEnCours(prev => {
        if (prev.find(x => `${x[0]},${x[1]}` === posKey)) return prev;
        if (prev.length >= 2) return prev;
        return [...prev, position];
      });
      return;
    }

    if (p.type === "attente_recoloriage") {
      setPopup(null);
      try {
        const res = await axios.post(`${API}/jouer/${partieId}`, {
          action: "pouvoir", pouvoir: "recoloriage", cible_pouvoir: position,
        });
        setEtat(res.data.etat);
        await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
      } catch (err) { console.error("Erreur recoloriage:", err); }
      return;
    }

    if (p.type === "attente_cible") {
      const pouvoir = p.pouvoir;
      setPopup(null);
      await envoyerPouvoir({ pouvoir, cible_pouvoir: position });
    }
  }, [partieId, modeIA, niveauIA, declencherIA, envoyerPouvoir]);

  // ── Confirmer extraction ──
  const handleConfirmerExtraction = useCallback(async () => {
    setPopup(null);
    if (extractionsEnCours.length === 0) {
      await envoyerPouvoir({ pouvoir: "rien" });
    } else {
      await envoyerPouvoir({ pouvoir: "extraire", extraire: extractionsEnCours });
    }
    setExtractionsEnCours([]);
  }, [extractionsEnCours, envoyerPouvoir]);

  const handleRepiocher = async () => {
    if (!estMonTour) return;
    const res = await axios.post(`${API}/jouer/${partieId}`, { action: "repiocher" });
    setEtat(res.data.etat);
    await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
  };

  const [scoutEchanges, setScoutEchanges] = useState([]);

  const handleScout = async () => {
    if (!estMonTour) return;
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, { action: "scout" });
      if (res.data.succes === false) { console.error("Scout échoué:", res.data.erreur); return; }
      setEtat(res.data.etat);
      setScoutPieces(res.data.pieces_vues || []);
      setScoutEchanges(res.data.echanges || []);
      setPopup({ type: "scout" });
    } catch (err) { console.error("Erreur scout:", err); }
  };

  const handleAbandon = () => {
    // Compter les abandons en cours de partie
    if (etape === "jeu" && etat && !etat.manche_terminee) {
      const nouveauxAbandons = nbAbandons + 1;
      setNbAbandons(nouveauxAbandons);
      localStorage.setItem("elmaas_abandons", String(nouveauxAbandons));
      if (nouveauxAbandons >= 3) {
        const jusque = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        setBanniJusque(jusque);
        localStorage.setItem("elmaas_banni_jusque", jusque);
        setNbAbandons(0);
        localStorage.setItem("elmaas_abandons", "0");
        alert("3 abandons consecutifs — vous etes banni pendant 24h.");
      }
    }
    handleReset();
  };

  const estBanni = () => {
    if (!banniJusque) return false;
    return new Date(banniJusque) > new Date();
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setEtape("taille"); setEtat(null); setPartieId(null);
    setMonRole(null); setModeMultijoueur(false); setStatutConnexion("attente");
    setBonusDoubleActif(false); setBonusUtilise(false);
    setReconnaissanceTentee(false); setIndiceReconnaissance(null);
    setTimerRouge(timerChoisi); setTimerNoir(timerChoisi);
    setExtractionsEnCours([]); setAttenteChoixPouvoir(false); setPopup(null);
    setMancheTermineeInfo(null); setPauseActive(false); setDemandePauseRecue(null);
    setEtape(utilisateur ? "taille" : "auth");
  };
  
  // ── Rendu étapes ──
  if (etape === "taille") return <div className="app"><EcranTaille onValider={handleTailleValidee} /></div>;

  if (etape === "auth") return (
    <div className="app">
      <EcranAuth onConnecte={(user) => { setUtilisateur(user); setEtape("taille"); }} />
    </div>
  );

  if (etape === "photo") return (
    <div className="app">
      <div style={{ position: "absolute", bottom: 32, width: "100%", display: "flex", justifyContent: "center" }}>
        <button className="btn-action" style={{ fontSize: 15, padding: "10px 20px" }}
          onClick={() => { setMonRole("joueur2"); setEtape("lobby"); }}>
          Je suis le Joueur 2 — Rejoindre une partie
        </button>
      </div>
      <EcranPhoto2
        prop1={props.j1} prop2={props.j2} timerSec={timerChoisi}
        utilisateur={utilisateur}
        modeIA={modeIA}
        onPartieCreee={handlePartieCreee}
      />
    </div>
  );

  if (etape === "lobby") return (
    <div className="app">
      <EcranLobby partieId={partieId} monRole={monRole} statutConnexion={statutConnexion}
        onRejoindreManuellement={handleRejoindreManuellement} />
    </div>
  );

  // ── Écran jeu ──
  return (
    <div className="app jeu">

      {showClassement && <EcranClassement utilisateur={utilisateur} onFermer={() => setShowClassement(false)} />}

      {showParametres && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ minWidth: 320, gap: 14 }}>
            <div className="popup-titre">Parametres</div>

            {/* Compte */}
            {utilisateur && (
              <div style={{ width: "100%", borderBottom: "1px solid var(--bord)", paddingBottom: 12 }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Compte</div>
                <div style={{ fontSize: 15, color: "var(--texte)", marginBottom: 8 }}>{utilisateur.pseudo} — {utilisateur.email}</div>
                <div style={{ fontSize: 13, color: "var(--rouge-c)", marginBottom: 8 }}>ELO : {utilisateur.elo}</div>
                <button className="popup-btn" style={{ fontSize: 13 }}
                  onClick={() => {
                    localStorage.removeItem("elmaas_token");
                    localStorage.removeItem("elmaas_user");
                    setUtilisateur(null);
                    setShowParametres(false);
                    handleReset();
                  }}>
                  Se deconnecter
                </button>
              </div>
            )}

            {/* Langue */}
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Langue</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["fr","Francais"],["en","English"],["ar","العربية"],["es","Español"]].map(([code, nom]) => (
                  <button key={code} className="ia-btn" style={{ fontSize: 13 }}
                    onClick={() => alert("Traductions a venir !")}>
                    {nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium */}
            {utilisateur && !utilisateur.premium && (
              <button className="btn-valider" style={{ fontSize: 14, padding: "10px 24px" }}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("elmaas_token");
                   const res = await fetch(`${API}/stripe/checkout`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch(e) { alert("Erreur paiement"); }
                }}>
                Passer Premium — 6.99€/mois
              </button>
            )}
            {utilisateur?.premium && (
              <div style={{ color: "#88ff88", fontSize: 14 }}>Premium actif</div>
            )}

            <button className="popup-btn" onClick={() => setShowParametres(false)}>Fermer</button>
          </div>
        </div>
      )}
      
      {/* Écran fin de manche */}
      {mancheTermineeInfo && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ minWidth: 380, gap: 16 }}>
            {/* Titre victoire/défaite selon le joueur local */}
            {(() => {
              const g = mancheTermineeInfo.gagnant;
              const maCouleur = monRole === "joueur2" ? "noir" : "rouge";
              const jaiGagne = g === maCouleur;
              const egalite = g === "egalite";
              return (
                <>
                  <div className="popup-titre" style={{
                    color: egalite ? "var(--muted)" : jaiGagne ? "#88ff88" : "var(--rouge-c)",
                    fontSize: 32,
                  }}>
                    {egalite ? "Egalite !" : jaiGagne ? "Victoire !" : "Defaite"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {egalite ? "" : jaiGagne ? "Bien joue !" : `${g === "rouge" ? "Rouge" : "Noir"} remporte la manche`}
                  </div>
                </>
              );
            })()}
            <div style={{ display: "flex", gap: 24, justifyContent: "center", fontSize: 32, fontFamily: "var(--brush)", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "var(--rouge-c)", fontWeight: 700 }}>{mancheTermineeInfo.scores?.rouge ?? 0}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Rouge</div>
              </div>
              <span style={{ color: "var(--muted)", fontSize: 20 }}>vs</span>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#aaaaaa", fontWeight: 700 }}>{mancheTermineeInfo.scores?.noir ?? 0}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Noir</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
              Score en cellules de puzzles completes
            </div>
            <div style={{ display: "flex", gap: 24, justifyContent: "center", fontSize: 13, color: "var(--muted)" }}>
              <span>Manches Rouge : <strong style={{ color: "var(--rouge-c)" }}>{scoresManches.rouge}</strong></span>
              <span>Manches Noir : <strong style={{ color: "#aaaaaa" }}>{scoresManches.noir}</strong></span>
            </div>
            <div className="popup-options" style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
              <button className="popup-btn" style={{ flex: 1 }}
                onClick={async () => {
                  const res = await axios.post(`${API}/revanche/${partieId}`);
                  if (res.data.succes) {
                    setEtat(res.data.etat);
                    setScoresManches(res.data.scores_manches);
                    setMancheTermineeInfo(null);
                  }
                }}>
                Revanche
              </button>
              <button className="popup-btn" style={{ flex: 1 }} onClick={handleReset}>
                Nouvelle partie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demande de pause reçue */}
      {demandePauseRecue && !pauseActive && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ gap: 16 }}>
            {demandePauseRecue === (monRole === "joueur2" ? "noir" : "rouge") ? (
              // C'est nous qui avons demandé — on attend
              <>
                <div className="popup-titre">Pause demandée</div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>
                  En attente de la réponse de l'adversaire...
                </div>
                <button className="popup-btn"
                  onClick={() => { setDemandePauseRecue(null); axios.post(`${API}/pause/refuser/${partieId}`); }}>
                  Annuler
                </button>
              </>
            ) : (
              // C'est l'adversaire qui a demandé — on peut accepter ou refuser
              <>
                <div className="popup-titre">Pause demandée</div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>
                  L'adversaire demande une pause.
                </div>
                <div className="popup-options" style={{ flexDirection: "row", gap: 10 }}>
                  <button className="popup-btn" style={{ flex: 1 }}
                    onClick={() => axios.post(`${API}/pause/accepter/${partieId}`)}>
                    Accepter
                  </button>
                  <button className="popup-btn" style={{ flex: 1 }}
                    onClick={() => axios.post(`${API}/pause/refuser/${partieId}`)}>
                    Refuser
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pause active */}
      {pauseActive && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ gap: 16 }}>
            <div className="popup-titre">Jeu en pause</div>
            <button className="popup-btn"
              onClick={() => axios.post(`${API}/pause/reprendre/${partieId}`)}>
              Reprendre
            </button>
          </div>
        </div>
      )}
      

      {/* Popups */}
      {popup?.type === "pouvoir" && <PopupPouvoir serie={popup.serie} onChoisir={handlePouvoir} />}
      {popup?.type === "scout"   && <PopupScout pieces={scoutPieces} couleur={joueurActif?.couleur} echanges={scoutEchanges} onFermer={() => setPopup(null)} />}
      {popup?.type === "manuel"  && <PopupManuel onFermer={() => setPopup(null)} />}
      {popup?.type === "reconnaissance" && (
        <PopupReconnaissance
          indice={indiceReconnaissance}
          tenteeDejaFaite={reconnaissanceTentee}
          onTenter={async (proposition) => {
            const res = await axios.post(`${API}/reconnaitre/${partieId}`, { proposition });
            setReconnaissanceTentee(true);
            if (res.data.succes) setBonusDoubleActif(true);
            return res.data;
          }}
          onFermer={() => setPopup(null)}
        />
      )}

      {/* Bandeaux mode cible */}
      {popup?.type === "attente_cible" && (
        <div className="bandeau-cible">
          <span>{popup.message}</span>
          <button onClick={() => { setAttenteChoixPouvoir(false); setPopup(null); envoyerPouvoir({ pouvoir: "rien" }); }}>Annuler</button>
        </div>
      )}
      {popup?.type === "attente_extraire" && (
        <div className="bandeau-cible">
          <span>{popup.message}</span>
          <span style={{ color: "#ffaa44", fontWeight: 700 }}>
            {extractionsEnCours.length}/2 sélectionnée{extractionsEnCours.length > 1 ? "s" : ""}
          </span>
          <button style={{ background: "#22441188", color: "#88ff88", borderColor: "#88ff8844" }}
            onClick={handleConfirmerExtraction}>
            Confirmer
          </button>
          <button onClick={() => { setExtractionsEnCours([]); setAttenteChoixPouvoir(false); setPopup(null); envoyerPouvoir({ pouvoir: "rien" }); }}>Annuler</button>
        </div>
      )}
        {popup?.type === "attente_recoloriage" && (
          <div className="bandeau-cible">
            <span>{popup.message}</span>
            <button onClick={async () => { setPopup(null); setAttenteChoixPouvoir(false); await declencherIA(etat, partieId, modeIA, niveauIA); }}>Passer</button>
          </div>
        )}
  {popup?.type === "temps_ecoule" && (
  <PopupFinPartie
    titre={popup.titre}
    message={popup.message}
    gagnant={popup.gagnant}
    couleurGagnant={popup.couleurGagnant}
    onFermer={() => {
      setPopup(null);
      handleReset();
    }}
    onRevanche={async () => {
      try {
        const res = await axios.post(`${API}/revanche/${partieId}`);
        if (res.data.succes) {
          // Réinitialiser TOUT le state local lié à la partie en cours
          setEtat(res.data.etat);
          if (res.data.scores_manches) setScoresManches(res.data.scores_manches);
          setTimerRouge(timerChoisi);
          setTimerNoir(timerChoisi);
          setPieceIdx(null);
          setExtractionsEnCours([]);
          setPieceADonner(null);
          setAttenteChoixPouvoir(false);
          setMancheTermineeInfo(null);
          setBonusDoubleActif(false);
          setBonusUtilise(false);
          setReconnaissanceTentee(false);
          setPopup(null);
        } else {
          console.error("Revanche échouée:", res.data);
          setPopup(null);
        }
      } catch (e) {
        console.error("Erreur revanche:", e);
        setPopup(null);
      }
    }}
  />
)}

      {/* Header */}
      <header className="app-header">
        <h1 className="titre-jeu-petit">ELMAAS</h1>

        <div className="scores">
          <div className="score-item rouge">
            <span className="score-nb">{etat?.scores?.rouge ?? 0}</span>
            <span className="score-lbl">Rouge</span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{scoresManches.rouge} manche{scoresManches.rouge > 1 ? "s" : ""}</span>
          </div>
          <div className="score-sep">vs</div>
          <div className="score-item noir">
            <span className="score-nb">{etat?.scores?.noir ?? 0}</span>
            <span className="score-lbl">Noir</span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{scoresManches.noir} manche{scoresManches.noir > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="timers">
          {/* Timer Rouge : caché si l'IA joue Rouge */}
          {modeIA !== "j1" && (
            <TimerBloc secondes={timerRouge} couleur="rouge" actif={etat?.tour_actuel === 0 && !attenteChoixPouvoir && !popup} />
          )}
          {/* Timer Noir : caché si l'IA joue Noir */}
          {modeIA !== "j2" && (
            <TimerBloc secondes={timerNoir}  couleur="noir"  actif={etat?.tour_actuel === 1 && !attenteChoixPouvoir && !popup} />
          )}
        </div>
        <div className="tour-info">
          Tour {etat?.numero_tour} —
          <span className={"couleur-actif " + joueurActif?.couleur}> {joueurActif?.couleur}</span>
          {modeMultijoueur && (
            <span className="badge-ia" style={{ background: estMonTour ? "#22441188" : "#44111188", color: estMonTour ? "#88ff88" : "#ff8888" }}>
              {estMonTour ? "Ton tour" : "Adversaire joue"}
            </span>
          )}
          {bonusDoubleActif && monRole === "joueur2" && (
            <span className="badge-ia" style={{ background: "#44220088", color: "#ffaa44" }}>
              Double tour actif
            </span>
          )}
          {estTourIA && <span className="badge-ia">IA{iaEnCours ? " ..." : ""}</span>}
          {joueurActif?.serie_actuelle >= 3 && <span className="badge-serie"> Série {joueurActif.serie_actuelle}</span>}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {utilisateur && (
            <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
              <div style={{ color: "var(--texte)" }}>{utilisateur.pseudo}</div>
              <div style={{ color: "var(--rouge-c)" }}>ELO {utilisateur.elo}</div>
            </div>
          )}
          <button className="btn-manuel" onClick={() => setShowParametres(true)} title="Parametres"
            style={{ width: 34, height: 34, fontSize: 16 }}>⚙</button>
          <button className="btn-manuel" onClick={() => setShowClassement(true)} title="Classement"
            style={{ width: 34, height: 34, fontSize: 14 }}>ELO</button>
          <button className="btn-manuel" onClick={() => setPopup({ type: "manuel" })} title="Manuel">?</button>
          <button className="btn-reset" onClick={handleAbandon}>Nouvelle partie</button>
        </div>
      </header>

      {/* Zone adverse */}
      <div className="zone-adverse">
        <div className="adverse-label">Adversaire ({joueurAdverse?.couleur}) — {(joueurAdverse?.nb_pieces_reserve || 0) + (joueurAdverse?.main_active?.length || 0)} pièces</div>
        <div className="adverse-pieces">
          {(joueurAdverse?.main_active || []).map((_, i) => (
            <div key={i} className={"piece-cachee " + joueurAdverse?.couleur} />
          ))}
        </div>
      </div>

      {/* Zone de jeu */}
      <div className="zone-jeu">

        <div className="panneau-main">
          {/* ── Mes pièces ── */}
          <div className="panneau-titre">
            Mes pièces ({joueurActif?.couleur})
          </div>
          <div className="main-pieces-list">
            {(joueurActif?.main_active || []).map((piece, i) => {
              // En mode protéger : clic direct sur ma pièce
              const clickProteger = popup?.type === "attente_cible" && popup?.pouvoir === "proteger";
              const clickEchanger = popup?.type === "attente_cible" && popup?.pouvoir === "echanger";
              const estSelectPourDonner = clickEchanger && pieceADonner === i;
              return (
                <div key={i} style={{ position: "relative" }}>
                  <MiniPiece piece={piece} couleur={joueurActif?.couleur}
                    estSelectionnee={pieceIdx === i || estSelectPourDonner}
                    onClick={() => {
                      if (clickProteger) {
                        setPopup(null);
                        envoyerPouvoir({ pouvoir: "proteger_main", piece_index: i });
                      } else if (clickEchanger) {
                        // Sélectionner ma pièce à donner
                        setPieceADonner(pieceADonner === i ? null : i);
                      } else if (!enModeCible && !attenteChoixPouvoir && estMonTour) {
                        setPieceIdx(pieceIdx === i ? null : i);
                      }
                    }} />
                  {clickProteger && (
                    <div style={{ position: "absolute", inset: 0, border: "2px dashed #88ff88",
                      borderRadius: 6, pointerEvents: "none", opacity: 0.7 }} />
                  )}
                  {estSelectPourDonner && (
                    <div style={{ position: "absolute", inset: 0, border: "2px solid #88ff88",
                      borderRadius: 6, pointerEvents: "none" }} />
                  )}
                  {clickEchanger && pieceADonner === null && (
                    <div style={{ position: "absolute", inset: 0, border: "2px dashed #88ff8866",
                      borderRadius: 6, pointerEvents: "none" }} />
                  )}
                </div>
              );
            })}
          </div>
          {(joueurActif?.main_active || []).length === 0 && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Main vide</div>
          )}

          <div className="panneau-titre" style={{ marginTop: 10 }}>
            Réserve : {joueurActif?.nb_pieces_reserve}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            Pièces posées : {joueurActif?.nb_pieces_posees_depuis_regen ?? 0} / {joueurActif?.seuil_regen_actuel ?? 5}
          </div>
          <div className="serie-info">
            Série : {joueurActif?.serie_actuelle}
            {joueurActif?.serie_actuelle >= 3 ? " !" : ""}
          </div>

          {/* ── Pièces adversaires (visible pour echanger) ── */}
          {(() => {
            const clickEchanger = popup?.type === "attente_cible" && popup?.pouvoir === "echanger";
            const mainAdverse = joueurAdverse?.main_active || [];
            const showAdverse = clickEchanger || true; // toujours visible mais grayed sauf en mode echanger
            return showAdverse ? (
              <>
                <div className="panneau-titre" style={{ marginTop: 14, borderColor: joueurAdverse?.couleur === "rouge" ? "#cc220044" : "#44444444" }}>
                  Adversaire ({joueurAdverse?.couleur})
                </div>
                <div className="main-pieces-list">
                  {mainAdverse.map((piece, i) => (
                    <div key={i} style={{ position: "relative", opacity: clickEchanger ? 1 : 0.4 }}>
                      <MiniPiece piece={piece} couleur={joueurAdverse?.couleur}
                        estSelectionnee={false}
                        onClick={() => {
                          if (clickEchanger) {
                            if (pieceADonner === null) {
                              alert("Choisis d'abord ta pièce à donner (en vert)");
                              return;
                            }
                            setPopup(null);
                            setPieceADonner(null);
                            envoyerPouvoir({ pouvoir: "echanger_main", piece_index_adverse: i, piece_index_donner: pieceADonner });
                          }
                        }} />
                      {clickEchanger && (
                        <div style={{ position: "absolute", inset: 0, border: "2px dashed #ff8888",
                          borderRadius: 6, pointerEvents: "none", opacity: 0.8 }} />
                      )}
                    </div>
                  ))}
                </div>
                {mainAdverse.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Main adverse vide</div>
                )}
              </>
            ) : null;
          })()}
        </div>

        <div className="plateau-central">
          <Board
            etat={etat}
            taille={taille}
            couleurJoueur={joueurActif?.couleur}
            pieceSelectionnee={pieceIdx !== null && !enModeCible && !attenteChoixPouvoir ? joueurActif?.main_active[pieceIdx] : null}
            pieceIdx={pieceIdx}
            pixelsPhoto={pixelsPhoto}
            onPoserPiece={!enModeCible && !attenteChoixPouvoir ? handlePoserPiece : null}
            modeCible={enModeCible}
            extractionsEnCours={extractionsEnCours}
            onCibleSelectionnee={enModeCible ? handleCiblePouvoir : null}
          />
        </div>

        <div className="panneau-actions">
          <div className="panneau-titre">Actions</div>
          <button className="btn-action" onClick={handleRepiocher}
            disabled={!estMonTour || enModeCible || attenteChoixPouvoir || estTourIA}>
            Repiocher
          </button>
          <button className="btn-action scout" onClick={handleScout}
            disabled={!estMonTour || enModeCible || attenteChoixPouvoir || estTourIA}>
            Scout
          </button>

          {modeMultijoueur && modeIA === "aucune" && monRole === "joueur2" && indiceReconnaissance && (
            <>
              <button className="btn-action"
                style={{ borderColor: reconnaissanceTentee ? "#444" : "#cc880044", color: reconnaissanceTentee ? "var(--muted)" : "#ffaa44" }}
                onClick={() => setPopup({ type: "reconnaissance" })} disabled={reconnaissanceTentee}>
                {reconnaissanceTentee ? "Déjà tenté" : " Reconnaître"}
              </button>
              {bonusDoubleActif && (
                <div className="hint-action" style={{ color: "#ffaa44", borderColor: "#ffaa4444", background: "#44220011" }}>
                  Double tour actif !
                </div>
              )}
            </>
          )}

          {pieceIdx !== null && estMonTour && !enModeCible && !attenteChoixPouvoir && (
            <div className="hint-action">Clique sur le plateau pour placer</div>
          )}
          {modeIA === "aucune" && (
            <button className="btn-action" style={{ marginTop: "auto", borderColor: "#4444aa44", color: "var(--muted)" }}
              onClick={() => {
                const couleur = monRole === "joueur2" ? "noir" : "rouge";
                axios.post(`${API}/pause/demander/${partieId}`, { couleur });
                setDemandePauseRecue(couleur);
              }}>
              Pause
            </button>
          )}
          {attenteChoixPouvoir && (
            <div className="hint-action" style={{ borderColor: "#cc880044", background: "#44220011", color: "#ffaa44" }}>
              Choisissez votre récompense…
            </div>
          )}
          {!estMonTour && modeMultijoueur && (
            <div className="hint-action" style={{ borderColor: "#ff444444", background: "#ff000011", color: "#ff8888" }}>
              Attends ton tour...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}