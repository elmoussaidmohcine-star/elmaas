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


#  Structures de données 

@dataclass
class Joueur:
    id: int
    couleur: str
    main_active: list
    reserve: list
    pieces_protegees: set
    serie_actuelle: int = 0
    score_puzzles: list = field(default_factory=list)
    nb_pieces_posees_depuis_regen: int = 0
    seuil_regen_actuel: int = 5
    puzzles_completes_depuis_regen: int = 0

    def __deepcopy__(self, memo):
        """Deepcopy personnalise pour eviter RecursionError sur les dataclasses."""
        import copy
        new_obj = Joueur(
            id=self.id,
            couleur=self.couleur,
            main_active=copy.deepcopy(self.main_active, memo),
            reserve=copy.deepcopy(self.reserve, memo),
            pieces_protegees=copy.deepcopy(self.pieces_protegees, memo),
            serie_actuelle=self.serie_actuelle,
            score_puzzles=copy.deepcopy(self.score_puzzles, memo),
            nb_pieces_posees_depuis_regen=self.nb_pieces_posees_depuis_regen,
            seuil_regen_actuel=self.seuil_regen_actuel,
            puzzles_completes_depuis_regen=self.puzzles_completes_depuis_regen,
        )
        memo[id(self)] = new_obj
        return new_obj

    def nb_pieces_total(self) -> int:
        return len(self.main_active) + len(self.reserve)

    def piocher(self):
        while len(self.main_active) < TAILLE_MAIN and self.reserve:
            self.main_active.append(self.reserve.pop(0))

    def retirer_piece(self, index: int) -> bool:
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
    tour_actuel: int = 0
    numero_tour: int = 0
    manche_terminee: bool = False
    gagnant: Optional[str] = None
    victoire_immediate: bool = False
    historique_actions: list = field(default_factory=list)
    piece_initiale_pos: Optional[tuple] = None
    timestamp_debut_tour: float = field(default_factory=time.time)

    def __deepcopy__(self, memo):
        """Deepcopy personnalise pour eviter RecursionError."""
        import copy
        new_obj = EtatJeu(
            plateau=copy.deepcopy(self.plateau, memo),
            joueur1=copy.deepcopy(self.joueur1, memo),
            joueur2=copy.deepcopy(self.joueur2, memo),
            tour_actuel=self.tour_actuel,
            numero_tour=self.numero_tour,
            manche_terminee=self.manche_terminee,
            gagnant=self.gagnant,
            victoire_immediate=self.victoire_immediate,
            historique_actions=copy.deepcopy(self.historique_actions, memo),
            piece_initiale_pos=self.piece_initiale_pos,
            timestamp_debut_tour=self.timestamp_debut_tour,
        )
        memo[id(self)] = new_obj
        return new_obj

    def joueur_actif(self) -> Joueur:
        return self.joueur1 if self.tour_actuel == 0 else self.joueur2

    def joueur_adverse(self) -> Joueur:
        return self.joueur2 if self.tour_actuel == 0 else self.joueur1

    def passer_tour(self):
        self.tour_actuel = 1 - self.tour_actuel
        self.numero_tour += 1
        self.timestamp_debut_tour = time.time()


#  Initialisation du jeu 

def calculer_pieces_initiales(plateau: Plateau, couleur: str) -> list:
    """Calcul asymétrique original — gardé pour compatibilité."""
    from pieces_generator import generer_piece, FORMES
    couleur_mono = "mono_rouge" if couleur == COULEUR_JOUEUR_1 else "mono_noir"

    cellules_couleur = sum(
        len(p.cellules) for p in plateau.puzzles.values()
        if p.type_couleur == couleur_mono
    )
    cellules_mixtes = sum(
        len(p.cellules) for p in plateau.puzzles.values()
        if p.type_couleur == "mixte"
    )
    cible = cellules_couleur + cellules_mixtes // 2
    cible = max(cible, 10)

    GROSSES = {n for n, f in FORMES.items() if len(f) >= 4}
    pieces = []
    total = 0
    nb_solo = 0
    nb_grosses = 0
    nb_petites = 0
    while total < cible:
        piece = generer_piece()
        if piece["forme"] == "1":
            if nb_solo >= 1:
                continue
            nb_solo += 1
        taille_p = len(piece["cellules"])
        est_grosse = piece["forme"] in GROSSES
        if est_grosse and nb_petites > 0 and nb_grosses >= nb_petites * 2:
            continue
        pieces.append(piece)
        total += taille_p
        if est_grosse:
            nb_grosses += 1
        else:
            nb_petites += 1
    return pieces


