# ELMAAS — analyse_partie.py v6.0
# Analyse avec RECONSTRUCTION AUTOMATIQUE de l'état initial
#
# Problème résolu : l'état initial envoyé par le frontend est souvent
# l'état FINAL (plateau plein). Cette version reconstruit un état propre
# à partir de zéro en utilisant l'historique des coups.
#
# Changements clés :
#   1. reconstruire_etat_initial() : vide le plateau, réinitialise les puzzles,
#      reconstitue les mains/réserves depuis l'historique
#   2. Préparation de la main avant chaque coup d'analyse
#   3. Replay manuel robuste (ne dépend pas de jouer_tour)

import copy
import time
import random
from typing import Optional, List, Dict, Tuple, Any
from dataclasses import dataclass, field

from game_engine import (
    calculer_scores, EtatJeu, Joueur,
    action_poser_piece, action_passer_repiocher, action_scout,
    verifier_completion_puzzles,
)
from pieces_generator import (
    cellules_absolues, placement_valide, generer_piece,
    serialiser_piece, toutes_rotations, FORMES
)
from puzzle_generator import Puzzle


# ═══════════════════════════════════════════════════════════
# CONSTANTES
# ═══════════════════════════════════════════════════════════

CLASSE_ELMAAS     = "ELMAAS"
CLASSE_ELMAASYON  = "ELMAASYON"
CLASSE_MASSY      = "MASSY"
CLASSE_NOTMESSY   = "NOTMESSY"
CLASSE_MISSED     = "MISSED"
CLASSE_CHESS      = "CHESS"
CLASSE_BLUNDER    = "BLUNDER"

POIDS_CLASSIFICATION = {
    CLASSE_ELMAAS:    100,
    CLASSE_ELMAASYON:  92,
    CLASSE_MASSY:      85,
    CLASSE_NOTMESSY:   70,
    CLASSE_MISSED:     45,
    CLASSE_CHESS:      20,
    CLASSE_BLUNDER:     5,
}


# ═══════════════════════════════════════════════════════════
# STRUCTURES DE DONNEES
# ═══════════════════════════════════════════════════════════

@dataclass
class AnalyseCoup:
    index: int
    type_coup: str
    couleur: str
    numero_tour: int
    piece_index: Optional[int] = None
    piece_forme: Optional[str] = None
    piece_est_elmaas: bool = False
    origine: Optional[Tuple[int, int]] = None
    classification: str = CLASSE_NOTMESSY
    score_joue: float = 0.0
    score_optimal: float = 0.0
    ecart_relatif: float = 0.0
    rang: int = 1
    total_coups_possibles: int = 1
    puzzles_completes: List[int] = field(default_factory=list)
    gain_cellules: int = 0
    serie_apres: int = 0
    serie_avant: int = 0
    scores_avant: Dict[str, int] = field(default_factory=dict)
    scores_apres: Dict[str, int] = field(default_factory=dict)
    meilleur_alternative: Optional[dict] = None
    alternative_est_elmaas: bool = False
    plateau_avant: Optional[dict] = None
    plateau_apres: Optional[dict] = None
    valeur_positionnelle: float = 0.0
    valeur_tactique: float = 0.0
    valeur_strategique: float = 0.0

    def to_dict(self) -> dict:
        return {
            "index": self.index,
            "type_coup": self.type_coup,
            "couleur": self.couleur,
            "numero_tour": self.numero_tour,
            "piece_index": self.piece_index,
            "piece_forme": self.piece_forme,
            "piece_est_elmaas": self.piece_est_elmaas,
            "origine": list(self.origine) if self.origine else None,
            "classification": self.classification,
            "score_joue": round(self.score_joue, 2),
            "score_optimal": round(self.score_optimal, 2),
            "ecart_relatif": round(self.ecart_relatif, 3),
            "rang": self.rang,
            "total_coups_possibles": self.total_coups_possibles,
            "puzzles_completes": self.puzzles_completes,
            "gain_cellules": self.gain_cellules,
            "serie_avant": self.serie_avant,
            "serie_apres": self.serie_apres,
            "scores_avant": self.scores_avant,
            "scores_apres": self.scores_apres,
            "valeur_positionnelle": round(self.valeur_positionnelle, 2),
            "valeur_tactique": round(self.valeur_tactique, 2),
            "valeur_strategique": round(self.valeur_strategique, 2),
            "meilleur_alternative": self.meilleur_alternative,
            "alternative_est_elmaas": self.alternative_est_elmaas,
            "plateau_avant": self.plateau_avant,
            "plateau_apres": self.plateau_apres,
        }


@dataclass
class ResumeAnalyse:
    precision_pct: float = 0.0
    couleur_analysee: Optional[str] = None
    nb_coups_total: int = 0
    nb_coups_analyses: int = 0
    stats_classes: Dict[str, int] = field(default_factory=dict)
    tendance_debut: str = "stable"
    tendance_milieu: str = "stable"
    tendance_fin: str = "stable"
    meilleur_coup: Optional[dict] = None
    pire_coup: Optional[dict] = None
    coup_decisif: Optional[dict] = None
    nb_elmaas_joues: int = 0
    nb_elmaas_opportunites_manquees: int = 0
    efficacite_elmaas: float = 0.0
    serie_max_atteinte: int = 0
    nb_series_ratees: int = 0
    nb_pouvoirs_utilises: int = 0
    efficacite_pouvoirs: float = 0.0

    def to_dict(self) -> dict:
        return {
            "precision_pct": round(self.precision_pct, 1),
            "couleur_analysee": self.couleur_analysee,
            "nb_coups_total": self.nb_coups_total,
            "nb_coups_analyses": self.nb_coups_analyses,
            "stats_classes": self.stats_classes,
            "tendance_debut": self.tendance_debut,
            "tendance_milieu": self.tendance_milieu,
            "tendance_fin": self.tendance_fin,
            "meilleur_coup": self.meilleur_coup,
            "pire_coup": self.pire_coup,
            "coup_decisif": self.coup_decisif,
            "nb_elmaas_joues": self.nb_elmaas_joues,
            "nb_elmaas_opportunites_manquees": self.nb_elmaas_opportunites_manquees,
            "efficacite_elmaas": round(self.efficacite_elmaas, 1),
            "serie_max_atteinte": self.serie_max_atteinte,
            "nb_series_ratees": self.nb_series_ratees,
            "nb_pouvoirs_utilises": self.nb_pouvoirs_utilises,
            "efficacite_pouvoirs": round(self.efficacite_pouvoirs, 1),
        }


