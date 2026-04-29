// ELMAAS — EcranAnalyse.js v7
// Analyse profonde uniquement — plateau APRÈS chaque coup — couleur distincte

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Board from "./Board";
import { t, getCitationAttente } from "./translations";

const API = "https://elmaas-backend.onrender.com";

const COULEURS_CLASSE = {
  ELMAAS:    "#ffd700",
  ELMAASYON: "#88ff88", 
  MASSY:     "#44cc44",
  NOTMESSY:  "#88aaff",
  MISSED:    "#ffaa44",
  CHESS:     "#ff4422",
  BLUNDER:   "#ff0000",
};

const NOMS_CLASSE_FR = {
  ELMAAS: "ELMAAS", ELMAASYON: "ELMAASYON", MASSY: "MASSY",
  NOTMESSY: "NOTMESSY", MISSED: "MISSED", CHESS: "CHESS", BLUNDER: "BLUNDER",
};
const NOMS_CLASSE_EN = {
  ELMAAS: "ELMAAS", ELMAASYON: "ELMAASYON", MASSY: "MASSY",
  NOTMESSY: "NOTMESSY", MISSED: "MISSED", CHESS: "CHESS", BLUNDER: "BLUNDER",
};
const NOMS_CLASSE_AR = {
  ELMAAS: "الماس", ELMAASYON: "الماسيون", MASSY: "ماسي",
  NOTMESSY: "نوتمسي", MISSED: "ميسد", CHESS: "شيس", BLUNDER: "بلندر",
};
const NOMS_CLASSE_ES = {
  ELMAAS: "ELMAAS", ELMAASYON: "ELMAASYON", MASSY: "MASSY",
  NOTMESSY: "NOTMESSY", MISSED: "MISSED", CHESS: "CHESS", BLUNDER: "BLUNDER",
};

function getNomsClasse(L) {
  if (L === 1) return NOMS_CLASSE_EN;
  if (L === 2) return NOMS_CLASSE_AR;
  if (L === 3) return NOMS_CLASSE_ES;
  return NOMS_CLASSE_FR;
}

