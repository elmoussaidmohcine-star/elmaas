// ELMAAS App.js — VERSION CORRIGÉE (Matchmaking fix)
// Features : Google OAuth only + choix pseudo + score cumulé + matchmaking
//            + pause IA + messages chat + popup 5min cheesy + analyse + filtres

import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Board from "./Board";
import { T, LANGUES, t, getSloganAleatoire, getCitationAttente, getSloganVictoire, getSloganDefaite, getSloganAnalyse, CLASSIFICATION_COUP } from "./translations";
import "./App.css";
import EcranAnalyse from "./EcranAnalyse";

const API = "https://elmaas-backend.onrender.com";
//const API = "http://localhost:3000/";
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
function appliquerTheme(indexLangue) {
  const html = document.documentElement;
  LANGUES.forEach(l => html.classList.remove(l.theme));
  html.classList.add(LANGUES[indexLangue].theme);
  html.setAttribute("dir", LANGUES[indexLangue].code === "ar" ? "rtl" : "ltr");
}

// Gestion des scores cumulés par adversaire (localStorage)
const KEY_SCORES = "elmaas_scores_cumules";
const MAX_ADVERSAIRES = 5;
 
function getScoresCumules(pseudoAdverse) {
  try {
    const data = JSON.parse(localStorage.getItem(KEY_SCORES) || '{"ordre":[],"scores":{}}');
    return data.scores[pseudoAdverse] || { moi: 0, lui: 0 };
  } catch { return { moi: 0, lui: 0 }; }
}
 
function setScoresCumules(pseudoAdverse, scores) {
  try {
    let data = JSON.parse(localStorage.getItem(KEY_SCORES) || '{"ordre":[],"scores":{}}');
    data.scores[pseudoAdverse] = scores;
    data.ordre = data.ordre.filter(p => p !== pseudoAdverse);
    data.ordre.push(pseudoAdverse);
    while (data.ordre.length > MAX_ADVERSAIRES) {
      const oublie = data.ordre.shift();
      delete data.scores[oublie];
    }
    localStorage.setItem(KEY_SCORES, JSON.stringify(data));
  } catch {}
}

//  Bouton Paramètres flottant 
function BtnParamsFlottant({ onClick, L }) {
  return (
    <button className="btn-params-flottant" onClick={onClick} title={t("parametres", L)}></button>
  );
}

//  Popup Paramètres 
function PopupParametres({ utilisateur, L, indexLangue, changerLangue, onFermer, onDeconnecter, onPaiement }) {
  return (
    <div className="popup-overlay" onClick={onFermer}>
      <div className="popup-pouvoir" style={{ minWidth: 340, maxWidth: 440, gap: 14, maxHeight: "85vh", overflowY: "auto" }}
           onClick={(e) => e.stopPropagation()}>
        <div className="popup-titre">{t("parametres", L)}</div>

        {utilisateur && (
          <div style={{ width: "100%", borderBottom: "1px solid var(--bord)", paddingBottom: 12 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>{t("compte", L)}</div>
            <div style={{ fontSize: 15, color: "var(--texte)", marginBottom: 8 }}>{utilisateur.pseudo || "—"} — {utilisateur.email}</div>
            <div style={{ fontSize: 13, color: "var(--rouge-c)", marginBottom: 8 }}>{t("elm", L)} {utilisateur.elo}</div>
            <button className="popup-btn" style={{ fontSize: 13 }} onClick={onDeconnecter}>{t("seDeconnecter", L)}</button>
          </div>
        )}

        <div style={{ width: "100%" }}>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>{t("langue", L)} / {t("theme", L)}</div>
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

        {utilisateur && (
          <div className="plans-section">
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{t("plans", L)}</div>
            <div className="plan-welcome">{t("welcomeElmaasyon", L)}</div>
            <div className={`plan-card ${utilisateur.plan === "elmaasyon" ? "actif" : "premium"}`}>
              <div className="plan-nom">{t("planElmaasyon", L)}</div>
              <div className="plan-desc">{t("planElmaasyonDesc", L)}</div>
              <div className="plan-prix">Gratuit <small>(lancement)</small></div>
              {utilisateur.plan !== "elmaasyon" && (
                <button className="btn-valider" style={{ fontSize: 13, padding: "8px 16px" }} onClick={() => onPaiement("elmaasyon")}>
                  {t("passerPremiumBtn", L)}
                </button>
              )}
            </div>
            <div className={`plan-card ${utilisateur.plan === "elmaas" ? "actif" : "premium"}`}>
              <div className="plan-nom">{t("planElmaas", L)}</div>
              <div className="plan-desc">{t("planElmaasDesc", L)}</div>
              <div className="plan-prix">6.99€<small>{t("parMois", L)}</small></div>
              {utilisateur.plan !== "elmaas" && (
                <button className="btn-valider" style={{ fontSize: 13, padding: "8px 16px" }} onClick={() => onPaiement("elmaas")}>
                  {t("passerPremiumBtn", L)}
                </button>
              )}
            </div>
          </div>
        )}

        <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
      </div>
    </div>
  );
}

//  Écran Auth (Google uniquement + sans compte) 
function EcranAuth({ onConnecte, L }) {
  const handleGoogleLogin = () => { window.location.href = `${API}/auth/google`; };
  return (
    <div className="ecran-taille">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{getSloganAleatoire(L)}</p>
      <p className="sous-phrase-jeu">{t("sousSlogan", L)}</p>
      <div className="lobby-card" style={{ minWidth: 340, gap: 12 }}>
        <button className="popup-btn" style={{ justifyContent: "center", gap: 10, padding: "14px" }} onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t("continuerAvecGoogle", L)}
        </button>
        <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:13, marginTop:4 }}
          onClick={() => onConnecte(null)}>
          {t("continuerSansCompte", L)}
        </button>
      </div>
    </div>
  );
}