# ═══════════════════════════════════════════════════════════
# UTILITAIRES DE COMPARAISON
# ═══════════════════════════════════════════════════════════

def _normaliser_piece(piece: Optional[dict]) -> Optional[tuple]:
    if piece is None:
        return None
    cellules = piece.get("cellules", [])
    cellules_norm = tuple(sorted(
        tuple(c) if isinstance(c, (list, tuple)) else (c,) for c in cellules
    ))
    return (piece.get("forme"), cellules_norm, piece.get("enlevement", False))


def _trouver_index_piece(main: list, piece_data: dict) -> int:
    cible = _normaliser_piece(piece_data)
    if cible is None:
        return -1
    for i, p in enumerate(main):
        if _normaliser_piece(p) == cible:
            return i
    return -1


def _injecter_piece_robuste(joueur: Joueur, piece_data: dict, idx_souhaite: int) -> int:
    idx_actuel = _trouver_index_piece(joueur.main_active, piece_data)
    if idx_actuel >= 0:
        return idx_actuel
    if 0 <= idx_souhaite < len(joueur.main_active):
        joueur.main_active[idx_souhaite] = piece_data
        return idx_souhaite
    joueur.main_active.append(piece_data)
    return len(joueur.main_active) - 1


# ═══════════════════════════════════════════════════════════
# COPIE PROFONDE
# ═══════════════════════════════════════════════════════════

def copier_etat_manuel(etat: EtatJeu) -> EtatJeu:
    plateau_orig = etat.plateau
    pieces_copy = copy.deepcopy(dict(plateau_orig.pieces))
    puzzles_copy = copy.deepcopy(dict(plateau_orig.puzzles))
    cellules_libres_copy = set(plateau_orig.cellules_libres)
    cellules_actives_copy = set(plateau_orig.cellules_actives)
    grille_copy = plateau_orig.grille_bicolore.copy()

    from puzzle_generator import Plateau
    plateau_copy = Plateau(
        grille_bicolore=grille_copy,
        pieces=pieces_copy,
        puzzles=puzzles_copy,
        cellules_libres=cellules_libres_copy,
        cellules_actives=cellules_actives_copy,
    )

    def copier_joueur(j):
        from game_engine import Joueur
        return Joueur(
            id=j.id, couleur=j.couleur,
            main_active=list(j.main_active), reserve=list(j.reserve),
            pieces_protegees=set(j.pieces_protegees),
            serie_actuelle=j.serie_actuelle,
            score_puzzles=list(j.score_puzzles),
            nb_pieces_posees_depuis_regen=j.nb_pieces_posees_depuis_regen,
            seuil_regen_actuel=j.seuil_regen_actuel,
            puzzles_completes_depuis_regen=j.puzzles_completes_depuis_regen,
        )

    from game_engine import EtatJeu
    return EtatJeu(
        plateau=plateau_copy,
        joueur1=copier_joueur(etat.joueur1),
        joueur2=copier_joueur(etat.joueur2),
        tour_actuel=etat.tour_actuel,
        numero_tour=etat.numero_tour,
        manche_terminee=etat.manche_terminee,
        gagnant=etat.gagnant,
        victoire_immediate=etat.victoire_immediate,
        historique_actions=list(etat.historique_actions),
        piece_initiale_pos=etat.piece_initiale_pos,
        timestamp_debut_tour=etat.timestamp_debut_tour,
    )


# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
# RECONSTRUCTION DE L'ÉTAT INITIAL (SOLUTION CLÉ)
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════

def reconstruire_etat_initial(etat_final: EtatJeu, historique: list) -> Tuple[EtatJeu, Dict[str, list]]:
    """
    Reconstruit un état initial PROPRE à partir de l'état final.
    Le plateau est vidé, les puzzles réinitialisés, les mains reconstruites
    depuis l'historique des coups.

    Retourne : (etat_propre, dict des pièces par joueur)
    """
    etat = copier_etat_manuel(etat_final)
    taille = etat.plateau.grille_bicolore.shape[0]
    centre = taille // 2

    # 1. Sauvegarder la couleur de la pièce initiale (cellule centrale)
    cle_centre = f"{centre},{centre}"
    couleur_initiale = etat.plateau.pieces.get(cle_centre, "rouge")

    # 2. Vider le plateau
    etat.plateau.pieces = {}
    etat.plateau.cellules_actives = set()
    etat.plateau.cellules_libres = set(
        (r, c) for r in range(taille) for c in range(taille)
    )

    # 3. Remettre la pièce initiale au centre
    etat.plateau.pieces[cle_centre] = couleur_initiale
    etat.plateau.cellules_actives.add((centre, centre))
    etat.plateau.cellules_libres.discard((centre, centre))
    etat.piece_initiale_pos = (centre, centre)

    # 4. Réinitialiser les puzzles (tous incomplets)
    for puzzle in etat.plateau.puzzles.values():
        puzzle.complete_par = None
        puzzle.brise = False
        puzzle.protege = False

    # 5. Réinitialiser les séries et scores
    for joueur in [etat.joueur1, etat.joueur2]:
        joueur.serie_actuelle = 0
        joueur.score_puzzles = []
        joueur.nb_pieces_posees_depuis_regen = 0
        joueur.puzzles_completes_depuis_regen = 0

    # 6. Collecter les pièces jouées par chaque joueur (dans l'ordre chronologique)
    pieces_par_joueur: Dict[str, list] = {"rouge": [], "noir": []}
    for coup in historique:
        if coup.get("type") == "poser" and coup.get("piece_data"):
            couleur = coup.get("couleur", "")
            if couleur in pieces_par_joueur:
                pieces_par_joueur[couleur].append(coup["piece_data"])

    # 7. Distribuer les pièces : les 3 premières en main, le reste en réserve
    #    (approximation ; le repiocher n'est pas géré exactement)
    for joueur in [etat.joueur1, etat.joueur2]:
        pieces = pieces_par_joueur.get(joueur.couleur, [])
        joueur.main_active = pieces[:3]
        joueur.reserve = pieces[3:]

    # 8. Réinitialiser le tour et le numéro
    etat.tour_actuel = 0
    etat.numero_tour = 0
    etat.manche_terminee = False
    etat.gagnant = None
    etat.victoire_immediate = False

    nb_p = len([v for v in etat.plateau.pieces.values() if v is not None])
    print(f"[analyse] Reconstruction : {nb_p} pièces sur plateau | "
          f"J1 main={len(etat.joueur1.main_active)} res={len(etat.joueur1.reserve)} | "
          f"J2 main={len(etat.joueur2.main_active)} res={len(etat.joueur2.reserve)}")

    return etat, pieces_par_joueur


