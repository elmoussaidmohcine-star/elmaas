// ============================================================
//  ELMAAS — Board.jsx v4
//  - Clic sur arête : éclaire le puzzle (blanc)
//  - Intersection : éclaire le plus petit puzzle
//  - Frontières nettes par type et état
//  - Support modeCible et extractionsEnCours
// ============================================================
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import "./Board.css";

const COULEURS = {
  1: { ROUGE: "#dd1100", ROUGE_C: "#ff3311", NOIR_B: "#222222", NOIR_C: "#555566", DIAMANT: "#00BFFF" },
  2: { ROUGE: "#00CED1", ROUGE_C: "#40E0D0", NOIR_B: "#F0E68C", NOIR_C: "#FFFACD", DIAMANT: "#FFFFFF" },
};

// C passé en paramètre car défini dans le composant
function couleurFrontierePuzzle(puzzle, C) {
  if (!puzzle) return "#1a1a2a";
  if (puzzle.brise) return "#884400";
  if (puzzle.complete_par === "rouge") return C.ROUGE_C;
  if (puzzle.complete_par === "noir")  return "#aaaaaa";
  if (puzzle.type_couleur === "mono_rouge") return C.ROUGE;
  if (puzzle.type_couleur === "mono_noir")  return C.NOIR_C;
  if (puzzle.type_couleur === "mixte")      return "mixte";
  return "#2a2a4a";
}

function couleurFrontiereMixte(r, c, dir, C) {
  const pair = (r + c + (dir === "top" || dir === "bottom" ? 0 : 1)) % 2 === 0;
  return pair ? C.ROUGE : C.NOIR_C;
}

function couleurBgComplete(puzzle) {
  if (!puzzle?.complete_par) return null;
  return puzzle.complete_par === "rouge"
    ? "rgba(180, 30, 0, 0.38)"
    : "rgba(60, 60, 100, 0.45)";
}

function cellulesDansGrille(cellules, origine) {
  const [r0, c0] = origine;
  return cellules.map(([dr, dc]) => [r0 + dr, c0 + dc]);
}

function positionValide(cellules, origine, pieces, taille, estEnlevement = false) {
  for (const [dr, dc] of cellules) {
    const r = origine[0] + dr, c = origine[1] + dc;
    if (r < 0 || r >= taille || c < 0 || c >= taille) return false;
    const contenu = pieces[`${r},${c}`];
    if (estEnlevement) {
      if (contenu === "diamant") return false;
    } else {
      if (contenu !== undefined && contenu !== null && contenu !== "diamant") return false;
    }
  }
  return true;
}