//  Écran Choix Pseudo 
function EcranPseudo({ onPseudoDefini, L }) {
  const [pseudo, setPseudo] = useState("");
  const [statut, setStatut] = useState(null);
  const [chargement, setChargement] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (pseudo.trim().length < 2) { setStatut(null); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${API}/auth/pseudo/disponible`, { params: { pseudo } });
        setStatut(r.data);
      } catch { setStatut(null); }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [pseudo]);

  const valider = async () => {
    if (!statut?.disponible) return;
    setChargement(true);
    try {
      const token = getToken();
      const r = await axios.post(`${API}/auth/pseudo/definir`, { pseudo },
        { headers: { Authorization: `Bearer ${token}` } });
      if (r.data.succes) {
        localStorage.setItem("elmaas_user", JSON.stringify(r.data.utilisateur));
        onPseudoDefini(r.data.utilisateur);
      }
    } catch (e) {
      console.error(e);
    } finally { setChargement(false); }
  };

  return (
    <div className="ecran-taille">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{getSloganAleatoire(L)}</p>
      <div className="lobby-card" style={{ minWidth: 340, gap: 14 }}>
        <div className="lobby-titre">{t("choisisPseudo", L)}</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{t("pseudoUnique", L)}</div>
        <input className="lobby-input" placeholder={t("pseudoPlaceholder", L)}
          value={pseudo} onChange={e => setPseudo(e.target.value)}
          onKeyDown={e => e.key === "Enter" && statut?.disponible && valider()} />
        {pseudo.length >= 2 && statut && (
          <div style={{ fontSize: 13, color: statut.disponible ? "#88ff88" : "#ff8888" }}>
            {statut.disponible ? t("pseudoDispo", L)
              : statut.raison === "mot_sacre" ? t("motSacreErreur", L)
              : statut.raison === "trop_court" ? t("pseudoTropCourt", L)
              : t("pseudoPris", L)}
          </div>
        )}
        <button className="btn-valider" onClick={valider} disabled={!statut?.disponible || chargement}>
          {chargement ? "..." : t("pseudoValider", L)}
        </button>
      </div>
    </div>
  );
}

//  Popup "5 min trop cheesy" 
function PopupCheesy({ onChoisir, onFermer, L }) {
  const temps = [{v:10,l:"10 s"},{v:20,l:"20 s"},{v:30,l:"30 s"},{v:60,l:"1 min"},{v:120,l:"2 min"}];
  return (
    <div className="popup-overlay" onClick={onFermer}>
      <div className="popup-pouvoir" onClick={e => e.stopPropagation()} style={{ gap: 14 }}>
        <div className="popup-titre" style={{ fontStyle: "italic" }}>{t("cheesyTitre", L)}</div>
        <div className="popup-sous-titre">{t("cheesyMessage", L)}</div>
        <div className="ia-options">
          {temps.map(x => (
            <button key={x.v} className="ia-btn" onClick={() => onChoisir(x.v)}>{x.l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

//  Écran Taille 
const TIMER_OPTIONS = [
  { label: "10 s", val: 10 }, { label: "20 s", val: 20 }, { label: "30 s", val: 30 },
  { label: "1 min", val: 60 }, { label: "2 min", val: 120 }, { label: "5 min", val: 300 },
];

function EcranTaille({ onValider, onPlayOnline, L, utilisateur }) {
  const [prop1, setProp1] = useState(16);
  const [modeIA, setModeIA] = useState("aucune");
  const [niveauIA, setNiveauIA] = useState(2);
  const [timerSec, setTimerSec] = useState(30);
  const [showCheesy, setShowCheesy] = useState(false);
  const tailleFin = Math.max(16, Math.min(20, prop1 % 2 === 0 ? prop1 : prop1 - 1));

  const selectTimer = (v) => {
    if (v === 300) { setShowCheesy(true); return; }
    setTimerSec(v);
  };

  return (
    <div className="ecran-taille">
      {showCheesy && <PopupCheesy L={L} onFermer={() => setShowCheesy(false)}
        onChoisir={(v) => { setTimerSec(v); setShowCheesy(false); }} />}
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{getSloganAleatoire(L)}</p>
      <p className="sous-phrase-jeu">{t("sousSlogan", L)}</p>
      <p className="sous-titre">{t("choisissezTaille", L)}</p>

      <div className="taille-inputs">
        <div className="taille-joueur">
          <label>{t("tailleDuPlateau", L)}</label>
          <input type="range" min="16" max="20" step="2" value={prop1} onChange={e => setProp1(Number(e.target.value))} />
          <span className="taille-val">{prop1}</span>
        </div>
        <div className="taille-result">
          <div className="taille-final">{tailleFin}</div>
          <div className="taille-label">{t("plateau", L)}</div>
        </div>
      </div>

      <div className="ia-section">
        <div className="ia-titre">{t("tempsParTour", L)}</div>
        <div className="ia-options">
          {TIMER_OPTIONS.map(opt => (
            <button key={opt.val} className={`ia-btn ${timerSec === opt.val ? "actif" : ""}`}
              onClick={() => selectTimer(opt.val)}>{opt.label}</button>
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
            {[1,2,3,4].map(n => (
              <button key={n} className={`ia-btn-niveau ${niveauIA === n ? "actif" : ""}`} onClick={() => setNiveauIA(n)}>
                {n === 1 ? t("facile", L) : n === 2 ? t("moyen", L) : n === 3 ? t("expert", L) : "GM 2500+"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn-valider" onClick={() => onValider(prop1, prop1, tailleFin, modeIA, niveauIA, timerSec)}>
          {modeIA === "aucune" ? t("jouerContreAmi", L) : t("jouerContreIA", L)}
        </button>
        {utilisateur && modeIA === "aucune" && (
          <button className="btn-valider" style={{ background: "linear-gradient(135deg, #228866, #44cc88)" }}
            onClick={() => onPlayOnline(timerSec)}>
            {t("jouerOnline", L)}
          </button>
        )}
      </div>
    </div>
  );
}

//  Popup Matchmaking 
function PopupMatchmaking({ onAnnuler, onMatchTrouve, timerSec, L, utilisateur }) {
  const [tempsEcoule, setTempsEcoule] = useState(0);
  const [citation, setCitation] = useState(() => getCitationAttente(getLangueInitiale()));
  const [echec, setEchec] = useState(false);
  const [tolerance, setTolerance] = useState(100);
 
  useEffect(() => {
    const i = setInterval(() => setTempsEcoule(t => t + 1), 1000);
    const c = setInterval(() => setCitation(getCitationAttente(L)), 8000);
    return () => { clearInterval(i); clearInterval(c); };
  }, []);
 
  useEffect(() => {
    let actif = true;
    const token = localStorage.getItem("elmaas_token");
 
    const verifier = async () => {
      if (!actif) return;
      try {
        const r = await axios.get(`${API}/matchmaking/verifier`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!actif) return;
 
        if (r.data.status === "match") {
          onMatchTrouve(r.data);
          return;
        }
        if (r.data.status === "timeout") {
          setEchec(true);
          return;
        }
        if (r.data.tolerance) setTolerance(r.data.tolerance);
      } catch (e) {
        console.error("Poll match:", e);
      }
    };
 
    verifier();
    const poll = setInterval(verifier, 3000);
    return () => { actif = false; clearInterval(poll); };
  }, [onMatchTrouve]);
 
  const handleAnnuler = async () => {
    const token = localStorage.getItem("elmaas_token");
    try {
      await axios.post(`${API}/matchmaking/quitter`, {},
        { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    onAnnuler();
  };
 
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir" style={{ minWidth: 400, gap: 16 }}>
        {echec ? (
          <>
            <div className="popup-titre"></div>
            <div className="popup-sous-titre">{t("matchmakingEchec", L)}</div>
            <button className="popup-btn" onClick={handleAnnuler}>{t("fermer", L)}</button>
          </>
        ) : (
          <>
            <div className="popup-titre">{t("rechercheJoueur", L)}</div>
            <div className="spinner" style={{ margin: "0 auto" }} />
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {t("tempsAttente", L)} {Math.floor(tempsEcoule/60)}:{String(tempsEcoule%60).padStart(2,"0")}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {t("elargissementRecherche", L)}{tolerance} ELM
            </div>
            <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--texte)", textAlign: "center", maxWidth: 340, opacity: 0.8 }}>
              "{citation}"
            </div>
            <button className="popup-btn" onClick={handleAnnuler}>{t("annulerRecherche", L)}</button>
          </>
        )}
      </div>
    </div>
  );
}

//  Écran Photo 
function EcranPhoto2({ prop1, prop2, timerSec, utilisateur, modeIA, partieIdMatch, onPartieCreee, L }) {
  const [photosFixees, setPhotosFixees] = useState([]);
  const [photoSelectionnee, setPhotoSelectionnee] = useState(null);
  const [nomPhoto, setNomPhoto] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [apercu, setApercu] = useState(null);

  const peutUploader = !utilisateur ? false : utilisateur.premium || !utilisateur.photo_perso_utilisee;
  const nomValide = modeIA !== "aucune" || nomPhoto.trim().length >= 3;

  useEffect(() => {
    axios.get(`${API}/photos_fixes`).then(res => setPhotosFixees(res.data.photos));
  }, []);

  const jouerAvecPhoto = async (urlOuFichier, estFichier = false) => {
    if (!nomValide) { setErreur(t("min3Car", L)); return; }
    setErreur(null); setChargement(true);
    try {
      const formData = new FormData();
      formData.append("prop_j1", prop1);
      formData.append("prop_j2", prop2);
      formData.append("nom_photo", modeIA !== "aucune" ? "" : nomPhoto.slice(0, 10));
      formData.append("timer_sec", timerSec);
      formData.append("langue", LANGUES[L].code);
      if (partieIdMatch) formData.append("partie_id_match", partieIdMatch);
      if (estFichier) {
        formData.append("photo", urlOuFichier);
        if (utilisateur && !utilisateur.premium) {
          const token = getToken();
          await axios.post(`${API}/consommer_upload`, {}, { headers: { Authorization: `Bearer ${token}` } });
        }
      } else {
        const resp = await fetch(`${API}${urlOuFichier}`);
        const blob = await resp.blob();
        const fichier = new File([blob], "photo.jpg", { type: blob.type });
        formData.append("photo", fichier);
      }
      const res = await axios.post(`${API}/nouvelle-partie`, formData);
      onPartieCreee(res.data.partie_id, res.data.etat, res.data.pixels_photo, res.data.taille, res.data.timer_sec, res.data.scores_manches);
    } catch (err) {
      console.error("Erreur création partie:", err);
      if (err.response?.data?.code === "MOT_SACRE") setErreur(t("motSacreErreur", L));
      else if (err.response?.status === 413 || err.response?.data?.code === "PHOTO_INVALIDE")
        setErreur(t("photoInvalide", L));
      else setErreur(err.response?.data?.erreur || t("erreurCreation", L));
    } finally { setChargement(false); }
  };

  const handleFichier = (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    if (fichier.size > 5 * 1024 * 1024) { setErreur(t("photoInvalide", L)); return; }
    setApercu(URL.createObjectURL(fichier));
    setPhotoSelectionnee({ fichier, estFichier: true });
  };

  const filtreNomSacre = (val) => {
    setNomPhoto(val);
  };

  return (
    <div className="ecran-taille" style={{ gap: 20 }}>
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{t("choisissezPhoto", L)}</p>

      {modeIA === "aucune" && (
        <div className="nom-photo-section">
          <label className="nom-photo-label">
            {t("nomSecretPhoto", L)}{" "}
            <span>{t("max10Car", L)}</span>{" "}
            <span style={{ color: nomValide ? "#88ff88" : "var(--rouge-c)" }}>{t("min3Car", L)}</span>
          </label>
          <input className="nom-photo-input" maxLength={10} placeholder={t("exVacances", L)}
            value={nomPhoto} onChange={e => filtreNomSacre(e.target.value)} />
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
            <img src={`${API}${url}`} alt={`photo ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>

      {utilisateur ? (peutUploader ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {utilisateur.premium ? t("premiumIllimite", L) : t("unePhotoGratuite", L)}
          </div>
          <label className="zone-upload" htmlFor="photo-perso-input" style={{ width: 200, minHeight: 80, cursor: "pointer" }}>
            {apercu ? <img src={apercu} alt="apercu" style={{ width: "100%", height: 80, objectFit: "cover" }} />
              : <div className="upload-placeholder" style={{ fontSize: 13 }}>
                  <div className="upload-icone" style={{ fontSize: 24 }}>+</div>
                  <p>{t("maPhoto", L)}</p>
                </div>}
            <input id="photo-perso-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFichier} style={{ display: "none" }} />
          </label>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
          {t("photoUtilisee", L)} — <span style={{ color: "var(--rouge-c)" }}>{t("passerPremium", L)}</span>
        </div>
      )) : (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{t("connectezVous", L)}</div>
      )}

      {erreur && <p className="erreur">{erreur}</p>}
      {chargement && <div className="chargement"><div className="spinner" /><p>{t("generation", L)}</p></div>}

      {photoSelectionnee && !chargement && (
        <button className="btn-valider" disabled={!nomValide}
          onClick={() => jouerAvecPhoto(
            photoSelectionnee.estFichier ? photoSelectionnee.fichier : photoSelectionnee.url,
            photoSelectionnee.estFichier)}>
          {t("jouerAvecPhoto", L)}
        </button>
      )}
    </div>
  );
}