# ═══════════════════════════════════════════════════════════
# REPLAY MANUEL (n'utilise PAS jouer_tour)
# ═══════════════════════════════════════════════════════════

def _replay_poser(etat: EtatJeu, coup: dict) -> bool:
    """Replay manuel d'un coup 'poser'."""
    couleur = coup.get("couleur", "")
    if not couleur:
        return False

    joueur = etat.joueur1 if etat.joueur1.couleur == couleur else etat.joueur2
    piece_data = coup.get("piece_data")
    origine = tuple(coup.get("origine", [0, 0]))
    if not piece_data:
        return False

    # 1. Retirer la pièce de la main (ou réserve si pas en main)
    idx = _trouver_index_piece(joueur.main_active, piece_data)
    if idx >= 0:
        piece = joueur.main_active.pop(idx)
    else:
        idx_res = _trouver_index_piece(joueur.reserve, piece_data)
        if idx_res >= 0:
            piece = joueur.reserve.pop(idx_res)
        else:
            piece = piece_data  # Créer une pièce temporaire

    # 2. Placer sur le plateau
    try:
        absolues = cellules_absolues(piece, origine)
    except Exception:
        return False

    couleur_piece = "diamant" if piece.get("enlevement", False) else couleur
    for r, c in absolues:
        cle = f"{r},{c}"
        # Si déjà occupé, on écrase (fallback)
        etat.plateau.pieces[cle] = couleur_piece
        etat.plateau.cellules_actives.add((r, c))
        etat.plateau.cellules_libres.discard((r, c))

    # 3. Vérifier puzzles
    puzzles_completes = verifier_completion_puzzles(etat.plateau, joueur)
    if puzzles_completes:
        joueur.serie_actuelle += 1
        for p in puzzles_completes:
            joueur.score_puzzles.append(p.id)
    else:
        joueur.serie_actuelle = 0

    # 4. Piocher
    if joueur.reserve:
        nouvelle = joueur.reserve.pop()
        joueur.main_active.append(nouvelle)

    # 5. Passer le tour
    etat.tour_actuel = 1 - etat.tour_actuel
    etat.numero_tour += 1
    return True


def _replay_repiocher(etat: EtatJeu, coup: dict) -> bool:
    """Replay manuel d'un repiocher."""
    couleur = coup.get("couleur", "")
    if not couleur:
        return False
    joueur = etat.joueur1 if etat.joueur1.couleur == couleur else etat.joueur2

    pieces = joueur.main_active + joueur.reserve
    random.shuffle(pieces)
    joueur.main_active = pieces[:3]
    joueur.reserve = pieces[3:]

    etat.tour_actuel = 1 - etat.tour_actuel
    etat.numero_tour += 1
    return True


def _replay_scout(etat: EtatJeu, coup: dict) -> bool:
    """Replay manuel d'un scout."""
    couleur = coup.get("couleur", "")
    if not couleur:
        return False
    joueur = etat.joueur1 if etat.joueur1.couleur == couleur else etat.joueur2

    if joueur.reserve:
        nouvelle = joueur.reserve.pop()
        joueur.main_active.append(nouvelle)

    etat.tour_actuel = 1 - etat.tour_actuel
    etat.numero_tour += 1
    return True


def _avancer_etat(etat: EtatJeu, coup: dict) -> bool:
    """Routeur de replay."""
    ctype = coup.get("type", "")
    if ctype == "poser":
        return _replay_poser(etat, coup)
    elif ctype == "repiocher":
        return _replay_repiocher(etat, coup)
    elif ctype == "scout":
        return _replay_scout(etat, coup)
    return False


# ═══════════════════════════════════════════════════════════
# PRÉPARATION DE LA MAIN AVANT ANALYSE
# ═══════════════════════════════════════════════════════════

def _preparer_main_pour_coup(etat: EtatJeu, coup: dict, historique: list,
                              pieces_par_joueur: Dict[str, list]) -> None:
    """
    Prépare la main du joueur AVANT l'analyse d'un coup.
    La main contient les pièces que le joueur a à ce moment,
    basé sur l'ordre chronologique de l'historique.
    """
    couleur = coup.get("couleur", "")
    if not couleur:
        return

    joueur = etat.joueur1 if etat.joueur1.couleur == couleur else etat.joueur2
    pieces = pieces_par_joueur.get(couleur, [])

    # Compter combien de coups "poser" ce joueur a DÉJÀ joué
    idx_coup = -1
    nb_deja_joue = 0
    for i, c in enumerate(historique):
        if c.get("type") == "poser" and c.get("couleur") == couleur:
            if c is coup or (c.get("piece_data") == coup.get("piece_data") and
                             c.get("origine") == coup.get("origine")):
                idx_coup = i
                break
            nb_deja_joue += 1

    if idx_coup < 0:
        # Coup non trouvé dans l'historique : on le cherche par correspondance
        for i, c in enumerate(historique):
            if (c.get("type") == coup.get("type") and
                c.get("couleur") == couleur and
                c.get("origine") == coup.get("origine")):
                idx_coup = i
                # Recalculer nb_deja_joue
                nb_deja_joue = sum(1 for j in range(i)
                                   if historique[j].get("type") == "poser"
                                   and historique[j].get("couleur") == couleur)
                break

    # La main = les prochaines pièces disponibles
    # nb_deja_joue pièces ont déjà été jouées → elles sont sur le plateau
    # La main contient les pièces [nb_deja_joue : nb_deja_joue + 3]
    main = pieces[nb_deja_joue:nb_deja_joue + 5]
    reserve = pieces[:nb_deja_joue] + pieces[nb_deja_joue + 5:]

    joueur.main_active = list(main)
    joueur.reserve = list(reserve)

    # S'assurer que la pièce du coup actuel est dans la main
    piece_data = coup.get("piece_data")
    if piece_data:
        idx_piece = _trouver_index_piece(joueur.main_active, piece_data)
        if idx_piece < 0:
            # Pas trouvée : l'ajouter
            joueur.main_active.append(piece_data)