export default function Board({
  etat, taille = 16, couleurJoueur,
  pieceSelectionnee, pieceIdx, pixelsPhoto,
  onPoserPiece, modeCible, onCibleSelectionnee, extractionsEnCours,
  modeCouleur = 1
}) {
  const C = COULEURS[modeCouleur] || COULEURS[1];
  const mapCouleurClasse = (couleur) => {
    if (modeCouleur === 2) {
      if (couleur === "rouge") return "cyan";
      if (couleur === "noir") return "jaune";
      if (couleur === "diamant") return "diamant-mode2";
    }
    return couleur;
  };

  const [survol, setSurvol] = useState(null);
  const [puzzleEclaire, setPuzzleEclaire] = useState(null);
  const [animPuzzles, setAnimPuzzles] = useState({});
  const [pendingPlacement, setPendingPlacement] = useState(null); // {cell, valid} pour placement tactile 2 étapes
  const boardRef = useRef(null);
  
  // Calcul de la taille des cellules — plus grand sur mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const maxBoardPx = isMobile 
    ? Math.min(window.innerWidth - 8, window.innerHeight * 0.52)  // mobile: prend presque toute la largeur
    : 560;
  const CELL = Math.max(14, Math.floor(maxBoardPx / taille));

  const plateau = etat?.plateau;
  const pieces  = plateau?.pieces ?? {};
  const puzzles = plateau?.puzzles ?? {};

  // ── Index multi-puzzle — MEMOIZED ──
  const puzzlesParCell = useMemo(() => {
    const idx = {};
    Object.entries(puzzles).forEach(([pid, puzz]) => {
      (puzz.cellules || []).forEach(([r, c]) => {
        const key = `${r},${c}`;
        if (!idx[key]) idx[key] = [];
        idx[key].push(Number(pid));
      });
    });
    Object.values(idx).forEach(pids => {
      pids.sort((a, b) => (puzzles[a]?.cellules?.length ?? 0) - (puzzles[b]?.cellules?.length ?? 0));
    });
    return idx;
  }, [puzzles]);

  const getFrontieres = useCallback((r, c, pid) => {
    const dirs = { top: [r-1,c], bottom: [r+1,c], left: [r,c-1], right: [r,c+1] };
    const f = {};
    for (const [dir, [vr, vc]] of Object.entries(dirs)) {
      const voisinPids = puzzlesParCell[`${vr},${vc}`] || [];
      if (!voisinPids.includes(pid)) f[dir] = true;
    }
    return f;
  }, [puzzlesParCell]);

  // ── Cellules du puzzle éclairé ──
  const cellulesEclairees = new Set();
  if (puzzleEclaire !== null && puzzles[puzzleEclaire]) {
    (puzzles[puzzleEclaire].cellules || []).forEach(([r, c]) => {
      cellulesEclairees.add(`${r},${c}`);
    });
  }

  // ── Anim complétion ──
  useEffect(() => {
    const nouveaux = {};
    Object.entries(puzzles).forEach(([pid, puzz]) => {
      if (puzz.complete_par && !animPuzzles[pid]) nouveaux[pid] = true;
    });
    if (Object.keys(nouveaux).length > 0) {
      setAnimPuzzles(prev => ({ ...prev, ...nouveaux }));
      setTimeout(() => {
        setAnimPuzzles(prev => {
          const n = { ...prev };
          Object.keys(nouveaux).forEach(pid => delete n[pid]);
          return n;
        });
      }, 1500);
    }
  }, [puzzles]);

  const getCellule = useCallback((e) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / CELL);
    const r = Math.floor((e.clientY - rect.top) / CELL);
    if (r >= 0 && r < taille && c >= 0 && c < taille) return [r, c];
    return null;
  }, [CELL, taille]);

  const handleMouseMove = useCallback((e) => {
    if (!pieceSelectionnee && !modeCible) { setSurvol(null); return; }
    setSurvol(getCellule(e));
  }, [pieceSelectionnee, modeCible, getCellule]);

  // ── Touch handlers pour mobile : ghost + placement en 2 étapes ──
  const getTouchCellule = useCallback((e) => {
    if (!boardRef.current || !e.touches || e.touches.length === 0) return null;
    const touch = e.touches[0];
    const rect = boardRef.current.getBoundingClientRect();
    const c = Math.floor((touch.clientX - rect.left) / CELL);
    const r = Math.floor((touch.clientY - rect.top) / CELL);
    if (r >= 0 && r < taille && c >= 0 && c < taille) return [r, c];
    return null;
  }, [CELL, taille]);

  const handleTouchMove = useCallback((e) => {
    if (!pieceSelectionnee || modeCible) return;
    const cell = getTouchCellule(e);
    if (cell) {
      setSurvol(cell);
      e.preventDefault(); // empêcher le scroll pendant le drag
    }
  }, [pieceSelectionnee, modeCible, getTouchCellule]);

  const handleTouchEnd = useCallback((e) => {
    if (!pieceSelectionnee || !survol || pieceIdx === null) return;
    // Figer la position ghost → attendre un tap de confirmation
    const valide = positionValide(pieceSelectionnee.cellules, survol, pieces, taille, pieceSelectionnee.enlevement === true);
    setPendingPlacement({ cell: survol, valid: valide });
    // Ne PAS effacer survol pour garder le ghost visible
  }, [pieceSelectionnee, survol, pieceIdx, pieces, taille]);

  const handleClick = useCallback((e) => {
    const cell = getCellule(e);

    if (modeCible && onCibleSelectionnee && cell) {
      onCibleSelectionnee(cell);
      return;
    }

    // ── Placement tactile 2 étapes : si pendingPlacement, confirmer sur tap ──
    if (pendingPlacement && pieceSelectionnee && pieceIdx !== null) {
      if (pendingPlacement.valid && onPoserPiece) {
        onPoserPiece(pieceIdx, pendingPlacement.cell);
        setSurvol(null);
        setPuzzleEclaire(null);
        setPendingPlacement(null);
        return;
      } else {
        // Tap ailleurs → annuler le pending et montrer un nouveau ghost
        setPendingPlacement(null);
        if (cell) setSurvol(cell);
        return;
      }
    }

    if (pieceSelectionnee && survol && pieceIdx !== null) {
      const valide = positionValide(pieceSelectionnee.cellules, survol, pieces, taille, pieceSelectionnee.enlevement === true);
      if (valide && onPoserPiece) {
        onPoserPiece(pieceIdx, survol);
        setSurvol(null);
        setPuzzleEclaire(null);
        setPendingPlacement(null);
        return;
      }
    }

    if (cell) {
      const key = `${cell[0]},${cell[1]}`;
      const pids = puzzlesParCell[key] || [];
      if (pids.length > 0) {
        const idxActuel = puzzleEclaire !== null ? pids.indexOf(puzzleEclaire) : -1;
        const idxSuivant = (idxActuel + 1) % pids.length;
        const nouveauPid = pids[idxSuivant];
        setPuzzleEclaire(prev => prev === nouveauPid && pids.length === 1 ? null : nouveauPid);
      } else {
        setPuzzleEclaire(null);
      }
    }
  }, [getCellule, modeCible, onCibleSelectionnee, pieceSelectionnee, survol,
      pieceIdx, pieces, taille, onPoserPiece, puzzlesParCell, puzzleEclaire, pendingPlacement]);

  // Use pending cell for ghost if available, otherwise survol
  const ghostOrigin = pendingPlacement ? pendingPlacement.cell : survol;
  const cellulesFantomes = new Set();
  let fantomeValide = false;
  if (pieceSelectionnee && ghostOrigin) {
    const absolues = cellulesDansGrille(pieceSelectionnee.cellules, ghostOrigin);
    fantomeValide = positionValide(pieceSelectionnee.cellules, ghostOrigin, pieces, taille, pieceSelectionnee.enlevement === true);
    absolues.forEach(([r, c]) => {
      if (r >= 0 && r < taille && c >= 0 && c < taille)
        cellulesFantomes.add(`${r},${c}`);
    });
  }

  const extractionSet = new Set(
    (extractionsEnCours || []).map(([r, c]) => `${r},${c}`)
  );

  return (
    <div
      ref={boardRef}
      className={`board-v3 ${pieceSelectionnee ? "mode-pose" : ""} ${modeCible ? "mode-cible" : ""}`}
      style={{ width: taille * CELL, height: taille * CELL, position: "relative", touchAction: pieceSelectionnee ? "none" : "auto" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setSurvol(null); }}
      onClick={handleClick}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {Array.from({ length: taille }, (_, r) =>
        Array.from({ length: taille }, (_, c) => {
          const key = `${r},${c}`;
          const couleurPiece = pieces[key];
          const pids = puzzlesParCell[key] || [];

          const pidPrinc = pids[0] ?? undefined;
          const puzzle = pidPrinc !== undefined ? puzzles[pidPrinc] : null;
          const estIntersection = pids.length > 1;

          const estEclaire = cellulesEclairees.has(key);

          const pidAffiche = estEclaire && puzzleEclaire !== null
            ? puzzleEclaire
            : pidPrinc;
          const puzzleAffiche = pidAffiche !== undefined ? puzzles[pidAffiche] : null;

          const estFantome = cellulesFantomes.has(key);
          const brise = puzzleAffiche?.brise;
          const anime = pidPrinc !== undefined && animPuzzles[pidPrinc] === true;

          const frontieres = puzzleAffiche
            ? getFrontieres(r, c, pidAffiche)
            : {};

          const cFBase = couleurFrontierePuzzle(puzzleAffiche, C);  // ← C passé
          const estMixte = puzzleAffiche?.type_couleur === "mixte";
          let epaisseur = puzzleAffiche?.complete_par ? "3px" : "2px";
          if (estEclaire) epaisseur = "3px";

          const getCF = (dir) => {
            if (estEclaire) return "#ffffff";
            if (estMixte) return couleurFrontiereMixte(r, c, dir, C);  // ← C passé
            return cFBase;
          };

          const pid2 = estIntersection
            ? (pidAffiche === pids[0] ? pids[1] : pids[0])
            : null;
          const puzzle2 = pid2 !== null ? puzzles[pid2] : null;
          const frontieres2 = puzzle2 ? getFrontieres(r, c, pid2) : {};
          const cF2 = couleurFrontierePuzzle(puzzle2, C);  // ← C passé

          const px = pixelsPhoto?.[r]?.[c];
          let bgColor = px
            ? `rgba(${px[0]},${px[1]},${px[2]},0.18)`
            : "rgba(10,10,20,0.18)";

          const bgComplete = couleurBgComplete(puzzleAffiche);
          if (bgComplete) bgColor = bgComplete;
          if (estEclaire) bgColor = "rgba(255,255,255,0.12)";

          const estEnExtraction = extractionSet.has(key);

          return (
            <div key={key}
              className={[
                "cell-v3",
                estFantome ? (fantomeValide ? "f-ok" : "f-non") : "",
                brise ? "brise" : "",
                anime ? "anim-complete" : "",
              ].filter(Boolean).join(" ")}
              style={{
                position: "absolute",
                left: c * CELL, top: r * CELL,
                width: CELL, height: CELL,
                backgroundColor: bgColor,
                borderTop:    frontieres.top    ? `${epaisseur} solid ${getCF("top")}`    : "1px solid #1a1a2a22",
                borderBottom: frontieres.bottom ? `${epaisseur} solid ${getCF("bottom")}` : "1px solid #1a1a2a22",
                borderLeft:   frontieres.left   ? `${epaisseur} solid ${getCF("left")}`   : "1px solid #1a1a2a22",
                borderRight:  frontieres.right  ? `${epaisseur} solid ${getCF("right")}`  : "1px solid #1a1a2a22",
                boxSizing: "border-box",
                cursor: pieceSelectionnee ? "crosshair" : (puzzle ? "pointer" : "default"),
                transition: "background-color 0.25s",
                outline: estEnExtraction ? "2px solid #ffaa44" : "none",
                outlineOffset: "-2px",
              }}
            >
              {/* Arêtes du puzzle secondaire (intersection) */}
              {estIntersection && puzzle2 && (
                <>
                  {frontieres2.top    && !frontieres.top    && <div style={{ position:"absolute", top:0,    left:0, right:0,  height:"1px", background: cF2, opacity:0.5 }} />}
                  {frontieres2.bottom && !frontieres.bottom && <div style={{ position:"absolute", bottom:0, left:0, right:0,  height:"1px", background: cF2, opacity:0.5 }} />}
                  {frontieres2.left   && !frontieres.left   && <div style={{ position:"absolute", left:0,   top:0,  bottom:0, width:"1px",  background: cF2, opacity:0.5 }} />}
                  {frontieres2.right  && !frontieres.right  && <div style={{ position:"absolute", right:0,  top:0,  bottom:0, width:"1px",  background: cF2, opacity:0.5 }} />}
                </>
              )}

              {/* Pièce posée */}
          {/* Pièce posée */}
            {couleurPiece && (
              <div 
                className="piece-posee-v2"
                style={{
                  position: "absolute",
                  top: 2, left: 2, right: 2, bottom: 2,
                  borderRadius: "20%",
                  backgroundColor:
                    couleurPiece === "meilleur_coup" ? "#00dd66" :
                    couleurPiece === "rouge"   ? C.ROUGE_C :
                    couleurPiece === "noir"    ? C.NOIR_C  :
                    couleurPiece === "diamant" ? C.DIAMANT : "#888",
                  border:
                    couleurPiece === "meilleur_coup" ? "2px solid #00ff88" :
                    couleurPiece === "noir"  ? `2px solid ${C.NOIR_B}` : "none",
                  boxShadow:
                    couleurPiece === "meilleur_coup" ? "0 0 8px rgba(0,255,100,0.7)" :
                    couleurPiece === "rouge" ? "0 0 6px rgba(255,68,34,0.6)" :
                    couleurPiece === "noir"  ? "0 0 4px rgba(85,85,102,0.5)" :
                    "0 0 6px rgba(0,191,255,0.6)",
                  zIndex: 10,
                }}
              />
            )}
            </div>
          );
        })
      )}

      {/* Effets animation complétion */}
      {Object.entries(animPuzzles).map(([pid]) => {
        const puzz = puzzles[pid];
        if (!puzz) return null;
        const coul = puzz.complete_par === "rouge" ? C.ROUGE_C : C.NOIR_C;
        return (puzz.cellules || []).map(([r, c]) => (
          <div key={`fx-${pid}-${r}-${c}`} style={{
            position: "absolute",
            left: c * CELL, top: r * CELL,
            width: CELL, height: CELL,
            background: `radial-gradient(circle, ${coul}dd, transparent 70%)`,
            pointerEvents: "none",
            animation: "fx-complete 0.8s ease-out forwards",
          }} />
        ));
      })}
    </div>
  );
}