function EcranLobby({ partieId, monRole, statutConnexion, onRejoindreManuellement, L, dejaMatche, onPartiePrete }) {
  const [codeSaisi, setCodeSaisi] = useState("");

  // Transition automatique quand statutConnexion devient "connecte"
  useEffect(() => {
    if (statutConnexion === "connecte" && onPartiePrete) {
      onPartiePrete();
    }
  }, [statutConnexion, onPartiePrete]);

  // Cas 1 : Joueur 2 qui vient du matchmaking → attend la création de la partie par Rouge
  if (dejaMatche) {
    return (
      <div className="ecran-lobby">
        <h1 className="titre-jeu">ELMAAS</h1>
        <p className="phrase-jeu">{getSloganAleatoire(L)}</p>
        <div className="lobby-card">
          <div className="lobby-titre">Match trouvé !</div>
          <div className="lobby-sous">Adversaire choisit la photo...</div>
          <div className="spinner" style={{ margin: "20px auto" }} />
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Code de partie : {partieId}
          </div>
        </div>
      </div>
    );
  }

  // Cas 2 : Joueur 1 qui a créé une partie et attend un ami par code
  if (monRole === "joueur1") {
    return (
      <div className="ecran-lobby">
        <h1 className="titre-jeu">ELMAAS</h1>
        <p className="phrase-jeu">{getSloganAleatoire(L)}</p>
        <div className="lobby-card">
          <div className="lobby-titre">{t("partieCreee", L)}</div>
          <div className="lobby-sous">{t("donnezCodeJ2", L)}</div>
          <div className="lobby-code">{partieId}</div>
          <button className="lobby-copier" onClick={() => navigator.clipboard.writeText(partieId)}>
            {t("copierCode", L)}
          </button>
          <div className={`lobby-statut ${statutConnexion}`}>
            {statutConnexion === "attente" && t("attenteJ2", L)}
            {statutConnexion === "connecte" && t("j2Connecte", L)}
          </div>
        </div>
      </div>
    );
  }

  // Cas 3 : Joueur 2 qui doit saisir un code (invité par ami)
  return (
    <div className="ecran-lobby">
      <h1 className="titre-jeu">ELMAAS</h1>
      <p className="phrase-jeu">{getSloganAleatoire(L)}</p>
      <div className="lobby-card">
        <div className="lobby-titre">{t("rejoindrePartie", L)}</div>
        <div className="lobby-sous">{t("entrerCode", L)}</div>
        <input className="lobby-input" placeholder={t("codePartie", L)}
          value={codeSaisi} onChange={e => setCodeSaisi(e.target.value)} />
        <button className="btn-valider"
          onClick={() => onRejoindreManuellement(codeSaisi.trim())}
          disabled={!codeSaisi.trim()}>
          {t("rejoindre", L)}
        </button>
        {statutConnexion === "erreur" && (
          <div className="lobby-statut erreur">{t("partieIntrouvable", L)}</div>
        )}
      </div>
    </div>
  );
}

function TimerBloc({ secondes, couleur, actif, L }) {
  const m = Math.floor(secondes / 60), s = secondes % 60;
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

function MiniPiece({ piece, couleur, estSelectionnee, onClick }) {
  if (!piece) return null;
  const cells = piece.cellules || [];
  const maxR = Math.max(0, ...cells.map(([r]) => r));
  const maxC = Math.max(0, ...cells.map(([, c]) => c));
  const S = 10;

  //  ELMAAS = pièce d'enlèvement (diamant)
  const estELMAAS = piece.enlevement === true;

  let coul, coulClair, bordure, bgSel;
  if (estELMAAS) {
    coul = "#00BFFF"; coulClair = "#80D8FF";
    bordure = estSelectionnee ? "#00BFFF" : "#004488";
    bgSel = "rgba(0,191,255,0.2)";
  } else {
    coul = couleur === "rouge" ? "#cc2200" : "#444444";
    coulClair = couleur === "rouge" ? "#ff4422" : "#888888";
    bordure = estSelectionnee ? coulClair : "#2a2a4a";
    bgSel = `${coul}33`;
  }

  return (
    <div onClick={onClick} className={`mini-piece ${estSelectionnee ? "sel" : ""}`}
      style={{ position: "relative", width: (maxC+1)*S+10, height: (maxR+1)*S+10, padding: 5,
        borderRadius: 6, cursor: "pointer", flexShrink: 0,
        border: `2px solid ${bordure}`,
        background: estSelectionnee ? bgSel : "#111122", transition: "all 0.15s",
        boxShadow: estELMAAS ? "0 0 8px rgba(0,191,255,0.4)" : "none" }}
      title={estELMAAS ? ` ELMAAS ${piece.forme}` : piece.forme}>
      {cells.map(([r, c], i) => (
        <div key={i} style={{ position: "absolute", top: r*S+5, left: c*S+5,
          width: S-2, height: S-2, borderRadius: 2, background: coul,
          boxShadow: estELMAAS ? `0 0 6px ${coul}` : `0 0 4px ${coul}88` }} />
      ))}
      {estELMAAS && (
        <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8,
          borderRadius: "50%", background: "#00BFFF", boxShadow: "0 0 4px #00BFFF" }} />
      )}
    </div>
  );
}