def calculer_pieces_initiales_equilibrees(plateau: Plateau) -> list:
    """
    Calcule le même nombre de pièces pour les deux joueurs.
    Basé sur la MOYENNE des cellules rouges et noires + mixtes partagés.
    """
    from pieces_generator import generer_piece, FORMES

    cellules_rouge = sum(len(p.cellules) for p in plateau.puzzles.values() if p.type_couleur == "mono_rouge")
    cellules_noir = sum(len(p.cellules) for p in plateau.puzzles.values() if p.type_couleur == "mono_noir")
    cellules_mixtes = sum(len(p.cellules) for p in plateau.puzzles.values() if p.type_couleur == "mixte")

    cible = (cellules_rouge + cellules_noir) // 2 + cellules_mixtes // 2
    cible = max(cible, 14)
    cible = min(cible, 32)

    GROSSES = {n for n, f in FORMES.items() if len(f) >= 4}
    pieces = []
    total = 0
    nb_solo = 0
    nb_grosses = 0
    nb_petites = 0
    while total < cible:
        piece = generer_piece()
        if piece["forme"] == "1":
            if nb_solo >= 1:
                continue
            nb_solo += 1
        taille_p = len(piece["cellules"])
        est_grosse = piece["forme"] in GROSSES
        if est_grosse and nb_petites > 0 and nb_grosses >= nb_petites * 2:
            continue
        pieces.append(piece)
        total += taille_p
        if est_grosse:
            nb_grosses += 1
        else:
            nb_petites += 1
    return pieces

def reinitialiser_plateau(plateau: Plateau) -> Plateau:
    """Nettoie un plateau pour une revanche : garde la structure des puzzles,
    mais vide les pièces posées et remet les puzzles à l'état non complété."""
    # Vider toutes les pièces posées
    plateau.pieces = {}
    
    # Réinitialiser les puzzles
    for puzzle in plateau.puzzles.values():
        puzzle.complete_par = None
        puzzle.brise = False
        puzzle.protege = False
    
    # Recalculer cellules libres = toutes les cellules actives des puzzles
    toutes_cellules = set()
    for puzzle in plateau.puzzles.values():
        for cell in puzzle.cellules:
            toutes_cellules.add(tuple(cell) if not isinstance(cell, tuple) else cell)
    
    plateau.cellules_actives = toutes_cellules
    plateau.cellules_libres = list(toutes_cellules)
    
    return plateau
def initialiser_jeu(plateau: Plateau) -> EtatJeu:
    from pieces_generator import generer_piece

    # ÉQUILIBRAGE : même nombre de pièces initiales pour les deux joueurs
    pieces_communes = calculer_pieces_initiales_equilibrees(plateau)
    reserve_j1_liste = list(pieces_communes)
    reserve_j2_liste = list(pieces_communes)

    # Pièce initiale : générée indépendamment pour ne PAS voler un joueur
    piece_initiale = generer_piece()
    reserve_j1 = reserve_j1_liste
    reserve_j2 = reserve_j2_liste

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
        print(f"[game_engine] [OK] Jeu initialisé avec tetrominos")
        print(f"  Pièce initiale : {piece_initiale['forme']} en {centre} ({couleur_initiale})")
        print(f"  J1 main={[p['forme'] for p in joueur1.main_active]}, réserve={len(joueur1.reserve)}")
        print(f"  J2 main={[p['forme'] for p in joueur2.main_active]}, réserve={len(joueur2.reserve)}")

    return etat


#  Actions du tour 