# ═══════════════════════════════════════════════════════════
# ÉVALUATION POSITIONNELLE
# ═══════════════════════════════════════════════════════════

def evaluer_position_complete(etat: EtatJeu, couleur_perspective: str) -> float:
    scores = calculer_scores(etat)
    couleur_adverse = "noir" if couleur_perspective == "rouge" else "rouge"
    score_total = 0.0

    cellules_moi = scores.get(couleur_perspective, 0)
    cellules_adv = scores.get(couleur_adverse, 0)
    score_total += (cellules_moi - cellules_adv) * 3.0

    nb_puzzles_moi = 0
    nb_puzzles_adv = 0

    for puzzle in etat.plateau.puzzles.values():
        if puzzle.brise:
            continue
        nb_total = len(puzzle.cellules)
        if nb_total == 0:
            continue

        if puzzle.complete_par == couleur_perspective:
            score_total += nb_total * 8.0
            nb_puzzles_moi += 1
            continue
        if puzzle.complete_par == couleur_adverse:
            score_total -= nb_total * 8.0
            nb_puzzles_adv += 1
            continue

        nb_moi, nb_adv, nb_vide, nb_diamant = 0, 0, 0, 0
        for r, c in puzzle.cellules:
            v = etat.plateau.pieces.get(f"{r},{c}")
            if v is None:
                nb_vide += 1
            elif v == couleur_perspective:
                nb_moi += 1
            elif v == couleur_adverse:
                nb_adv += 1
            elif v == "diamant":
                nb_diamant += 1

        if nb_diamant > 0 and puzzle.type_couleur in ("mono_rouge", "mono_noir"):
            score_total -= 1.0
            continue

        if nb_vide <= 2:
            if nb_moi > nb_adv:
                score_total += nb_total * 4.0 * (nb_moi / max(nb_moi + nb_adv, 1))
            elif nb_adv > nb_moi:
                score_total -= nb_total * 4.0 * (nb_adv / max(nb_moi + nb_adv, 1))

        if puzzle.type_couleur == "mono_rouge":
            gagnant_nat = "rouge"
            if gagnant_nat == couleur_perspective:
                score_total += nb_moi * 2.0 - nb_adv * 3.0
            else:
                score_total -= nb_adv * 2.0 - nb_moi * 3.0
        elif puzzle.type_couleur == "mono_noir":
            gagnant_nat = "noir"
            if gagnant_nat == couleur_perspective:
                score_total += nb_moi * 2.0 - nb_adv * 3.0
            else:
                score_total -= nb_adv * 2.0 - nb_moi * 3.0
        else:
            avance = nb_moi - nb_adv
            score_total += avance * 1.5 + (nb_moi + nb_adv) * 0.5

    joueur_moi = etat.joueur1 if etat.joueur1.couleur == couleur_perspective else etat.joueur2
    joueur_adv = etat.joueur2 if joueur_moi == etat.joueur1 else etat.joueur1

    score_total += joueur_moi.serie_actuelle * 5.0
    score_total -= joueur_adv.serie_actuelle * 4.0
    if joueur_moi.serie_actuelle >= 4:
        score_total += 25.0
    if joueur_adv.serie_actuelle >= 4:
        score_total -= 20.0

    score_total += len(joueur_moi.main_active) * 1.5
    score_total += len(joueur_moi.reserve) * 1.0
    score_total -= len(joueur_adv.main_active) * 1.2
    score_total -= len(joueur_adv.reserve) * 0.8

    if not joueur_moi.reserve and not joueur_moi.main_active:
        score_total -= 50.0 if nb_puzzles_moi == 0 else 15.0

    mobilite_moi = compter_mobilite(etat, joueur_moi)
    mobilite_adv = compter_mobilite(etat, joueur_adv)
    score_total += (mobilite_moi - mobilite_adv) * 0.3

    elmaas_moi = sum(1 for p in joueur_moi.main_active if p.get("enlevement"))
    elmaas_adv = sum(1 for p in joueur_adv.main_active if p.get("enlevement"))
    score_total += elmaas_moi * 3.0
    score_total -= elmaas_adv * 2.5

    return score_total


def compter_mobilite(etat: EtatJeu, joueur: Joueur) -> int:
    taille = etat.plateau.grille_bicolore.shape[0]
    total = 0
    for piece in joueur.main_active:
        for r in range(taille):
            for c in range(taille):
                valide, _ = placement_valide(piece, (r, c), etat.plateau.pieces, taille)
                if valide:
                    total += 1
    return total


# ═══════════════════════════════════════════════════════════
# LISTAGE DES COUPS
# ═══════════════════════════════════════════════════════════

def lister_coups_poser(etat: EtatJeu, joueur: Joueur) -> List[Tuple[int, Tuple[int, int]]]:
    coups = []
    taille = etat.plateau.grille_bicolore.shape[0]
    for idx, piece in enumerate(joueur.main_active):
        for r in range(taille):
            for c in range(taille):
                valide, _ = placement_valide(piece, (r, c), etat.plateau.pieces, taille)
                if valide:
                    coups.append((idx, (r, c)))
    return coups


