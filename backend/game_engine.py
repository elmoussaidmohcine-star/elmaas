# ============================================================
#  ELMAAS — game_engine.py
#  Moteur de jeu complet : tours, règles, pouvoirs, séries,
#  puzzles brisés, fin de manche, calcul du score.
# ============================================================

import random
import time
from dataclasses import dataclass, field
from typing import Optional
from puzzle_generator import Plateau, Puzzle
from pieces_generator import distribuer_pieces, cellules_absolues, serialiser_piece, placement_valide
from config import (
    TAILLE_MAIN,
    TAILLE_TAB,
    NB_SCOUT,
    NB_ECHANGE_SCOUT,
    MIN_PIECES_SCOUT,
    SERIE_BONUS_EXTRACTION,
    NB_PIECES_EXTRACTION,
    SERIE_VICTOIRE_IMMEDIATE,
    POUVOIRS_DISPONIBLES,
    COULEUR_JOUEUR_1,
    COULEUR_JOUEUR_2,
    DEBUG,
)


# ── Structures de données ────────────────────────────────────

@dataclass
class Joueur:
    id: int
    couleur: str                        # "rouge" ou "noir"
    main_active: list                   # pièces tetrominos visibles (max TAILLE_MAIN)
    reserve: list                       # pièces tetrominos cachées
    pieces_protegees: set               # positions (r,c) protégées ce tour
    serie_actuelle: int = 0
    score_puzzles: list = field(default_factory=list)
    # Gestion régénération
    nb_pieces_posees_depuis_regen: int = 0   # pièces posées depuis dernière régén
    seuil_regen_actuel: int = 5              # 5 → 10 → 15
    puzzles_completes_depuis_regen: int = 0  # puzzles complétés dans ce cycle

    def nb_pieces_total(self) -> int:
        return len(self.main_active) + len(self.reserve)

    def piocher(self):
        """Remplace la main active depuis la réserve jusqu'à TAILLE_MAIN."""
        while len(self.main_active) < TAILLE_MAIN and self.reserve:
            self.main_active.append(self.reserve.pop(0))

    def retirer_piece(self, index: int) -> bool:
        """Retire la pièce à l'index donné de la main active."""
        if 0 <= index < len(self.main_active):
            self.main_active.pop(index)
            self.piocher()
            return True
        return False


@dataclass
class EtatJeu:
    plateau: Plateau
    joueur1: Joueur
    joueur2: Joueur
    tour_actuel: int = 0                # 0 = joueur1, 1 = joueur2
    numero_tour: int = 0
    manche_terminee: bool = False
    gagnant: Optional[str] = None      # "rouge", "noir", ou None
    victoire_immediate: bool = False
    historique_actions: list = field(default_factory=list)
    piece_initiale_pos: Optional[tuple] = None  # pièce placée aléatoirement au début
    timestamp_debut_tour: float = field(default_factory=time.time)  # synchro timers

    def joueur_actif(self) -> Joueur:
        return self.joueur1 if self.tour_actuel == 0 else self.joueur2

    def joueur_adverse(self) -> Joueur:
        return self.joueur2 if self.tour_actuel == 0 else self.joueur1

    def passer_tour(self):
        self.tour_actuel = 1 - self.tour_actuel
        self.numero_tour += 1
        self.timestamp_debut_tour = time.time()


# ── Initialisation du jeu ────────────────────────────────────