function PopupPouvoir({ onChoisir, serie, L }) {
  const estSerie3 = serie >= 3;
  const options = [
    { id: "rien", label: t("rienFaire", L), desc: t("rienFaireDesc", L) },
    { id: "echanger", label: t("echanger", L), desc: t("echangerDesc", L) },
    ...(estSerie3 ? [{ id: "extraire", label: `${t("extraire", L)} (${t("serie", L)} ${serie})`, desc: t("extraireDesc", L) }] : []),
  ];
  return (
    <div className="popup-overlay">
      <div className="popup-pouvoir">
        <div className="popup-titre">{estSerie3 ? `${t("serieDe", L)} ${serie}` : t("puzzleComplete", L)}</div>
        <div className="popup-sous-titre">{t("choisirRecompense", L)}</div>
        <div className="popup-options">
          {options.map(opt => (
            <button key={opt.id} className={`popup-btn ${opt.id === "extraire" ? "popup-btn-serie" : ""}`}
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

function PopupReconnaissance({ indice, onTenter, onFermer, tenteeDejaFaite, L }) {
  const [proposition, setProposition] = useState("");
  const [resultat, setResultat] = useState(null);
  const [erreurLocale, setErreurLocale] = useState(null);
  const propValide = proposition.trim().length >= 3;

  const handleTenter = async () => {
    if (!propValide) { setErreurLocale(t("min3CarDevinette", L)); return; }
    setErreurLocale(null);
    const res = await onTenter(proposition);
    setResultat(res);
  };
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
              value={proposition} onChange={e => { setProposition(e.target.value); setErreurLocale(null); }}
              onKeyDown={e => e.key === "Enter" && propValide && handleTenter()} />
            {erreurLocale && <div style={{ color: "#ff6644", fontSize: 12 }}>{erreurLocale}</div>}
            <button className="btn-valider" onClick={handleTenter} disabled={!propValide}>{t("valider", L)}</button>
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

function PopupManuel({ onFermer, L }) {
  return (
    <div className="popup-overlay" onClick={onFermer}>
      <div className="popup-pouvoir" style={{ maxWidth: 600, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div className="popup-titre">{t("manuelTitre", L)}</div>
        <div style={{ fontSize: 14, color: "var(--muted)", fontStyle: "italic", textAlign: "center" }}>{t("manuelIntro", L)}</div>
        <div className="manuel-content">
          <div className="manuel-section">
            <div className="manuel-titre-section"> {t("objectif", L)}</div>
            <p>{t("objectifDesc", L)}</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section"> {t("actionsParTour", L)}</div>
            <p>• {t("actionPoser", L)}</p>
            <p>• {t("actionRepiocher", L)}</p>
            <p>• {t("actionScout", L)}</p>
          </div>
          <div className="manuel-section">
            <div className="manuel-titre-section"> {t("series", L)}</div>
            <p>• {t("serie3Desc", L)}</p>
            <p>• {t("serie5Desc", L)}</p>
          </div>
          <div className="manuel-section" style={{ borderColor: "var(--accent-culture)" }}>
            <div className="manuel-titre-section"> {t("astuceTitre", L)}</div>
            <p style={{ fontStyle: "italic" }}>{t("astuceDesc", L)}</p>
          </div>
        </div>
        <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
      </div>
    </div>
  );
}

//  Bulle message (5s) 
function BulleMessage({ texte, couleur, position, onFermer }) {
  useEffect(() => {
    const t = setTimeout(onFermer, 5000);
    return () => clearTimeout(t);
  }, [onFermer]);
  return (
    <div className="bulle-message" style={{ [position]: 20, borderColor: couleur === "rouge" ? "#ff4422" : "#aaaaaa" }}>
      {texte}
    </div>
  );
}

//  App principale 
export default function App() {
  const [utilisateur, setUtilisateur] = useState(() => getUser());
  const [indexLangue, setIndexLangue] = useState(getLangueInitiale);
  const L = indexLangue;
  const [showParametres, setShowParametres] = useState(false);
  const [etape, setEtape] = useState(() => getUser()?.pseudo ? "taille" : (getUser() ? "pseudo" : "auth"));
  const [props, setProps] = useState({ j1: 16, j2: 16, taille: 16 });
  const [partieId, setPartieId] = useState(null);
  const [partieIdMatch, setPartieIdMatch] = useState(null);
  const [pseudoAdversaireMatch, setPseudoAdversaireMatch] = useState(null);
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
  const [reconnaissanceTentee, setReconnaissanceTentee] = useState(false);
  const [indiceReconnaissance, setIndiceReconnaissance] = useState(null);
  const [timerChoisi, setTimerChoisi] = useState(30);
  const [timerRouge, setTimerRouge] = useState(30);
  const [timerNoir, setTimerNoir] = useState(30);
  const [scoresManches, setScoresManches] = useState({ rouge: 0, noir: 0 });
  const [mancheTermineeInfo, setMancheTermineeInfo] = useState(null);
  const [pauseActive, setPauseActive] = useState(false);
  const [pauseIAActive, setPauseIAActive] = useState(false);
  const [demandePauseRecue, setDemandePauseRecue] = useState(null);
  const timerRef = useRef(null);
  const [extractionsEnCours, setExtractionsEnCours] = useState([]);
  const [pieceADonner, setPieceADonner] = useState(null);
  const [attenteChoixPouvoir, setAttenteChoixPouvoir] = useState(false);
  const [scoutEchanges, setScoutEchanges] = useState([]);
  const [matchmakingActif, setMatchmakingActif] = useState(false);
  const [modeAnalyse, setModeAnalyse] = useState("rapide");
  const [messageChat, setMessageChat] = useState("");
  const [bullesActives, setBullesActives] = useState([]);
  const lastMsgTime = useRef(0);
  
  const pseudoAdverse = modeIA !== "aucune"
    ? (niveauIA === 1 ? "CHESS" : niveauIA === 2 ? "ELMAASYON" : niveauIA === 3 ? "ELMAAS" : "GM 2500+")
    : (etat?.pseudo_adversaire || "ADVERSAIRE");

  const [scoresCumules, setScoresCumulesState] = useState({ moi: 0, lui: 0 });
  
  useEffect(() => {
    if (!mancheTermineeInfo) return;
    const g = mancheTermineeInfo.gagnant;
    if (g && g !== "egalite" && pseudoAdverse) {
      const maCouleur = monRole === "joueur2" ? "noir" : "rouge";
      const jaiGagne = g === maCouleur;
      const nouveauScore = {
        moi: scoresCumules.moi + (jaiGagne ? 1 : 0),
        lui: scoresCumules.lui + (jaiGagne ? 0 : 1)
      };
      setScoresCumulesState(nouveauScore);
      setScoresCumules(pseudoAdverse, nouveauScore);
    }
  }, [mancheTermineeInfo]);
  
  const [showAnalyse, setShowAnalyse] = useState(false);
  const [dernierCoupClassif, setDernierCoupClassif] = useState(null);

  const changerLangue = (idx) => {
    setIndexLangue(idx);
    localStorage.setItem("elmaas_langue", String(idx));
    appliquerTheme(idx);
  };

  useEffect(() => { appliquerTheme(indexLangue); }, [indexLangue]);

  // Retour Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("google_token");
    const besoinPseudo = params.get("besoin_pseudo");
    const authError = params.get("auth_error");

    if (authError) {
      const detail = params.get("detail");
      console.error("OAuth ERREUR:", authError);
      console.error("DETAIL:", detail ? decodeURIComponent(detail) : "(pas de détail)");
      alert("OAuth erreur : " + (detail ? decodeURIComponent(detail) : authError));
      window.history.replaceState({}, "", "/");
      return;
    }
    if (googleToken) {
      localStorage.setItem("elmaas_token", googleToken);
      fetch(`${API}/auth/moi`, { headers: { Authorization: `Bearer ${googleToken}` } })
        .then(r => r.json())
        .then(user => {
          if (user && !user.erreur) {
            localStorage.setItem("elmaas_user", JSON.stringify(user));
            setUtilisateur(user);
            if (besoinPseudo === "1" || !user.pseudo) setEtape("pseudo");
            else setEtape("taille");
          }
          window.history.replaceState({}, "", "/");
        })
        .catch(() => window.history.replaceState({}, "", "/"));
    }
  }, []);

  // Scores cumulés chargés à chaque changement d'adversaire
  useEffect(() => {
    if (pseudoAdverse && etape === "jeu") {
      setScoresCumulesState(getScoresCumules(pseudoAdverse));
    }
  }, [pseudoAdverse, etape]);

  // Dérivés
  const joueurActif = etat ? (etat.tour_actuel === 0 ? etat.joueur1 : etat.joueur2) : null;
  const joueurAdverse = etat ? (etat.tour_actuel === 0 ? etat.joueur2 : etat.joueur1) : null;

  // Panneaux joueurs — jamais de swap pendant la partie
  // Mode IA       : toujours le joueur humain à gauche
  // Mode 2 joueurs: toujours basé sur monRole
  // Mode local    : suit le tour actuel
  const couleurHumain = modeIA === "j2" ? "rouge" : modeIA === "j1" ? "noir" : null;
  let joueurAffiche, joueurAdverseAffiche;
  if (modeIA !== "aucune" && etat) {
    joueurAffiche        = couleurHumain === "rouge" ? etat.joueur1 : etat.joueur2;
    joueurAdverseAffiche = couleurHumain === "rouge" ? etat.joueur2 : etat.joueur1;
  } else if (modeMultijoueur && monRole && etat) {
    joueurAffiche        = monRole === "joueur1" ? etat.joueur1 : etat.joueur2;
    joueurAdverseAffiche = monRole === "joueur1" ? etat.joueur2 : etat.joueur1;
  } else {
    joueurAffiche        = joueurActif;
    joueurAdverseAffiche = joueurAdverse;
  }
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
  const trCouleur = (c) => c === "rouge" ? t("rouge", L) : c === "noir" ? t("noir", L) : c;

  // Timer
  useEffect(() => {
    clearInterval(timerRef.current);
    if (etape !== "jeu" || !etat || etat.manche_terminee) return;
    if (pauseIAActive) return;
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
          setPopup({ type: "temps_ecoule", titre: t("tempsEcoule", L),
            message: t("rougeNonJoue", L), gagnant: t("noir", L), couleurGagnant: "noir" });
        }
      } else {
        setTimerNoir(restant);
        if (restant <= 0) {
          clearInterval(timerRef.current);
          setPopup({ type: "temps_ecoule", titre: t("tempsEcoule", L),
            message: t("noirNonJoue", L), gagnant: t("rouge", L), couleurGagnant: "rouge" });
        }
      }
    }, 200);
    return () => clearInterval(timerRef.current);
  }, [etape, etat?.tour_actuel, etat?.manche_terminee, etat?.timestamp_debut_tour, modeMultijoueur, statutConnexion, timerChoisi, estTourIA, iaEnCours, L, pauseIAActive]);

  // WebSocket
  useEffect(() => {
    const socket = io(API, { transports: ["polling", "websocket"] });
    socketRef.current = socket;
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
    socket.on("pause_active", () => { setPauseActive(true); setDemandePauseRecue(null); });
    socket.on("pause_terminee", (data) => { setPauseActive(false); if (data?.etat) setEtat(data.etat); });
    socket.on("pause_refusee", () => { setDemandePauseRecue(null); });
    socket.on("message_recu", (data) => {
      const id = Date.now() + Math.random();
      setBullesActives(b => [...b, {
        id, texte: data.texte,
        couleur: data.couleur,
        position: data.couleur === (monRole === "joueur1" ? "rouge" : "noir") ? "bottom" : "top"
      }]);
    });
    return () => socket.disconnect();
  }, []);

  const calculer_scores_locaux = (etatLocal) => {
    if (!etatLocal) return { rouge: 0, noir: 0 };
    const puzzles = etatLocal.plateau?.puzzles || {};
    let rouge = 0, noir = 0;
    Object.values(puzzles).forEach(p => {
      if (p.brise) return;
      const nb = (p.cellules || []).length;
      if (p.complete_par === "rouge") rouge += nb;
      if (p.complete_par === "noir") noir += nb;
    });
    return { rouge, noir };
  };

  const handleTailleValidee = (j1, j2, tailleFin, mode, niveau, timer) => {
    setProps({ j1, j2, taille: tailleFin });
    setModeIA(mode || "aucune");
    setNiveauIA(niveau || 2);
    setTimerChoisi(timer || 30);
    setTimerRouge(timer || 30); setTimerNoir(timer || 30);
    setEtape("photo");
  };

  const handlePlayOnline = async (timer) => {
    setTimerChoisi(timer);
    setMatchmakingActif(true);

    const token = getToken();
    if (!token) {
      alert("Connexion requise pour jouer en ligne");
      setMatchmakingActif(false);
      return;
    }

    try {
      await axios.post(`${API}/matchmaking/rejoindre`,
        { timer_sec: timer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[matchmaking] Rejoint la file avec timer:", timer);
    } catch (e) {
      console.error("Erreur rejoindre file:", e);
      setMatchmakingActif(false);
      alert("Erreur de connexion au matchmaking : " + (e.response?.data?.erreur || e.message));
    }
  };

  const handlePartieCreee = useCallback((id, etatInit, pixels, tt, timerSec, scoresManchesInit) => {
    setPartieId(id); 
    setEtat(etatInit); 
    setPixelsPhoto(pixels); 
    setTaille(tt || 16);
    if (timerSec) { setTimerChoisi(timerSec); setTimerRouge(timerSec); setTimerNoir(timerSec); }
    if (scoresManchesInit) setScoresManches(scoresManchesInit);
    
    if (modeIA !== "aucune") {
      setMonRole("joueur1"); 
      setModeMultijoueur(false); 
      setEtape("jeu");
    } else {
      setMonRole("joueur1"); 
      setModeMultijoueur(true);
      
      //  CRITIQUE: rejoindre la room WebSocket immédiatement
      socketRef.current.emit("rejoindre_partie", { partie_id: id, joueur: "joueur1" });
      
      if (partieIdMatch) {
        setEtape("jeu");
      } else {
        setEtape("lobby");
      }
    }
  }, [modeIA, partieIdMatch]);

  const handleRejoindreManuellement = useCallback(async (id) => {
    if (!id) return;
    setPartieId(id); 
    setMonRole("joueur2"); 
    setModeMultijoueur(true); 
    setEtape("lobby");
    
    //  CRITIQUE: rejoindre la room WebSocket immédiatement
    socketRef.current.emit("rejoindre_partie", { partie_id: id, joueur: "joueur2" });
    
    try {
      const res = await axios.get(`${API}/pixels/${id}`);
      if (res.data && res.data.pixels_photo) {
        setPixelsPhoto(res.data.pixels_photo); 
        setTaille(res.data.taille);
        if (res.data.etat) setEtat(res.data.etat);
        if (res.data.indice) setIndiceReconnaissance(res.data.indice);
        if (res.data.timer_sec) { 
          setTimerChoisi(res.data.timer_sec); 
          setTimerRouge(res.data.timer_sec); 
          setTimerNoir(res.data.timer_sec); 
        }
      }
    } catch (err) { 
      console.error("Pixels introuvables:", err); 
    }
  }, []);

  const gererErreur404 = useCallback((err) => {
    if (err.response?.status === 404) {
      setPopup({ type: "temps_ecoule", titre: t("partiePerdue", L),
        message: t("serveurRedemarre", L), gagnant: null, couleurGagnant: null });
      return true;
    }
    return false;
  }, [L]);

  const declencherIA = useCallback(async (etatCourant, partieIdCourant, mode, niveau) => {
    if (!partieIdCourant || !etatCourant || mode === "aucune") return;
    const tourIA = mode === "j1" ? 0 : 1;
    if (etatCourant.tour_actuel !== tourIA || etatCourant.manche_terminee) return;
    setIaEnCours(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const res = await axios.post(`${API}/ia/${partieIdCourant}`, { niveau });
      setEtat(res.data.etat);
      // DÉTECTION FIN DE MANCHE EN MODE IA
      if (res.data.manche_terminee || res.data.victoire_immediate) {
        const scores = calculer_scores_locaux(res.data.etat);
        setMancheTermineeInfo({ gagnant: res.data.gagnant, scores });
      }
    } catch (err) { console.error("Erreur IA:", err); gererErreur404(err); }
    finally { setIaEnCours(false); }
  }, [gererErreur404]);

  useEffect(() => {
    if (etape === "jeu" && etat && partieId && modeIA !== "aucune" && !iaEnCours && !attenteChoixPouvoir && !pauseIAActive) {
      const tourIA = modeIA === "j1" ? 0 : 1;
      if (etat.tour_actuel === tourIA && !etat.manche_terminee) declencherIA(etat, partieId, modeIA, niveauIA);
    }
  }, [etat?.tour_actuel, etape, partieId, attenteChoixPouvoir, pauseIAActive]);

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
    } catch (err) { console.error("Erreur pouvoir:", err); gererErreur404(err); }
  }, [partieId, modeIA, niveauIA, declencherIA, L, gererErreur404]);

  const handlePoserPiece = useCallback(async (idx, origine) => {
    if (!partieId || estTourIA || !estMonTour) return;
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, {
        action: "poser", piece_index: idx, origine, pouvoir: "rien" });
      setEtat(res.data.etat); 
      setPieceIdx(null);
      if (res.data.double_tour_consomme) setBonusDoubleActif(false);
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
    } catch (err) { console.error("Erreur pose:", err); gererErreur404(err); }
  }, [partieId, estTourIA, estMonTour, modeIA, niveauIA, declencherIA, gererErreur404]);

  const handlePouvoir = useCallback((choix) => {
    setPopup(null);
    if (choix === "rien") envoyerPouvoir({ pouvoir: "rien" });
    else if (choix === "echanger") { setPieceADonner(null); setAttenteChoixPouvoir(true); setPopup({ type: "attente_cible", pouvoir: "echanger", message: t("cliquerAdversaire", L) }); }
    else if (choix === "extraire") { setExtractionsEnCours([]); setAttenteChoixPouvoir(true); setPopup({ type: "attente_extraire", message: t("cliquer1ou2", L) }); }
  }, [envoyerPouvoir, L]);

  const handleCiblePouvoir = useCallback(async (position) => {
    const p = popupRef.current; if (!p) return;
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
          action: "pouvoir", pouvoir: "recoloriage", cible_pouvoir: position });
        setEtat(res.data.etat);
        await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
      } catch (err) { console.error(err); gererErreur404(err); }
      return;
    }
    if (p.type === "attente_cible") {
      const pouvoir = p.pouvoir; 
      setPopup(null);
      await envoyerPouvoir({ pouvoir, cible_pouvoir: position });
    }
  }, [partieId, modeIA, niveauIA, declencherIA, envoyerPouvoir, gererErreur404]);

  const handleConfirmerExtraction = useCallback(async () => {
    setPopup(null);
    if (extractionsEnCours.length === 0) await envoyerPouvoir({ pouvoir: "rien" });
    else await envoyerPouvoir({ pouvoir: "extraire", extraire: extractionsEnCours });
    setExtractionsEnCours([]);
  }, [extractionsEnCours, envoyerPouvoir]);

  const handleRepiocher = async () => {
    if (!estMonTour) return;
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, { action: "repiocher" });
      setEtat(res.data.etat);
      await declencherIA(res.data.etat, partieId, modeIA, niveauIA);
    } catch (err) { console.error(err); gererErreur404(err); }
  };

  const handleScout = async () => {
    if (!estMonTour) return;
    try {
      const res = await axios.post(`${API}/jouer/${partieId}`, { action: "scout" });
      if (res.data.succes === false) return;
      setEtat(res.data.etat);
      setScoutPieces(res.data.pieces_vues || []);
      setScoutEchanges(res.data.echanges || []);
      setPopup({ type: "scout" });
    } catch (err) { console.error(err); gererErreur404(err); }
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setEtat(null); setPartieId(null);
    setPartieIdMatch(null); setPseudoAdversaireMatch(null);
    setMonRole(null); setModeMultijoueur(false); setStatutConnexion("attente");
    setBonusDoubleActif(false); setReconnaissanceTentee(false); setIndiceReconnaissance(null);
    setTimerRouge(timerChoisi); setTimerNoir(timerChoisi);
    setExtractionsEnCours([]); setAttenteChoixPouvoir(false); setPopup(null);
    setMancheTermineeInfo(null); setPauseActive(false); setPauseIAActive(false); setDemandePauseRecue(null);
    setIaEnCours(false);
    setEtape(utilisateur?.pseudo ? "taille" : (utilisateur ? "pseudo" : "auth"));
  };

  const handlePaiement = async (plan) => {
    try {
      const token = getToken();
      const res = await fetch(`${API}/stripe/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch(e) { console.error(e); }
  };

  const onDeconnecter = () => {
    localStorage.removeItem("elmaas_token"); localStorage.removeItem("elmaas_user");
    setUtilisateur(null); setShowParametres(false); handleReset();
  };

  const envoyerMessage = () => {
    if (!messageChat.trim()) return;
    if (messageChat.length > 30) return;
    const maintenant = Date.now();
    if (maintenant - lastMsgTime.current < 3000) return;
    lastMsgTime.current = maintenant;
    const couleurMoi = monRole === "joueur1" ? "rouge" : "noir";
    socketRef.current?.emit("message_envoye", {
      partie_id: partieId, texte: messageChat.slice(0, 30), couleur: couleurMoi
    });
    const id = Date.now() + Math.random();
    setBullesActives(b => [...b, { id, texte: messageChat.slice(0, 30),
      couleur: couleurMoi, position: "bottom" }]);
    setMessageChat("");
  };

  const boutonParamsFlottant = etape !== "jeu" && (
    <BtnParamsFlottant L={L} onClick={() => setShowParametres(true)} />
  );
  const popupParams = showParametres && (
    <PopupParametres utilisateur={utilisateur} L={L} indexLangue={indexLangue}
      changerLangue={changerLangue} onFermer={() => setShowParametres(false)}
      onDeconnecter={onDeconnecter} onPaiement={handlePaiement} />
  );

  if (etape === "auth") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}
      <EcranAuth onConnecte={(user) => { setUtilisateur(user); setEtape(user?.pseudo ? "taille" : (user ? "pseudo" : "taille")); }} L={L} />
    </div>
  );

  if (etape === "pseudo") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}
      <EcranPseudo L={L} onPseudoDefini={(user) => { setUtilisateur(user); setEtape("taille"); }} />
    </div>
  );

  if (etape === "taille") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}
      {matchmakingActif && (
        <PopupMatchmaking L={L} timerSec={timerChoisi} utilisateur={utilisateur}
          onAnnuler={() => setMatchmakingActif(false)}
          onMatchTrouve={(data) => {
            setMatchmakingActif(false);
            setPartieIdMatch(data.partie_id);
            setPseudoAdversaireMatch(data.adversaire_pseudo);
            setModeMultijoueur(true);
            
            if (data.ma_couleur === "rouge") {
              setMonRole("joueur1");
              setEtape("photo");
            } else {
              //  JOUEUR 2 : rejoindre IMMÉDIATEMENT la room WebSocket
              setMonRole("joueur2");
              setPartieId(data.partie_id);
              setEtape("lobby");
              
              // CRITIQUE : rejoindre tout de suite
              socketRef.current.emit("rejoindre_partie", {
                partie_id: data.partie_id,
                joueur: "joueur2"
              });
              
              // Récupérer les pixels en arrière-plan
              const pollerPartie = async () => {
                try {
                  const res = await axios.get(`${API}/pixels/${data.partie_id}`);
                  if (res.data && res.data.pixels_photo) {
                    setPixelsPhoto(res.data.pixels_photo);
                    setTaille(res.data.taille);
                    if (res.data.etat) setEtat(res.data.etat);
                    if (res.data.indice) setIndiceReconnaissance(res.data.indice);
                    if (res.data.timer_sec) {
                      setTimerChoisi(res.data.timer_sec);
                      setTimerRouge(res.data.timer_sec);
                      setTimerNoir(res.data.timer_sec);
                    }
                    return;
                  }
                } catch (e) {}
                setTimeout(pollerPartie, 2000);
              };
              pollerPartie();
            }
          }}
        />
      )}
      <EcranTaille onValider={handleTailleValidee} onPlayOnline={handlePlayOnline} L={L} utilisateur={utilisateur} />
    </div>
  );

  if (etape === "photo") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}
      {modeIA === "aucune" && (
        <div style={{ position: "absolute", bottom: 32, width: "100%", display: "flex", justifyContent: "center" }}>
          <button className="btn-action" style={{ fontSize: 15, padding: "10px 20px" }}
            onClick={() => { setMonRole("joueur2"); setEtape("lobby"); }}>
            {t("jeSuisJoueur2", L)}
          </button>
        </div>
      )}
      <EcranPhoto2 prop1={props.j1} prop2={props.j2} timerSec={timerChoisi}
        utilisateur={utilisateur} modeIA={modeIA} partieIdMatch={partieIdMatch}
        onPartieCreee={handlePartieCreee} L={L} />
    </div>
  );

  if (etape === "lobby") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}
      <EcranLobby 
        partieId={partieId} 
        monRole={monRole} 
        statutConnexion={statutConnexion}
        onRejoindreManuellement={handleRejoindreManuellement} 
        L={L}
        dejaMatche={modeMultijoueur && monRole === "joueur2" && !!partieId && !etat}
        onPartiePrete={() => setEtape("jeu")}
      />
    </div>
  );

  // 
  // ÉCRAN ANALYSE
  // 
  if (showAnalyse) {
    return (
      <div className="app">
        <EcranAnalyse
          partieId={partieId}
          couleurJoueur={modeIA !== "aucune" ? (modeIA === "j1" ? "noir" : "rouge") : (monRole === "joueur2" ? "noir" : "rouge")}
          mode={modeAnalyse}
          pixelsPhoto={pixelsPhoto}
          taille={taille}
          L={L}
          onFermer={() => { setShowAnalyse(false); setMancheTermineeInfo(null); }}
        />
      </div>
    );
  }

  // 
  // JEU PRINCIPAL
  // 
  return (
    <div className="app jeu">
      {popupParams}

      {bullesActives.map(b => (
        <BulleMessage key={b.id} texte={b.texte} couleur={b.couleur} position={b.position}
          onFermer={() => setBullesActives(bb => bb.filter(x => x.id !== b.id))} />
      ))}

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
                  <div style={{
                    fontSize: 12, fontStyle: "italic", color: "var(--muted)",
                    textAlign: "center", maxWidth: 320, lineHeight: 1.5, padding: "4px 0"
                  }}>
                    {egalite ? "" : jaiGagne ? getSloganVictoire(L) : getSloganDefaite(L)}
                  </div>
                </>
              );
            })()}
            <div style={{ display: "flex", gap: 24, justifyContent: "center", fontSize: 32, fontFamily: "var(--brush)" }}>
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
            <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              Score cumulé vs {pseudoAdverse} : {scoresCumules.moi}-{scoresCumules.lui}
            </div>
            <div className="popup-options" style={{ flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", marginBottom: 4 }}>
                {L === 0 ? "Analyser la partie" : L === 1 ? "Analyze game" : L === 2 ? "تحليل المباراة" : "Analizar partida"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="popup-btn" style={{ flex: 1, borderColor: "var(--accent-culture)", color: "var(--accent-culture)" }}
                  onClick={() => { setModeAnalyse("rapide"); setMancheTermineeInfo(null); setShowAnalyse(true); }}>
                  {L === 0 ? "Rapide" : L === 1 ? "Quick" : L === 2 ? "سريع" : "Rápido"}
                </button>
                <button className="popup-btn" style={{ flex: 1, borderColor: "#ffaa44", color: "#ffaa44" }}
                  onClick={() => { setModeAnalyse("profonde"); setMancheTermineeInfo(null); setShowAnalyse(true); }}>
                  {L === 0 ? "Profonde" : L === 1 ? "Deep" : L === 2 ? "عميق" : "Profundo"}
                </button>
              </div>
              <button className="popup-btn" onClick={handleReset}>{t("nouvellePartie", L)}</button>
            </div>
          </div>
        </div>
      )}

      {pauseIAActive && modeIA !== "aucune" && (
        <div className="popup-overlay">
          <div className="popup-pouvoir" style={{ gap: 16 }}>
            <div className="popup-titre">{t("jeuEnPause", L)}</div>
            <button className="popup-btn" onClick={() => setPauseIAActive(false)}>{t("reprendre", L)}</button>
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
                <button className="popup-btn" onClick={() => { setDemandePauseRecue(null); axios.post(`${API}/pause/refuser/${partieId}`); }}>
                  {t("annuler", L)}
                </button>
              </>
            ) : (
              <>
                <div className="popup-titre">{t("pauseDemandee", L)}</div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>{t("adversaireDemandePause", L)}</div>
                <div className="popup-options" style={{ flexDirection: "row", gap: 10 }}>
                  <button className="popup-btn" style={{ flex: 1 }} onClick={() => axios.post(`${API}/pause/accepter/${partieId}`)}>{t("accepter", L)}</button>
                  <button className="popup-btn" style={{ flex: 1 }} onClick={() => axios.post(`${API}/pause/refuser/${partieId}`)}>{t("refuser", L)}</button>
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
            <button className="popup-btn" onClick={() => axios.post(`${API}/pause/reprendre/${partieId}`)}>{t("reprendre", L)}</button>
          </div>
        </div>
      )}

      {popup?.type === "pouvoir" && <PopupPouvoir serie={popup.serie} onChoisir={handlePouvoir} L={L} />}
      {popup?.type === "scout" && <PopupScout pieces={scoutPieces} couleur={joueurAffiche?.couleur} echanges={scoutEchanges} onFermer={() => setPopup(null)} L={L} />}
      {popup?.type === "manuel" && <PopupManuel onFermer={() => setPopup(null)} L={L} />}
      {popup?.type === "reconnaissance" && (
        <PopupReconnaissance indice={indiceReconnaissance} tenteeDejaFaite={reconnaissanceTentee}
          onTenter={async (proposition) => {
            const res = await axios.post(`${API}/reconnaitre/${partieId}`, { proposition });
            setReconnaissanceTentee(true);
            if (res.data.succes) setBonusDoubleActif(true);
            return res.data;
          }}
          onFermer={() => setPopup(null)} L={L} />
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
          <button style={{ background: "#22441188", color: "#88ff88", borderColor: "#88ff8844" }} onClick={handleConfirmerExtraction}>{t("confirmer", L)}</button>
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
        <div className="popup-overlay" onClick={() => { setPopup(null); handleReset(); }}>
          <div className="popup-pouvoir popup-fin" onClick={e => e.stopPropagation()}>
            <div className="popup-titre">{popup.titre}</div>
            <div className="popup-sous-titre">{popup.message}</div>
            {popup.gagnant && (
              <div className={`popup-gagnant ${popup.couleurGagnant}`}>{popup.gagnant} {t("gagne", L)}</div>
            )}
            <div className="popup-options-fin">
              <button className="popup-btn" onClick={() => { setPopup(null); handleReset(); }}>{t("fermer", L)}</button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-gauche">
          <h1 className="titre-jeu-petit">ELMAAS</h1>
          <div className="pseudo-joueur rouge">
            <span className="pseudo-nom">{modeIA === "j1" ? (niveauIA === 1 ? "CHESS" : niveauIA === 2 ? "ELMAASYON" : niveauIA === 3 ? "ELMAAS" : "GM 2500+") : (utilisateur?.pseudo || "Joueur 1")}</span>
            <span className="pseudo-score">{etat?.scores?.rouge ?? 0}</span>
          </div>
        </div>

        <div className="header-centre">
          <div className="timers">
            {modeIA !== "j1" && <TimerBloc secondes={timerRouge} couleur="rouge" actif={etat?.tour_actuel === 0 && !popup && !pauseIAActive} L={L} />}
            {modeIA !== "j2" && <TimerBloc secondes={timerNoir} couleur="noir" actif={etat?.tour_actuel === 1 && !popup && !pauseIAActive} L={L} />}
          </div>
          {pseudoAdverse && (scoresCumules.moi > 0 || scoresCumules.lui > 0) && (
            <div className="score-cumule">
              {t("scoreContre", L)} {pseudoAdverse}: {scoresCumules.moi}-{scoresCumules.lui}
            </div>
          )}
        </div>

        <div className="header-droite">
          <div className="pseudo-joueur noir">
            <span className="pseudo-nom">{modeIA === "j2" ? (niveauIA === 1 ? "CHESS" : niveauIA === 2 ? "ELMAASYON" : niveauIA === 3 ? "ELMAAS" : "GM 2500+") : pseudoAdverse}</span>
            <span className="pseudo-score">{etat?.scores?.noir ?? 0}</span>
          </div>
          {/* Parametres uniquement pendant le jeu */}
          <div className="tour-info">
            {t("tour", L)} {etat?.numero_tour}
            {modeMultijoueur && (
              <span className="badge-ia" style={{ background: estMonTour ? "#22441188" : "#44111188", color: estMonTour ? "#88ff88" : "#ff8888" }}>
                {estMonTour ? t("tonTour", L) : t("adversaireJoue", L)}
              </span>
            )}
            {bonusDoubleActif && <span className="badge-ia" style={{ background: "#44220088", color: "#ffaa44" }}>{t("doubleTourActif", L)}</span>}
            {estTourIA && <span className="badge-ia">IA{iaEnCours ? " ..." : ""}</span>}
            {joueurAffiche?.serie_actuelle >= 3 && <span className="badge-serie">{t("serie", L)} {joueurAffiche.serie_actuelle}</span>}
          </div>
          {dernierCoupClassif && (
            <span className="badge-classif" style={{
              background: CLASSIFICATION_COUP[dernierCoupClassif]?.couleur + "22",
              borderColor: CLASSIFICATION_COUP[dernierCoupClassif]?.couleur,
              color: CLASSIFICATION_COUP[dernierCoupClassif]?.couleur
            }}>
              {dernierCoupClassif}
            </span>
          )}
          <button className="btn-manuel" onClick={() => setShowParametres(true)} title={t("parametres", L)}></button>
          <button className="btn-manuel" onClick={() => setPopup({ type: "manuel" })} title={t("manuelTitre", L)}>?</button>
          <button className="btn-reset" onClick={handleReset}>{t("nouvellePartie", L)}</button>
        </div>
      </header>

      <div className="zone-adverse">
        <div className="adverse-label">
          {t("adversaire", L)} ({trCouleur(joueurAdverseAffiche?.couleur)}) — {(joueurAdverseAffiche?.nb_pieces_reserve || 0) + (joueurAdverseAffiche?.main_active?.length || 0)} {t("pieces", L)}
        </div>
        <div className="adverse-pieces">
          {(joueurAdverseAffiche?.main_active || []).map((_, i) => (
            <div key={i} className={"piece-cachee " + joueurAdverseAffiche?.couleur} />
          ))}
        </div>
      </div>

      <div className="zone-jeu">
        <div className="panneau-main">
          <div className="panneau-titre">{t("mesPieces", L)} ({trCouleur(joueurAffiche?.couleur)})</div>
          <div className="main-pieces-list">
            {(joueurAffiche?.main_active || []).map((piece, i) => {
              const clickProteger = popup?.type === "attente_cible" && popup?.pouvoir === "proteger";
              const clickEchanger = popup?.type === "attente_cible" && popup?.pouvoir === "echanger";
              const estSelectPourDonner = clickEchanger && pieceADonner === i;
              return (
                <div key={i} style={{ position: "relative" }}>
                  <MiniPiece piece={piece} couleur={joueurAffiche?.couleur}
                    estSelectionnee={pieceIdx === i || estSelectPourDonner}
                    onClick={() => {
                      if (clickProteger) { setPopup(null); envoyerPouvoir({ pouvoir: "proteger_main", piece_index: i }); }
                      else if (clickEchanger) { setPieceADonner(pieceADonner === i ? null : i); }
                      else if (!enModeCible && !attenteChoixPouvoir && estMonTour) { setPieceIdx(pieceIdx === i ? null : i); }
                    }} />
                </div>
              );
            })}
          </div>
          {(joueurAffiche?.main_active || []).length === 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("mainVide", L)}</div>}
          <div className="panneau-titre" style={{ marginTop: 10 }}>{t("reserve", L)} {joueurAffiche?.nb_pieces_reserve}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("piecesPosees", L)} {joueurAffiche?.nb_pieces_posees_depuis_regen ?? 0} / {joueurAffiche?.seuil_regen_actuel ?? 5}</div>
          <div className="serie-info">{t("serieLabel", L)} {joueurAffiche?.serie_actuelle}</div>

          {(() => {
            const clickEchanger = popup?.type === "attente_cible" && popup?.pouvoir === "echanger";
            const mainAdverse = joueurAdverseAffiche?.main_active || [];
            return (
              <>
                <div className="panneau-titre" style={{ marginTop: 14 }}>
                  {t("adversaire", L)} ({trCouleur(joueurAdverseAffiche?.couleur)})
                </div>
                <div className="main-pieces-list">
                  {mainAdverse.map((piece, i) => (
                    <div key={i} style={{ position: "relative", opacity: clickEchanger ? 1 : 0.4 }}>
                      <MiniPiece piece={piece} couleur={joueurAdverseAffiche?.couleur}
                        onClick={() => {
                          if (clickEchanger) {
                            if (pieceADonner === null) return;
                            setPopup(null); setPieceADonner(null);
                            envoyerPouvoir({ pouvoir: "echanger_main", piece_index_adverse: i, piece_index_donner: pieceADonner });
                          }
                        }} />
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        <div className="plateau-central">
          <Board etat={etat} taille={taille} couleurJoueur={joueurAffiche?.couleur}
            pieceSelectionnee={pieceIdx !== null && !enModeCible && !attenteChoixPouvoir ? joueurAffiche?.main_active[pieceIdx] : null}
            pieceIdx={pieceIdx} pixelsPhoto={pixelsPhoto}
            onPoserPiece={!enModeCible && !attenteChoixPouvoir ? handlePoserPiece : null}
            modeCible={enModeCible} extractionsEnCours={extractionsEnCours}
            onCibleSelectionnee={enModeCible ? handleCiblePouvoir : null} />
        </div>

        <div className="panneau-actions">
          <div className="panneau-titre">{t("actions", L)}</div>
          <button className="btn-action" onClick={handleRepiocher} disabled={!estMonTour || enModeCible || attenteChoixPouvoir || estTourIA}>
            {t("repiocher", L)}
          </button>
          <button className="btn-action scout" onClick={handleScout} disabled={!estMonTour || enModeCible || attenteChoixPouvoir || estTourIA}>
            {t("scout", L)}
          </button>

          {modeMultijoueur && modeIA === "aucune" && monRole === "joueur2" && indiceReconnaissance && (
            <button className="btn-action"
              style={{ borderColor: reconnaissanceTentee ? "#444" : "#cc880044", color: reconnaissanceTentee ? "var(--muted)" : "#ffaa44" }}
              onClick={() => setPopup({ type: "reconnaissance" })} disabled={reconnaissanceTentee}>
              {reconnaissanceTentee ? t("dejaTente", L) : t("reconnaitre", L)}
            </button>
          )}

          {modeIA !== "aucune" && (
            <button className="btn-action" onClick={() => setPauseIAActive(true)}>{t("pause", L)}</button>
          )}
          {modeIA === "aucune" && (
            <button className="btn-action" onClick={() => {
              const couleur = monRole === "joueur2" ? "noir" : "rouge";
              axios.post(`${API}/pause/demander/${partieId}`, { couleur });
              setDemandePauseRecue(couleur);
            }}>{t("pause", L)}</button>
          )}

          {modeMultijoueur && (
            <div className="chat-zone">
              <input type="text" maxLength={30} placeholder={t("envoyerMessage", L)}
                value={messageChat} onChange={e => setMessageChat(e.target.value)}
                onKeyDown={e => e.key === "Enter" && envoyerMessage()} />
              <button onClick={envoyerMessage} disabled={!messageChat.trim()}></button>
            </div>
          )}

          {!estMonTour && modeMultijoueur && (
            <div className="hint-action" style={{ borderColor: "#ff444444", color: "#ff8888" }}>
              {t("attendsTonTour", L)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}