def lister_coups_repiocher(etat: EtatJeu, joueur: Joueur) -> List[str]:
    if len(joueur.main_active) > 0 and len(joueur.reserve) > 0:
        return ["repiocher"]
    return []


def lister_coups_scout(etat: EtatJeu, joueur: Joueur) -> List[str]:
    from config import MIN_PIECES_SCOUT
    if len(joueur.main_active) > MIN_PIECES_SCOUT and len(joueur.reserve) > 0:
        return ["scout"]
    return []


def lister_tous_coups(etat: EtatJeu, joueur: Joueur) -> List[dict]:
    coups = []
    for idx, orig in lister_coups_poser(etat, joueur):
        piece = joueur.main_active[idx]
        coups.append({
            "type": "poser",
            "piece_index": idx,
            "origine": orig,
            "piece": piece,
            "est_elmaas": piece.get("enlevement", False),
        })
    if lister_coups_repiocher(etat, joueur):
        coups.append({"type": "repiocher"})
    if lister_coups_scout(etat, joueur):
        coups.append({"type": "scout"})
    return coups


# ═══════════════════════════════════════════════════════════
# SIMULATION POUR ÉVALUATION
# ═══════════════════════════════════════════════════════════

def simuler_coup(etat: EtatJeu, coup: dict) -> Tuple[Optional[EtatJeu], Optional[dict]]:
    etat_copie = copier_etat_manuel(etat)
    try:
        if coup["type"] == "poser":
            idx = coup["piece_index"]
            joueur = etat_copie.joueur_actif()
            if "piece_data" in coup:
                idx = _injecter_piece_robuste(joueur, coup["piece_data"], idx)
            if idx < 0 or idx >= len(joueur.main_active):
                return etat_copie, {"succes": False, "erreur": f"Index {idx} invalide"}
            resultat = action_poser_piece(etat_copie, idx, coup["origine"])
            if not resultat.get("attente_pouvoir") and not resultat.get("victoire_immediate"):
                etat_copie.passer_tour()
            return etat_copie, resultat
        elif coup["type"] == "repiocher":
            resultat = action_passer_repiocher(etat_copie)
            etat_copie.passer_tour()
            return etat_copie, resultat
        elif coup["type"] == "scout":
            resultat = action_scout(etat_copie)
            etat_copie.passer_tour()
            return etat_copie, resultat
        return None, None
    except Exception as e:
        print(f"[analyse] Erreur simulation: {e}")
        import traceback; traceback.print_exc()
        return None, None


def simuler_coup_pour_eval(etat: EtatJeu, coup: dict, couleur_perspective: str) -> float:
    etat_apres, resultat = simuler_coup(etat, coup)
    if etat_apres is None:
        return float("-inf")
    if resultat and resultat.get("victoire_immediate"):
        return 1000.0 if etat_apres.gagnant == couleur_perspective else -1000.0
    score = evaluer_position_complete(etat_apres, couleur_perspective)
    if resultat and resultat.get("puzzles_completes"):
        nb = len(resultat["puzzles_completes"])
        gain = sum(len(p.cellules) for p in resultat["puzzles_completes"])
        score += nb * 15.0 + gain * 2.0
    return score


# ═══════════════════════════════════════════════════════════
# ÉVALUATION DES COUPS
# ═══════════════════════════════════════════════════════════

