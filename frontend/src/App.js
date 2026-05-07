// ELMAAS App.js — VERSION CORRIGÉE (Analyse profonde uniquement)

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
    <button className="btn-params-flottant" onClick={onClick} title={t("parametres", L)}>&#x2699;</button>
  );
}

//  Popup Paramètres 
function PopupParametres({ utilisateur, L, indexLangue, changerLangue, onFermer, onDeconnecter, onPaiement, onVoirPlans }) {
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
          <div style={{ width: "100%", borderTop: "1px solid var(--bord)", paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{L===0?"Formule active":L===1?"Active plan":L===2?"\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0646\u0634\u0637\u0629":"Plan activo"} :</span>
              <span style={{
                fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
                color: utilisateur.plan === "elmaas" ? "#cc88ff" : utilisateur.plan === "elmaasyon" ? "#66aaff" : "#6699ff",
              }}>
                {utilisateur.plan === "elmaas" ? "ELMAAS" : utilisateur.plan === "elmaasyon" ? "ELMAASYON" : (L===0?"Gratuit":L===1?"Free":L===2?"\u0645\u062c\u0627\u0646\u064a":"Gratis")}
              </span>
            </div>
            <button
              onClick={onVoirPlans}
              style={{
                width: "100%", padding: "13px 18px",
                background: "linear-gradient(135deg, rgba(68,136,255,0.10), rgba(170,85,255,0.10))",
                border: "1px solid rgba(100,120,220,0.35)", borderRadius: 8,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 12, transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, rgba(68,136,255,0.18), rgba(170,85,255,0.18))"}
              onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, rgba(68,136,255,0.10), rgba(170,85,255,0.10))"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{"\u2726"}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{
                    fontFamily: "var(--titre, 'Cinzel', serif)",
                    fontSize: 14, fontWeight: 700, letterSpacing: "0.08em",
                    background: "linear-gradient(90deg, #4488ff, #aa55ff)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {L===0?"D\u00e9couvrir les formules":L===1?"Explore plans":L===2?"\u0627\u0643\u062a\u0634\u0641 \u0627\u0644\u0628\u0627\u0642\u0627\u062a":"Ver planes"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {L===0?"Uploads \u00b7 Analyse \u00b7 IA avanc\u00e9e":L===1?"Uploads \u00b7 Analysis \u00b7 Advanced AI":L===2?"\u062a\u062d\u0645\u064a\u0644 \u00b7 \u062a\u062d\u0644\u064a\u0644 \u00b7 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a":"Subidas \u00b7 An\u00e1lisis \u00b7 IA avanzada"}
                  </div>
                </div>
              </div>
              <span style={{ color: "#aa55ff", fontSize: 18, opacity: 0.8 }}>{"\u2192"}</span>
            </button>
          </div>
        )}

        <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
      </div>
    </div>
  );
}