export default function EcranAnalyse({ partieId, couleurJoueur, pixelsPhoto, taille, onFermer, L, modeCouleur = 1 }) {
  const [analyseMoi, setAnalyseMoi] = useState(null);
  const [analyseAdv, setAnalyseAdv] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [indexCoup, setIndexCoup] = useState(0);
  const [coteActif, setCoteActif] = useState("moi");
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [showMeilleurCoup, setShowMeilleurCoup] = useState(false);
  const [citationAttente, setCitationAttente] = useState(() => getCitationAttente(L));

  const nomsClasse = getNomsClasse(L);

  // Charger l'analyse au montage — TOUJOURS PROFONDE
  useEffect(() => {
    let cancelled = false;
    const fetchAnalyse = async () => {
      try {
        const token = localStorage.getItem("elmaas_token");
        const couleurAdv = couleurJoueur === "rouge" ? "noir" : "rouge";

        // Analyse du joueur
        const resMoi = await axios.post(
          `${API}/analyse/${partieId}`,
          { couleur: couleurJoueur },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }
        );
        if (cancelled) return;
        setAnalyseMoi(resMoi.data.analyse);

        // Analyse de l'adversaire
        const resAdv = await axios.post(
          `${API}/analyse/${partieId}`,
          { couleur: couleurAdv },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }
        );
        if (cancelled) return;
        setAnalyseAdv(resAdv.data.analyse);

        setQuotaInfo({
          restant: resMoi.data.quota_restant,
          plan: resMoi.data.plan
        });
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 429) {
          setErreur({ type: "quota", message: err.response.data.erreur });
        } else if (err.response?.status === 401) {
          setErreur({ type: "auth", message: "Connexion requise" });
        } else {
          setErreur({ type: "generic", message: err.response?.data?.erreur || "Erreur d'analyse" });
        }
      } finally {
        if (!cancelled) setChargement(false);
      }
    };
    fetchAnalyse();
    return () => { cancelled = true; };
  }, [partieId, couleurJoueur]);

  // Citation qui change toutes les 5s pendant le chargement
  useEffect(() => {
    if (!chargement) return;
    const interval = setInterval(() => setCitationAttente(getCitationAttente(L)), 5000);
    return () => clearInterval(interval);
  }, [chargement, L]);

  const analyseCourante = coteActif === "moi" ? analyseMoi : analyseAdv;
  const couleurAnalysee = coteActif === "moi" ? couleurJoueur : (couleurJoueur === "rouge" ? "noir" : "rouge");

  // IMPORTANT: coupActuel et totalCoups AVANT les useMemo
  const coupsListe = analyseCourante?.coups || [];
  const totalCoups = coupsListe.length;
  const coupActuel = totalCoups > 0 && indexCoup < totalCoups ? coupsListe[indexCoup] : null;

  // Helper : construit un etat compatible Board depuis un dict pieces
  const buildEtatPlateau = useCallback((pieces, numeroTour = 0) => {
    if (!pieces || typeof pieces !== "object") return null;
    // CLONE EXPLICITE pour éviter les mutations partagées
    const piecesClone = { ...pieces };
    const cellulesActives = Object.entries(piecesClone)
      .filter(([k, v]) => v != null)
      .map(([k]) => k.split(",").map(Number));
    return {
      plateau: {
        pieces: piecesClone,
        puzzles: {},
        cellules_libres: [],
        cellules_actives: cellulesActives,
        grille_bicolore: Array(taille).fill().map(() => Array(taille).fill(0))
      },
      joueur1: { 
        couleur: "rouge", main_active: [], nb_pieces_reserve: 0,
        serie_actuelle: 0, nb_pieces_posees_depuis_regen: 0,
        seuil_regen_actuel: 5, pieces_protegees: []
      },
      joueur2: { 
        couleur: "noir", main_active: [], nb_pieces_reserve: 0,
        serie_actuelle: 0, nb_pieces_posees_depuis_regen: 0,
        seuil_regen_actuel: 5, pieces_protegees: []
      },
      tour_actuel: 0,
      numero_tour: numeroTour,
      manche_terminee: false,
      gagnant: null,
      victoire_immediate: false,
      scores: { rouge: 0, noir: 0 },
    };
  }, [taille]);

  // PLATEAU APRES LE COUP (données directes du backend)
  const etatPlateau = useMemo(() => {
    if (!coupActuel?.plateau_apres) return null;
    return buildEtatPlateau(coupActuel.plateau_apres, coupActuel.numero_tour);
  }, [coupActuel, buildEtatPlateau, indexCoup]); // indexCoup ajouté pour forcer recalc

  // PLATEAU DU MEILLEUR COUP (marqueur sur plateau avant)
  const etatPlateauMeilleur = useMemo(() => {
    if (!showMeilleurCoup || !coupActuel?.meilleur_alternative || !coupActuel?.plateau_avant) return null;
    const pieces = { ...coupActuel.plateau_avant };
    const alt = coupActuel.meilleur_alternative;
    if (alt && alt.origine) {
      pieces[`${alt.origine[0]},${alt.origine[1]}`] = "meilleur_coup";
    }
    return buildEtatPlateau(pieces, coupActuel.numero_tour);
  }, [showMeilleurCoup, coupActuel, buildEtatPlateau]);

  const precedent = useCallback(() => {
    setIndexCoup(prev => Math.max(0, prev - 1));
    setShowMeilleurCoup(false);
  }, []);

  const suivant = useCallback(() => {
    setIndexCoup(prev => Math.min(totalCoups - 1, prev + 1));
    setShowMeilleurCoup(false);
  }, [totalCoups]);

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") precedent();
      if (e.key === "ArrowRight") suivant();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [precedent, suivant]);

  // ÉCRAN DE CHARGEMENT
  if (chargement) {
    return (
      <div className="ecran-analyse-overlay">
        <div className="ecran-analyse" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center", maxWidth: 500 }}>
            <div className="popup-titre" style={{ marginBottom: 24 }}>
              {L === 0 ? "Analyse en cours" : L === 1 ? "Analysis in progress" : L === 2 ? "التحليل قيد التقدم" : "Análisis en progreso"}
            </div>
            <div className="spinner" style={{ margin: "20px auto" }} />
            <div style={{ fontSize: 15, color: "var(--texte)", fontStyle: "italic", marginTop: 20, lineHeight: 1.6, minHeight: 60 }}>
              "{citationAttente}"
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
              {L === 0 ? "Cela peut prendre quelques secondes..." : 
               L === 1 ? "This may take a few seconds..." : 
               L === 2 ? "قد يستغرق هذا بضع ثوانٍ..." : 
               "Esto puede tardar unos segundos..."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN D'ERREUR
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

  // Si pas de coups analysés
  if (!analyseCourante || totalCoups === 0) {
    return (
      <div className="popup-overlay" onClick={onFermer}>
        <div className="popup-pouvoir" onClick={e => e.stopPropagation()}>
          <div className="popup-titre">{t("analyseTitre", L)}</div>
          <div className="popup-sous-titre">
            {L === 0 ? "Aucun coup à analyser pour cette partie." : 
             L === 1 ? "No moves to analyze for this game." :
             L === 2 ? "لا توجد حركات لتحليلها في هذه المباراة." :
             "No hay movimientos para analizar en esta partida."}
          </div>
          <button className="popup-btn" onClick={onFermer}>{t("fermer", L)}</button>
        </div>
      </div>
    );
  }

  const precision = analyseCourante?.precision_pct ?? 0;
  const stats = analyseCourante?.stats || {};
  const classification = coupActuel?.classification;
  const couleurClasse = COULEURS_CLASSE[classification] || "var(--muted)";

  const textes = {
    coup: L === 0 ? "Coup" : L === 1 ? "Move" : L === 2 ? "الحركة" : "Movimiento",
    sur: L === 0 ? "sur" : L === 1 ? "of" : L === 2 ? "من" : "de",
    precision: L === 0 ? "précision" : L === 1 ? "accuracy" : L === 2 ? "الدقة" : "precisión",
    moi: L === 0 ? "Moi" : L === 1 ? "Me" : L === 2 ? "أنا" : "Yo",
    adversaire: L === 0 ? "Adversaire" : L === 1 ? "Opponent" : L === 2 ? "الخصم" : "Rival",
    tour: L === 0 ? "Tour" : L === 1 ? "Turn" : L === 2 ? "الدور" : "Turno",
    joueur: L === 0 ? "Joueur" : L === 1 ? "Player" : L === 2 ? "اللاعب" : "Jugador",
    meilleurCoup: L === 0 ? "Meilleur coup possible" : L === 1 ? "Best possible move" : L === 2 ? "أفضل حركة ممكنة" : "Mejor movimiento",
    coupJoue: L === 0 ? "Coup joué" : L === 1 ? "Played move" : L === 2 ? "الحركة الملعوبة" : "Movimiento jugado",
    ranger: L === 0 ? "Rang" : L === 1 ? "Rank" : L === 2 ? "الترتيب" : "Rango",
    coupsPossibles: L === 0 ? "coups possibles" : L === 1 ? "possible moves" : L === 2 ? "حركات ممكنة" : "movimientos posibles",
    piece: L === 0 ? "Pièce" : L === 1 ? "Piece" : L === 2 ? "القطعة" : "Pieza",
    forme: L === 0 ? "Forme" : L === 1 ? "Shape" : L === 2 ? "الشكل" : "Forma",
    origine: L === 0 ? "Origine" : L === 1 ? "Origin" : L === 2 ? "الأصل" : "Origen",
    elmaas: L === 0 ? "ELMAAS (diamant)" : L === 1 ? "ELMAAS (diamond)" : L === 2 ? "الماس (ماسة)" : "ELMAAS (diamante)",
    voirMeilleur: L === 0 ? "Voir le meilleur coup" : L === 1 ? "See best move" : L === 2 ? "عرض أفضل حركة" : "Ver mejor movimiento",
    cacherMeilleur: L === 0 ? "Cacher" : L === 1 ? "Hide" : L === 2 ? "إخفاء" : "Ocultar",
    precedent: L === 0 ? "Précédent" : L === 1 ? "Previous" : L === 2 ? "السابق" : "Anterior",
    suivant: L === 0 ? "Suivant" : L === 1 ? "Next" : L === 2 ? "التالي" : "Siguiente",
    analysesRestantes: L === 0 ? "Analyses restantes" : L === 1 ? "Analyses remaining" : L === 2 ? "تحاليل متبقية" : "Análisis restantes",
  };

  return (
    <div className="ecran-analyse-overlay">
      <div className="ecran-analyse">
        {/* Header */}
        <div className="analyse-header">
          <div className="analyse-titre">
            {t("analyseTitre", L)} — <span style={{ color: couleurAnalysee === "rouge" ? "var(--rouge-c)" : "#aaaaaa" }}>{couleurAnalysee.toUpperCase()}</span>
          </div>
          <div className="analyse-precision">
            {precision}% <small>{textes.precision}</small>
          </div>
          <button className="btn-reset" onClick={onFermer}>{t("fermer", L)}</button>
        </div>

        {/* Switch joueur — COULEUR EXPLICITE */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "8px" }}>
          <button 
            className={`popup-btn ${coteActif === "moi" ? "popup-btn-revanche" : ""}`}
            onClick={() => { setCoteActif("moi"); setIndexCoup(0); setShowMeilleurCoup(false); }}
            style={{ flex: 1, maxWidth: 200, justifyContent: "center" }}
          >
            <span style={{ color: couleurJoueur === "rouge" ? "var(--rouge-c)" : "#aaaaaa" }}>●</span> {textes.moi} ({couleurJoueur}) — {analyseMoi?.precision_pct ?? 0}%
          </button>
          <button 
            className={`popup-btn ${coteActif === "adv" ? "popup-btn-revanche" : ""}`}
            onClick={() => { setCoteActif("adv"); setIndexCoup(0); setShowMeilleurCoup(false); }}
            style={{ flex: 1, maxWidth: 200, justifyContent: "center" }}
          >
            <span style={{ color: couleurJoueur === "rouge" ? "#aaaaaa" : "var(--rouge-c)" }}>●</span> {textes.adversaire} ({couleurJoueur === "rouge" ? "noir" : "rouge"}) — {analyseAdv?.precision_pct ?? 0}%
          </button>
        </div>

        {/* Stats */}
        <div className="analyse-stats">
          {Object.entries(stats).map(([cls, nb]) => nb > 0 && (
            <div key={cls} className="stat-badge" style={{ borderColor: COULEURS_CLASSE[cls], color: COULEURS_CLASSE[cls] }}>
              <span className="stat-nb">{nb}</span>
              <span className="stat-label">{nomsClasse[cls] || cls}</span>
            </div>
          ))}
        </div>

        {/* Zone de lecture */}
        <div className="analyse-corps">
          <div className="analyse-plateau">
            {showMeilleurCoup && etatPlateauMeilleur ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: "#aa88ff", fontWeight: 600 }}>
                  {L === 0 ? "Meilleur coup possible" : L === 1 ? "Best possible move" : L === 2 ? "أفضل حركة ممكنة" : "Mejor movimiento"}
                </div>
                <Board
                  etat={etatPlateauMeilleur}
                  taille={taille}
                  pixelsPhoto={pixelsPhoto}
                  couleurJoueur={couleurAnalysee}
                  onPoserPiece={null}
                  modeCouleur={modeCouleur}
                />
              </div>
            ) : etatPlateau ? (
              <Board
                etat={etatPlateau}
                taille={taille}
                pixelsPhoto={pixelsPhoto}
                couleurJoueur={couleurAnalysee}
                onPoserPiece={null}
                modeCouleur={modeCouleur}
              />
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
                {L === 0 ? "Chargement du plateau..." : L === 1 ? "Loading board..." : L === 2 ? "جاري تحميل اللوحة..." : "Cargando tablero..."}
              </div>
            )}
          </div>

          <div className="analyse-panneau">
            <div className="analyse-coup-info">
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {textes.coup} {indexCoup + 1} {textes.sur} {totalCoups}
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

              {/* Badge de classification */}
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
                {nomsClasse[classification] || classification || "—"}
              </div>

              {/* INFO COULEUR DU JOUEUR QUI A JOUÉ CE COUP */}
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: coupActuel?.couleur === "rouge" ? "var(--rouge-c)" : "#aaaaaa",
                textAlign: "center",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}>
                {coupActuel?.couleur === "rouge" ? "ROUGE" : "NOIR"} — {textes.tour} {coupActuel?.numero_tour ?? "?"}
              </div>

              {coupActuel?.rang > 1 && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  {textes.ranger}: {coupActuel.rang} / {coupActuel.total_coups_possibles} {textes.coupsPossibles}
                </div>
              )}

              {/* Info pièce jouée */}
              {coupActuel?.piece_forme && (
                <div style={{ 
                  fontSize: 12, color: "var(--texte)", marginTop: 12, 
                  padding: "10px", background: "var(--bg3)", borderRadius: "6px",
                  border: "1px solid var(--bord)"
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{textes.coupJoue}:</div>
                  <div>{textes.forme}: <strong>{coupActuel.piece_forme}</strong></div>
                  {coupActuel.piece_est_elmaas && (
                    <div style={{ color: "#00BFFF", fontWeight: 600 }}>ELMAAS {textes.elmaas}</div>
                  )}
                  <div>{textes.origine}: [{coupActuel.origine?.join(", ")}]</div>
                </div>
              )}

              {/* BOUTON: Voir le meilleur coup */}
              {coupActuel?.meilleur_alternative && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => setShowMeilleurCoup(!showMeilleurCoup)}
                    style={{
                      padding: "10px 16px",
                      background: showMeilleurCoup ? "var(--bg3)" : "linear-gradient(135deg, #6644cc, #8866ff)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                      width: "100%",
                    }}
                  >
                    {showMeilleurCoup ? textes.cacherMeilleur : textes.voirMeilleur}
                  </button>

                  {showMeilleurCoup && (
                    <div style={{
                      marginTop: 8,
                      padding: "10px",
                      background: "rgba(102,68,204,0.15)",
                      borderRadius: "6px",
                      border: "1px solid #6644cc",
                      fontSize: 12
                    }}>
                      <div style={{ color: "#aa88ff", fontWeight: 600, marginBottom: 4 }}>
                        {textes.meilleurCoup}:
                      </div>
                      <div style={{ color: "var(--texte)" }}>
                        {textes.piece} #{coupActuel.meilleur_alternative.piece_index + 1} 
                        ({coupActuel.meilleur_alternative.forme || "?"})
                      </div>
                      <div style={{ color: "#ffaa44" }}>
                        {textes.origine}: [{coupActuel.meilleur_alternative.origine?.join(",")}]
                      </div>
                      {coupActuel.meilleur_alternative.est_elmaas && (
                        <div style={{ color: "#00BFFF" }}>ELMAAS {textes.elmaas}</div>
                      )}
                      <div style={{ color: "var(--muted)", marginTop: 4, fontSize: 11 }}>
                        Score: {coupActuel.meilleur_alternative.score} vs {Math.round(coupActuel.score_joue)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="analyse-navigation" style={{ 
              display: "flex", gap: 8, marginTop: 16 
            }}>
              <button 
                className="popup-btn" 
                onClick={precedent} 
                disabled={indexCoup === 0}
                style={{ flex: 1, opacity: indexCoup === 0 ? 0.4 : 1 }}
              >
                ◄ {textes.precedent}
              </button>
              <button 
                className="popup-btn" 
                onClick={suivant} 
                disabled={indexCoup >= totalCoups - 1}
                style={{ flex: 1, opacity: indexCoup >= totalCoups - 1 ? 0.4 : 1 }}
              >
                {textes.suivant} ►
              </button>
            </div>
          </div>
        </div>

        {/* Quota */}
        {quotaInfo && (
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 8 }}>
            {textes.analysesRestantes}: {quotaInfo.restant === -1 ? "∞" : quotaInfo.restant}
          </div>
        )}
      </div>
    </div>
  );
}