def evaluer_coup_poser(etat_avant: EtatJeu, coup_joue: dict,
                        profondeur: int = 2, deadline: float = None) -> AnalyseCoup:
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    piece_idx_joue = coup_joue.get("piece_index", 0)
    origine_joue = tuple(coup_joue.get("origine", [0, 0]))

    piece_joue = coup_joue.get("piece_data")
    if piece_joue is None and piece_idx_joue < len(joueur.main_active):
        piece_joue = joueur.main_active[piece_idx_joue]
    est_elmaas = piece_joue.get("enlevement", False) if piece_joue else False
    piece_joue_norm = _normaliser_piece(piece_joue)

    scores_avant = calculer_scores(etat_avant)
    serie_avant = joueur.serie_actuelle
    plateau_avant_dict = copy.deepcopy(dict(etat_avant.plateau.pieces))

    etat_apres_joue, resultat_joue = simuler_coup(etat_avant, {
        "type": "poser",
        "piece_index": piece_idx_joue,
        "origine": origine_joue,
        "piece_data": piece_joue,
    })

    if etat_apres_joue is None:
        return AnalyseCoup(
            index=coup_joue.get("index", 0),
            type_coup="poser",
            couleur=couleur,
            numero_tour=etat_avant.numero_tour,
            piece_index=piece_idx_joue,
            piece_forme=piece_joue["forme"] if piece_joue else None,
            piece_est_elmaas=est_elmaas,
            origine=origine_joue,
            classification=CLASSE_BLUNDER,
            score_joue=-100.0,
            score_optimal=0.0,
            ecart_relatif=1.0,
            rang=999,
            total_coups_possibles=1,
            scores_avant=scores_avant,
            plateau_avant=plateau_avant_dict,
            plateau_apres=plateau_avant_dict,
        )

    plateau_apres_dict = copy.deepcopy(dict(etat_apres_joue.plateau.pieces))
    scores_apres_joue = calculer_scores(etat_apres_joue)
    joueur_apres = etat_apres_joue.joueur1 if etat_apres_joue.joueur1.couleur == couleur else etat_apres_joue.joueur2
    serie_apres_joue = joueur_apres.serie_actuelle

    # Alternatives
    etat_pour_alternatives = copier_etat_manuel(etat_avant)
    joueur_alt = etat_pour_alternatives.joueur_actif()
    if piece_joue is not None and piece_joue_norm is not None:
        idx_injecte = _trouver_index_piece(joueur_alt.main_active, piece_joue)
        if idx_injecte < 0:
            if piece_idx_joue < len(joueur_alt.main_active):
                joueur_alt.main_active[piece_idx_joue] = piece_joue
            else:
                joueur_alt.main_active.append(piece_joue)

    MAX_ALTERNATIVES = 15 if profondeur <= 1 else 25
    tous_coups = lister_tous_coups(etat_pour_alternatives, joueur_alt)

    evaluations = []
    for i, alt in enumerate(tous_coups):
        if deadline and time.time() > deadline:
            break
        if i >= MAX_ALTERNATIVES:
            break
        score = simuler_coup_pour_eval(etat_pour_alternatives, alt, couleur)
        evaluations.append({"coup": alt, "score": score, "est_elmaas": alt.get("est_elmaas", False)})

    evaluations.sort(key=lambda x: x["score"], reverse=True)

    # Identifier le coup joué par identité
    score_joue = None
    rang_joue = 0
    for i, ev in enumerate(evaluations):
        alt = ev["coup"]
        if alt["type"] == "poser":
            alt_piece = alt.get("piece")
            alt_orig = tuple(alt.get("origine", [0, 0]))
            alt_norm = _normaliser_piece(alt_piece)
            if (alt_norm is not None and piece_joue_norm is not None and
                alt_norm == piece_joue_norm and alt_orig == origine_joue):
                score_joue = ev["score"]
                rang_joue = i
                break

    if score_joue is None:
        score_joue = simuler_coup_pour_eval(etat_avant, {
            "type": "poser", "piece_index": piece_idx_joue,
            "origine": origine_joue, "piece_data": piece_joue,
        }, couleur)
        rang_joue = 0
        for i, ev in enumerate(evaluations):
            if score_joue >= ev["score"]:
                rang_joue = i
                break
        else:
            rang_joue = len(evaluations)

    score_optimal = evaluations[0]["score"] if evaluations else score_joue
    total_coups = len(evaluations)
    ecart = (score_optimal - score_joue) / abs(score_optimal) if score_optimal != 0 else (0.0 if score_joue == 0 else 1.0)

    puzzles_c = resultat_joue.get("puzzles_completes", []) if resultat_joue else []
    gain_cellules = sum(len(p.cellules) for p in puzzles_c) if puzzles_c else 0
    nb_puzzles = len(puzzles_c)

    classification = CLASSE_NOTMESSY
    if rang_joue == 0:
        if nb_puzzles >= 2 or (nb_puzzles >= 1 and gain_cellules >= 6) or serie_apres_joue >= 4:
            classification = CLASSE_ELMAAS
        elif nb_puzzles >= 1 and gain_cellules >= 3:
            classification = CLASSE_ELMAASYON
        else:
            classification = CLASSE_MASSY
    elif rang_joue < max(1, total_coups * 0.05):
        classification = CLASSE_MASSY if not (nb_puzzles >= 1 and gain_cellules >= 4) else CLASSE_ELMAASYON
    elif rang_joue < max(1, total_coups * 0.10):
        classification = CLASSE_MASSY
    elif rang_joue < max(1, total_coups * 0.25):
        classification = CLASSE_NOTMESSY
    elif ecart > 0.8:
        classification = CLASSE_BLUNDER
    elif ecart > 0.5:
        classification = CLASSE_CHESS
    else:
        classification = CLASSE_MISSED

    meilleur_alt = evaluations[0] if evaluations else None
    alt_est_elmaas = bool(meilleur_alt and meilleur_alt["coup"].get("est_elmaas"))

    return AnalyseCoup(
        index=coup_joue.get("index", 0),
        type_coup="poser",
        couleur=couleur,
        numero_tour=etat_avant.numero_tour,
        piece_index=piece_idx_joue,
        piece_forme=piece_joue["forme"] if piece_joue else None,
        piece_est_elmaas=est_elmaas,
        origine=origine_joue,
        classification=classification,
        score_joue=score_joue,
        score_optimal=score_optimal,
        ecart_relatif=ecart,
        rang=rang_joue + 1,
        total_coups_possibles=total_coups,
        puzzles_completes=[p.id for p in puzzles_c] if puzzles_c else [],
        gain_cellules=gain_cellules,
        serie_avant=serie_avant,
        serie_apres=serie_apres_joue,
        scores_avant=scores_avant,
        scores_apres=scores_apres_joue,
        valeur_positionnelle=evaluer_position_complete(etat_apres_joue, couleur),
        valeur_tactique=nb_puzzles * 10.0 + gain_cellules * 2.0 + (serie_apres_joue - serie_avant) * 5.0,
        valeur_strategique=evaluer_position_complete(etat_apres_joue, couleur) * 0.3,
        meilleur_alternative={
            "type": meilleur_alt["coup"]["type"] if meilleur_alt else None,
            "piece_index": meilleur_alt["coup"].get("piece_index") if meilleur_alt else None,
            "origine": list(meilleur_alt["coup"].get("origine", [])) if meilleur_alt else None,
            "est_elmaas": meilleur_alt["coup"].get("est_elmaas", False) if meilleur_alt else False,
            "score": round(meilleur_alt["score"], 2) if meilleur_alt else 0,
        } if meilleur_alt else None,
        alternative_est_elmaas=alt_est_elmaas,
        plateau_avant=plateau_avant_dict,
        plateau_apres=plateau_apres_dict,
    )


