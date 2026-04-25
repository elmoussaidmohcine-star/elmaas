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
    """Retourne une copie des pièces après avoir posé la pièce.
    Si c'est une pièce d'enlèvement, place 'diamant' à la place de la couleur."""
    nouvelles = dict(pieces)
    valeur = "diamant" if piece.get("enlevement") else couleur
    for r, c in cellules_absolues(piece, origine):
        if 0 <= r < taille and 0 <= c < taille:
            nouvelles[f"{r},{c}"] = valeur
    return nouvelles


def compter_puzzles_completes(pieces, puzzles, couleur):
    """Compte combien de puzzles seraient complétés POUR moi avec ces pièces.
    Tient compte du diamant qui bloque les complétions mono."""
    score = 0
    for puzzle in puzzles.values():
        cellules = puzzle.cellules
        if not cellules:
            continue
        # On ignore les puzzles déjà attribués À MOI (pas de gain)
        # mais on regarde quand même les puzzles attribués à l'adverse
        # car un diamant peut me les transférer si la couleur change.
        # Note : compter_puzzles_completes ne distingue pas les transferts,
        # ce sera fait par score_recuperation_puzzle ci-dessous.
        if puzzle.complete_par == couleur:
            continue
        if puzzle.brise:
            continue
        # Toutes les cellules posées ?
        if not all(pieces.get(f"{r},{c}") is not None for r, c in cellules):
            continue
        # Couleurs présentes (hors diamant)
        couleurs_presentes = {pieces.get(f"{r},{c}") for r, c in cellules}
        couleurs_presentes.discard(None)
        a_diamant = "diamant" in couleurs_presentes
        couleurs_joueurs = couleurs_presentes - {"diamant"}
        # Mono : pas de diamant accepté
        if puzzle.type_couleur == "mono_rouge":
            if not a_diamant and couleurs_joueurs == {"rouge"} and couleur == "rouge":
                score += 1
            elif not a_diamant and couleurs_joueurs == {"noir"} and couleur == "noir":
                score += 1
        elif puzzle.type_couleur == "mono_noir":
            if not a_diamant and couleurs_joueurs == {"noir"} and couleur == "noir":
                score += 1
            elif not a_diamant and couleurs_joueurs == {"rouge"} and couleur == "rouge":
                score += 1
        elif puzzle.type_couleur == "mixte":
            # Mixte : rouge ET noir présents (diamant OK)
            if "rouge" in couleurs_joueurs and "noir" in couleurs_joueurs:
                score += 1  # le joueur actif récupère un mixte
    return score


def score_enlevement(piece, origine, pieces_plateau, puzzles, couleur, taille):
    """
    Score spécifique pour une pièce d'enlèvement : valorise l'effacement
    de cases adverses dans des puzzles favorables à l'adversaire ou des
    puzzles déjà complétés par l'adversaire.
    """
    if not piece.get("enlevement"):
        return 0
    
    couleur_adverse = "noir" if couleur == "rouge" else "rouge"
    score = 0
    absolues = cellules_absolues(piece, origine)
    
    for r, c in absolues:
        if not (0 <= r < taille and 0 <= c < taille):
            continue
        cle = f"{r},{c}"
        case_actuelle = pieces_plateau.get(cle)
        # Bonus énorme si on enlève une pièce adverse
        if case_actuelle == couleur_adverse:
            score += 5
        # Trouve les puzzles concernés
        for puzzle in puzzles.values():
            if (r, c) not in puzzle.cellules:
                continue
            # Bonus très important si le puzzle est déjà complété par l'adverse
            if puzzle.complete_par == couleur_adverse and not puzzle.brise:
                score += 30
            # Bonus si le puzzle est mono favorable à l'adverse
            elif puzzle.complete_par is None and not puzzle.brise:
                if puzzle.type_couleur == "mono_rouge" and couleur_adverse == "rouge":
                    score += 8
                elif puzzle.type_couleur == "mono_noir" and couleur_adverse == "noir":
                    score += 8
    
    # Pénalité : éviter de poser un diamant sur une de mes propres pièces
    # qui complète un puzzle pour moi
    for r, c in absolues:
        cle = f"{r},{c}"
        if pieces_plateau.get(cle) == couleur:
            for puzzle in puzzles.values():
                if (r, c) not in puzzle.cellules:
                    continue
                if puzzle.complete_par == couleur and not puzzle.brise:
                    score -= 20  # ne pas casser MES puzzles
                elif puzzle.complete_par is None and not puzzle.brise:
                    if puzzle.type_couleur == "mono_rouge" and couleur == "rouge":
                        score -= 5
                    elif puzzle.type_couleur == "mono_noir" and couleur == "noir":
                        score -= 5
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
    Sait utiliser les pièces d'enlèvement contre l'adversaire.
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
            # Score spécifique enlèvement
            bonus_enlev = score_enlevement(piece, origine, pieces_plateau, puzzles, couleur, TAILLE_TAB)

            score = puzzles_finis * 100 + score_cellules + bonus_enlev

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
    Sait utiliser les pièces d'enlèvement contre les puzzles adverses.
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

            # Score spécifique enlèvement (très puissant pour l'expert)
            bonus_enlev = score_enlevement(piece, origine, pieces_plateau, puzzles, couleur, TAILLE_TAB)

            # Score défensif — bloquer l'adversaire (uniquement pour pièces normales)
            if not piece.get("enlevement"):
                score_def = score_blocage_adversaire(piece, origine, puzzles, couleur_adverse, TAILLE_TAB)
            else:
                score_def = 0

            # Pénalité : aider l'adversaire en complétant son puzzle (pièces normales)
            penalite = 0
            if not piece.get("enlevement"):
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

            score = puzzles_finis * 150 + score_cellules * 2 + score_def + bonus_enlev * 3 - penalite

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