def action_poser_piece(etat: EtatJeu, piece_index: int, origine: tuple) -> dict:
    joueur = etat.joueur_actif()
    resultat = {"succes": False, "erreur": None, "puzzles_completes": [], "victoire_immediate": False}

    if piece_index < 0 or piece_index >= len(joueur.main_active):
        resultat["erreur"] = "Index de pièce invalide"
        return resultat

    piece = joueur.main_active[piece_index]

    valide, raison = placement_valide(piece, origine, etat.plateau.pieces, TAILLE_TAB)
    if not valide:
        resultat["erreur"] = raison
        return resultat

    absolues = cellules_absolues(piece, origine)
    positions_posees = []
    for pos in absolues:
        r, c = pos
        cle = f"{r},{c}"
        # CORRECTION: ELMAAS/diamant = couleur neutre, pas la couleur du joueur
        valeur = "diamant" if piece.get("enlevement") else joueur.couleur
        etat.plateau.pieces[cle] = valeur
        etat.plateau.cellules_actives.add((r, c))
        positions_posees.append((r, c))

    joueur.retirer_piece(piece_index)
    joueur.nb_pieces_posees_depuis_regen += 1
    joueur.pieces_protegees.clear()

    if DEBUG:
        print(f"[game_engine] {joueur.couleur} pose {piece['forme']} en {origine} → {positions_posees}")

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

        for puzzle_c in puzzles_completes:
            if puzzle_c.parent_id is not None:
                parent = etat.plateau.puzzles.get(puzzle_c.parent_id)
                if parent and parent.complete_par is not None and parent.complete_par != joueur.couleur:
                    parent.complete_par = joueur.couleur
                    if DEBUG:
                        print(f"[game_engine] {joueur.couleur} vole le parent {parent.id} via sous-puzzle {puzzle_c.id}")

        if joueur.serie_actuelle >= SERIE_VICTOIRE_IMMEDIATE:
            etat.manche_terminee = True
            etat.gagnant = joueur.couleur
            etat.victoire_immediate = True
            resultat["victoire_immediate"] = True
            resultat["motif"] = "victoire_immediate"
            if DEBUG:
                print(f"[game_engine] [VICTOIRE] VICTOIRE IMMÉDIATE — {joueur.couleur}")

    #  Régénération de pièces 
    if not joueur.reserve and not joueur.main_active:
        puzzles_completes_total = sum(
            1 for p in etat.plateau.puzzles.values()
            if p.complete_par is not None and not p.brise
        )
        if puzzles_completes_total == 0:
            etat.manche_terminee = True
            etat.gagnant = etat.joueur_adverse().couleur
            resultat["defaite_regen"] = True
            resultat["motif"] = "regen_impossible"
            resultat["succes"] = True
            return resultat
        else:
            from pieces_generator import generer_piece, generer_paire_enlevement
            # RÉGÉNÉRATION AVEC PIÈCES ELMAAS (diamant)
            # Règles : 5 pièces total, dont 2 ELMAAS
            # Somme(tailles ELMAAS) < 1/2 × Somme(tailles normales)
            elmaas1, elmaas2 = generer_paire_enlevement()
            normales = [generer_piece() for _ in range(3)]

            # Vérifier la contrainte de taille ELMAAS
            taille_elmaas = len(elmaas1["cellules"]) + len(elmaas2["cellules"])
            taille_normales = sum(len(p["cellules"]) for p in normales)
            if taille_elmaas >= taille_normales // 2:
                # Regénérer les ELMAAS plus petites
                for _ in range(10):
                    elmaas1, elmaas2 = generer_paire_enlevement()
                    taille_elmaas = len(elmaas1["cellules"]) + len(elmaas2["cellules"])
                    if taille_elmaas < taille_normales // 2:
                        break

            nouvelles = [elmaas1, elmaas2] + normales
            random.shuffle(nouvelles)
            joueur.reserve = nouvelles
            joueur.piocher()
            joueur.nb_pieces_posees_depuis_regen = 0
            joueur.puzzles_completes_depuis_regen = 0
            joueur.seuil_regen_actuel = len(nouvelles)
            resultat["regeneration"] = {"nouveau_seuil": 5, "nb_pieces": 5, "elmaas": 2}

    resultat["succes"] = True
    etat.historique_actions.append({
        "tour": etat.numero_tour,
        "joueur": joueur.couleur,
        "action": "poser",
        "piece": piece["forme"],
        "origine": list(origine),
        "positions": [list(p) for p in positions_posees],
        "puzzles_completes": [p.id for p in puzzles_completes],
    })

    if plateau_plein(etat):
        terminer_manche(etat)

    return resultat


def action_passer_repiocher(etat: EtatJeu) -> dict:
    """
    Action 2 : Passer son tour pour actualiser sa main active.
    """
    joueur = etat.joueur_actif()
    resultat = {"succes": True, "nouvelles_pieces": []}

    anciennes = list(joueur.main_active)
    joueur.main_active = []
    joueur.reserve = joueur.reserve + anciennes
    joueur.piocher()

    resultat["nouvelles_pieces"] = list(joueur.main_active)

    if DEBUG:
        print(f"[game_engine] {joueur.couleur} repoche — nouvelle main : {joueur.main_active}")

    etat.historique_actions.append({
        "tour": etat.numero_tour,
        "joueur": joueur.couleur,
        "action": "repiocher",
    })

    return resultat