def evaluer_coup_repiocher(etat_avant: EtatJeu, coup_joue: dict) -> AnalyseCoup:
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    scores_avant = calculer_scores(etat_avant)

    etat_apres, resultat = simuler_coup(etat_avant, {"type": "repiocher"})
    if etat_apres is None:
        return AnalyseCoup(
            index=coup_joue.get("index", 0), type_coup="repiocher",
            couleur=couleur, numero_tour=etat_avant.numero_tour,
            classification=CLASSE_MISSED, score_joue=0.0,
            score_optimal=0.0, scores_avant=scores_avant,
        )

    scores_apres = calculer_scores(etat_apres)
    coups_poser = lister_coups_poser(etat_avant, joueur)

    if not coups_poser:
        classification = CLASSE_MASSY
        score_joue = 5.0
        score_optimal = 5.0
    else:
        meilleur_score_poser = float("-inf")
        for idx, orig in coups_poser[:10]:
            score = simuler_coup_pour_eval(etat_avant, {
                "type": "poser", "piece_index": idx, "origine": orig,
            }, couleur)
            meilleur_score_poser = max(meilleur_score_poser, score)
        score_repiocher = evaluer_position_complete(etat_apres, couleur)
        if score_repiocher >= meilleur_score_poser - 5.0:
            classification, score_joue, score_optimal = CLASSE_NOTMESSY, score_repiocher, meilleur_score_poser
        elif score_repiocher >= meilleur_score_poser - 15.0:
            classification, score_joue, score_optimal = CLASSE_MISSED, score_repiocher, meilleur_score_poser
        else:
            classification, score_joue, score_optimal = CLASSE_CHESS, score_repiocher, meilleur_score_poser

    ecart = (score_optimal - score_joue) / max(abs(score_optimal), 1.0) if score_optimal != 0 else 0.0
    plateau_avant = dict(etat_avant.plateau.pieces)
    plateau_apres = dict(etat_apres.plateau.pieces)
    return AnalyseCoup(
        index=coup_joue.get("index", 0), type_coup="repiocher",
        couleur=couleur, numero_tour=etat_avant.numero_tour,
        classification=classification, score_joue=score_joue,
        score_optimal=score_optimal, ecart_relatif=ecart,
        rang=1 if classification in (CLASSE_MASSY, CLASSE_NOTMESSY) else 2,
        total_coups_possibles=2 if coups_poser else 1,
        scores_avant=scores_avant, scores_apres=scores_apres,
        plateau_avant=plateau_avant, plateau_apres=plateau_apres,
    )


def evaluer_coup_scout(etat_avant: EtatJeu, coup_joue: dict) -> AnalyseCoup:
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    scores_avant = calculer_scores(etat_avant)

    etat_apres, resultat = simuler_coup(etat_avant, {"type": "scout"})
    if etat_apres is None:
        return AnalyseCoup(
            index=coup_joue.get("index", 0), type_coup="scout",
            couleur=couleur, numero_tour=etat_avant.numero_tour,
            classification=CLASSE_MISSED, score_joue=0.0,
            score_optimal=0.0, scores_avant=scores_avant,
        )

    scores_apres = calculer_scores(etat_apres)
    coups_poser = lister_coups_poser(etat_avant, joueur)
    main_avant = joueur.main_active
    joueur_apres = etat_apres.joueur1 if etat_apres.joueur1.couleur == couleur else etat_apres.joueur2
    main_apres = joueur_apres.main_active

    mobilite_avant = compter_mobilite(etat_avant, joueur)
    from game_engine import Joueur
    joueur_temp = Joueur(
        id=joueur.id, couleur=joueur.couleur,
        main_active=list(main_apres), reserve=list(joueur.reserve),
        pieces_protegees=set(joueur.pieces_protegees),
    )
    mobilite_apres = compter_mobilite(etat_avant, joueur_temp)

    score_joue = mobilite_apres * 0.5
    score_optimal = mobilite_avant * 0.5 if mobilite_avant > 0 else 5.0
    classification = CLASSE_NOTMESSY if (mobilite_apres > mobilite_avant and mobilite_avant < 10) or mobilite_avant < 20 else CLASSE_MISSED

    plateau_avant = dict(etat_avant.plateau.pieces)
    plateau_apres = dict(etat_apres.plateau.pieces)
    return AnalyseCoup(
        index=coup_joue.get("index", 0), type_coup="scout",
        couleur=couleur, numero_tour=etat_avant.numero_tour,
        classification=classification, score_joue=score_joue,
        score_optimal=score_optimal, ecart_relatif=0.2, rang=1,
        total_coups_possibles=3 if coups_poser else 1,
        scores_avant=scores_avant, scores_apres=scores_apres,
        plateau_avant=plateau_avant, plateau_apres=plateau_apres,
    )


# ═══════════════════════════════════════════════════════════
# ANALYSE COMPLÈTE (AVEC RECONSTRUCTION)
# ═══════════════════════════════════════════════════════════

