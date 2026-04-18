// ELMAAS App.js v8 — Traductions fr/en/ar/es + tous les fixes précédents
import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Board from "./Board";
import { T, LANGUES, t } from "./translations";
import "./App.css";

const API = "https://elmaas.up.railway.app";

// ── Auth helpers ─────────────────────────────────────────────
function getToken() { return localStorage.getItem("elmaas_token"); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem("elmaas_user") || "null"); }
  catch { return null; }
}
function getLangueInitiale() {
  const saved = localStorage.getItem("elmaas_langue");
  const idx = parseInt(saved);
  if (!isNaN(idx) && idx >= 0 && idx < LANGUES.length) return idx;
  return 0;
}

// ── Écran Auth ────────────────────────────────────────────────
function EcranAuth({ onConnecte, L }) {
  const [mode, setMode] = useState("connexion");
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
      setErreur(err.response?.data?.erreur || t("erreurConnexion", L));
    } finally { setChargement(false); }
  };

  return (
    <div className="ecran-taille">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{t("slogan", L)}</p>
      <div className="lobby-card" style={{ minWidth: 340 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["connexion","inscription"].map(m => (
            <button key={m} className={`ia-btn ${mode===m?"actif":""}`}
              onClick={() => { setMode(m); setErreur(null); }}
              style={{ flex: 1 }}>
              {m === "connexion" ? t("connexion", L) : t("inscription", L)}
            </button>
          ))}
        </div>
        {mode === "inscription" && (
          <input className="lobby-input" placeholder={t("pseudo", L)} value={pseudo}
            onChange={e => setPseudo(e.target.value)} style={{ marginBottom: 8 }} />
        )}
        <input className="lobby-input" placeholder={t("email", L)} type="email" value={email}
          onChange={e => setEmail(e.target.value)} style={{ marginBottom: 8 }} />
        <input className="lobby-input" placeholder={t("motDePasse", L)} type="password" value={mdp}
          onChange={e => setMdp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ marginBottom: 8 }} />
        {erreur && <div style={{ color: "#ff6644", fontSize: 13 }}>{erreur}</div>}
        <button className="btn-valider" onClick={handleSubmit} disabled={chargement}>
          {chargement ? "..." : mode === "connexion" ? t("seConnecter", L) : t("creerCompte", L)}
        </button>
        <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:13, marginTop:4 }}
          onClick={() => onConnecte(null)}>
          {t("continuerSansCompte", L)}
        </button>
      </div>
    </div>
  );
}

// ── Écran sélection photo ─────────────────────────────────────
function EcranPhoto2({ prop1, prop2, timerSec, utilisateur, modeIA, onPartieCreee, L }) {
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
      setErreur(t("erreurCreation", L));
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
      <p className="phrase-jeu">{t("choisissezPhoto", L)}</p>

      {modeIA === "aucune" && (
        <div className="nom-photo-section">
          <label className="nom-photo-label">{t("nomSecretPhoto", L)} <span>{t("max10Car", L)}</span></label>
          <input className="nom-photo-input" maxLength={10} placeholder={t("exVacances", L)}
            value={nomPhoto} onChange={e => setNomPhoto(e.target.value)} />
        </div>
      )}

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

      {utilisateur ? (
        peutUploader ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {utilisateur.premium ? t("premiumIllimite", L) : t("unePhotoGratuite", L)}
            </div>
            <label className="zone-upload" htmlFor="photo-perso-input"
              style={{ width: 200, minHeight: 80, cursor: "pointer" }}>
              {apercu
                ? <img src={apercu} alt="apercu" style={{ width: "100%", height: 80, objectFit: "cover" }} />
                : <div className="upload-placeholder" style={{ fontSize: 13 }}>
                    <div className="upload-icone" style={{ fontSize: 24 }}>+</div>
                    <p>{t("maPhoto", L)}</p>
                  </div>}
              <input id="photo-perso-input" type="file" accept="image/*"
                onChange={handleFichier} style={{ display: "none" }} />
            </label>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            {t("photoUtilisee", L)} — <span style={{ color: "var(--rouge-c)" }}>{t("passerPremium", L)}</span>
          </div>
        )
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {t("connectezVous", L)}
        </div>
      )}

      {erreur && <p className="erreur">{erreur}</p>}
      {chargement && <div className="chargement"><div className="spinner" /><p>{t("generation", L)}</p></div>}

      {photoSelectionnee && !chargement && (
        <button className="btn-valider"
          onClick={() => jouerAvecPhoto(
            photoSelectionnee.estFichier ? photoSelectionnee.fichier : photoSelectionnee.url,
            photoSelectionnee.estFichier
          )}>
          {t("jouerAvecPhoto", L)}
        </button>
      )}
    </div>
  );
}

// ── Écran Classement ELO ──────────────────────────────────────
function EcranClassement({ onFermer, utilisateur, L }) {
  const [classement, setClassement] = useState([]);
  useEffect(() => {
    axios.get(`${API}/classement`).then(res => setClassement(res.data));
  }, []);
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir" style={{ maxWidth: 480, maxHeight: "80vh", overflowY: "auto", gap: 12 }}>
        <div className="popup-titre">{t("classementElo", L)}</div>
        {classement.length === 0 && <div style={{ color: "var(--muted)", fontSize: 14 }}>{t("aucunClasse", L)}</div>}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--muted)", borderBottom: "1px solid var(--bord)" }}>
              <th style={{ padding: "4px 8px", textAlign: "left" }}>#</th>
              <th style={{ padding: "4px 8px", textAlign: "left" }}>{t("pseudo", L)}</th>
              <th style={{ padding: "4px 8px", textAlign: "right" }}>ELO</th>
              <th style={{ padding: "4px 8px", textAlign: "right" }}>{t("parties", L)}</th>
              <th style={{ padding: "4px 8px", textAlign: "right" }}>{t("winPct", L)}</th>
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
        <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
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