def action_scout(etat: EtatJeu) -> dict:
    """
    Action 3 : Voir 10 pièces de la réserve à venir.
    """
    joueur = etat.joueur_actif()
    resultat = {"succes": False, "erreur": None, "pieces_vues": [], "echanges": []}

    if len(joueur.main_active) <= MIN_PIECES_SCOUT:
        resultat["erreur"] = f"Main trop petite pour le scout (besoin > {MIN_PIECES_SCOUT})"
        return resultat
    if len(joueur.reserve) == 0:
        resultat["erreur"] = "Réserve vide"
        return resultat

    nb_voir = min(NB_SCOUT, len(joueur.reserve))
    pieces_vues = joueur.reserve[:nb_voir]
    resultat["pieces_vues"] = list(pieces_vues)

    nb_echange = min(NB_ECHANGE_SCOUT, len(joueur.main_active), len(pieces_vues))
    indices_main = random.sample(range(len(joueur.main_active)), nb_echange)
    indices_vue = random.sample(range(len(pieces_vues)), nb_echange)

    for im, iv in zip(indices_main, indices_vue):
        piece_main = joueur.main_active[im]
        piece_vue = joueur.reserve[iv]
        joueur.main_active[im] = piece_vue
        joueur.reserve[iv] = piece_main
        resultat["echanges"].append({"de_main": piece_main, "vers_main": piece_vue})

    resultat["succes"] = True

    if DEBUG:
        print(f"[game_engine] {joueur.couleur} scout — vues:{pieces_vues[:3]}... échanges:{resultat['echanges']}")

    etat.historique_actions.append({
        "tour": etat.numero_tour,
        "joueur": joueur.couleur,
        "action": "scout",
        "echanges": resultat["echanges"],
    })

    return resultat


#  Pouvoirs après complétion de puzzle 

def appliquer_pouvoir(etat: EtatJeu, pouvoir: str, cible: tuple = None) -> dict:
    joueur = etat.joueur_actif()
    adverse = etat.joueur_adverse()
    resultat = {"succes": False, "erreur": None}

    if pouvoir not in POUVOIRS_DISPONIBLES:
        resultat["erreur"] = f"Pouvoir inconnu : {pouvoir}"
        return resultat

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
        joueur.pieces_protegees.add(cible)
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
        etat.plateau.pieces[cible] = joueur.couleur
        resultat["succes"] = True
        if DEBUG:
            print(f"[game_engine] {joueur.couleur} échange {cible} (était {adverse.couleur})")
        verifier_brisure_puzzle(etat, cible)

    return resultat


def appliquer_bonus_serie(etat: EtatJeu, positions_a_extraire: list = None) -> dict:
    joueur = etat.joueur_actif()
    resultat = {"succes": True, "extractions": [], "recoloriages_possibles": 0}

    if positions_a_extraire is None:
        return resultat

    for pos in positions_a_extraire[:NB_PIECES_EXTRACTION]:
        if isinstance(pos, (tuple, list)):
            pos = f"{pos[0]},{pos[1]}"
        couleur_piece = etat.plateau.pieces.get(pos)
        if couleur_piece is None:
            continue
        pos_cle = f"{pos[0]},{pos[1]}" if isinstance(pos, (tuple, list)) else pos
        etat.plateau.pieces[pos_cle] = None
        etat.plateau.cellules_actives.discard(pos)
        resultat["extractions"].append({"position": pos, "couleur": couleur_piece})

        if couleur_piece == joueur.couleur:
            resultat["recoloriages_possibles"] += 1

        if DEBUG:
            print(f"[game_engine] {joueur.couleur} extrait {pos} ({couleur_piece})")

    return resultat


def recolorier_piece(etat: EtatJeu, position: tuple) -> dict:
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

    pos_cle = f"{position[0]},{position[1]}" if isinstance(position, (tuple, list)) else position
    etat.plateau.pieces[pos_cle] = joueur.couleur
    resultat["succes"] = True

    verifier_brisure_puzzle(etat, position)

    if DEBUG:
        print(f"[game_engine] {joueur.couleur} recolorie {position}")

    return resultat