def analyser_partie_complete(
    coups_historique: list,
    etat_initial: EtatJeu,
    couleur_joueur: Optional[str] = None,
    profondeur: int = 3,
    timeout_global: int = 30
) -> dict:
    deadline_global = time.time() + timeout_global

    # ═══════════════════════════════════════════════════════════
    # RECONSTRUCTION : créer un état initial propre
    # Même si etat_initial est l'état final, on le reconstruit
    # ═══════════════════════════════════════════════════════════
    etat, pieces_par_joueur = reconstruire_etat_initial(etat_initial, coups_historique)

    coups_analyses = []
    resume = ResumeAnalyse()
    resume.couleur_analysee = couleur_joueur
    resume.nb_coups_total = len(coups_historique)

    compteur_classes = {cls: 0 for cls in POIDS_CLASSIFICATION.keys()}
    nb_elmaas_joues = 0
    nb_elmaas_opportunites = 0
    serie_max = 0
    erreurs_consecutives = 0
    MAX_ERREURS = 5

    MAX_COUPS_ANALYSES = 50
    for i, coup in enumerate(coups_historique):
        if i >= MAX_COUPS_ANALYSES:
            break
        if time.time() > deadline_global:
            print(f"[analyse] Timeout global")
            break

        couleur_coup = coup.get("couleur", "")
        doit_analyser = (couleur_joueur is None or couleur_coup == couleur_joueur)

        # Synchronisation
        if couleur_coup:
            joueur_attendu = etat.joueur1 if etat.tour_actuel == 0 else etat.joueur2
            if joueur_attendu.couleur != couleur_coup:
                etat.tour_actuel = 1 - etat.tour_actuel

        joueur_actuel = etat.joueur1 if etat.joueur1.couleur == couleur_coup else etat.joueur2
        serie_max = max(serie_max, joueur_actuel.serie_actuelle)

        nb_pieces_avant = len([v for v in etat.plateau.pieces.values() if v is not None])
        coup_ok = False

        try:
            # ═══════════════════════════════════════════════════════════
            # PRÉPARER LA MAIN avant l'analyse (CLÉ pour les alternatives)
            # ═══════════════════════════════════════════════════════════
            if coup["type"] == "poser":
                _preparer_main_pour_coup(etat, coup, coups_historique, pieces_par_joueur)

            if coup["type"] == "poser" and doit_analyser:
                piece_idx = coup.get("piece_index", 0)
                est_elmaas_coup = False
                piece_data = coup.get("piece_data")
                if piece_data and piece_data.get("enlevement"):
                    est_elmaas_coup = True
                    nb_elmaas_joues += 1
                elif piece_idx < len(joueur_actuel.main_active):
                    if joueur_actuel.main_active[piece_idx].get("enlevement"):
                        est_elmaas_coup = True
                        nb_elmaas_joues += 1

                analyse = evaluer_coup_poser(
                    etat, {**coup, "index": i},
                    profondeur=profondeur, deadline=deadline_global
                )
                if analyse.alternative_est_elmaas and not est_elmaas_coup:
                    nb_elmaas_opportunites += 1
                coups_analyses.append(analyse)
                compteur_classes[analyse.classification] += 1
                erreurs_consecutives = 0

            elif coup["type"] == "repiocher" and doit_analyser:
                analyse = evaluer_coup_repiocher(etat, {**coup, "index": i})
                coups_analyses.append(analyse)
                compteur_classes[analyse.classification] += 1
                erreurs_consecutives = 0

            elif coup["type"] == "scout" and doit_analyser:
                analyse = evaluer_coup_scout(etat, {**coup, "index": i})
                coups_analyses.append(analyse)
                compteur_classes[analyse.classification] += 1
                erreurs_consecutives = 0

            # REPLAY MANUEL
            coup_ok = _avancer_etat(etat, coup)

            nb_pieces_apres = len([v for v in etat.plateau.pieces.values() if v is not None])
            if i < 10 or not coup_ok:
                print(f"[analyse] Coup {i:2d} | {couleur_coup:5s} | {coup['type']:8s} | "
                      f"{nb_pieces_avant:3d} → {nb_pieces_apres:3d} pièces | "
                      f"{'OK' if coup_ok else 'FAIL'}")

            if not coup_ok:
                erreurs_consecutives += 1
                if erreurs_consecutives >= MAX_ERREURS:
                    print("[analyse] Trop d'erreurs, arrêt.")
                    break
            else:
                erreurs_consecutives = 0

        except Exception as e:
            print(f"[analyse] ERREUR coup {i}: {e}")
            import traceback; traceback.print_exc()
            erreurs_consecutives += 1
            if erreurs_consecutives >= MAX_ERREURS:
                break
            continue

    # Résumé
    resume.serie_max_atteinte = serie_max
    resume.nb_elmaas_joues = nb_elmaas_joues
    resume.nb_elmaas_opportunites_manquees = nb_elmaas_opportunites
    resume.efficacite_elmaas = (nb_elmaas_joues / max(nb_elmaas_joues + nb_elmaas_opportunites, 1)) * 100

    tiers = max(len(coups_analyses) // 3, 1)
    if coups_analyses:
        def tendance(classes):
            score = sum(POIDS_CLASSIFICATION.get(c, 50) for c in classes) / max(len(classes), 1)
            return "fort" if score >= 85 else "stable" if score >= 60 else "faible"
        resume.tendance_debut = tendance([c.classification for c in coups_analyses[:tiers]])
        resume.tendance_milieu = tendance([c.classification for c in coups_analyses[tiers:2*tiers]])
        resume.tendance_fin = tendance([c.classification for c in coups_analyses[2*tiers:]])

    if coups_analyses:
        meilleurs = sorted(coups_analyses, key=lambda c: c.score_joue, reverse=True)
        resume.meilleur_coup = meilleurs[0].to_dict() if meilleurs else None
        resume.pire_coup = meilleurs[-1].to_dict() if meilleurs else None

    nb_analyses = sum(compteur_classes.values())
    precision = sum(POIDS_CLASSIFICATION.get(c, 50) * n for c, n in compteur_classes.items()) / nb_analyses if nb_analyses > 0 else 0.0

    resume.precision_pct = round(precision, 1)
    resume.nb_coups_analyses = nb_analyses
    resume.stats_classes = {k: v for k, v in compteur_classes.items() if v > 0}

    print(f"[analyse] TERMINÉ : {nb_analyses}/{len(coups_historique)} coups | Précision={precision:.1f}%")
    print(f"[analyse] Classes : {resume.stats_classes}")

    return {
        "coups": [c.to_dict() for c in coups_analyses],
        "stats": resume.stats_classes,
        "precision_pct": resume.precision_pct,
        "total_coups_analyses": resume.nb_coups_analyses,
        "resume": resume.to_dict(),
        "nb_coups_total": len(coups_historique),
    }


def formater_analyse_rapide(resultat_analyse: dict) -> str:
    resume = resultat_analyse.get("resume", {})
    lines = [
        "=" * 50,
        "  ANALYSE ELMAAS",
        "=" * 50,
        f"  Precision : {resultat_analyse.get('precision_pct', 0)}%",
        f"  Coups analyses : {resultat_analyse.get('total_coups_analyses', 0)}/{resultat_analyse.get('nb_coups_total', 0)}",
        "",
        "  Distribution :",
    ]
    for classe, nb in resultat_analyse.get("stats", {}).items():
        pct = nb / max(resultat_analyse.get('total_coups_analyses', 1), 1) * 100
        bar = "#" * int(pct / 5)
        lines.append(f"    {classe:12} : {nb:3} ({pct:5.1f}%) {bar}")
    lines.extend([
        "",
        f"  Tendance debut : {resume.get('tendance_debut', 'N/A')}",
        f"  Tendance milieu : {resume.get('tendance_milieu', 'N/A')}",
        f"  Tendance fin : {resume.get('tendance_fin', 'N/A')}",
        f"  Serie max : {resume.get('serie_max_atteinte', 0)}",
        f"  ELMAAS joues : {resume.get('nb_elmaas_joues', 0)}",
        "=" * 50,
    ])
    return "\n".join(lines)


if __name__ == "__main__":
    print("Module analyse_partie.py v6.0 chargé.")
    print("- Reconstruction automatique de l'état initial")
    print("- Replay manuel robuste")
    print("- Préparation des mains pour alternatives")
