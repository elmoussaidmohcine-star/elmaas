# ============================================================
#  ELMAAS — ai_player.py
#  IA joueur — 3 niveaux de difficulté
#  Niveau 1 : Aléatoire
#  Niveau 2 : Stratégique (greedy — maximise les puzzles complétés)
#  Niveau 3 : Expert (minimax léger + blocage adversaire)
# ============================================================

import random
from pieces_generator import cellules_absolues, placement_valide
from config import TAILLE_TAB, DEBUG


# ── Utilitaires ──────────────────────────────────────────────

def placements_possibles(piece, pieces, taille):
    """Retourne tous les (origine) valides pour une pièce."""
    possibles = []
    for r in range(taille):
        for c in range(taille):
            valide, _ = placement_valide(piece, (r, c), pieces, taille)
            if valide:
                possibles.append((r, c))
    return possibles


def simuler_pose(pieces, piece, origine, couleur, taille):
    """Retourne une copie des pièces après avoir posé la pièce."""
    nouvelles = dict(pieces)
    for r, c in cellules_absolues(piece, origine):
        if 0 <= r < taille and 0 <= c < taille:
            nouvelles[f"{r},{c}"] = couleur
    return nouvelles


def compter_puzzles_completes(pieces, puzzles, couleur):
    """Compte combien de puzzles seraient complétés avec ces pièces."""
    score = 0
    for puzzle in puzzles.values():
        cellules = puzzle.cellules
        if not cellules:
            continue
        if puzzle.complete_par:
            continue
        if puzzle.brise:
            continue
        # Toutes les cellules posées ?
        if not all(pieces.get(f"{r},{c}") is not None for r, c in cellules):
            continue
        # Contrainte couleur
        couleurs_presentes = {pieces.get(f"{r},{c}") for r, c in cellules}
        couleurs_presentes.discard(None)
        if puzzle.type_couleur == "mono_rouge" and couleurs_presentes == {"noir"}:
            continue
        if puzzle.type_couleur == "mono_noir" and couleurs_presentes == {"rouge"}:
            continue
        if puzzle.type_couleur == "mixte" and len(couleurs_presentes) < 2:
            continue
        score += 1
    return score


def score_cellules_dans_puzzles(piece, origine, puzzles, couleur, taille):
    """Compte combien de cellules de la pièce tombent dans des puzzles utiles."""
    absolues = cellules_absolues(piece, origine)
    score = 0
    for r, c in absolues:
        if not (0 <= r < taille and 0 <= c < taille):
            continue
        cle = f"{r},{c}"
        for puzzle in puzzles.values():
            if puzzle.complete_par or puzzle.brise:
                continue
            if (r, c) in puzzle.cellules:
                # Bonus si la couleur est compatible
                if puzzle.type_couleur == "mono_rouge" and couleur == "rouge":
                    score += 2
                elif puzzle.type_couleur == "mono_noir" and couleur == "noir":
                    score += 2
                elif puzzle.type_couleur == "mixte":
                    score += 1
                else:
                    score += 1
    return score


def score_blocage_adversaire(piece, origine, puzzles, couleur_adverse, taille):
    """Bonus si le placement gêne l'adversaire."""
    absolues = cellules_absolues(piece, origine)
    score = 0
    for r, c in absolues:
        cle = f"{r},{c}"
        for puzzle in puzzles.values():
            if puzzle.complete_par or puzzle.brise:
                continue
            if (r, c) in puzzle.cellules:
                # Puzzle favorable à l'adversaire ?
                if puzzle.type_couleur == "mono_rouge" and couleur_adverse == "rouge":
                    score += 1
                elif puzzle.type_couleur == "mono_noir" and couleur_adverse == "noir":
                    score += 1
    return score


# ── Niveaux de difficulté ────────────────────────────────────

def ia_niveau_1(etat, joueur):
    """
    Niveau 1 — Aléatoire.
    Choisit une pièce et un placement au hasard.
    """
    main = joueur.main_active
    if not main:
        return None

    indices = list(range(len(main)))
    random.shuffle(indices)

    for idx in indices:
        piece = main[idx]
        possibles = placements_possibles(piece, etat.plateau.pieces, TAILLE_TAB)
        if possibles:
            origine = random.choice(possibles)
            if DEBUG:
                print(f"[IA-1] pose {piece['forme']} en {origine}")
            return idx, origine

    return None