#  Détection de complétion et brisure 

def verifier_completion_puzzles(etat: EtatJeu, position_posee: tuple) -> list[Puzzle]:
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

        gagnant = determiner_gagnant_puzzle(etat, puzzle)
        if gagnant is None:
            continue

        puzzle.complete_par = gagnant
        completes.append(puzzle)

        if DEBUG:
            print(f"[game_engine] Puzzle {pid} complété par {gagnant} (type={puzzle.type_couleur})")

        for autre_pid, autre_puzzle in etat.plateau.puzzles.items():
            if autre_pid == pid:
                continue
            if autre_puzzle.complete_par is not None or autre_puzzle.brise:
                continue
            verifier_brisure_depuis_completion(etat, puzzle, autre_puzzle)

    return completes


def toutes_posees(etat: EtatJeu, puzzle: Puzzle) -> bool:
    return all(etat.plateau.pieces.get(f"{r},{c}") is not None for r, c in puzzle.cellules)


def determiner_gagnant_puzzle(etat: EtatJeu, puzzle: Puzzle):
    couleurs = {
        etat.plateau.pieces[f"{r},{c}"]
        for r, c in puzzle.cellules
        if etat.plateau.pieces.get(f"{r},{c}") is not None
    }

    # CORRECTION: Diamant = couleur neutre qui bloque les puzzles mono
    a_diamant = "diamant" in couleurs
    couleurs_joueurs = couleurs - {"diamant"}

    tout_rouge = couleurs_joueurs == {COULEUR_JOUEUR_1}
    tout_noir  = couleurs_joueurs == {COULEUR_JOUEUR_2}

    if puzzle.type_couleur == "mono_rouge":
        # Diamant bloque completement un puzzle mono
        if a_diamant:
            return None
        if tout_rouge: return COULEUR_JOUEUR_1
        if tout_noir:  return COULEUR_JOUEUR_2
        return None

    elif puzzle.type_couleur == "mono_noir":
        if a_diamant:
            return None
        if tout_noir:  return COULEUR_JOUEUR_2
        if tout_rouge: return COULEUR_JOUEUR_1
        return None

    elif puzzle.type_couleur == "mixte":
        # Mixte: diamant est neutre, il faut rouge ET noir (hors diamant)
        if COULEUR_JOUEUR_1 in couleurs_joueurs and COULEUR_JOUEUR_2 in couleurs_joueurs:
            return etat.joueur_actif().couleur
        return None

    return None


def verifier_brisure_depuis_completion(etat: EtatJeu, puzzle_complete: Puzzle, puzzle_cible: Puzzle):
    intersection = puzzle_complete.cellules & puzzle_cible.cellules
    if not intersection:
        return

    couleurs_intersection = {
        etat.plateau.pieces[f"{r},{c}"] for r, c in intersection
        if etat.plateau.pieces.get(f"{r},{c}") is not None
    }

    couleur_completeur = puzzle_complete.complete_par

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
            print(f"[game_engine] [ATTENTION]  Puzzle {puzzle_cible.id} BRISÉ (conflit avec {puzzle_complete.id})")


def verifier_brisure_puzzle(etat: EtatJeu, position: tuple):
    for pid, puzzle in etat.plateau.puzzles.items():
        if puzzle.complete_par is not None and not puzzle.brise:
            for autre_pid, autre in etat.plateau.puzzles.items():
                if autre_pid == pid or autre.brise or autre.complete_par is not None:
                    continue
                if position in (puzzle.cellules & autre.cellules):
                    verifier_brisure_depuis_completion(etat, puzzle, autre)


def tenter_reparer_puzzle_brise(etat: EtatJeu, puzzle_id: int) -> dict:
    joueur = etat.joueur_actif()
    resultat = {"succes": False, "erreur": None}

    if joueur.serie_actuelle < SERIE_BONUS_EXTRACTION:
        resultat["erreur"] = "Série insuffisante pour réparer (besoin de 3 d'affilée)"
        return resultat

    puzzle = etat.plateau.puzzles.get(puzzle_id)
    if puzzle is None or not puzzle.brise:
        resultat["erreur"] = "Puzzle non brisé ou inexistant"
        return resultat

    for autre_pid, autre in etat.plateau.puzzles.items():
        if autre.complete_par is None:
            continue
        intersection = puzzle.cellules & autre.cellules
        if not intersection:
            continue
        for cell in intersection:
            couleur_actuelle = etat.plateau.pieces.get(cell)
            if couleur_actuelle == autre.complete_par:
                cell_cle = f"{cell[0]},{cell[1]}" if isinstance(cell, (tuple, list)) else cell
                etat.plateau.pieces[cell_cle] = joueur.couleur

        puzzle.brise = False
        resultat["succes"] = True
        if DEBUG:
            print(f"[game_engine] [REPARATION] Puzzle {puzzle_id} réparé par {joueur.couleur}")
        break

    return resultat


