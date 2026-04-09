// ============================================================
//  ELMAAS — Board.jsx v4
//  - Clic sur arête : éclaire le puzzle (blanc)
//  - Intersection : éclaire le plus petit puzzle
//  - Frontières nettes par type et état
//  - Support modeCible et extractionsEnCours
// ============================================================
import { useState, useRef, useCallback, useEffect } from "react";
import "./Board.css";

const ROUGE   = "#cc2200";
const ROUGE_C = "#ff4422";
const NOIR_B  = "#222222";
const NOIR_C  = "#555566";

function couleurFrontierePuzzle(puzzle) {
  if (!puzzle) return "#1a1a2a";
  if (puzzle.brise) return "#884400";
  if (puzzle.complete_par === "rouge") return ROUGE_C;
  if (puzzle.complete_par === "noir")  return "#aaaaaa";
  if (puzzle.type_couleur === "mono_rouge") return ROUGE;
  if (puzzle.type_couleur === "mono_noir")  return NOIR_C;
  if (puzzle.type_couleur === "mixte")      return "mixte"; // traité séparément
  return "#2a2a4a";
}

// Pour les puzzles mixtes : renvoie rouge ou noir en alternance selon position
function couleurFrontiereMixte(r, c, dir) {
  // Alternance basée sur la position de la cellule + direction
  const pair = (r + c + (dir === "top" || dir === "bottom" ? 0 : 1)) % 2 === 0;
  return pair ? ROUGE : NOIR_C;
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

function positionValide(cellules, origine, pieces, taille) {
  for (const [dr, dc] of cellules) {
    const r = origine[0] + dr, c = origine[1] + dc;
    if (r < 0 || r >= taille || c < 0 || c >= taille) return false;
    if (pieces[`${r},${c}`] !== undefined && pieces[`${r},${c}`] !== null) return false;
  }
  return true;
}

export default function Board({
  etat, taille = 16, couleurJoueur,
  pieceSelectionnee, pieceIdx, pixelsPhoto,
  onPoserPiece, modeCible, onCibleSelectionnee, extractionsEnCours
}) {
  const [survol, setSurvol] = useState(null);
  const [puzzleEclaire, setPuzzleEclaire] = useState(null); // pid éclairé au clic
  const [animPuzzles, setAnimPuzzles] = useState({});
  const boardRef = useRef(null);
  const CELL = Math.min(36, Math.floor(560 / taille));

  const plateau = etat?.plateau;
  const pieces  = plateau?.pieces ?? {};
  const puzzles = plateau?.puzzles ?? {};

  // ── Index multi-puzzle : une cellule peut appartenir à plusieurs puzzles ──
  // puzzlesParCell[key] = [pid1, pid2, ...] (triés du plus petit au plus grand)
  const puzzlesParCell = {};
  Object.entries(puzzles).forEach(([pid, puzz]) => {
    (puzz.cellules || []).forEach(([r, c]) => {
      const key = `${r},${c}`;
      if (!puzzlesParCell[key]) puzzlesParCell[key] = [];
      puzzlesParCell[key].push(Number(pid));
    });
  });
  // Trier chaque liste par taille croissante (plus petit = sous-puzzle)
  Object.values(puzzlesParCell).forEach(pids => {
    pids.sort((a, b) => (puzzles[a]?.cellules?.length ?? 0) - (puzzles[b]?.cellules?.length ?? 0));
  });

  // ── Calculer les frontières d'un puzzle donné ──
  const getFrontieres = useCallback((r, c, pid) => {
    const dirs = { top: [r-1,c], bottom: [r+1,c], left: [r,c-1], right: [r,c+1] };
    const f = {};
    for (const [dir, [vr, vc]] of Object.entries(dirs)) {
      const voisinPids = puzzlesParCell[`${vr},${vc}`] || [];
      if (!voisinPids.includes(pid)) f[dir] = true;
    }
    return f;
  }, [puzzlesParCell]);

  // ── Puzzle principal d'une cellule (le plus petit si intersection) ──
  const puzzlePrincipal = useCallback((key) => {
    const pids = puzzlesParCell[key] || [];
    if (pids.length === 0) return null;
    // En intersection : le plus petit (sous-puzzle)
    return puzzles[pids[0]] ?? null;
  }, [puzzlesParCell, puzzles]);

  // ── Toutes les cellules d'un puzzle éclairé ──
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

  const handleClick = useCallback((e) => {
    const cell = getCellule(e);

    // Mode cible
    if (modeCible && onCibleSelectionnee && cell) {
      onCibleSelectionnee(cell);
      return;
    }

    // Pose de pièce
    if (pieceSelectionnee && survol && pieceIdx !== null) {
      const valide = positionValide(pieceSelectionnee.cellules, survol, pieces, taille);
      if (valide && onPoserPiece) {
        onPoserPiece(pieceIdx, survol);
        setSurvol(null);
        setPuzzleEclaire(null);
        return;
      }
    }

    // Clic sur arête : éclaire le puzzle
    if (cell) {
      const key = `${cell[0]},${cell[1]}`;
      const pids = puzzlesParCell[key] || [];
      if (pids.length > 0) {
        // Trouver quel puzzle est sur l'arête cliquée
        // Si déjà éclairé, cycler au suivant
        const idxActuel = puzzleEclaire !== null ? pids.indexOf(puzzleEclaire) : -1;
        const idxSuivant = (idxActuel + 1) % pids.length;
        const nouveauPid = pids[idxSuivant];
        setPuzzleEclaire(prev => prev === nouveauPid ? null : nouveauPid);
      } else {
        setPuzzleEclaire(null);
      }
    }
  }, [getCellule, modeCible, onCibleSelectionnee, pieceSelectionnee, survol,
      pieceIdx, pieces, taille, onPoserPiece, puzzlesParCell, puzzleEclaire]);

  // Fantômes
  const cellulesFantomes = new Set();
  let fantomeValide = false;
  if (pieceSelectionnee && survol) {
    const absolues = cellulesDansGrille(pieceSelectionnee.cellules, survol);
    fantomeValide = positionValide(pieceSelectionnee.cellules, survol, pieces, taille);
    absolues.forEach(([r, c]) => {
      if (r >= 0 && r < taille && c >= 0 && c < taille)
        cellulesFantomes.add(`${r},${c}`);
    });
  }

  // Cellules en cours d'extraction
  const extractionSet = new Set(
    (extractionsEnCours || []).map(([r, c]) => `${r},${c}`)
  );

  return (
    <div
      ref={boardRef}
      className={`board-v3 ${pieceSelectionnee ? "mode-pose" : ""} ${modeCible ? "mode-cible" : ""}`}
      style={{ width: taille * CELL, height: taille * CELL, position: "relative" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setSurvol(null)}
      onClick={handleClick}
    >
      {Array.from({ length: taille }, (_, r) =>
        Array.from({ length: taille }, (_, c) => {
          const key = `${r},${c}`;
          const couleurPiece = pieces[key];
          const pids = puzzlesParCell[key] || [];
          // Puzzle affiché = le plus petit présent
          const pidPrinc = pids[0] ?? undefined;
          const puzzle = pidPrinc !== undefined ? puzzles[pidPrinc] : null;
          const estIntersection = pids.length > 1;

          // Puzzle éclairé au clic
          const estEclaire = cellulesEclairees.has(key);
          // Le puzzle éclairé (peut être différent du principal)
          const puzzleEcl = puzzleEclaire !== null ? puzzles[puzzleEclaire] : null;

          // Fantôme
          const estFantome = cellulesFantomes.has(key);

          // Brisé / complété
          const brise = puzzle?.brise;
          const anime = pidPrinc !== undefined && animPuzzles[pidPrinc] === true;

          // ── Frontières : on dessine les arêtes du puzzle principal ──
          // Si intersection, l'arête externe est celle du sous-puzzle
          const frontieres = puzzle
            ? getFrontieres(r, c, pidPrinc)
            : {};

          // Couleur frontière selon état
          const cFBase = couleurFrontierePuzzle(puzzle);
          const estMixte = puzzle?.type_couleur === "mixte";
          let epaisseur = puzzle?.complete_par ? "3px" : "2px";
          if (estEclaire) epaisseur = "3px";

          // Fonction qui retourne la couleur de frontière pour une direction donnée
          const getCF = (dir) => {
            if (estEclaire) return "#ffffff";
            if (estMixte) return couleurFrontiereMixte(r, c, dir);
            return cFBase;
          };

          // Pour les cellules d'intersection, aussi dessiner le contour du parent
          // (arête interne plus fine)
          const pid2 = estIntersection ? pids[1] : null;
          const puzzle2 = pid2 !== null ? puzzles[pid2] : null;
          const frontieres2 = puzzle2 ? getFrontieres(r, c, pid2) : {};
          const cF2 = couleurFrontierePuzzle(puzzle2);

          // Background
          const px = pixelsPhoto?.[r]?.[c];
          let bgColor = px
            ? `rgba(${px[0]},${px[1]},${px[2]},0.18)`
            : "rgba(10,10,20,0.18)";

          const bgComplete = couleurBgComplete(puzzle);
          if (bgComplete) bgColor = bgComplete;
          if (estEclaire) bgColor = "rgba(255,255,255,0.12)";

          // Extraction
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
                // Arêtes du puzzle principal
                borderTop:    frontieres.top    ? `${epaisseur} solid ${getCF("top")}`    : "1px solid #1a1a2a22",
                borderBottom: frontieres.bottom ? `${epaisseur} solid ${getCF("bottom")}` : "1px solid #1a1a2a22",
                borderLeft:   frontieres.left   ? `${epaisseur} solid ${getCF("left")}`   : "1px solid #1a1a2a22",
                borderRight:  frontieres.right  ? `${epaisseur} solid ${getCF("right")}`  : "1px solid #1a1a2a22",
                boxSizing: "border-box",
                cursor: pieceSelectionnee ? "crosshair" : (puzzle ? "pointer" : "default"),
                transition: "background-color 0.25s",
                // Extraction en cours : outline orange
                outline: estEnExtraction ? "2px solid #ffaa44" : "none",
                outlineOffset: "-2px",
              }}
            >
              {/* Arêtes du puzzle parent (intersection) — tracées en interne */}
              {estIntersection && puzzle2 && (
                <>
                  {frontieres2.top    && !frontieres.top    && <div style={{ position:"absolute", top:0,    left:0, right:0,  height:"1px", background: cF2, opacity:0.5 }} />}
                  {frontieres2.bottom && !frontieres.bottom && <div style={{ position:"absolute", bottom:0, left:0, right:0,  height:"1px", background: cF2, opacity:0.5 }} />}
                  {frontieres2.left   && !frontieres.left   && <div style={{ position:"absolute", left:0,   top:0,  bottom:0, width:"1px",  background: cF2, opacity:0.5 }} />}
                  {frontieres2.right  && !frontieres.right  && <div style={{ position:"absolute", right:0,  top:0,  bottom:0, width:"1px",  background: cF2, opacity:0.5 }} />}
                </>
              )}

              {/* Pièce posée */}
              {couleurPiece && (
                <div className={`piece-v3 ${couleurPiece}`} />
              )}

              {/* Tag type puzzle en haut à gauche du puzzle */}
              {puzzle && frontieres.top && frontieres.left && (
                <div className="tag-puzzle" style={{ color: estEclaire ? "#ffffff" : (estMixte ? ROUGE : cFBase) }}>
                  {puzzle.type_couleur === "mixte" ? "R+N"
                    : puzzle.type_couleur === "mono_rouge" ? "R" : "N"}
                  {estIntersection ? "+" : ""}
                  {puzzle.parent_id !== null && puzzle.parent_id !== undefined ? "s" : ""}
                </div>
              )}

              {/* Indicateur intersection (point central) */}
              {estIntersection && (
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 4, height: 4, borderRadius: "50%",
                  background: cF2, opacity: 0.6, pointerEvents: "none",
                }} />
              )}
            </div>
          );
        })
      )}

      {/* Effets animation complétion */}
      {Object.entries(animPuzzles).map(([pid]) => {
        const puzz = puzzles[pid];
        if (!puzz) return null;
        const coul = puzz.complete_par === "rouge" ? ROUGE_C : NOIR_C;
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