def ia_niveau_2(etat, joueur):
    """
    Niveau 2 — Stratégique (greedy).
    Choisit le placement qui maximise les cellules utiles dans les puzzles.
    Préfère compléter un puzzle si possible.
    """
    main = joueur.main_active
    puzzles = etat.plateau.puzzles
    pieces_plateau = etat.plateau.pieces
    couleur = joueur.couleur

    meilleur = None
    meilleur_score = -1

    for idx, piece in enumerate(main):
        possibles = placements_possibles(piece, pieces_plateau, TAILLE_TAB)
        for origine in possibles:
            # Simuler le placement
            nouvelles_pieces = simuler_pose(pieces_plateau, piece, origine, couleur, TAILLE_TAB)

            # Score : puzzles complétés en priorité
            puzzles_finis = compter_puzzles_completes(nouvelles_pieces, puzzles, couleur)
            score_cellules = score_cellules_dans_puzzles(piece, origine, puzzles, couleur, TAILLE_TAB)

            score = puzzles_finis * 100 + score_cellules

            if score > meilleur_score:
                meilleur_score = score
                meilleur = (idx, origine)

    if meilleur:
        if DEBUG:
            print(f"[IA-2] pose {main[meilleur[0]]['forme']} en {meilleur[1]} (score={meilleur_score})")
    return meilleur


def ia_niveau_3(etat, joueur):
    """
    Niveau 3 — Expert.
    Greedy + blocage adversaire + évite d'aider l'adversaire.
    Regarde 1 coup en avance.
    """
    main = joueur.main_active
    puzzles = etat.plateau.puzzles
    pieces_plateau = etat.plateau.pieces
    couleur = joueur.couleur
    couleur_adverse = "noir" if couleur == "rouge" else "rouge"

    meilleur = None
    meilleur_score = -999

    for idx, piece in enumerate(main):
        possibles = placements_possibles(piece, pieces_plateau, TAILLE_TAB)
        for origine in possibles:
            nouvelles_pieces = simuler_pose(pieces_plateau, piece, origine, couleur, TAILLE_TAB)

            # Score offensif
            puzzles_finis = compter_puzzles_completes(nouvelles_pieces, puzzles, couleur)
            score_cellules = score_cellules_dans_puzzles(piece, origine, puzzles, couleur, TAILLE_TAB)

            # Score défensif — bloquer l'adversaire
            score_def = score_blocage_adversaire(piece, origine, puzzles, couleur_adverse, TAILLE_TAB)

            # Pénalité : aider l'adversaire en complétant son puzzle
            penalite = 0
            for puzzle in puzzles.values():
                if puzzle.complete_par or puzzle.brise:
                    continue
                absolues = cellules_absolues(piece, origine)
                for r, c in absolues:
                    if (r, c) in puzzle.cellules:
                        if puzzle.type_couleur == "mono_rouge" and couleur == "noir":
                            penalite += 3
                        elif puzzle.type_couleur == "mono_noir" and couleur == "rouge":
                            penalite += 3

            score = puzzles_finis * 150 + score_cellules * 2 + score_def - penalite

            if score > meilleur_score:
                meilleur_score = score
                meilleur = (idx, origine)

    if meilleur:
        if DEBUG:
            print(f"[IA-3] pose {main[meilleur[0]]['forme']} en {meilleur[1]} (score={meilleur_score})")
    return meilleur


# ── Interface principale ──────────────────────────────────────

def jouer_ia(etat, joueur, niveau: int):
    """
    Point d'entrée de l'IA.
    niveau : 1 (facile), 2 (moyen), 3 (expert)
    Retourne (piece_index, origine) ou None si aucun coup possible.
    """
    if niveau == 1:
        return ia_niveau_1(etat, joueur)
    elif niveau == 2:
        return ia_niveau_2(etat, joueur)
    elif niveau == 3:
        return ia_niveau_3(etat, joueur)
    else:
        return ia_niveau_1(etat, joueur)