#  Fin de manche 

def plateau_plein(etat: EtatJeu) -> bool:
    return all(v is not None for v in etat.plateau.pieces.values())


def terminer_manche(etat: EtatJeu):
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
        print(f"\n[game_engine] [FIN] FIN DE MANCHE")
        print(f"  Rouge : {score_rouge} puzzles")
        print(f"  Noir  : {score_noir} puzzles")
        print(f"  Gagnant : {etat.gagnant}")

    return {"score_rouge": score_rouge, "score_noir": score_noir, "gagnant": etat.gagnant, "motif": "plateau_plein"}


def calculer_score_cellules(etat: EtatJeu, couleur: str) -> int:
    total = 0
    for p in etat.plateau.puzzles.values():
        if not p.brise and p.complete_par == couleur:
            total += len(p.cellules)
    return total


def calculer_scores(etat: EtatJeu) -> dict:
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


#  Interface principale 

def jouer_tour(etat: EtatJeu, action: str, **kwargs) -> dict:
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

        if resultat["puzzles_completes"] and not resultat["victoire_immediate"]:
            if joueur.serie_actuelle >= SERIE_BONUS_EXTRACTION:
                extraire = kwargs.get("extraire")
                if extraire:
                    bonus = appliquer_bonus_serie(etat, extraire)
                    resultat["bonus_serie"] = bonus
                    recoloriage = kwargs.get("recoloriage")
                    if recoloriage and bonus.get("recoloriages_possibles", 0) > 0:
                        r = recolorier_piece(etat, recoloriage)
                        resultat["recoloriage"] = r

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

    resultat["scores"] = calculer_scores(etat)
    resultat["manche_terminee"] = etat.manche_terminee
    resultat["gagnant"] = etat.gagnant

    puzzles_completes = resultat.get("puzzles_completes", [])
    attente_pouvoir = bool(puzzles_completes) and not resultat.get("victoire_immediate", False)
    resultat["attente_pouvoir"] = attente_pouvoir

    if not etat.manche_terminee and not attente_pouvoir:
        etat.passer_tour()
        # Vérifier si le joueur suivant peut poser une pièce
        # Si non, terminer la manche (le gagnant est celui avec le plus de points)
        if not etat.manche_terminee:
            joueur_suivant = etat.joueur_actif()
            if joueur_suivant.main_active:
                from pieces_generator import placement_valide
                taille = etat.plateau.grille_bicolore.shape[0]
                peut_jouer = False
                peut_jouer_sur_puzzle = False
                puzzles_actifs = [p for p in etat.plateau.puzzles.values() if not p.complete_par and not p.brise]
                cellules_puzzles_actifs = set()
                for p in puzzles_actifs:
                    cellules_puzzles_actifs |= p.cellules

                for piece in joueur_suivant.main_active:
                    if peut_jouer_sur_puzzle:
                        break
                    for r in range(taille):
                        for c in range(taille):
                            valide, _ = placement_valide(piece, (r, c), etat.plateau.pieces, taille)
                            if valide:
                                peut_jouer = True
                                # Condition intersection : au moins une cellule de la piece touche un puzzle actif
                                for (pr, pc) in cellules_absolues(piece, (r, c)):
                                    if (pr, pc) in cellules_puzzles_actifs:
                                        peut_jouer_sur_puzzle = True
                                        break
                                if peut_jouer_sur_puzzle:
                                    break
                        if peut_jouer_sur_puzzle:
                            break
                # Si le joueur ne peut poser aucune piece intersectant un puzzle (meme s'il peut poser sur zones libres), fin
                if not peut_jouer_sur_puzzle and not joueur_suivant.reserve:
                    terminer_manche(etat)
                    resultat["manche_terminee"] = True
                    resultat["gagnant"] = etat.gagnant
                    resultat["motif"] = "no_moves_puzzle"

    return resultat


#  Test rapide 

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