def calculer_pieces_initiales(plateau: Plateau, couleur: str) -> list:
    """
    Génère des pièces aléatoires dont la somme des tailles =
    cellules puzzles de cette couleur + cellules mixtes / 2.
    """
    from pieces_generator import generer_piece
    couleur_mono = "mono_rouge" if couleur == COULEUR_JOUEUR_1 else "mono_noir"
    
    # Compter les cellules cibles
    cellules_couleur = sum(
        len(p.cellules) for p in plateau.puzzles.values()
        if p.type_couleur == couleur_mono
    )
    cellules_mixtes = sum(
        len(p.cellules) for p in plateau.puzzles.values()
        if p.type_couleur == "mixte"
    )
    cible = cellules_couleur + cellules_mixtes // 2
    cible = max(cible, 10)  # minimum 10 cellules
    
    pieces = []
    total = 0
    nb_solo = 0
    while total < cible:
        piece = generer_piece()
        if piece["forme"] == "1":
            if nb_solo >= 1:
                continue  # on re-tire
            nb_solo += 1
        pieces.append(piece)
        total += len(piece["cellules"])
    return pieces


def initialiser_jeu(plateau: Plateau) -> EtatJeu:
    """
    Prépare l'état initial du jeu avec pièces tetrominos.
    - Calcule les pièces initiales selon la taille des puzzles
    - Place une pièce initiale aléatoire sur le plateau
    - Initialise les mains actives (TAILLE_MAIN pièces visibles)
    """
    from pieces_generator import generer_piece
    
    reserve_j1_liste = calculer_pieces_initiales(plateau, COULEUR_JOUEUR_1)
    reserve_j2_liste = calculer_pieces_initiales(plateau, COULEUR_JOUEUR_2)
    
    # Pièce initiale = première pièce de j1
    piece_initiale = reserve_j1_liste.pop(0) if reserve_j1_liste else generer_piece()
    reserve_j1 = reserve_j1_liste
    reserve_j2 = reserve_j2_liste

    # Placer la pièce initiale au centre du plateau
    centre = (TAILLE_TAB // 2, TAILLE_TAB // 2)
    couleur_initiale = random.choice([COULEUR_JOUEUR_1, COULEUR_JOUEUR_2])
    absolues_init = cellules_absolues(piece_initiale, centre)
    for pos in absolues_init:
        r, c = pos
        if 0 <= r < TAILLE_TAB and 0 <= c < TAILLE_TAB:
            cle = f"{r},{c}"
            if plateau.pieces.get(cle) is None:
                plateau.pieces[cle] = couleur_initiale
                plateau.cellules_actives.add((r, c))

    joueur1 = Joueur(
        id=0,
        couleur=COULEUR_JOUEUR_1,
        main_active=[],
        reserve=reserve_j1,
        pieces_protegees=set(),
        seuil_regen_actuel=max(5, len(reserve_j1)),
    )
    joueur2 = Joueur(
        id=1,
        couleur=COULEUR_JOUEUR_2,
        main_active=[],
        reserve=reserve_j2,
        pieces_protegees=set(),
        seuil_regen_actuel=max(5, len(reserve_j2)),
    )

    joueur1.piocher()
    joueur2.piocher()

    etat = EtatJeu(
        plateau=plateau,
        joueur1=joueur1,
        joueur2=joueur2,
        piece_initiale_pos=centre,
    )

    if DEBUG:
        print(f"[game_engine] ✅ Jeu initialisé avec tetrominos")
        print(f"  Pièce initiale : {piece_initiale['forme']} en {centre} ({couleur_initiale})")
        print(f"  J1 main={[p['forme'] for p in joueur1.main_active]}, réserve={len(joueur1.reserve)}")
        print(f"  J2 main={[p['forme'] for p in joueur2.main_active]}, réserve={len(joueur2.reserve)}")

    return etat


# ── Actions du tour ──────────────────────────────────────────

def action_poser_piece(etat: EtatJeu, piece_index: int, origine: tuple) -> dict:
    """
    Action 1 : Poser une pièce tetromino sur le plateau.
    piece_index : index de la pièce dans la main active
    origine     : (r, c) coin supérieur gauche du placement
    """
    joueur = etat.joueur_actif()
    resultat = {"succes": False, "erreur": None, "puzzles_completes": [], "victoire_immediate": False}

    if piece_index < 0 or piece_index >= len(joueur.main_active):
        resultat["erreur"] = "Index de pièce invalide"
        return resultat

    piece = joueur.main_active[piece_index]

    # Vérifier placement valide
    valide, raison = placement_valide(piece, origine, etat.plateau.pieces, TAILLE_TAB)
    if not valide:
        resultat["erreur"] = raison
        return resultat

    # Poser toutes les cellules de la pièce
    absolues = cellules_absolues(piece, origine)
    positions_posees = []
    for pos in absolues:
        r, c = pos
        cle = f"{r},{c}"
        etat.plateau.pieces[cle] = joueur.couleur
        etat.plateau.cellules_actives.add((r, c))
        positions_posees.append((r, c))

    # Retirer la pièce de la main
    joueur.retirer_piece(piece_index)
    joueur.nb_pieces_posees_depuis_regen += 1

    # Réinitialiser protections
    joueur.pieces_protegees.clear()

    if DEBUG:
        print(f"[game_engine] {joueur.couleur} pose {piece['forme']} en {origine} → {positions_posees}")

    # Vérifier puzzles complétés pour chaque cellule posée
    puzzles_completes = []
    for pos in positions_posees:
        nouveaux = verifier_completion_puzzles(etat, pos)
        for p in nouveaux:
            if p not in puzzles_completes:
                puzzles_completes.append(p)

    resultat["puzzles_completes"] = puzzles_completes

    if puzzles_completes:
        joueur.serie_actuelle += len(puzzles_completes)
        joueur.puzzles_completes_depuis_regen += len(puzzles_completes)
        etat.joueur_adverse().serie_actuelle = 0

        # Règle sous-puzzle : si un puzzle parent est déjà complété,
        # le joueur qui complète le sous-puzzle gagne le parent aussi
        for puzzle_c in puzzles_completes:
            if puzzle_c.parent_id is not None:
                parent = etat.plateau.puzzles.get(puzzle_c.parent_id)
                if parent and parent.complete_par is not None and parent.complete_par != joueur.couleur:
                    # Le parent était complété par l'adversaire → le joueur le vole
                    parent.complete_par = joueur.couleur
                    if DEBUG:
                        print(f"[game_engine] {joueur.couleur} vole le parent {parent.id} via sous-puzzle {puzzle_c.id}")

        if joueur.serie_actuelle >= SERIE_VICTOIRE_IMMEDIATE:
            etat.manche_terminee = True
            etat.gagnant = joueur.couleur
            etat.victoire_immediate = True
            resultat["victoire_immediate"] = True
            if DEBUG:
                print(f"[game_engine] 🏆 VICTOIRE IMMÉDIATE — {joueur.couleur}")

    # ── Régénération de pièces ──
    if not joueur.reserve and not joueur.main_active:
        puzzles_completes_total = sum(
            1 for p in etat.plateau.puzzles.values()
            if p.complete_par is not None and not p.brise
        )
        if puzzles_completes_total == 0:
            etat.manche_terminee = True
            etat.gagnant = etat.joueur_adverse().couleur
            resultat["defaite_regen"] = True
            resultat["succes"] = True
            return resultat
        else:
            from pieces_generator import generer_piece
            nouvelles = [generer_piece() for _ in range(5)]
            joueur.reserve = nouvelles
            joueur.piocher()
            joueur.nb_pieces_posees_depuis_regen = 0
            joueur.puzzles_completes_depuis_regen = 0
            joueur.seuil_regen_actuel = len(nouvelles)
            resultat["regeneration"] = {"nouveau_seuil": 5, "nb_pieces": 5}
# ── Pouvoirs après complétion de puzzle ──────────────────────

def appliquer_pouvoir(etat: EtatJeu, pouvoir: str, cible: tuple = None) -> dict:
    """
    Applique le pouvoir choisi après complétion d'un puzzle.
    pouvoir : "rien", "proteger", "echanger"
    cible   : position de la pièce concernée (pour protéger ou échanger)
    """
    joueur = etat.joueur_actif()
    adverse = etat.joueur_adverse()
    resultat = {"succes": False, "erreur": None}

    if pouvoir not in POUVOIRS_DISPONIBLES:
        resultat["erreur"] = f"Pouvoir inconnu : {pouvoir}"
        return resultat

    # Normaliser cible en string si tuple
    if cible is not None and isinstance(cible, (tuple, list)):
        cible = f"{cible[0]},{cible[1]}"

    if pouvoir == "rien":
        resultat["succes"] = True

    elif pouvoir == "proteger":
        if cible is None:
            resultat["erreur"] = "Cible requise pour protéger"
            return resultat
        if etat.plateau.pieces.get(cible) != joueur.couleur:
            resultat["erreur"] = "Vous ne possédez pas cette pièce"
            return resultat
        cible_cle = f"{cible[0]},{cible[1]}" if isinstance(cible, (tuple,list)) else cible
        joueur.pieces_protegees.add(cible_cle)
        resultat["succes"] = True
        if DEBUG:
            print(f"[game_engine] {joueur.couleur} protège {cible}")

    elif pouvoir == "echanger":
        if cible is None:
            resultat["erreur"] = "Cible requise pour échanger"
            return resultat
        if etat.plateau.pieces.get(cible) != adverse.couleur:
            resultat["erreur"] = "La cible n'appartient pas à l'adversaire"
            return resultat
        if cible in adverse.pieces_protegees:
            resultat["erreur"] = "Cette pièce est protégée"
            return resultat
        # Échanger : la pièce adverse devient la couleur du joueur actif
        cible_cle = f"{cible[0]},{cible[1]}" if isinstance(cible, (tuple,list)) else cible
        etat.plateau.pieces[cible_cle] = joueur.couleur
        resultat["succes"] = True
        if DEBUG:
            print(f"[game_engine] {joueur.couleur} échange {cible} (était {adverse.couleur})")

        # Vérifier si l'échange brise un puzzle
        verifier_brisure_puzzle(etat, cible)

    return resultat


def appliquer_bonus_serie(etat: EtatJeu, positions_a_extraire: list = None) -> dict:
    """
    Applique le bonus de série (3 puzzles d'affilée) :
    - Extrait NB_PIECES_EXTRACTION pièces du plateau (optionnel)
    - Si une pièce extraite est de sa propre couleur → recolorier une autre pièce
    """
    joueur = etat.joueur_actif()
    resultat = {"succes": True, "extractions": [], "recoloriages_possibles": 0}

    if positions_a_extraire is None:
        return resultat  # Joueur choisit de ne pas extraire

    for pos in positions_a_extraire[:NB_PIECES_EXTRACTION]:
        if isinstance(pos, (tuple, list)):
            pos = f"{pos[0]},{pos[1]}"
        couleur_piece = etat.plateau.pieces.get(pos)
        if couleur_piece is None:
            continue
        # Extraire la pièce
        pos_cle = f"{pos[0]},{pos[1]}" if isinstance(pos, (tuple,list)) else pos
        etat.plateau.pieces[pos_cle] = None
        etat.plateau.cellules_actives.discard(pos)
        resultat["extractions"].append({"position": pos, "couleur": couleur_piece})

        # Si sa propre couleur extraite → droit de recolorier une autre pièce
        if couleur_piece == joueur.couleur:
            resultat["recoloriages_possibles"] += 1

        if DEBUG:
            print(f"[game_engine] {joueur.couleur} extrait {pos} ({couleur_piece})")

    return resultat


def recolorier_piece(etat: EtatJeu, position: tuple) -> dict:
    """
    Recolorie une pièce adverse en la couleur du joueur actif.
    Utilisé après extraction d'une pièce de sa propre couleur.
    """
    joueur = etat.joueur_actif()
    resultat = {"succes": False, "erreur": None}

    if isinstance(position, (tuple, list)):
        position = f"{position[0]},{position[1]}"
    couleur_actuelle = etat.plateau.pieces.get(position)
    if couleur_actuelle is None:
        resultat["erreur"] = "Aucune pièce à cette position"
        return resultat
    if couleur_actuelle == joueur.couleur:
        resultat["erreur"] = "La pièce est déjà de votre couleur"
        return resultat

    pos_cle = f"{position[0]},{position[1]}" if isinstance(position, (tuple,list)) else position
    etat.plateau.pieces[pos_cle] = joueur.couleur
    resultat["succes"] = True

    verifier_brisure_puzzle(etat, position)

    if DEBUG:
        print(f"[game_engine] {joueur.couleur} recolorie {position}")

    return resultat


# ── Détection de complétion et brisure ──────────────────────

def verifier_completion_puzzles(etat: EtatJeu, position_posee: tuple) -> list[Puzzle]:
    """
    Vérifie si la pièce posée complète un ou plusieurs puzzles.
    Règles :
    - mono_rouge : toutes les cellules doivent être ROUGE → complete_par = "rouge"
                   toutes les cellules doivent être NOIR  → complete_par = "noir"
                   mélange → pas complété
    - mono_noir  : même logique inversée
    - mixte      : doit avoir les deux couleurs → complete_par = joueur actif
    """
    completes = []

    for pid, puzzle in etat.plateau.puzzles.items():
        if puzzle.complete_par is not None:
            continue
        if puzzle.brise:
            continue
        if position_posee not in puzzle.cellules:
            continue
        if not toutes_posees(etat, puzzle):
            continue

        # Déterminer le gagnant selon les couleurs présentes
        gagnant = determiner_gagnant_puzzle(etat, puzzle)
        if gagnant is None:
            continue  # Pas encore complétable

        puzzle.complete_par = gagnant
        completes.append(puzzle)

        if DEBUG:
            print(f"[game_engine] Puzzle {pid} complété par {gagnant} (type={puzzle.type_couleur})")

        # Vérifier brisure des puzzles voisins
        for autre_pid, autre_puzzle in etat.plateau.puzzles.items():
            if autre_pid == pid:
                continue
            if autre_puzzle.complete_par is not None or autre_puzzle.brise:
                continue
            verifier_brisure_depuis_completion(etat, puzzle, autre_puzzle)

    return completes


def toutes_posees(etat: EtatJeu, puzzle: Puzzle) -> bool:
    """Vérifie que toutes les cellules du puzzle ont une pièce posée."""
    # Les clés de plateau.pieces sont des strings "r,c", les cellules sont des tuples (r,c)
    return all(etat.plateau.pieces.get(f"{r},{c}") is not None for r, c in puzzle.cellules)


def determiner_gagnant_puzzle(etat: EtatJeu, puzzle: Puzzle):
    """
    Détermine qui gagne le puzzle selon les couleurs présentes.
    Retourne "rouge", "noir", ou None si le puzzle n'est pas complétable.

    Règles :
    - mono_rouge : tout rouge → rouge gagne
                   tout noir  → noir gagne (a envahi le puzzle)
                   mélange    → non complété
    - mono_noir  : tout noir  → noir gagne
                   tout rouge → rouge gagne (a envahi le puzzle)
                   mélange    → non complété
    - mixte      : doit avoir les deux couleurs → le joueur actif gagne
                   (celui qui a posé la dernière pièce)
    """
    couleurs = {
        etat.plateau.pieces[f"{r},{c}"]
        for r, c in puzzle.cellules
        if etat.plateau.pieces.get(f"{r},{c}") is not None
    }
    tout_rouge = couleurs == {COULEUR_JOUEUR_1}
    tout_noir  = couleurs == {COULEUR_JOUEUR_2}

    if puzzle.type_couleur == "mono_rouge":
        if tout_rouge: return COULEUR_JOUEUR_1
        if tout_noir:  return COULEUR_JOUEUR_2
        return None  # mélange = pas complété

    elif puzzle.type_couleur == "mono_noir":
        if tout_noir:  return COULEUR_JOUEUR_2
        if tout_rouge: return COULEUR_JOUEUR_1
        return None  # mélange = pas complété

    elif puzzle.type_couleur == "mixte":
        # Les deux couleurs doivent être présentes
        if COULEUR_JOUEUR_1 in couleurs and COULEUR_JOUEUR_2 in couleurs:
            return etat.joueur_actif().couleur
        return None

    return None


def verifier_brisure_depuis_completion(etat: EtatJeu, puzzle_complete: Puzzle, puzzle_cible: Puzzle):
    """
    Vérifie si la complétion de puzzle_complete brise puzzle_cible.
    Un puzzle se brise si son intersection avec un puzzle complété
    contient une couleur incompatible avec sa propre contrainte.
    """
    intersection = puzzle_complete.cellules & puzzle_cible.cellules
    if not intersection:
        return

    couleurs_intersection = {
        etat.plateau.pieces[f"{r},{c}"] for r, c in intersection
        if etat.plateau.pieces.get(f"{r},{c}") is not None
    }

    # Le puzzle complété illumine avec la couleur du joueur
    couleur_completeur = puzzle_complete.complete_par

    # Si l'intersection est entièrement de la couleur du compléteur
    # ET que puzzle_cible ne peut pas avoir cette couleur seule → brisure
    conflit = False
    if puzzle_cible.type_couleur == "mixte" and couleurs_intersection == {couleur_completeur}:
        conflit = True
    elif puzzle_cible.type_couleur == "mono_rouge" and couleur_completeur == COULEUR_JOUEUR_2:
        if couleurs_intersection == {COULEUR_JOUEUR_2}:
            conflit = True
    elif puzzle_cible.type_couleur == "mono_noir" and couleur_completeur == COULEUR_JOUEUR_1:
        if couleurs_intersection == {COULEUR_JOUEUR_1}:
            conflit = True

    if conflit:
        puzzle_cible.brise = True
        if DEBUG:
            print(f"[game_engine] ⚠️  Puzzle {puzzle_cible.id} BRISÉ (conflit avec {puzzle_complete.id})")


def verifier_brisure_puzzle(etat: EtatJeu, position: tuple):
    """
    Après un échange ou recoloriage, vérifie si des puzzles sont maintenant brisés.
    """
    for pid, puzzle in etat.plateau.puzzles.items():
        if puzzle.complete_par is not None and not puzzle.brise:
            for autre_pid, autre in etat.plateau.puzzles.items():
                if autre_pid == pid or autre.brise or autre.complete_par is not None:
                    continue
                if position in (puzzle.cellules & autre.cellules):
                    verifier_brisure_depuis_completion(etat, puzzle, autre)


def tenter_reparer_puzzle_brise(etat: EtatJeu, puzzle_id: int) -> dict:
    """
    Tente de réparer un puzzle brisé.
    Condition : le joueur actif vient de compléter 3 puzzles d'affilée
    et souhaite échanger la couleur dans l'intersection problématique.
    """
    joueur = etat.joueur_actif()
    resultat = {"succes": False, "erreur": None}

    if joueur.serie_actuelle < SERIE_BONUS_EXTRACTION:
        resultat["erreur"] = "Série insuffisante pour réparer (besoin de 3 d'affilée)"
        return resultat

    puzzle = etat.plateau.puzzles.get(puzzle_id)
    if puzzle is None or not puzzle.brise:
        resultat["erreur"] = "Puzzle non brisé ou inexistant"
        return resultat

    # Trouver le puzzle complété responsable de la brisure
    for autre_pid, autre in etat.plateau.puzzles.items():
        if autre.complete_par is None:
            continue
        intersection = puzzle.cellules & autre.cellules
        if not intersection:
            continue
        # Échanger la couleur dans l'intersection
        for cell in intersection:
            couleur_actuelle = etat.plateau.pieces.get(cell)
            if couleur_actuelle == autre.complete_par:
                cell_cle = f"{cell[0]},{cell[1]}" if isinstance(cell, (tuple,list)) else cell
                etat.plateau.pieces[cell_cle] = joueur.couleur

        puzzle.brise = False
        resultat["succes"] = True
        if DEBUG:
            print(f"[game_engine] 🔧 Puzzle {puzzle_id} réparé par {joueur.couleur}")
        break

    return resultat


# ── Fin de manche ────────────────────────────────────────────

def plateau_plein(etat: EtatJeu) -> bool:
    """Vérifie si toutes les cases du plateau ont une pièce posée."""
    return all(v is not None for v in etat.plateau.pieces.values())


def terminer_manche(etat: EtatJeu):
    """
    Calcule le score final et désigne le gagnant.
    Score = nombre de puzzles éclairés par chaque couleur.
    Les pièces du puzzle brisé sont exclues du calcul.
    """
    if etat.manche_terminee:
        return

    score_rouge = calculer_score_cellules(etat, COULEUR_JOUEUR_1)
    score_noir  = calculer_score_cellules(etat, COULEUR_JOUEUR_2)

    etat.manche_terminee = True

    if score_rouge > score_noir:
        etat.gagnant = COULEUR_JOUEUR_1
    elif score_noir > score_rouge:
        etat.gagnant = COULEUR_JOUEUR_2
    else:
        etat.gagnant = "egalite"

    if DEBUG:
        print(f"\n[game_engine] 🏁 FIN DE MANCHE")
        print(f"  Rouge : {score_rouge} puzzles")
        print(f"  Noir  : {score_noir} puzzles")
        print(f"  Gagnant : {etat.gagnant}")

    return {"score_rouge": score_rouge, "score_noir": score_noir, "gagnant": etat.gagnant}


def calculer_score_cellules(etat: EtatJeu, couleur: str) -> int:
    """
    Score = nombre total de cellules dans les puzzles complétés par cette couleur
    (toutes les cellules du puzzle comptent, peu importe leur couleur sur le plateau).
    """
    total = 0
    for p in etat.plateau.puzzles.values():
        if not p.brise and p.complete_par == couleur:
            total += len(p.cellules)
    return total


def calculer_scores(etat: EtatJeu) -> dict:
    """Retourne le score actuel sans terminer la manche."""
    score_rouge = calculer_score_cellules(etat, COULEUR_JOUEUR_1)
    score_noir  = calculer_score_cellules(etat, COULEUR_JOUEUR_2)
    return {
        "rouge": score_rouge,
        "noir": score_noir,
        "serie_rouge": etat.joueur1.serie_actuelle,
        "serie_noir": etat.joueur2.serie_actuelle,
        "puzzles_brises": sum(1 for p in etat.plateau.puzzles.values() if p.brise),
        "puzzles_rouge": sum(1 for p in etat.plateau.puzzles.values() if not p.brise and p.complete_par == COULEUR_JOUEUR_1),
        "puzzles_noir":  sum(1 for p in etat.plateau.puzzles.values() if not p.brise and p.complete_par == COULEUR_JOUEUR_2),
    }


# ── Interface principale ─────────────────────────────────────

def jouer_tour(etat: EtatJeu, action: str, **kwargs) -> dict:
    """
    Point d'entrée principal pour jouer un tour.

    action : "poser" | "repiocher" | "scout"
    kwargs :
      - position     : tuple (ligne, col) pour "poser"
      - pouvoir      : str pour après complétion puzzle
      - cible_pouvoir: tuple pour "proteger" ou "echanger"
      - extraire     : list de positions pour bonus série
    
    Retourne un dict complet de l'état résultant.
    """
    if etat.manche_terminee:
        return {"succes": False, "erreur": "Manche déjà terminée"}

    joueur = etat.joueur_actif()
    resultat = {}

    if action == "poser":
        piece_index = kwargs.get("piece_index", 0)
        origine = kwargs.get("origine")
        if origine is None:
            return {"succes": False, "erreur": "Origine manquante"}
        resultat = action_poser_piece(etat, piece_index, tuple(origine))

        if not resultat["succes"]:
            return resultat

        # Si puzzles complétés → gérer pouvoirs et bonus
        if resultat["puzzles_completes"] and not resultat["victoire_immediate"]:

            # Bonus série 3 → extraction optionnelle
            if joueur.serie_actuelle >= SERIE_BONUS_EXTRACTION:
                extraire = kwargs.get("extraire")
                if extraire:
                    bonus = appliquer_bonus_serie(etat, extraire)
                    resultat["bonus_serie"] = bonus

                    # Recoloriage si pièce propre extraite
                    recoloriage = kwargs.get("recoloriage")
                    if recoloriage and bonus.get("recoloriages_possibles", 0) > 0:
                        r = recolorier_piece(etat, recoloriage)
                        resultat["recoloriage"] = r

            # Appliquer le pouvoir choisi après complétion
            pouvoir = kwargs.get("pouvoir", "rien")
            cible = kwargs.get("cible_pouvoir")
            if pouvoir != "rien":
                resultat["pouvoir"] = appliquer_pouvoir(etat, pouvoir, cible)

    elif action == "repiocher":
        resultat = action_passer_repiocher(etat)

    elif action == "scout":
        resultat = action_scout(etat)

    else:
        return {"succes": False, "erreur": f"Action inconnue : {action}"}

    # Ajouter l'état courant au résultat
    resultat["scores"] = calculer_scores(etat)
    resultat["manche_terminee"] = etat.manche_terminee
    resultat["gagnant"] = etat.gagnant

    # Passer au tour suivant SAUF si des puzzles ont été complétés :
    # dans ce cas le frontend va envoyer action=pouvoir qui passera le tour.
    puzzles_completes = resultat.get("puzzles_completes", [])
    attente_pouvoir = bool(puzzles_completes) and not resultat.get("victoire_immediate", False)
    resultat["attente_pouvoir"] = attente_pouvoir

    if not etat.manche_terminee and not attente_pouvoir:
        etat.passer_tour()

    return resultat


# ── Test rapide ──────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    from image_processor import traiter_photo
    from puzzle_generator import generer_puzzles

    if len(sys.argv) < 2:
        print("Usage : python game_engine.py <chemin_image>")
        sys.exit(1)

    print("=== Initialisation ELMAAS ===")
    donnees = traiter_photo(sys.argv[1])
    plateau = generer_puzzles(donnees)
    etat = initialiser_jeu(plateau)

    print(f"\nJoueur 1 ({etat.joueur1.couleur}) main : {etat.joueur1.main_active}")
    print(f"Joueur 2 ({etat.joueur2.couleur}) main : {etat.joueur2.main_active}")
    print(f"Scores initiaux : {calculer_scores(etat)}")

    # Simuler quelques tours
    print("\n=== Simulation 3 tours ===")
    for i in range(3):
        joueur = etat.joueur_actif()
        if joueur.main_active:
            pos = joueur.main_active[0]
            res = jouer_tour(etat, "poser", position=pos, pouvoir="rien")
            print(f"Tour {i+1} ({joueur.couleur}) pose {pos} → puzzles={[p.id for p in res.get('puzzles_completes', [])]}")
        else:
            jouer_tour(etat, "repiocher")
            print(f"Tour {i+1} ({joueur.couleur}) repioche")

    print(f"\nScores : {calculer_scores(etat)}")