// ── EcranPlans — Page dediee aux formules ─────────────────────────────────────
function EcranPlans({ utilisateur, L, onFermer, onPaiement }) {
  const mois = L===0?"mois":L===1?"month":L===2?"\u0634\u0647\u0631":"mes";
  const lancement = L===0?"Offre de lancement \u221250%":L===1?"Launch offer \u221250%":L===2?"\u0639\u0631\u0636 \u0627\u0644\u0625\u0637\u0644\u0627\u0642 \u221250%":"Oferta de lanzamiento \u221250%";

  const Feature = ({ ok, children }) => (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
      <span style={{ fontSize:13, color: ok ? "#66ee88" : "#555", flexShrink:0, marginTop:1 }}>{ok ? "\u2713" : "\u2717"}</span>
      <span style={{ fontSize:13, color: ok ? "var(--texte)" : "var(--muted)", lineHeight:1.5 }}>{children}</span>
    </div>
  );

  const Section = ({ label }) => (
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      color:"var(--muted)", marginBottom:8, marginTop:16, opacity:0.7 }}>{label}</div>
  );

  const photoLabel = L===0?"Photos":L===1?"Photos":L===2?"\u0627\u0644\u0635\u0648\u0631":"Fotos";
  const analyseLabel = L===0?"Analyse":L===1?"Analysis":L===2?"\u0627\u0644\u062a\u062d\u0644\u064a\u0644":"An\u00e1lisis";
  const iaLabel = L===0?"Intelligence Artificielle":L===1?"Artificial Intelligence":L===2?"\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a":"Inteligencia Artificial";

  const txt = {
    biblio: [
      "Biblioth\u00e8que de photos incluse",
      "Built-in photo library",
      "\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u062f\u0645\u062c\u0629",
      "Fotos de la biblioteca incluidas"
    ],
    upload1: [
      "1 photo personnalis\u00e9e (upload)",
      "1 custom photo upload",
      "\u062a\u062d\u0645\u064a\u0644 \u0635\u0648\u0631\u0629 \u0645\u062e\u0635\u0635\u0629 \u0648\u0627\u062d\u062f\u0629",
      "1 foto personalizada (subida)"
    ],
    uploadIllim: [
      "Uploads illimit\u00e9s (vos propres photos)",
      "Unlimited uploads (your own photos)",
      "\u062a\u062d\u0645\u064a\u0644\u0627\u062a \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629 (\u0635\u0648\u0631\u0643 \u0627\u0644\u062e\u0627\u0635\u0629)",
      "Subidas ilimitadas (tus fotos)"
    ],
    uploadIllimShort: [
      "Uploads illimit\u00e9s",
      "Unlimited uploads",
      "\u062a\u062d\u0645\u064a\u0644\u0627\u062a \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629",
      "Subidas ilimitadas"
    ],
    analyse1: [
      "1 analyse de partie / jour",
      "1 game analysis / day",
      "\u062a\u062d\u0644\u064a\u0644 \u0645\u0628\u0627\u0631\u0627\u0629 \u0648\u0627\u062d\u062f / \u064a\u0648\u0645",
      "1 an\u00e1lisis de partida / d\u00eda"
    ],
    analyse3: [
      "3 analyses de partie / jour",
      "3 game analyses / day",
      "3 \u062a\u062d\u0627\u0644\u064a\u0644 / \u064a\u0648\u0645",
      "3 an\u00e1lisis de partida / d\u00eda"
    ],
    analyseIllim: [
      "Analyses illimit\u00e9es",
      "Unlimited analyses",
      "\u062a\u062d\u0627\u0644\u064a\u0644 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629",
      "An\u00e1lisis ilimitados"
    ],
    visuCoup: [
      "Visualisation coup par coup",
      "Move-by-move visualization",
      "\u062a\u0635\u0648\u0631 \u0627\u0644\u0623\u062d\u062f\u0627\u062b \u062d\u0631\u0643\u0629 \u0628\u062d\u0631\u0643\u0629",
      "Visualizaci\u00f3n jugada a jugada"
    ],
    stratProf: [
      "Comparaison strat\u00e9gique profonde",
      "Deep strategic comparison",
      "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0645\u0639\u0645\u0651\u0642\u0629",
      "Comparaci\u00f3n estrat\u00e9gica profunda"
    ],
    bots3: [
      "Robots Chess, Amal, ELMAASYON",
      "Chess, Amal, ELMAASYON bots",
      "\u0631\u0648\u0628\u0648\u062a\u0627\u062a Chess, Amal, ELMAASYON",
      "Robots Chess, Amal, ELMAASYON"
    ],
    botElmaas: [
      "Robot ELMAAS (Grandmaster)",
      "ELMAAS bot (Grandmaster)",
      "\u0631\u0648\u0628\u0648\u062a ELMAAS (\u063a\u0631\u0627\u0646\u062f \u0645\u0627\u0633\u062a\u0631)",
      "Robot ELMAAS (Grandmaster)"
    ],
    botElmaas15: [
      "Robot ELMAAS \u2014 Grandmaster (~15s/coup)",
      "ELMAAS bot \u2014 Grandmaster (~15s/move)",
      "\u0631\u0648\u0628\u0648\u062a ELMAAS \u2014 \u063a\u0631\u0627\u0646\u062f \u0645\u0627\u0633\u062a\u0631 (~15\u062b/\u062d\u0631\u0643\u0629)",
      "Robot ELMAAS \u2014 Grandmaster (~15s/jugada)"
    ],
    iaReflex: [
      "R\u00e9flexion IA jusqu'\u00e0 15 secondes par coup",
      "AI thinking up to 15 seconds per move",
      "\u062a\u0641\u0643\u064a\u0631 \u064a\u0635\u0644 \u0625\u0644\u0649 15 \u062b\u0627\u0646\u064a\u0629 \u0644\u0643\u0644 \u062d\u0631\u0643\u0629",
      "Reflexi\u00f3n IA hasta 15 segundos por jugada"
    ],
    gerer: [
      "G\u00e9rer l'abonnement",
      "Manage subscription",
      "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643",
      "Gestionar suscripci\u00f3n"
    ],
    choisirYon: [
      "Choisir ELMAASYON",
      "Get ELMAASYON",
      "\u0627\u0634\u062a\u0631\u0643 \u0641\u064a ELMAASYON",
      "Elegir ELMAASYON"
    ],
    choisirElm: [
      "Choisir ELMAAS",
      "Get ELMAAS",
      "\u0627\u0634\u062a\u0631\u0643 \u0641\u064a ELMAAS",
      "Elegir ELMAAS"
    ],
    inclus: [
      "Inclus dans ELMAAS",
      "Included in ELMAAS",
      "\u0645\u0636\u0645\u0651\u0646 \u0641\u064a ELMAAS",
      "Incluido en ELMAAS"
    ],
    formuleActuelle: [
      "FORMULE ACTUELLE",
      "CURRENT PLAN",
      "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629",
      "PLAN ACTUAL"
    ],
    planActuel: [
      "Formule actuelle",
      "Current plan",
      "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629",
      "Plan actual"
    ],
    populaire: ["POPULAIRE", "POPULAR", "\u0627\u0644\u0623\u0643\u062b\u0631 \u0634\u064a\u0648\u0639\u0627\u064b", "POPULAR"],
    gratuit: ["Gratuit", "Free", "\u0645\u062c\u0627\u0646\u064a", "Gratis"],
    pourToujours: ["Pour toujours", "Forever free", "\u0645\u062c\u0627\u0646\u0627\u064b \u0644\u0644\u0623\u0628\u062f", "Gratis para siempre"],
    offreLancement: ["Offre lancement", "Launch offer", "\u0639\u0631\u0636 \u0627\u0644\u0625\u0637\u0644\u0627\u0642", "Oferta lanzamiento"],
    grandmaster: ["Le niveau Grandmaster", "The Grandmaster tier", "\u0645\u0633\u062a\u0648\u0649 \u063a\u0631\u0627\u0646\u062f \u0645\u0627\u0633\u062a\u0631", "El nivel Grandmaster"],
    choisir: ["Choisissez votre formule", "Choose your plan", "\u0627\u062e\u062a\u0631 \u0628\u0627\u0642\u062a\u0643", "Elige tu plan"],
    retour: ["\u2190 Retour", "\u2190 Back", "\u2192 \u0631\u062c\u0648\u0639", "\u2190 Volver"],
    offreLimitee: [
      "offre limit\u00e9e \u00e0 l'ouverture",
      "limited opening offer",
      "\u0639\u0631\u0636 \u0645\u062d\u062f\u0648\u062f \u0639\u0646\u062f \u0627\u0644\u0625\u0637\u0644\u0627\u0642",
      "oferta limitada al lanzamiento"
    ],
    paiement: [
      "Paiement s\u00e9curis\u00e9 via Stripe \u00b7 Annulation \u00e0 tout moment \u00b7 Sans engagement",
      "Secure payment via Stripe \u00b7 Cancel anytime \u00b7 No commitment",
      "\u062f\u0641\u0639 \u0622\u0645\u0646 \u0639\u0628\u0631 Stripe \u00b7 \u0625\u0644\u063a\u0627\u0621 \u0641\u064a \u0623\u064a \u0648\u0642\u062a \u00b7 \u0628\u062f\u0648\u0646 \u0627\u0644\u062a\u0632\u0627\u0645",
      "Pago seguro v\u00eda Stripe \u00b7 Cancela cuando quieras \u00b7 Sin compromiso"
    ],
  };
  const T = (key) => txt[key][L] || txt[key][0];

  return (
    <div style={{
      position:"fixed", inset:0, background:"var(--bg)", zIndex:2000,
      display:"flex", flexDirection:"column", overflowY:"auto",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 24px", borderBottom:"1px solid var(--bord)",
        position:"sticky", top:0, background:"var(--bg)", zIndex:10,
      }}>
        <div>
          <div style={{ fontFamily:"var(--titre)", fontSize:22, letterSpacing:"0.1em", color:"var(--texte)" }}>ELMAAS</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{T("choisir")}</div>
        </div>
        <button onClick={onFermer} style={{
          background:"none", border:"1px solid var(--bord)", color:"var(--muted)",
          padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:13,
        }}>{T("retour")}</button>
      </div>

      {/* Banniere lancement */}
      <div style={{
        textAlign:"center", padding:"10px 16px",
        background:"linear-gradient(90deg,rgba(68,136,255,0.12),rgba(170,85,255,0.12))",
        borderBottom:"1px solid rgba(100,120,220,0.2)",
        fontSize:12, color:"#aa88ff", letterSpacing:"0.06em",
      }}>
        {"\u2726"} {lancement} {"\u2014"} {T("offreLimitee")} {"\u2726"}
      </div>

      {/* Cards */}
      <div style={{
        display:"flex", flexWrap:"wrap", gap:20, padding:"28px 24px",
        justifyContent:"center", maxWidth:1000, margin:"0 auto", width:"100%",
      }}>

        {/* GRATUIT */}
        <div style={{
          flex:"1 1 280px", maxWidth:320,
          background:"rgba(20,30,70,0.3)", border:"1px solid rgba(100,140,220,0.3)",
          borderRadius:12, padding:24, display:"flex", flexDirection:"column", gap:0,
          boxShadow: (!utilisateur?.plan || utilisateur?.plan==="gratuit") ? "0 0 24px rgba(100,140,220,0.15)" : "none",
        }}>
          {(!utilisateur?.plan || utilisateur?.plan==="gratuit") && (
            <div style={{ fontSize:11, color:"#6699ff", letterSpacing:"0.1em", marginBottom:8, fontWeight:700 }}>
              {"\u2726"} {T("formuleActuelle")}
            </div>
          )}
          <div style={{ fontFamily:"var(--titre)", fontSize:20, color:"#6699ff", marginBottom:4 }}>{T("gratuit")}</div>
          <div style={{ fontSize:28, fontWeight:800, color:"#6699ff", marginBottom:4 }}>0\u20ac</div>
          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:20 }}>{T("pourToujours")}</div>

          <Section label={photoLabel} />
          <Feature ok={true}>{T("biblio")}</Feature>
          <Feature ok={true}>{T("upload1")}</Feature>
          <Feature ok={false}>{T("uploadIllimShort")}</Feature>

          <Section label={analyseLabel} />
          <Feature ok={true}>{T("analyse1")}</Feature>
          <Feature ok={false}>{T("analyseIllim")}</Feature>

          <Section label={iaLabel} />
          <Feature ok={true}>{T("bots3")}</Feature>
          <Feature ok={false}>{T("botElmaas")}</Feature>

          <div style={{ marginTop:"auto", paddingTop:20 }}>
            <div style={{ padding:"10px 16px", borderRadius:8, background:"rgba(100,140,220,0.08)",
              border:"1px solid rgba(100,140,220,0.2)", textAlign:"center", fontSize:13, color:"#6699ff" }}>
              {T("planActuel")}
            </div>
          </div>
        </div>

        {/* ELMAASYON */}
        <div style={{
          flex:"1 1 280px", maxWidth:320,
          background: utilisateur?.plan==="elmaasyon" ? "rgba(30,60,140,0.35)" : "rgba(20,30,80,0.3)",
          border: utilisateur?.plan==="elmaasyon" ? "1px solid #4488ff" : "1px solid rgba(68,136,255,0.35)",
          borderRadius:12, padding:24, display:"flex", flexDirection:"column", gap:0,
          boxShadow: utilisateur?.plan==="elmaasyon" ? "0 0 32px rgba(68,136,255,0.18)" : "none",
          position:"relative",
        }}>
          {utilisateur?.plan==="elmaasyon" && (
            <div style={{ fontSize:11, color:"#66aaff", letterSpacing:"0.1em", marginBottom:8, fontWeight:700 }}>
              {"\u2726"} {T("formuleActuelle")}
            </div>
          )}
          {utilisateur?.plan !== "elmaasyon" && utilisateur?.plan !== "elmaas" && (
            <div style={{
              position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
              background:"linear-gradient(135deg,#1144cc,#4488ff)", color:"#fff",
              fontSize:11, fontWeight:700, padding:"4px 14px", borderRadius:20, letterSpacing:"0.08em",
            }}>{T("populaire")}</div>
          )}
          <div style={{ fontFamily:"var(--titre)", fontSize:20, color:"#66aaff", marginBottom:4 }}>ELMAASYON</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
            <span style={{ textDecoration:"line-through", fontSize:14, color:"var(--muted)", opacity:0.5 }}>6.99\u20ac</span>
            <span style={{ fontSize:32, fontWeight:800, color:"#66aaff" }}>3.49\u20ac</span>
          </div>
          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:20 }}>/{mois} {"\u2014"} {T("offreLancement")}</div>

          <Section label={photoLabel} />
          <Feature ok={true}>{T("biblio")}</Feature>
          <Feature ok={true}>{T("uploadIllim")}</Feature>

          <Section label={analyseLabel} />
          <Feature ok={true}>{T("analyse3")}</Feature>
          <Feature ok={true}>{T("visuCoup")}</Feature>
          <Feature ok={false}>{T("analyseIllim")}</Feature>

          <Section label={iaLabel} />
          <Feature ok={true}>{T("bots3")}</Feature>
          <Feature ok={false}>{T("botElmaas")}</Feature>

          <div style={{ marginTop:"auto", paddingTop:20 }}>
            {utilisateur?.plan === "elmaasyon" ? (
              <button className="btn-valider" style={{
                width:"100%", fontSize:13, padding:"11px",
                background:"rgba(68,136,255,0.12)", border:"1px solid #4488ff44",
              }} onClick={async () => {
                const res = await fetch(API+"/stripe/portal", { method:"POST", headers:{ Authorization:"Bearer "+getToken() } });
                const d = await res.json(); if (d.url) window.location.href = d.url;
              }}>{T("gerer")}</button>
            ) : utilisateur?.plan !== "elmaas" ? (
              <button className="btn-valider" style={{
                width:"100%", fontSize:14, padding:"12px",
                background:"linear-gradient(135deg,#1144cc,#4488ff)", border:"none",
              }} onClick={() => onPaiement("elmaasyon")}>{T("choisirYon")}</button>
            ) : (
              <div style={{ padding:"10px", textAlign:"center", fontSize:12, color:"var(--muted)",
                border:"1px solid var(--bord)", borderRadius:8 }}>{T("inclus")}</div>
            )}
          </div>
        </div>

        {/* ELMAAS */}
        <div style={{
          flex:"1 1 280px", maxWidth:320,
          background: utilisateur?.plan==="elmaas" ? "rgba(60,20,120,0.35)" : "rgba(30,10,60,0.3)",
          border: utilisateur?.plan==="elmaas" ? "2px solid #aa55ff" : "1px solid rgba(170,85,255,0.35)",
          borderRadius:12, padding:24, display:"flex", flexDirection:"column", gap:0,
          boxShadow: utilisateur?.plan==="elmaas" ? "0 0 40px rgba(170,85,255,0.25)" : "none",
        }}>
          {utilisateur?.plan==="elmaas" && (
            <div style={{ fontSize:11, color:"#cc88ff", letterSpacing:"0.1em", marginBottom:8, fontWeight:700 }}>
              {"\u2726"} {T("formuleActuelle")}
            </div>
          )}
          <div style={{ fontFamily:"var(--titre)", fontSize:20, color:"#cc88ff", marginBottom:4 }}>ELMAAS</div>
          <div style={{ fontSize:11, color:"#9966cc", letterSpacing:"0.06em", marginBottom:8, fontStyle:"italic" }}>{T("grandmaster")}</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
            <span style={{ textDecoration:"line-through", fontSize:14, color:"var(--muted)", opacity:0.5 }}>12.99\u20ac</span>
            <span style={{ fontSize:32, fontWeight:800, color:"#cc88ff" }}>6.49\u20ac</span>
          </div>
          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:20 }}>/{mois} {"\u2014"} {T("offreLancement")}</div>

          <Section label={photoLabel} />
          <Feature ok={true}>{T("biblio")}</Feature>
          <Feature ok={true}>{T("uploadIllim")}</Feature>

          <Section label={analyseLabel} />
          <Feature ok={true}>{T("analyseIllim")}</Feature>
          <Feature ok={true}>{T("visuCoup")}</Feature>
          <Feature ok={true}>{T("stratProf")}</Feature>

          <Section label={iaLabel} />
          <Feature ok={true}>{T("bots3")}</Feature>
          <Feature ok={true}>{T("botElmaas15")}</Feature>
          <Feature ok={true}>{T("iaReflex")}</Feature>

          <div style={{ marginTop:"auto", paddingTop:20 }}>
            {utilisateur?.plan === "elmaas" ? (
              <button className="btn-valider" style={{
                width:"100%", fontSize:13, padding:"11px",
                background:"rgba(170,85,255,0.12)", border:"1px solid #aa55ff44",
              }} onClick={async () => {
                const res = await fetch(API+"/stripe/portal", { method:"POST", headers:{ Authorization:"Bearer "+getToken() } });
                const d = await res.json(); if (d.url) window.location.href = d.url;
              }}>{T("gerer")}</button>
            ) : (
              <button className="btn-valider" style={{
                width:"100%", fontSize:14, padding:"12px",
                background:"linear-gradient(135deg,#6600cc,#aa55ff)", border:"none",
              }} onClick={() => onPaiement("elmaas")}>{T("choisirElm")}</button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"20px 24px 40px", borderTop:"1px solid var(--bord)", marginTop:8 }}>
        <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.8 }}>{T("paiement")}</div>
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
            {[
              { n: 1, label: "Chess",      locked: false, color: "#cc2200" },
              { n: 2, label: "Amal",       locked: false, color: "#ddaa00" },
              { n: 3, label: "ELMAASYON",  locked: false, color: "#4477ff" },
              { n: 4, label: "ELMAAS",     locked: utilisateur?.plan !== "elmaas", color: "#9933ff" },
            ].map(({ n, label, locked, color }) => (
              <button key={n}
                className={`ia-btn-niveau ${niveauIA === n ? "actif" : ""} ${locked ? "verrouille" : ""}`}
                onClick={() => { if (!locked) setNiveauIA(n); }}
                title={locked ? (L === 0 ? "Réservé au plan ELMAAS" : L === 1 ? "ELMAAS plan only" : L === 2 ? "حصري لخطة ELMAAS" : "Solo plan ELMAAS") : ""}
                style={{
                  borderColor: niveauIA === n ? color : undefined,
                  color: locked ? "#555" : (niveauIA === n ? color : undefined),
                  opacity: locked ? 0.5 : 1,
                  cursor: locked ? "not-allowed" : "pointer",
                  position: "relative",
                }}>
                {label}
                {locked && <span style={{ fontSize: 10, marginLeft: 4 }}>🔒</span>}
              </button>
            ))}
          </div>
        )}
        {modeIA !== "aucune" && niveauIA === 4 && (
          <div style={{
            marginTop: 12, padding: "10px 14px",
            background: "rgba(153,51,255,0.08)",
            borderRadius: 8, border: "1px solid #9933ff44",
            fontSize: 13, lineHeight: 1.5
          }}>
            <div style={{ color: "#9933ff", fontWeight: 700, marginBottom: 4 }}>
              ELMAAS
            </div>
            <div style={{ color: "#cc99ff" }}>
              {L === 0 ? "ELMAAS réfléchit profondément. Chaque coup peut prendre jusqu'à 30 secondes. Ce délai est inhérent à sa puissance." :
               L === 1 ? "ELMAAS thinks deeply. Each move may take up to 30 seconds. This delay is inherent to its power." :
               L === 2 ? "ELMAAS يفكر بعمق. كل حركة قد تستغرق حتى 30 ثانية. هذا التأخير جزء من قوته." :
               "ELMAAS piensa profundamente. Cada movimiento puede tardar hasta 30 segundos. Este retraso es parte de su poder."}
            </div>
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

  const peutUploader = !utilisateur ? false
    : (utilisateur.plan === "elmaas" || utilisateur.plan === "elmaasyon")
      ? true
      : !utilisateur.photo_perso_utilisee;
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
        if (utilisateur && utilisateur.plan !== "elmaas" && utilisateur.plan !== "elmaasyon") {
          const token = getToken();
          try {
            await axios.post(`${API}/consommer_upload`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const upd = { ...utilisateur, photo_perso_utilisee: true };
            localStorage.setItem("elmaas_user", JSON.stringify(upd));
            setUtilisateur(upd);
          } catch (err) {
            if (err.response?.data?.code === "QUOTA_UPLOAD") {
              const msg = L===0 ? "Upload limité à 1 photo (plan Gratuit). Passez à ELMAASYON." :
                          L===1 ? "Upload limited to 1 photo (Free plan). Upgrade to ELMAASYON." :
                          L===2 ? "التحميل محدود بصورة واحدة. ترقّ إلى ELMAASYON." :
                                  "Upload limitado a 1 foto (Gratis). Pasa a ELMAASYON.";
              setErreurPhoto(msg);
              return;
            }
          }
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
      else if (err.response?.data?.code === "QUOTA_UPLOAD") {
        const msg = L===0 ? "Upload limité à 1 photo (plan Gratuit). Passez à ELMAASYON." :
                    L===1 ? "Upload limited to 1 photo (Free plan). Upgrade to ELMAASYON." :
                    L===2 ? "التحميل محدود. ترقّ إلى ELMAASYON." :
                            "Upload limitado a 1 foto (Gratis). Pasa a ELMAASYON.";
        setErreur(msg);
      }
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
            {utilisateur.plan === "elmaas" || utilisateur.plan === "elmaasyon"
              ? t("premiumIllimite", L)
              : t("unePhotoGratuite", L)}
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

// ── Icônes SVG pour le manuel ──────────────────────────────
const IconPlateau = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="6" height="6" stroke="var(--accent-culture)" strokeWidth="1.2" rx="0.5"/>
    <rect x="9" y="1" width="6" height="6" stroke="var(--rouge-c)" strokeWidth="1.2" rx="0.5"/>
    <rect x="1" y="9" width="6" height="6" stroke="var(--muted)" strokeWidth="1.2" rx="0.5"/>
    <rect x="9" y="9" width="6" height="6" stroke="var(--accent-culture)" strokeWidth="1.2" rx="0.5" strokeDasharray="2 1"/>
  </svg>
);
const IconJouer = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <polygon points="3,2 13,8 3,14" fill="var(--accent-culture)" opacity="0.85"/>
  </svg>
);
const IconPuzzle = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 2h5v3.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V2h4v12H9.5c.3-.5.5-1 .5-1.5 0-.8-.7-1.5-1.5-1.5S7 11.7 7 12.5c0 .5.2 1 .5 1.5H2V2z" stroke="var(--accent-culture)" strokeWidth="1" fill="none"/>
  </svg>
);
const IconElmaas = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <polygon points="8,1 15,8 8,15 1,8" stroke="#00BFFF" strokeWidth="1.2" fill="#00BFFF18"/>
    <circle cx="8" cy="8" r="2" fill="#00BFFF" opacity="0.7"/>
  </svg>
);
const IconSerie = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="3" cy="8" r="2" fill="var(--accent-culture)" opacity="0.5"/>
    <circle cx="8" cy="8" r="2" fill="var(--accent-culture)" opacity="0.75"/>
    <circle cx="13" cy="8" r="2" fill="var(--accent-culture)"/>
    <line x1="5" y1="8" x2="6" y2="8" stroke="var(--accent-culture)" strokeWidth="1"/>
    <line x1="10" y1="8" x2="11" y2="8" stroke="var(--accent-culture)" strokeWidth="1"/>
  </svg>
);
const IconFin = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="14" height="14" rx="1" stroke="var(--accent-culture)" strokeWidth="1"/>
    <line x1="4" y1="8" x2="8" y2="12" stroke="var(--accent-culture)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="12" x2="13" y2="4" stroke="var(--accent-culture)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconConseil = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="6" r="4" stroke="var(--accent-culture)" strokeWidth="1.2"/>
    <line x1="8" y1="11" x2="8" y2="14" stroke="var(--accent-culture)" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="6" r="1.2" fill="var(--accent-culture)"/>
  </svg>
);