function EcranTaille({ onValider, L }) {
  const [prop1, setProp1] = useState(16);
  const [modeIA, setModeIA] = useState("aucune");
  const [niveauIA, setNiveauIA] = useState(2);
  const [timerSec, setTimerSec] = useState(30);
  const tailleFin = Math.max(10, Math.min(20, prop1 % 2 === 0 ? prop1 : prop1 - 1));
  return (
    <div className="ecran-taille">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{t("slogan", L)}</p>
      <p className="sous-titre">{t("choisissezTaille", L)}</p>
      <div className="taille-inputs">
        <div className="taille-joueur">
          <label>{t("tailleDuPlateau", L)}</label>
          <input type="range" min="10" max="20" step="2" value={prop1} onChange={e => setProp1(Number(e.target.value))} />
          <span className="taille-val">{prop1}</span>
        </div>
        <div className="taille-result">
          <div className="taille-final">{tailleFin}</div>
          <div className="taille-label">{t("plateau", L)}</div>
        </div>
      </div>

      <div className="ia-section">
        <div className="ia-titre">{t("tempsParTour", L)}</div>
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
        <div className="ia-titre">{t("modeIA", L)}</div>
        <div className="ia-options">
          {[["aucune", t("deuxJoueurs", L)],["j2", t("iaJoueNoir", L)],["j1", t("iaJoueRouge", L)]].map(([val, label]) => (
            <button key={val} className={`ia-btn ${modeIA === val ? "actif" : ""}`} onClick={() => setModeIA(val)}>{label}</button>
          ))}
        </div>
        {modeIA !== "aucune" && (
          <div className="ia-niveau">
            <span>{t("niveauIA", L)}</span>
            {[1,2,3].map(n => (
              <button key={n} className={`ia-btn-niveau ${niveauIA === n ? "actif" : ""}`} onClick={() => setNiveauIA(n)}>
                {n === 1 ? t("facile", L) : n === 2 ? t("moyen", L) : t("expert", L)}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="btn-valider" onClick={() => onValider(prop1, prop1, tailleFin, modeIA, niveauIA, timerSec)}>
        {t("confirmer", L)}
      </button>
    </div>
  );
}

// ── Écran Lobby ───────────────────────────────────────────────
function EcranLobby({ partieId, monRole, statutConnexion, onRejoindreManuellement, L }) {
  const [codeSaisi, setCodeSaisi] = useState("");
  if (monRole === "joueur1") {
    return (
      <div className="ecran-lobby">
        <h1 className="titre-jeu">ELMAAS</h1>
        <p className="phrase-jeu">{t("slogan", L)}</p>
        <div className="lobby-card">
          <div className="lobby-titre">{t("partieCreee", L)}</div>
          <div className="lobby-sous">{t("donnezCodeJ2", L)}</div>
          <div className="lobby-code">{partieId}</div>
          <button className="lobby-copier" onClick={() => navigator.clipboard.writeText(partieId)}>{t("copierCode", L)}</button>
          <div className={`lobby-statut ${statutConnexion}`}>
            {statutConnexion === "attente" && t("attenteJ2", L)}
            {statutConnexion === "connecte" && t("j2Connecte", L)}
            {statutConnexion === "erreur" && t("erreurConnex", L)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="ecran-lobby">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{t("slogan", L)}</p>
      <div className="lobby-card">
        <div className="lobby-titre">{t("rejoindrePartie", L)}</div>
        <div className="lobby-sous">{t("entrerCode", L)}</div>
        <input className="lobby-input" placeholder={t("codePartie", L)}
          value={codeSaisi} onChange={e => setCodeSaisi(e.target.value)} />
        <button className="btn-valider" onClick={() => onRejoindreManuellement(codeSaisi.trim())} disabled={!codeSaisi.trim()}>
          {t("rejoindre", L)}
        </button>
        {statutConnexion === "erreur" && <div className="lobby-statut erreur">{t("partieIntrouvable", L)}</div>}
      </div>
    </div>
  );
}

// ── Timer ─────────────────────────────────────────────────────
function TimerBloc({ secondes, couleur, actif, L }) {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  const danger = secondes <= 10;
  return (
    <div className={`timer-bloc ${couleur} ${actif ? "actif" : ""}`}>
      <span className="timer-label">{couleur === "rouge" ? t("rouge", L) : t("noir", L)}</span>
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

// ── Popup Pouvoir ─────────────────────────────────────────────
function PopupPouvoir({ onChoisir, serie, L }) {
  const estSerie3 = serie >= 3;
  const options = [
    { id: "rien",     label: t("rienFaire", L),  desc: t("rienFaireDesc", L) },
    { id: "proteger", label: t("proteger", L),   desc: t("protegerDesc", L) },
    { id: "echanger", label: t("echanger", L),   desc: t("echangerDesc", L) },
    ...(estSerie3 ? [{ id: "extraire", label: `${t("extraire", L)} (${t("serie", L)} ${serie})`, desc: t("extraireDesc", L) }] : []),
  ];
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir">
        <div className="popup-titre">{estSerie3 ? `${t("serieDe", L)} ${serie}` : t("puzzleComplete", L)}</div>
        <div className="popup-sous-titre">{t("choisirRecompense", L)}</div>
        <div className="popup-options">
          {options.map(opt => (
            <button key={opt.id}
              className={`popup-btn ${opt.id === "extraire" ? "popup-btn-serie" : ""}`}
              onClick={() => onChoisir(opt.id)}>
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
function PopupScout({ pieces, couleur, echanges, onFermer, L }) {
  return (
    <div className="popup-overlay">
      <div className="popup-scout">
        <div className="popup-titre">Scout — {pieces.length} {t("scoutProchaines", L)}</div>
        {echanges && echanges.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
            {echanges.length} {t("pieces", L)} {t("echangeAleatoire", L)}
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
        <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
      </div>
    </div>
  );
}

// ── Popup Reconnaissance ──────────────────────────────────────
function PopupReconnaissance({ indice, onTenter, onFermer, tenteeDejaFaite, L }) {
  const [proposition, setProposition] = useState("");
  const [resultat, setResultat] = useState(null);
  const handleTenter = async () => { const res = await onTenter(proposition); setResultat(res); };
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir">
        <div className="popup-titre">{t("reconnaissance", L)}</div>
        {!tenteeDejaFaite && !resultat && (
          <>
            <div className="popup-sous-titre">
              {t("longueur", L)} <strong>{indice?.longueur}</strong> {t("lettres", L)} &nbsp; {t("commencePar", L)} <strong>{indice?.premiere_lettre}</strong>
            </div>
            <input className="lobby-input" placeholder={t("tonEstimation", L)} maxLength={12}
              value={proposition} onChange={e => setProposition(e.target.value)}
              onKeyDown={e => e.key === "Enter" && proposition.trim() && handleTenter()} />
            <button className="btn-valider" onClick={handleTenter} disabled={!proposition.trim()}>{t("valider", L)}</button>
          </>
        )}
        {resultat && (
          <div style={{ textAlign: "center" }}>
            {resultat.succes
              ? <div style={{ color: "#88ff88", fontSize: 20 }}>{t("bravoDoubleTour", L)}</div>
              : <div style={{ color: "#ff8888" }}>{t("rateNomEtait", L)} <strong>{resultat.nom_reel}</strong></div>}
          </div>
        )}
        {tenteeDejaFaite && !resultat && <div style={{ color: "var(--muted)" }}>{t("tentativeUtilisee", L)}</div>}
        <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
      </div>
    </div>
  );
}

// ── Popup Manuel ──────────────────────────────────────────────
function PopupManuel({ onFermer, L }) {
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir" style={{ maxWidth: 560, maxHeight: "80vh", overflowY: "auto" }}>
        <div className="popup-titre">{t("manuelTitre", L)}</div>
        <div className="manuel-content">
          <div className="manuel-section">
            <div className="manuel-titre-section">{t("objectif", L)}</div>
            <p>{t("objectifDesc", L)}</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">{t("actionsParTour", L)}</div>
            <p><strong>{t("rienFaire", L).replace("Passer", "Poser")}</strong> — {t("cliquerPlateau", L)}</p>
            <p><strong>{t("repiocher", L)}</strong></p>
            <p><strong>Scout</strong></p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section">{t("series", L)}</div>
            <p><strong>3</strong> — {t("extraire", L)}</p>
            <p><strong>5</strong> — {t("victoire", L)}</p>
          </div>
        </div>
        <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
      </div>
    </div>
  );
}

// ── Popup fin de partie ───────────────────────────────────────
function PopupFinPartie({ titre, message, gagnant, couleurGagnant, onFermer, onRevanche, textRevanche, L }) {
  return (
    <div className="popup-overlay" onClick={onFermer}>
      <div className="popup-pouvoir popup-fin" onClick={(e) => e.stopPropagation()}>
        <div className="popup-titre">{titre}</div>
        <div className="popup-sous-titre">{message}</div>

        {gagnant && (
          <div className={`popup-gagnant ${couleurGagnant}`}>
            {gagnant} {t("gagne", L)}
          </div>
        )}

        <div className="popup-options-fin">
          {onRevanche && (
            <button className="popup-btn popup-btn-revanche" onClick={onRevanche}>
              {textRevanche || t("revanche", L)}
            </button>
          )}
          <button className="popup-btn" onClick={onFermer}>
            {t("fermer", L)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App principale ────────────────────────────────────────────
export default function App() {
  const [utilisateur, setUtilisateur] = useState(() => getUser());
  const [indexLangue, setIndexLangue] = useState(getLangueInitiale);
  const L = indexLangue;
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
  const [demandeRevancheRecue, setDemandeRevancheRecue] = useState(null);
  const [revancheDemandeeParMoi, setRevancheDemandeeParMoi] = useState(false);

  const [timerChoisi, setTimerChoisi] = useState(30);
  const [timerRouge, setTimerRouge] = useState(30);
  const [timerNoir, setTimerNoir] = useState(30);
  const [scoresManches, setScoresManches] = useState({ rouge: 0, noir: 0 });
  const [mancheTermineeInfo, setMancheTermineeInfo] = useState(null);
  const [pauseActive, setPauseActive] = useState(false);
  const [demandePauseRecue, setDemandePauseRecue] = useState(null);
  const timerRef = useRef(null);

  const [extractionsEnCours, setExtractionsEnCours] = useState([]);
  const [pieceADonner, setPieceADonner] = useState(null);
  const [attenteChoixPouvoir, setAttenteChoixPouvoir] = useState(false);

  // Sauvegarde de la langue dans localStorage
  const changerLangue = (idx) => {
    setIndexLangue(idx);
    localStorage.setItem("elmaas_langue", String(idx));
    // Direction RTL pour l'arabe
    if (LANGUES[idx].code === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }
  };

  // Appliquer la direction au chargement
  useEffect(() => {
    if (LANGUES[indexLangue].code === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }
  }, [indexLangue]);

  // ── Dérivés ──
  const joueurActif  = etat ? (etat.tour_actuel === 0 ? etat.joueur1 : etat.joueur2) : null;
  const joueurAdverse = etat ? (etat.tour_actuel === 0 ? etat.joueur2 : etat.joueur1) : null;
  const estTourIA = etat && modeIA !== "aucune" &&
    ((modeIA === "j1" && etat.tour_actuel === 0) || (modeIA === "j2" && etat.tour_actuel === 1));

  const estMonTour = modeIA !== "aucune"
    ? !estTourIA
    : (!modeMultijoueur || !monRole ||
      (monRole === "joueur1" && etat?.tour_actuel === 0) ||
      (monRole === "joueur2" && etat?.tour_actuel === 1));

  const enModeCible = ["attente_cible", "attente_extraire", "attente_recoloriage"].includes(popup?.type);

  const popupRef = useRef(null);
  useEffect(() => { popupRef.current = popup; }, [popup]);

  // ── Helper traduire couleur ──
  const trCouleur = (c) => c === "rouge" ? t("rouge", L) : c === "noir" ? t("noir", L) : c;

  // ── Timer ──
  useEffect(() => {
    clearInterval(timerRef.current);
    if (etape !== "jeu" || !etat || etat.manche_terminee || attenteChoixPouvoir || popup) return;
    if (modeMultijoueur && statutConnexion !== "connecte") return;
    if (estTourIA || iaEnCours) return;

    const tsDebut = etat.timestamp_debut_tour ? etat.timestamp_debut_tour * 1000 : Date.now();

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
            titre: t("tempsEcoule", L),
            message: t("rougeNonJoue", L),
            gagnant: t("noir", L),
            couleurGagnant: "noir"
          });
        }
      } else {
        setTimerNoir(restant);
        if (restant <= 0) {
          clearInterval(timerRef.current);
          setPopup({
            type: "temps_ecoule",
            titre: t("tempsEcoule", L),
            message: t("noirNonJoue", L),
            gagnant: t("rouge", L),
            couleurGagnant: "rouge"
          });
        }
      }
    }, 200);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape, etat?.tour_actuel, etat?.manche_terminee, etat?.timestamp_debut_tour, attenteChoixPouvoir, popup, modeMultijoueur, statutConnexion, timerChoisi, estTourIA, iaEnCours, L]);

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
      if (data.manche_terminee && data.gagnant) {
        const scores = calculer_scores_locaux(data.etat);
        setMancheTermineeInfo({ gagnant: data.gagnant, scores });
      }
    });
    socket.on("pause_demandee", (data) => { setDemandePauseRecue(data.couleur); });
    socket.on("pause_active",   () => { setPauseActive(true); setDemandePauseRecue(null); });
    socket.on("pause_terminee", (data) => {
      setPauseActive(false);
      if (data?.etat) setEtat(data.etat);
    });
    socket.on("pause_refusee",  () => { setDemandePauseRecue(null); });
    socket.on("revanche_lancee", (data) => {
      setEtat(data.etat);
      if (data.scores_manches) setScoresManches(data.scores_manches);
      setMancheTermineeInfo(null);
      setPauseActive(false);
      setDemandeRevancheRecue(null);
      setRevancheDemandeeParMoi(false);
      setPieceIdx(null);
      setExtractionsEnCours([]);
      setPieceADonner(null);
      setAttenteChoixPouvoir(false);
      setBonusDoubleActif(false);
      setBonusUtilise(false);
      setReconnaissanceTentee(false);
      setPopup(null);
      setTimerRouge(timerChoisi);
      setTimerNoir(timerChoisi);
    });
    socket.on("revanche_demandee", (data) => { setDemandeRevancheRecue(data.couleur); });
    socket.on("revanche_refusee", () => {
      setDemandeRevancheRecue(null);
      setRevancheDemandeeParMoi(false);
    });
    socket.on("erreur", () => { setStatutConnexion("erreur"); });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handlePartieCreee = useCallback((id, etatInit, pixels, tt, timerSec, scoresManchesInit) => {
    setPartieId(id); setEtat(etatInit); setPixelsPhoto(pixels); setTaille(tt || 16);
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
      if (res.data.timer_sec) {
        setTimerChoisi(res.data.timer_sec);
        setTimerRouge(res.data.timer_sec);
        setTimerNoir(res.data.timer_sec);
      }
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
    } catch (err) {
      console.error("Erreur IA:", err);
      if (err.response?.status === 404) {
        setPopup({
          type: "temps_ecoule",
          titre: t("partiePerdue", L),
          message: t("serveurRedemarre", L),
          gagnant: null,
          couleurGagnant: null
        });
      }
    }
    finally { setIaEnCours(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  useEffect(() => {
    if (etape === "jeu" && etat && partieId && modeIA !== "aucune" && !iaEnCours && !attenteChoixPouvoir) {
      const tourIA = modeIA === "j1" ? 0 : 1;
      if (etat.tour_actuel === tourIA && !etat.manche_terminee) declencherIA(etat, partieId, modeIA, niveauIA);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat?.tour_actuel, etape, partieId, attenteChoixPouvoir]);

  const gererErreur404 = (err) => {
    if (err.response?.status === 404) {
      setPopup({
        type: "temps_ecoule",
        titre: t("partiePerdue", L),
        message: t("serveurRedemarre", L),
        gagnant: null,
        couleurGagnant: null
      });
      return true;
    }
    return false;
  };

  const envoyerPouvoir = useCallback(async (body) => {
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, { action: "pouvoir", ...body });
      setEtat(res.data.etat);
      setAttenteChoixPouvoir(false);
      setPopup(null);
      if ((res.data.recoloriages_possibles ?? 0) > 0) {
        setPopup({ type: "attente_recoloriage", message: t("cliquerPieceAdverse", L) });
        return;
      }
      await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
    } catch (err) {
      console.error("Erreur pouvoir:", err);
      gererErreur404(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partieId, modeIA, niveauIA, declencherIA, L]);

  const handlePoserPiece = useCallback(async (idx, origine) => {
    if (!partieId || estTourIA || !estMonTour) return;
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, {
        action: "poser", piece_index: idx, origine, pouvoir: "rien",
      });
      setEtat(res.data.etat);
      setPieceIdx(null);

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
    } catch (err) {
      console.error("Erreur pose:", err);
      gererErreur404(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partieId, estTourIA, estMonTour, modeIA, niveauIA, declencherIA, L]);

  const handlePouvoir = useCallback((choix) => {
    setPopup(null);
    if (choix === "rien") {
      envoyerPouvoir({ pouvoir: "rien" });
    } else if (choix === "proteger") {
      setAttenteChoixPouvoir(true);
      setPopup({ type: "attente_cible", pouvoir: "proteger", message: t("cliquerTienne", L) });
    } else if (choix === "echanger") {
      setPieceADonner(null);
      setAttenteChoixPouvoir(true);
      setPopup({ type: "attente_cible", pouvoir: "echanger", message: t("cliquerDonnerPrendre", L) });
    } else if (choix === "extraire") {
      setExtractionsEnCours([]);
      setAttenteChoixPouvoir(true);
      setPopup({ type: "attente_extraire", message: t("cliquer1ou2", L) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envoyerPouvoir, L]);

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
      } catch (err) {
        console.error("Erreur recoloriage:", err);
        gererErreur404(err);
      }
      return;
    }

    if (p.type === "attente_cible") {
      const pouvoir = p.pouvoir;
      setPopup(null);
      await envoyerPouvoir({ pouvoir, cible_pouvoir: position });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partieId, modeIA, niveauIA, declencherIA, envoyerPouvoir, L]);

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
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, { action: "repiocher" });
      setEtat(res.data.etat);
      await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
    } catch (err) {
      console.error("Erreur repiocher:", err);
      gererErreur404(err);
    }
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
    } catch (err) {
      console.error("Erreur scout:", err);
      gererErreur404(err);
    }
  };

  const handleAbandon = () => {
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
      }
    }
    handleReset();
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setEtat(null); setPartieId(null);
    setMonRole(null); setModeMultijoueur(false); setStatutConnexion("attente");
    setBonusDoubleActif(false); setBonusUtilise(false);
    setReconnaissanceTentee(false); setIndiceReconnaissance(null);
    setTimerRouge(timerChoisi); setTimerNoir(timerChoisi);
    setExtractionsEnCours([]); setAttenteChoixPouvoir(false); setPopup(null);
    setMancheTermineeInfo(null); setPauseActive(false); setDemandePauseRecue(null);
    setDemandeRevancheRecue(null); setRevancheDemandeeParMoi(false);
    setEtape(utilisateur ? "taille" : "auth");
  };

  const lancerRevanche = useCallback(async () => {
    const maCouleur = monRole === "joueur2" ? "noir" : "rouge";

    if (modeMultijoueur) {
      try {
        const res = await axios.post(`${API}/revanche/demander/${partieId}`, { couleur: maCouleur });
        if (res.data.en_attente) setRevancheDemandeeParMoi(true);
        setMancheTermineeInfo(null);
        setPopup(null);
      } catch (e) {
        console.error("Erreur demande revanche:", e);
        gererErreur404(e);
      }
    } else {
      try {
        const res = await axios.post(`${API}/revanche/${partieId}`);
        if (res.data.succes) {
          setAttenteChoixPouvoir(true);
          setEtat(res.data.etat);
          if (res.data.scores_manches) setScoresManches(res.data.scores_manches);
          setTimerRouge(timerChoisi);
          setTimerNoir(timerChoisi);
          setPieceIdx(null);
          setExtractionsEnCours([]);
          setPieceADonner(null);
          setMancheTermineeInfo(null);
          setBonusDoubleActif(false);
          setBonusUtilise(false);
          setReconnaissanceTentee(false);
          setPopup(null);

          await new Promise(r => setTimeout(r, 150));
          setAttenteChoixPouvoir(false);

          if (res.data.etat) {
            await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
          }
        }
      } catch (e) {
        console.error("Erreur revanche IA:", e);
        gererErreur404(e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monRole, modeMultijoueur, partieId, timerChoisi, modeIA, niveauIA, declencherIA, L]);

  // ── Rendu étapes ──
  if (etape === "taille") return <div className="app"><EcranTaille onValider={handleTailleValidee} L={L} /></div>;

  if (etape === "auth") return (
    <div className="app">
      <EcranAuth onConnecte={(user) => { setUtilisateur(user); setEtape("taille"); }} L={L} />
    </div>
  );

  if (etape === "photo") return (
    <div className="app">
      {modeIA === "aucune" && (
        <div style={{ position: "absolute", bottom: 32, width: "100%", display: "flex", justifyContent: "center" }}>
          <button className="btn-action" style={{ fontSize: 15, padding: "10px 20px" }}
            onClick={() => { setMonRole("joueur2"); setEtape("lobby"); }}>
            {t("jeSuisJoueur2", L)}
          </button>
        </div>
      )}
      <EcranPhoto2
        prop1={props.j1} prop2={props.j2} timerSec={timerChoisi}
        utilisateur={utilisateur}
        modeIA={modeIA}
        onPartieCreee={handlePartieCreee}
        L={L}
      />
    </div>
  );

  if (etape === "lobby") return (
    <div className="app">
      <EcranLobby partieId={partieId} monRole={monRole} statutConnexion={statutConnexion}
        onRejoindreManuellement={handleRejoindreManuellement} L={L} />
    </div>
  );

  // ── Écran jeu ──
  return (
    <div className="app jeu">

      {showClassement && <EcranClassement utilisateur={utilisateur} onFermer={() => setShowClassement(false)} L={L} />}

      {showParametres && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ minWidth: 320, gap: 14 }}>
            <div className="popup-titre">{t("parametres", L)}</div>

            {utilisateur && (
              <div style={{ width: "100%", borderBottom: "1px solid var(--bord)", paddingBottom: 12 }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>{t("compte", L)}</div>
                <div style={{ fontSize: 15, color: "var(--texte)", marginBottom: 8 }}>{utilisateur.pseudo} — {utilisateur.email}</div>
                <div style={{ fontSize: 13, color: "var(--rouge-c)", marginBottom: 8 }}>{t("elo", L)} {utilisateur.elo}</div>
                <button className="popup-btn" style={{ fontSize: 13 }}
                  onClick={() => {
                    localStorage.removeItem("elmaas_token");
                    localStorage.removeItem("elmaas_user");
                    setUtilisateur(null);
                    setShowParametres(false);
                    handleReset();
                  }}>
                  {t("seDeconnecter", L)}
                </button>
              </div>
            )}

            {/* Langue */}
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>{t("langue", L)}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LANGUES.map((lang, idx) => (
                  <button key={lang.code}
                    className={`ia-btn ${indexLangue === idx ? "actif" : ""}`}
                    style={{ fontSize: 13 }}
                    onClick={() => changerLangue(idx)}>
                    {lang.nom}
                  </button>
                ))}
              </div>
            </div>

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
                  } catch(e) { console.error("Erreur paiement"); }
                }}>
                {t("passerPremiumBtn", L)}
              </button>
            )}
            {utilisateur?.premium && (
              <div style={{ color: "#88ff88", fontSize: 14 }}>{t("premiumActif", L)}</div>
            )}
            <button className="popup-btn" onClick={() => setShowParametres(false)}>{t("fermer", L)}</button>
          </div>
        </div>
      )}

      {/* Fin de manche */}
      {mancheTermineeInfo && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ minWidth: 380, gap: 16 }}>
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
                    {egalite ? t("egalite", L) : jaiGagne ? t("victoire", L) : t("defaite", L)}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {egalite ? "" : jaiGagne ? t("bienJoue", L) : `${trCouleur(g)} ${t("remporteManche", L)}`}
                  </div>
                </>
              );
            })()}
            <div style={{ display: "flex", gap: 24, justifyContent: "center", fontSize: 32, fontFamily: "var(--brush)", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "var(--rouge-c)", fontWeight: 700 }}>{mancheTermineeInfo.scores?.rouge ?? 0}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("rouge", L)}</div>
              </div>
              <span style={{ color: "var(--muted)", fontSize: 20 }}>vs</span>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#aaaaaa", fontWeight: 700 }}>{mancheTermineeInfo.scores?.noir ?? 0}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("noir", L)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, justifyContent: "center", fontSize: 13, color: "var(--muted)" }}>
              <span>{t("manchesRouge", L)} <strong style={{ color: "var(--rouge-c)" }}>{scoresManches.rouge}</strong></span>
              <span>{t("manchesNoir", L)} <strong style={{ color: "#aaaaaa" }}>{scoresManches.noir}</strong></span>
            </div>
            <div className="popup-options" style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
              <button className="popup-btn" style={{ flex: 1 }}
                onClick={lancerRevanche}>
                {modeMultijoueur ? t("demanderRevanche", L) : t("revanche", L)}
              </button>
              <button className="popup-btn" style={{ flex: 1 }} onClick={handleReset}>
                {t("nouvellePartie", L)}
              </button>
            </div>
          </div>
        </div>
      )}

      {demandePauseRecue && !pauseActive && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ gap: 16 }}>
            {demandePauseRecue === (monRole === "joueur2" ? "noir" : "rouge") ? (
              <>
                <div className="popup-titre">{t("pauseDemandee", L)}</div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>{t("attenteReponseAdverse", L)}</div>
                <button className="popup-btn"
                  onClick={() => { setDemandePauseRecue(null); axios.post(`${API}/pause/refuser/${partieId}`); }}>
                  {t("annuler", L)}
                </button>
              </>
            ) : (
              <>
                <div className="popup-titre">{t("pauseDemandee", L)}</div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>{t("adversaireDemandePause", L)}</div>
                <div className="popup-options" style={{ flexDirection: "row", gap: 10 }}>
                  <button className="popup-btn" style={{ flex: 1 }}
                    onClick={() => axios.post(`${API}/pause/accepter/${partieId}`)}>
                    {t("accepter", L)}
                  </button>
                  <button className="popup-btn" style={{ flex: 1 }}
                    onClick={() => axios.post(`${API}/pause/refuser/${partieId}`)}>
                    {t("refuser", L)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {pauseActive && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ gap: 16 }}>
            <div className="popup-titre">{t("jeuEnPause", L)}</div>
            <button className="popup-btn"
              onClick={() => axios.post(`${API}/pause/reprendre/${partieId}`)}>
              {t("reprendre", L)}
            </button>
          </div>
        </div>
      )}

      {demandeRevancheRecue && !revancheDemandeeParMoi && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ gap: 16 }}>
            <div className="popup-titre">{t("revancheDemandee", L)}</div>
            <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
              {t("adversaire", L)} ({trCouleur(demandeRevancheRecue)}) {t("adversaireProposeRevanche", L)}
            </div>
            <div className="popup-options" style={{ flexDirection: "row", gap: 10 }}>
              <button className="popup-btn" style={{ flex: 1 }}
                onClick={async () => {
                  await axios.post(`${API}/revanche/accepter/${partieId}`);
                  setDemandeRevancheRecue(null);
                }}>
                {t("accepter", L)}
              </button>
              <button className="popup-btn" style={{ flex: 1 }}
                onClick={async () => {
                  await axios.post(`${API}/revanche/refuser/${partieId}`);
                  setDemandeRevancheRecue(null);
                }}>
                {t("refuser", L)}
              </button>
            </div>
          </div>
        </div>
      )}

      {revancheDemandeeParMoi && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ gap: 16 }}>
            <div className="popup-titre">{t("revancheDemandee", L)}</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              {t("attenteReponseAdverse", L)}
            </div>
            <button className="popup-btn"
              onClick={async () => {
                await axios.post(`${API}/revanche/refuser/${partieId}`);
                setRevancheDemandeeParMoi(false);
                handleReset();
              }}>
              {t("annuler", L)}
            </button>
          </div>
        </div>
      )}

      {popup?.type === "pouvoir" && <PopupPouvoir serie={popup.serie} onChoisir={handlePouvoir} L={L} />}
      {popup?.type === "scout"   && <PopupScout pieces={scoutPieces} couleur={joueurActif?.couleur} echanges={scoutEchanges} onFermer={() => setPopup(null)} L={L} />}
      {popup?.type === "manuel"  && <PopupManuel onFermer={() => setPopup(null)} L={L} />}
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
          L={L}
        />
      )}

      {popup?.type === "attente_cible" && (
        <div className="bandeau-cible">
          <span>{popup.message}</span>
          <button onClick={() => { setAttenteChoixPouvoir(false); setPopup(null); envoyerPouvoir({ pouvoir: "rien" }); }}>{t("annuler", L)}</button>
        </div>
      )}
      {popup?.type === "attente_extraire" && (
        <div className="bandeau-cible">
          <span>{popup.message}</span>
          <span style={{ color: "#ffaa44", fontWeight: 700 }}>
            {extractionsEnCours.length}/2 {extractionsEnCours.length > 1 ? t("selectionnees", L) : t("selectionnee", L)}
          </span>
          <button style={{ background: "#22441188", color: "#88ff88", borderColor: "#88ff8844" }}
            onClick={handleConfirmerExtraction}>
            {t("confirmer", L)}
          </button>
          <button onClick={() => { setExtractionsEnCours([]); setAttenteChoixPouvoir(false); setPopup(null); envoyerPouvoir({ pouvoir: "rien" }); }}>{t("annuler", L)}</button>
        </div>
      )}
      {popup?.type === "attente_recoloriage" && (
        <div className="bandeau-cible">
          <span>{popup.message}</span>
          <button onClick={async () => { setPopup(null); setAttenteChoixPouvoir(false); await declencherIA(etat, partieId, modeIA, niveauIA); }}>{t("passer", L)}</button>
        </div>
      )}

      {popup?.type === "temps_ecoule" && (
        <PopupFinPartie
          titre={popup.titre}
          message={popup.message}
          gagnant={popup.gagnant}
          couleurGagnant={popup.couleurGagnant}
          textRevanche={modeMultijoueur ? t("demanderRevanche", L) : t("revanche", L)}
          onFermer={() => {
            setPopup(null);
            handleReset();
          }}
          onRevanche={lancerRevanche}
          L={L}
        />
      )}

      {/* Header */}
      <header className="app-header">
        <h1 className="titre-jeu-petit">ELMAAS</h1>

        <div className="scores">
          <div className="score-item rouge">
            <span className="score-nb">{etat?.scores?.rouge ?? 0}</span>
            <span className="score-lbl">{t("rouge", L)}</span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{scoresManches.rouge} {scoresManches.rouge > 1 ? t("manches", L) : t("manche", L)}</span>
          </div>
          <div className="score-sep">vs</div>
          <div className="score-item noir">
            <span className="score-nb">{etat?.scores?.noir ?? 0}</span>
            <span className="score-lbl">{t("noir", L)}</span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{scoresManches.noir} {scoresManches.noir > 1 ? t("manches", L) : t("manche", L)}</span>
          </div>
        </div>

        <div className="timers">
          {modeIA !== "j1" && (
            <TimerBloc secondes={timerRouge} couleur="rouge" actif={etat?.tour_actuel === 0 && !attenteChoixPouvoir && !popup} L={L} />
          )}
          {modeIA !== "j2" && (
            <TimerBloc secondes={timerNoir}  couleur="noir"  actif={etat?.tour_actuel === 1 && !attenteChoixPouvoir && !popup} L={L} />
          )}
        </div>

        <div className="tour-info">
          {t("tour", L)} {etat?.numero_tour} —
          <span className={"couleur-actif " + joueurActif?.couleur}> {trCouleur(joueurActif?.couleur)}</span>
          {modeMultijoueur && (
            <span className="badge-ia" style={{ background: estMonTour ? "#22441188" : "#44111188", color: estMonTour ? "#88ff88" : "#ff8888" }}>
              {estMonTour ? t("tonTour", L) : t("adversaireJoue", L)}
            </span>
          )}
          {bonusDoubleActif && monRole === "joueur2" && (
            <span className="badge-ia" style={{ background: "#44220088", color: "#ffaa44" }}>
              {t("doubleTourActif", L)}
            </span>
          )}
          {estTourIA && <span className="badge-ia">IA{iaEnCours ? " ..." : ""}</span>}
          {joueurActif?.serie_actuelle >= 3 && <span className="badge-serie">{t("serie", L)} {joueurActif.serie_actuelle}</span>}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {utilisateur && (
            <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
              <div style={{ color: "var(--texte)" }}>{utilisateur.pseudo}</div>
              <div style={{ color: "var(--rouge-c)" }}>ELO {utilisateur.elo}</div>
            </div>
          )}
          <button className="btn-manuel" onClick={() => setShowParametres(true)} title={t("parametres", L)}
            style={{ width: 34, height: 34, fontSize: 16 }}>⚙</button>
          <button className="btn-manuel" onClick={() => setShowClassement(true)} title={t("classementElo", L)}
            style={{ width: 34, height: 34, fontSize: 14 }}>ELO</button>
          <button className="btn-manuel" onClick={() => setPopup({ type: "manuel" })} title={t("manuelTitre", L)}>?</button>
          <button className="btn-reset" onClick={handleAbandon}>{t("nouvellePartie", L)}</button>
        </div>
      </header>

      <div className="zone-adverse">
        <div className="adverse-label">{t("adversaire", L)} ({trCouleur(joueurAdverse?.couleur)}) — {(joueurAdverse?.nb_pieces_reserve || 0) + (joueurAdverse?.main_active?.length || 0)} {t("pieces", L)}</div>
        <div className="adverse-pieces">
          {(joueurAdverse?.main_active || []).map((_, i) => (
            <div key={i} className={"piece-cachee " + joueurAdverse?.couleur} />
          ))}
        </div>
      </div>

      <div className="zone-jeu">

        <div className="panneau-main">
          <div className="panneau-titre">
            {t("mesPieces", L)} ({trCouleur(joueurActif?.couleur)})
          </div>
          <div className="main-pieces-list">
            {(joueurActif?.main_active || []).map((piece, i) => {
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
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("mainVide", L)}</div>
          )}

          <div className="panneau-titre" style={{ marginTop: 10 }}>
            {t("reserve", L)} {joueurActif?.nb_pieces_reserve}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            {t("piecesPosees", L)} {joueurActif?.nb_pieces_posees_depuis_regen ?? 0} / {joueurActif?.seuil_regen_actuel ?? 5}
          </div>
          <div className="serie-info">
            {t("serieLabel", L)} {joueurActif?.serie_actuelle}
          </div>

          {(() => {
            const clickEchanger = popup?.type === "attente_cible" && popup?.pouvoir === "echanger";
            const mainAdverse = joueurAdverse?.main_active || [];
            return (
              <>
                <div className="panneau-titre" style={{ marginTop: 14, borderColor: joueurAdverse?.couleur === "rouge" ? "#cc220044" : "#44444444" }}>
                  {t("adversaire", L)} ({trCouleur(joueurAdverse?.couleur)})
                </div>
                <div className="main-pieces-list">
                  {mainAdverse.map((piece, i) => (
                    <div key={i} style={{ position: "relative", opacity: clickEchanger ? 1 : 0.4 }}>
                      <MiniPiece piece={piece} couleur={joueurAdverse?.couleur}
                        estSelectionnee={false}
                        onClick={() => {
                          if (clickEchanger) {
                            if (pieceADonner === null) return;
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
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("mainAdverseVide", L)}</div>
                )}
              </>
            );
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
          <div className="panneau-titre">{t("actions", L)}</div>
          <button className="btn-action" onClick={handleRepiocher}
            disabled={!estMonTour || enModeCible || attenteChoixPouvoir || estTourIA}>
            {t("repiocher", L)}
          </button>
          <button className="btn-action scout" onClick={handleScout}
            disabled={!estMonTour || enModeCible || attenteChoixPouvoir || estTourIA}>
            {t("scout", L)}
          </button>

          {modeMultijoueur && modeIA === "aucune" && monRole === "joueur2" && indiceReconnaissance && (
            <>
              <button className="btn-action"
                style={{ borderColor: reconnaissanceTentee ? "#444" : "#cc880044", color: reconnaissanceTentee ? "var(--muted)" : "#ffaa44" }}
                onClick={() => setPopup({ type: "reconnaissance" })} disabled={reconnaissanceTentee}>
                {reconnaissanceTentee ? t("dejaTente", L) : t("reconnaitre", L)}
              </button>
              {bonusDoubleActif && (
                <div className="hint-action" style={{ color: "#ffaa44", borderColor: "#ffaa4444", background: "#44220011" }}>
                  {t("doubleTourActif", L)}
                </div>
              )}
            </>
          )}

          {pieceIdx !== null && estMonTour && !enModeCible && !attenteChoixPouvoir && (
            <div className="hint-action">{t("cliquerPlateau", L)}</div>
          )}
          {modeIA === "aucune" && (
            <button className="btn-action" style={{ marginTop: "auto", borderColor: "#4444aa44", color: "var(--muted)" }}
              onClick={() => {
                const couleur = monRole === "joueur2" ? "noir" : "rouge";
                axios.post(`${API}/pause/demander/${partieId}`, { couleur });
                setDemandePauseRecue(couleur);
              }}>
              {t("pause", L)}
            </button>
          )}
          {attenteChoixPouvoir && (
            <div className="hint-action" style={{ borderColor: "#cc880044", background: "#44220011", color: "#ffaa44" }}>
              {t("choisirRecompense", L)}
            </div>
          )}
          {!estMonTour && modeMultijoueur && (
            <div className="hint-action" style={{ borderColor: "#ff444444", background: "#ff000011", color: "#ff8888" }}>
              {t("attendsTonTour", L)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}