function PopupManuel({ onFermer, L }) {
  const [onglet, setOnglet] = useState(0);

  const sections = [
    { icon: <IconPlateau />, label: t("mSecPlateau", L) },
    { icon: <IconJouer />,   label: t("mSecJouer", L) },
    { icon: <IconPuzzle />,  label: t("mSecPuzzles", L) },
    { icon: <IconElmaas />,  label: t("mSecElmaas", L) },
    { icon: <IconSerie />,   label: t("mSecSeries", L) },
    { icon: <IconFin />,     label: t("mSecFin", L) },
    { icon: <IconConseil />, label: t("mSecConseils", L) },
  ];

  const renderSection = () => {
    const p = (txt, accent) => (
      <p style={{ marginBottom: 10, color: accent ? "var(--texte)" : "var(--muted)", lineHeight: 1.65, fontSize: 13 }}>{txt}</p>
    );
    const rule = (txt) => (
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 9 }}>
        <div style={{ width: 4, minWidth: 4, height: 4, borderRadius: "50%", background: "var(--accent-culture)", marginTop: 7, opacity: 0.7 }}/>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.65, fontSize: 13 }}>{txt}</p>
      </div>
    );
    const important = (txt) => (
      <div style={{ marginBottom: 10, padding: "8px 10px", borderLeft: "2px solid var(--accent-culture)", background: "var(--accent-culture)08", borderRadius: "0 4px 4px 0" }}>
        <p style={{ margin: 0, color: "var(--texte)", lineHeight: 1.6, fontSize: 12, fontStyle: "italic" }}>{txt}</p>
      </div>
    );

    switch(onglet) {
      case 0: return ( // Plateau
        <>
          {p(t("mPlateauDesc", L), true)}
          {important(t("mPlateauBords", L))}
          {rule(t("mPlateauSurpuzzle", L))}
        </>
      );
      case 1: return ( // Comment jouer
        <>
          {rule(t("mJouerPoser", L))}
          {rule(t("mJouerRepiocher", L))}
          {rule(t("mJouerScout", L))}
        </>
      );
      case 2: return ( // Puzzles
        <>
          {rule(t("mPuzzleMono", L))}
          {rule(t("mPuzzleBicolor", L))}
          {important(t("mPuzzleIntersection", L))}
          {rule(t("mPuzzleScore", L))}
        </>
      );
      case 3: return ( // ELMAAS
        <>
          {p(t("mElmaasQuoi", L), true)}
          {rule(t("mElmaasEffet", L))}
          {important(t("mElmaasScore", L))}
        </>
      );
      case 4: return ( // Séries
        <>
          {rule(t("mSerie3", L))}
          {important(t("mSerie5", L))}
        </>
      );
      case 5: return ( // Fin
        <>
          {rule(t("mFinQuand", L))}
          {rule(t("mFinTimer", L))}
        </>
      );
      case 6: return ( // Conseils
        <>
          {important(t("mConseilBords", L))}
          {important(t("mConseilCouleur", L))}
          {rule(t("mConseilElmaas", L))}
        </>
      );
      default: return null;
    }
  };

  return (
    <div className="popup-overlay" onClick={onFermer}>
      <div
        className="popup-pouvoir"
        style={{ maxWidth: 540, maxHeight: "90vh", padding: "16px 14px", gap: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--titre)", fontSize: 18, color: "var(--texte)", letterSpacing: "0.06em" }}>
            {t("manuelTitre", L)}
          </div>
          <button onClick={onFermer} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>&times;</button>
        </div>

        {/* Intro culturelle */}
        <div style={{ fontSize: 12, color: "var(--accent-culture)", fontStyle: "italic", textAlign: "center", marginBottom: 14, opacity: 0.8, fontFamily: "var(--brush)" }}>
          {t("manuelIntro", L)}
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14, borderBottom: "1px solid var(--bord)", paddingBottom: 10 }}>
          {sections.map((sec, i) => (
            <button key={i} onClick={() => setOnglet(i)} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 9px",
              background: onglet === i ? "var(--accent-culture)18" : "transparent",
              border: onglet === i ? "1px solid var(--accent-culture)55" : "1px solid var(--bord)",
              borderRadius: "var(--btn-radius, 4px)",
              color: onglet === i ? "var(--accent-culture)" : "var(--muted)",
              fontSize: 11, cursor: "pointer", fontFamily: "var(--brush)",
              whiteSpace: "nowrap"
            }}>
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* Contenu section */}
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "52vh", paddingRight: 4 }}>
          {renderSection()}
        </div>

        {/* Footer navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--bord)" }}>
          <button
            onClick={() => setOnglet(o => Math.max(0, o - 1))}
            disabled={onglet === 0}
            style={{ background: "none", border: "1px solid var(--bord)", color: onglet === 0 ? "var(--bord)" : "var(--muted)", padding: "5px 12px", cursor: onglet === 0 ? "default" : "pointer", borderRadius: "var(--btn-radius, 4px)", fontSize: 12, fontFamily: "var(--brush)" }}>
            &larr;
          </button>
          <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--brush)" }}>
            {onglet + 1} / {sections.length}
          </span>
          <button
            onClick={() => onglet < sections.length - 1 ? setOnglet(o => o + 1) : onFermer()}
            style={{ background: onglet === sections.length - 1 ? "var(--accent-culture)22" : "none", border: "1px solid var(--accent-culture)44", color: "var(--accent-culture)", padding: "5px 14px", cursor: "pointer", borderRadius: "var(--btn-radius, 4px)", fontSize: 12, fontFamily: "var(--brush)" }}>
            {onglet === sections.length - 1 ? t("fermer", L) : "→"}
          </button>
        </div>
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
  const [showPlans, setShowPlans] = useState(false);
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
  const monRoleRef = useRef(null);
  useEffect(() => { monRoleRef.current = monRole; }, [monRole]);
  const [statutConnexion, setStatutConnexion] = useState("attente");
  const [modeMultijoueur, setModeMultijoueur] = useState(false);
  const [bonusDoubleActif, setBonusDoubleActif] = useState(false);
  const [reconnaissanceTentee, setReconnaissanceTentee] = useState(false);
  const [indiceReconnaissance, setIndiceReconnaissance] = useState(null);
  const [timerChoisi, setTimerChoisi] = useState(30);
  const [timerRouge, setTimerRouge] = useState(30);
  const [timerNoir, setTimerNoir] = useState(30);
  const [timerIA, setTimerIA] = useState(0);
  const timerIARef = useRef(null);
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
  // SUPPRESSION DU MODE RAPIDE — toujours profonde
  const modeAnalyse = "profonde";
  const [modeCouleur, setModeCouleur] = useState(1); // 1=rouge/noir, 2=cyan/jaune
  const [messageChat, setMessageChat] = useState("");
  const [bullesActives, setBullesActives] = useState([]);
  const lastMsgTime = useRef(0);
  
  const pseudoAdverse = modeIA !== "aucune"
    ? (niveauIA === 1 ? "Chess" : niveauIA === 2 ? "Amal" : niveauIA === 3 ? "ELMAASYON" : "ELMAAS")
    : (pseudoAdversaireMatch || etat?.pseudo_adversaire || "ADVERSAIRE");

  const [scoresCumules, setScoresCumulesState] = useState({ moi: 0, lui: 0 });
  const [eloInfo, setEloInfo] = useState(null); // { avant, apres, delta }
  const finPartieEnvoyee = useRef(new Set()); // anti-double par partie_id

  useEffect(() => {
    if (!mancheTermineeInfo) return;
    const g = mancheTermineeInfo.gagnant;
    if (g && g !== "egalite" && pseudoAdverse) {
      const maCouleurScore = modeIA !== "aucune"
        ? (modeIA === "j1" ? "noir" : "rouge")
        : (monRole === "joueur2" ? "noir" : "rouge");
      const jaiGagne = g === maCouleurScore;
      const nouveauScore = {
        moi: scoresCumules.moi + (jaiGagne ? 1 : 0),
        lui: scoresCumules.lui + (jaiGagne ? 0 : 1)
      };
      setScoresCumulesState(nouveauScore);
      setScoresCumules(pseudoAdverse, nouveauScore);
    }

    // ── Mise à jour ELM ──────────────────────────────────────
    const token = getToken();
    if (!token || !utilisateur || !partieId) return;
    if (finPartieEnvoyee.current.has(partieId)) return;
    finPartieEnvoyee.current.add(partieId);

    // Couleur réelle du joueur humain
    const maCouleur = modeIA !== "aucune"
      ? (modeIA === "j1" ? "noir" : "rouge")   // IA j1=rouge → humain=noir
      : (monRole === "joueur2" ? "noir" : "rouge");
    const egalite     = g === "egalite";
    const jaiGagne    = !egalite && g === maCouleur;
    const gagnantCode = egalite ? 0 : jaiGagne ? 1 : 2;
    const scores      = mancheTermineeInfo.scores || {};

    axios.post(`${API}/fin_partie`, {
      partie_id:        partieId,
      adversaire_pseudo: pseudoAdverse,
      gagnant:          gagnantCode,
      score_j1:         maCouleur === "rouge" ? (scores.rouge ?? 0) : (scores.noir ?? 0),
      score_j2:         maCouleur === "rouge" ? (scores.noir  ?? 0) : (scores.rouge ?? 0),
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.succes && !res.data.deja_traite) {
          const delta = res.data.delta;
          const eloApres = res.data.elo_apres;
          setEloInfo({ avant: res.data.elo_avant, apres: eloApres, delta });
          const updatedUser = { ...utilisateur, elo: eloApres };
          localStorage.setItem("elmaas_user", JSON.stringify(updatedUser));
          setUtilisateur(updatedUser);
        }
      })
      .catch(err => console.warn("[fin_partie]", err?.response?.data || err.message));
  }, [mancheTermineeInfo]);
  
  const [showAnalyse, setShowAnalyse] = useState(false);
  const [analyseJoueur, setAnalyseJoueur] = useState(null);
  const [analyseAdv, setAnalyseAdv] = useState(null);
  const [analyseChargement, setAnalyseChargement] = useState(false);
  const [dernierCoupClassif, setDernierCoupClassif] = useState(null);

  const lancerAnalyse = async () => {
    if (!partieId) return;
    setAnalyseChargement(true);
    try {
      const couleurMoi = modeIA !== "aucune"
        ? (modeIA === "j1" ? "noir" : "rouge")
        : (monRole === "joueur2" ? "noir" : "rouge");
      const couleurAdv = couleurMoi === "rouge" ? "noir" : "rouge";
      const token = getToken();
      const res = await axios.post(
        `${API}/analyse/${partieId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.succes) {
        const tousCoups = res.data.analyse?.coups || [];
        const coupsMoi = tousCoups.filter(c => c.couleur === couleurMoi);
        const coupsAdv = tousCoups.filter(c => c.couleur === couleurAdv);
        const bon = ["ELMAAS", "ELMAASYON", "MASSY", "NOTMESSY"];
        const precMoi = coupsMoi.length
          ? Math.round(coupsMoi.filter(c => bon.includes(c.classification)).length / coupsMoi.length * 100)
          : 0;
        const precAdv = coupsAdv.length
          ? Math.round(coupsAdv.filter(c => bon.includes(c.classification)).length / coupsAdv.length * 100)
          : 0;
        setAnalyseJoueur({ coups: coupsMoi, precision_pct: precMoi });
        setAnalyseAdv({ coups: coupsAdv, precision_pct: precAdv });
        setMancheTermineeInfo(null);
        setPopup(null);
        setShowAnalyse(true);
      } else {
        alert(res.data.erreur || "Erreur lors de l'analyse");
      }
    } catch (e) {
      alert("Erreur : " + (e.response?.data?.erreur || e.message));
    } finally {
      setAnalyseChargement(false);
    }
  };

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

    // ── Retour paiement Stripe ──────────────────────────────
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      window.history.replaceState({}, "", "/");
      const token = getToken();
      if (token) {
        // Attendre 2s que le webhook Stripe soit traité, puis sync
        setTimeout(() => {
          fetch(`${API}/stripe/sync`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
              if (data && !data.erreur) {
                const updatedUser = { ...getUser(), ...data };
                localStorage.setItem("elmaas_user", JSON.stringify(updatedUser));
                setUtilisateur(updatedUser);
              }
            }).catch(() => {});
        }, 2000);
      }
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

  // Timer joueur
  useEffect(() => {
    clearInterval(timerRef.current);
    clearInterval(timerIARef.current);
    if (etape !== "jeu" || !etat || etat.manche_terminee) return;
    if (pauseIAActive) return;
    if (modeMultijoueur && statutConnexion !== "connecte") return;

    if (estTourIA || iaEnCours) {
      setTimerIA(0);
      timerIARef.current = setInterval(() => {
        setTimerIA(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timerIARef.current);
    }

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
          setMancheTermineeInfo({
            gagnant: "noir", scores: etat?.scores || {},
            messageTemps: t("rougeNonJoue", L)
          });
        }
      } else {
        setTimerNoir(restant);
        if (restant <= 0) {
          clearInterval(timerRef.current);
          setMancheTermineeInfo({
            gagnant: "rouge", scores: etat?.scores || {},
            messageTemps: t("noirNonJoue", L)
          });
        }
      }
    }, 200);
    return () => { clearInterval(timerRef.current); clearInterval(timerIARef.current); };
  }, [etape, etat?.tour_actuel, etat?.manche_terminee, etat?.timestamp_debut_tour, modeMultijoueur, statutConnexion, timerChoisi, estTourIA, iaEnCours, L, pauseIAActive]);

  // WebSocket
  useEffect(() => {
    const socket = io(API, { transports: ["polling", "websocket"] });
    socketRef.current = socket;
    socket.on("rejoint", (data) => { setEtat(data.etat); });
    socket.on("partie_prete", (data) => {
      setStatutConnexion("connecte");
      setEtat(data.etat);
      // Récupérer le pseudo de l'adversaire (monRoleRef est à jour, pas monRole)
      const roleActuel = monRoleRef.current;
      if (data.pseudo_j1 || data.pseudo_j2) {
        const advPseudo = roleActuel === "joueur2" ? data.pseudo_j1 : data.pseudo_j2;
        if (advPseudo) setPseudoAdversaireMatch(advPseudo);
      }
      // Charger les pixels immédiatement si pas encore reçus (évite la race condition)
      if (data.partie_id_pixels) {
        axios.get(`${API}/pixels/${data.partie_id_pixels}`)
          .then(res => {
            if (res.data?.pixels_photo) {
              setPixelsPhoto(res.data.pixels_photo);
              setTaille(res.data.taille || 16);
              if (res.data.etat) setEtat(res.data.etat);
            }
          }).catch(() => {});
      }
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
      socketRef.current.emit("rejoindre_partie", { partie_id: id, joueur: "joueur1", pseudo: utilisateur?.pseudo || "" });
      
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
    socketRef.current.emit("rejoindre_partie", { partie_id: id, joueur: "joueur2", pseudo: utilisateur?.pseudo || "" });
    
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
    const iaDelayMs = niveau >= 4 ? 15000 : 800;
    await new Promise(r => setTimeout(r, iaDelayMs));
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
    setEloInfo(null);
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
    const couleurMoi = monRole === "joueur2" ? "noir" : "rouge";
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
      onDeconnecter={onDeconnecter} onPaiement={handlePaiement}
      onVoirPlans={() => { setShowParametres(false); setShowPlans(true); }} />
  );
  const ecranPlans = showPlans && (
    <EcranPlans utilisateur={utilisateur} L={L}
      onFermer={() => setShowPlans(false)} onPaiement={handlePaiement} />
  );

  if (etape === "auth") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}{ecranPlans}
      <EcranAuth onConnecte={(user) => { setUtilisateur(user); setEtape(user?.pseudo ? "taille" : (user ? "pseudo" : "taille")); }} L={L} />
    </div>
  );

  if (etape === "pseudo") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}{ecranPlans}
      <EcranPseudo L={L} onPseudoDefini={(user) => { setUtilisateur(user); setEtape("taille"); }} />
    </div>
  );

  if (etape === "taille") return (
    <div className="app">
      {boutonParamsFlottant}{popupParams}{ecranPlans}
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
                joueur: "joueur2",
                pseudo: utilisateur?.pseudo || ""
              });
              
              // Récupérer les pixels en arrière-plan — poll rapide
              let tentatives = 0;
              const pollerPartie = async () => {
                tentatives++;
                try {
                  const res = await axios.get(`${API}/pixels/${data.partie_id}`);
                  if (res.data?.pixels_photo) {
                    setPixelsPhoto(res.data.pixels_photo);
                    setTaille(res.data.taille || 16);
                    if (res.data.etat) setEtat(res.data.etat);
                    if (res.data.indice) setIndiceReconnaissance(res.data.indice);
                    if (res.data.timer_sec) {
                      setTimerChoisi(res.data.timer_sec);
                      setTimerRouge(res.data.timer_sec);
                      setTimerNoir(res.data.timer_sec);
                    }
                    return; // succès
                  }
                } catch (e) {}
                if (tentatives < 20) setTimeout(pollerPartie, 800); // poll rapide 0.8s
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
      {boutonParamsFlottant}{popupParams}{ecranPlans}
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
      {boutonParamsFlottant}{popupParams}{ecranPlans}
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
  // ÉCRAN ANALYSE — TOUJOURS PROFONDE
  // 
  if (showAnalyse) {
    return (
      <div className="app">
        <EcranAnalyse
          partieId={partieId}
          analyseJoueur={analyseJoueur}
          analyseAdv={analyseAdv}
          couleurJoueur={modeIA !== "aucune" ? (modeIA === "j1" ? "noir" : "rouge") : (monRole === "joueur2" ? "noir" : "rouge")}
          pixelsPhoto={pixelsPhoto}
          taille={taille}
          L={L}
          onFermer={() => { setShowAnalyse(false); setMancheTermineeInfo(null); }}
          modeCouleur={modeCouleur}
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
      {ecranPlans}

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
                  {mancheTermineeInfo.messageTemps && (
                    <div style={{ fontSize: 12, color: "#ffaa44", fontFamily: "var(--brush)", textAlign: "center" }}>
                      {t("tempsEcoule", L)} — {mancheTermineeInfo.messageTemps}
                    </div>
                  )}
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

            {/* Delta ELM */}
            {eloInfo && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "8px 16px", borderRadius: 8,
                background: eloInfo.delta >= 0 ? "rgba(68,204,136,0.08)" : "rgba(204,34,0,0.08)",
                border: `1px solid ${eloInfo.delta >= 0 ? "#44cc8844" : "#cc220044"}`,
              }}>
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--brush)" }}>ELM</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--texte)", fontFamily: "var(--titre)" }}>
                  {eloInfo.apres}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--titre)",
                  color: eloInfo.delta >= 0 ? "#44cc88" : "#ff6644",
                }}>
                  {eloInfo.delta >= 0 ? "+" : ""}{eloInfo.delta}
                </span>
              </div>
            )}
            <div className="popup-options" style={{ flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", marginBottom: 4 }}>
                {L === 0 ? "Analyser la partie" : L === 1 ? "Analyze game" : L === 2 ? "تحليل المباراة" : "Analizar partida"}
              </div>
              {/* SUPPRESSION BOUTONS RAPIDE/PROFONDE — UN SEUL BOUTON ANALYSE */}
              <button className="popup-btn" style={{ borderColor: "var(--accent-culture)", color: "var(--accent-culture)" }}
                onClick={() => { lancerAnalyse(); }} disabled={analyseChargement}>
                {analyseChargement ? (L === 0 ? "Analyse en cours..." : L === 1 ? "Analyzing..." : L === 2 ? "...جارٍ التحليل" : "Analizando...") : (L === 0 ? "Analyse complète" : L === 1 ? "Full analysis" : L === 2 ? "تحليل كامل" : "Análisis completo")}
              </button>
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
            <div className="popup-options" style={{ flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", marginBottom: 4 }}>
                {L === 0 ? "Analyser la partie" : L === 1 ? "Analyze game" : L === 2 ? "تحليل المباراة" : "Analizar partida"}
              </div>
              {/* SUPPRESSION BOUTONS RAPIDE/PROFONDE — UN SEUL BOUTON */}
              <button className="popup-btn" style={{ borderColor: "var(--accent-culture)", color: "var(--accent-culture)" }}
                onClick={() => { lancerAnalyse(); }} disabled={analyseChargement}>
                {analyseChargement ? (L === 0 ? "Analyse en cours..." : L === 1 ? "Analyzing..." : L === 2 ? "...جارٍ التحليل" : "Analizando...") : (L === 0 ? "Analyse complète" : L === 1 ? "Full analysis" : L === 2 ? "تحليل كامل" : "Análisis completo")}
              </button>
              <button className="popup-btn" onClick={() => { setPopup(null); handleReset(); }}>{t("fermer", L)}</button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-gauche">
          <h1 className="titre-jeu-petit">ELMAAS</h1>
          <div className="pseudo-joueur rouge">
            <span className="pseudo-nom">{modeIA === "j1" ? (niveauIA === 1 ? "Chess" : niveauIA === 2 ? "Amal" : niveauIA === 3 ? "ELMAASYON" : "ELMAAS") : (utilisateur?.pseudo || "Joueur 1")}</span>
            <span className="pseudo-score">{etat?.scores?.rouge ?? 0}</span>
          </div>
        </div>

        <div className="header-centre">
          {estTourIA || iaEnCours ? (
            <div className="timers">
              <div className="timer-bloc" style={{ borderColor: "#ffd700", background: "linear-gradient(180deg, #ffd70022, #ffd70011)" }}>
                <span className="timer-label" style={{ color: "#ffd700" }}>
                  {L === 0 ? "IA RÉFLÉCHIT" : L === 1 ? "AI THINKING" : L === 2 ? "الذكاء الاصطناعي يفكر" : "IA PENSANDO"}
                </span>
                <span className="timer-val" style={{ color: "#ffd700" }}>
                  {String(Math.floor(timerIA / 60)).padStart(2, "0")}:{String(timerIA % 60).padStart(2, "0")}
                </span>
              </div>
            </div>
          ) : (
            <div className="timers">
              {modeIA !== "j1" && <TimerBloc secondes={timerRouge} couleur="rouge" actif={etat?.tour_actuel === 0 && !popup && !pauseIAActive} L={L} />}
              {modeIA !== "j2" && <TimerBloc secondes={timerNoir} couleur="noir" actif={etat?.tour_actuel === 1 && !popup && !pauseIAActive} L={L} />}
            </div>
          )}
          {pseudoAdverse && (scoresCumules.moi > 0 || scoresCumules.lui > 0) && (
            <div className="score-cumule">
              {t("scoreContre", L)} {pseudoAdverse}: {scoresCumules.moi}-{scoresCumules.lui}
            </div>
          )}
        </div>

        <div className="header-droite">
          <div className="pseudo-joueur noir">
            <span className="pseudo-nom">{modeIA === "j2" ? (niveauIA === 1 ? "Chess" : niveauIA === 2 ? "Amal" : niveauIA === 3 ? "ELMAASYON" : "ELMAAS") : pseudoAdverse}</span>
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
          <button className="btn-manuel" onClick={() => setShowParametres(true)} title={t("parametres", L)}>&#x2699;</button>
          {/* Toggle couleur — uniquement mode local */}
          {!modeMultijoueur && (
            <button 
              className="btn-manuel btn-couleur-toggle"
              onClick={() => setModeCouleur(prev => prev === 1 ? 2 : 1)}
              title={modeCouleur === 1 ? "Mode Cyan/Jaune" : "Mode Rouge/Noir"}
            >
              {modeCouleur === 1 ? "C/J" : "R/N"}
            </button>
          )}
          <button className="btn-manuel" onClick={() => setPopup({ type: "manuel" })} title={t("manuelTitre", L)}>?</button>
          <button className="btn-reset" onClick={handleReset}>{t("nouvellePartie", L)}</button>
        </div>
      </header>

      {/* Zone adverse desktop — cachée en mobile */}
      <div className="zone-adverse desktop-only">
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
        {/* 1. PANNEAU MAIN — Pièces joueur en haut */}
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

          {/* Desktop only : réserve, série, pièces adverses */}
          <div className="desktop-only">
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
        </div>

        {/* 2. INFOS MOBILE — sous les pièces */}
        <div className="mobile-infos-bar mobile-only">
          <span className="mobile-infos-tour">{t("tour", L)} {etat?.numero_tour}</span>
          {modeMultijoueur && (
            <span className={`mobile-tour-badge ${estMonTour ? "mon-tour" : "adverse-tour"}`}>
              {estMonTour ? t("tonTour", L) : t("adversaireJoue", L)}
            </span>
          )}
          {!modeMultijoueur && estTourIA && (
            <span className="mobile-tour-badge adverse-tour">IA</span>
          )}
          {bonusDoubleActif && (
            <span className="mobile-tour-badge bonus-tour">{t("doubleTourActif", L)}</span>
          )}
          <span className="mobile-infos-sep">|</span>
          <span>{t("reserve", L)} {joueurAffiche?.nb_pieces_reserve}</span>
          <span>{joueurAffiche?.nb_pieces_posees_depuis_regen ?? 0}/{joueurAffiche?.seuil_regen_actuel ?? 5}</span>
        </div>

        {/* 3. PLATEAU — maximum d'espace */}
        <div className="plateau-central">
          <Board etat={etat} taille={taille} couleurJoueur={joueurAffiche?.couleur}
            pieceSelectionnee={pieceIdx !== null && !enModeCible && !attenteChoixPouvoir ? joueurAffiche?.main_active[pieceIdx] : null}
            pieceIdx={pieceIdx} pixelsPhoto={pixelsPhoto}
            onPoserPiece={!enModeCible && !attenteChoixPouvoir ? handlePoserPiece : null}
            modeCible={enModeCible} extractionsEnCours={extractionsEnCours}
            onCibleSelectionnee={enModeCible ? handleCiblePouvoir : null}
            modeCouleur={modeCouleur} />
        </div>

        {/* 4b. ADVERSAIRE MOBILE — sous le plateau */}
        <div className="mobile-adverse-bar mobile-only">
          <div className="mobile-adverse-header">
            <span className="mobile-adverse-name">
              {modeIA === "j2" ? (niveauIA === 1 ? "Chess" : niveauIA === 2 ? "Amal" : niveauIA === 3 ? "ELMAASYON" : "ELMAAS") : pseudoAdverse}
            </span>
            <span className="mobile-adverse-score">
              {etat?.scores?.[joueurAdverseAffiche?.couleur] ?? 0}
            </span>
          </div>
          <div className="mobile-adverse-pieces">
            {(joueurAdverseAffiche?.main_active || []).map((piece, i) => {
              const clickEchanger = popup?.type === "attente_cible" && popup?.pouvoir === "echanger";
              return (
                <div key={i} className="mobile-adverse-piece-wrap"
                  style={{ opacity: clickEchanger ? 1 : 0.45, cursor: clickEchanger ? "pointer" : "default" }}>
                  <MiniPiece
                    piece={piece}
                    couleur={joueurAdverseAffiche?.couleur}
                    onClick={() => {
                      if (clickEchanger) {
                        if (pieceADonner === null) return;
                        setPopup(null); setPieceADonner(null);
                        envoyerPouvoir({ pouvoir: "echanger_main", piece_index_adverse: i, piece_index_donner: pieceADonner });
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
          <span className="mobile-adverse-count">
            {(joueurAdverseAffiche?.nb_pieces_reserve || 0) + (joueurAdverseAffiche?.main_active?.length || 0)} {t("pieces", L)}
          </span>
        </div>

        {/* 4. ACTIONS — sous le plateau */}
        <div className="panneau-actions">
          <div className="panneau-titre desktop-only">{t("actions", L)}</div>
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
              <button onClick={envoyerMessage} disabled={!messageChat.trim()}>➤</button>
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
}/*plateau */