# ELMAAS — analyse_partie.py v4.1 (corrigé)
# Analyse rigoureuse de partie : tous les coups des deux joueurs
# + Proposition du meilleur coup alternatif
# + Pas d'IA GM 2500+ dans l'analyse (analyse statique uniquement)
#
# CORRECTIONS v4.1 :
#   1. Identification du coup joué par identité de pièce (forme+cellules)
#      et non par piece_index qui change après repiocher/scout
#   2. Synchronisation forcée du tour_actuel lors du replay pour éviter
#      le déraillement quand un coup échoue

import copy
import time
import random
from typing import Optional, List, Dict, Tuple, Any
from dataclasses import dataclass, field

from game_engine import (
    jouer_tour, calculer_scores, EtatJeu, Joueur,
    action_poser_piece, action_passer_repiocher, action_scout,
    appliquer_pouvoir, appliquer_bonus_serie, recolorier_piece,
    determiner_gagnant_puzzle, verifier_completion_puzzles,
    SERIE_BONUS_EXTRACTION, SERIE_VICTOIRE_IMMEDIATE,
    NB_PIECES_EXTRACTION
)
from pieces_generator import (
    cellules_absolues, placement_valide, generer_piece,
    serialiser_piece, toutes_rotations, FORMES
)
from puzzle_generator import Puzzle


# ═══════════════════════════════════════════════════════════
# CONSTANTES DE CLASSIFICATION
# ═══════════════════════════════════════════════════════════

CLASSE_ELMAAS     = "ELMAAS"      # Coup brillant : gain maximal
CLASSE_ELMAASYON  = "ELMAASYON"   # Excellent : top 3
CLASSE_MASSY      = "MASSY"       # Tres bon : meilleur coup objectif
CLASSE_NOTMESSY   = "NOTMESSY"    # Bon : dans les 10% meilleurs
CLASSE_MISSED     = "MISSED"      # Moyen : opportunite manquee visible
CLASSE_CHESS      = "CHESS"       # Faible : erreur significative
CLASSE_BLUNDER    = "BLUNDER"     # Grosse erreur

POIDS_CLASSIFICATION = {
    CLASSE_ELMAAS:    100,
    CLASSE_ELMAASYON:  92,
    CLASSE_MASSY:      85,
    CLASSE_NOTMESSY:   70,
    CLASSE_MISSED:     45,
    CLASSE_CHESS:      20,
    CLASSE_BLUNDER:     5,
}

SEUIL_ELMAAS    = 0.95
SEUIL_ELMAASYON = 0.90
SEUIL_MASSY     = 0.85
SEUIL_NOTMESSY  = 0.70
SEUIL_MISSED    = 0.50
SEUIL_CHESS     = 0.20


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
# COPIE MANUELLE D'ETAT (evite deepcopy RecursionError)
# ═══════════════════════════════════════════════════════════

def copier_etat_manuel(etat: EtatJeu) -> EtatJeu:
    """Copie manuelle d'EtatJeu sans deepcopy (evite RecursionError)."""
    plateau_orig = etat.plateau

    # Copie PROFONDE des pieces (dict de strings)
    pieces_copy = copy.deepcopy(dict(plateau_orig.pieces))

    # Garder les memes puzzles (read-only pendant la simulation)
    puzzles_copy = dict(plateau_orig.puzzles)

    # Copier les sets
    cellules_libres_copy = set(plateau_orig.cellules_libres)
    cellules_actives_copy = set(plateau_orig.cellules_actives)

    # Copier la grille numpy
    grille_copy = plateau_orig.grille_bicolore.copy()

    # Reconstruire le plateau
    from puzzle_generator import Plateau
    plateau_copy = Plateau(
        grille_bicolore=grille_copy,
        pieces=pieces_copy,
        puzzles=puzzles_copy,
        cellules_libres=cellules_libres_copy,
        cellules_actives=cellules_actives_copy,
    )

    # Copier les joueurs
    def copier_joueur(j):
        from game_engine import Joueur
        return Joueur(
            id=j.id,
            couleur=j.couleur,
            main_active=list(j.main_active),
            reserve=list(j.reserve),
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
# EVALUATION POSITIONNELLE
# ═══════════════════════════════════════════════════════════

def evaluer_position_complete(etat: EtatJeu, couleur_perspective: str) -> float:
    """Evaluation complete d'une position pour couleur_perspective."""
    scores = calculer_scores(etat)
    couleur_adverse = "noir" if couleur_perspective == "rouge" else "rouge"

    score_total = 0.0

    # 1. DIFFERENTIEL DE CELLULES
    cellules_moi = scores.get(couleur_perspective, 0)
    cellules_adv = scores.get(couleur_adverse, 0)
    score_total += (cellules_moi - cellules_adv) * 3.0

    # 2. PUZZLES COMPLETES ET PROGRESSION
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

        # Analyse cellule par cellule
        nb_moi = 0
        nb_adv = 0
        nb_vide = 0
        nb_diamant = 0

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

        # Puzzle bloque par diamant
        if nb_diamant > 0 and puzzle.type_couleur in ("mono_rouge", "mono_noir"):
            score_total -= 1.0
            continue

        # Quasi-complet
        if nb_vide <= 2:
            if nb_moi > nb_adv:
                score_total += nb_total * 4.0 * (nb_moi / max(nb_moi + nb_adv, 1))
            elif nb_adv > nb_moi:
                score_total -= nb_total * 4.0 * (nb_adv / max(nb_moi + nb_adv, 1))

        # Progression generale
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
        else:  # mixte
            avance = nb_moi - nb_adv
            score_total += avance * 1.5 + (nb_moi + nb_adv) * 0.5

    # 3. SERIES
    joueur_moi = etat.joueur1 if etat.joueur1.couleur == couleur_perspective else etat.joueur2
    joueur_adv = etat.joueur2 if joueur_moi == etat.joueur1 else etat.joueur1

    score_total += joueur_moi.serie_actuelle * 5.0
    score_total -= joueur_adv.serie_actuelle * 4.0

    if joueur_moi.serie_actuelle >= 4:
        score_total += 25.0
    if joueur_adv.serie_actuelle >= 4:
        score_total -= 20.0

    # 4. MATERIEL
    score_total += len(joueur_moi.main_active) * 1.5
    score_total += len(joueur_moi.reserve) * 1.0
    score_total -= len(joueur_adv.main_active) * 1.2
    score_total -= len(joueur_adv.reserve) * 0.8

    # Danger: plus de pieces et aucun puzzle
    if not joueur_moi.reserve and not joueur_moi.main_active:
        if nb_puzzles_moi == 0:
            score_total -= 50.0
        else:
            score_total -= 15.0

    # 5. MOBILITE
    mobilite_moi = compter_mobilite(etat, joueur_moi)
    mobilite_adv = compter_mobilite(etat, joueur_adv)
    score_total += (mobilite_moi - mobilite_adv) * 0.3

    # 6. ELMAAS EN MAIN
    elmaas_moi = sum(1 for p in joueur_moi.main_active if p.get("enlevement"))
    elmaas_adv = sum(1 for p in joueur_adv.main_active if p.get("enlevement"))
    score_total += elmaas_moi * 3.0
    score_total -= elmaas_adv * 2.5

    return score_total


def compter_mobilite(etat: EtatJeu, joueur: Joueur) -> int:
    """Compte le nombre de placements legaux pour toutes les pieces en main."""
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
# LISTAGE DES COUPS POSSIBLES
# ═══════════════════════════════════════════════════════════

def lister_coups_poser(etat: EtatJeu, joueur: Joueur) -> List[Tuple[int, Tuple[int, int]]]:
    """Tous les coups 'poser' legaux."""
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
    """Repiocher possible si on a des pieces en main et en reserve."""
    if len(joueur.main_active) > 0 and len(joueur.reserve) > 0:
        return ["repiocher"]
    return []


def lister_coups_scout(etat: EtatJeu, joueur: Joueur) -> List[str]:
    """Scout possible si main assez grande et reserve non vide."""
    from config import MIN_PIECES_SCOUT
    if len(joueur.main_active) > MIN_PIECES_SCOUT and len(joueur.reserve) > 0:
        return ["scout"]
    return []


def lister_tous_coups(etat: EtatJeu, joueur: Joueur) -> List[dict]:
    """Liste TOUTES les actions possibles pour un joueur."""
    coups = []

    # 1. Coups poser
    for idx, orig in lister_coups_poser(etat, joueur):
        piece = joueur.main_active[idx]
        coups.append({
            "type": "poser",
            "piece_index": idx,
            "origine": orig,
            "piece": piece,
            "est_elmaas": piece.get("enlevement", False),
        })

    # 2. Repiocher
    if lister_coups_repiocher(etat, joueur):
        coups.append({"type": "repiocher"})

    # 3. Scout
    if lister_coups_scout(etat, joueur):
        coups.append({"type": "scout"})

    return coups


# ═══════════════════════════════════════════════════════════
# UTILITAIRE : normaliser une pièce pour comparaison
# ═══════════════════════════════════════════════════════════

def _normaliser_piece(piece: Optional[dict]) -> Optional[tuple]:
    """Retourne un tuple unique identifiant une pièce par sa forme et ses cellules."""
    if piece is None:
        return None
    cellules = piece.get("cellules", [])
    # Normaliser : trier les cellules, convertir en tuples
    cellules_norm = tuple(sorted(tuple(c) if not isinstance(c, tuple) else c for c in cellules))
    return (piece.get("forme"), cellules_norm, piece.get("enlevement", False))


# ═══════════════════════════════════════════════════════════
# SIMULATION DE COUPS (avec copie manuelle)
# ═══════════════════════════════════════════════════════════

def simuler_coup(etat: EtatJeu, coup: dict) -> Tuple[Optional[EtatJeu], Optional[dict]]:
    """Simule un coup et retourne (nouvel_etat, resultat_action)."""
    etat_copie = copier_etat_manuel(etat)

    try:
        if coup["type"] == "poser":
            # Si piece_data fourni (historique exact), injecter temporairement
            if "piece_data" in coup:
                idx = coup["piece_index"]
                joueur = etat_copie.joueur_actif()
                if 0 <= idx < len(joueur.main_active):
                    joueur.main_active[idx] = coup["piece_data"]
            resultat = action_poser_piece(
                etat_copie,
                coup["piece_index"],
                coup["origine"]
            )
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

        else:
            return None, None

    except Exception as e:
        print(f"[analyse] Erreur simulation: {e}")
        return None, None


def simuler_coup_pour_eval(etat: EtatJeu, coup: dict, couleur_perspective: str) -> float:
    """Simule un coup et retourne l'evaluation de la position resultante."""
    etat_apres, resultat = simuler_coup(etat, coup)
    if etat_apres is None:
        return float("-inf")

    # Victoire immediate
    if resultat and resultat.get("victoire_immediate"):
        gagnant = etat_apres.gagnant
        if gagnant == couleur_perspective:
            return 1000.0
        else:
            return -1000.0

    # Evaluation standard
    score = evaluer_position_complete(etat_apres, couleur_perspective)

    # Bonus pour puzzles completes
    if resultat and resultat.get("puzzles_completes"):
        nb_puzzles = len(resultat["puzzles_completes"])
        gain_cellules = sum(len(p.cellules) for p in resultat["puzzles_completes"])
        score += nb_puzzles * 15.0 + gain_cellules * 2.0

    return score


# ═══════════════════════════════════════════════════════════
# EVALUATION PAR TYPE DE COUP
# ═══════════════════════════════════════════════════════════

def evaluer_coup_poser(etat_avant: EtatJeu, coup_joue: dict, 
                        profondeur: int = 2, deadline: float = None) -> AnalyseCoup:
    """Evaluation rigoureuse d'un coup 'poser'."""
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur

    piece_idx_joue = coup_joue.get("piece_index", 0)
    origine_joue = tuple(coup_joue.get("origine", [0, 0]))

    # Utiliser piece_data si disponible (historique exact), sinon fallback sur main_active
    piece_joue = coup_joue.get("piece_data")
    if piece_joue is None and piece_idx_joue < len(joueur.main_active):
        piece_joue = joueur.main_active[piece_idx_joue]
    est_elmaas = piece_joue.get("enlevement", False) if piece_joue else False

    # Normaliser la pièce jouée pour comparaison par identité
    piece_joue_norm = _normaliser_piece(piece_joue)

    scores_avant = calculer_scores(etat_avant)
    serie_avant = joueur.serie_actuelle

    # CAPTURER plateau AVANT (copie profonde pour éviter mutation)
    plateau_avant_dict = copy.deepcopy(dict(etat_avant.plateau.pieces))

    # Simuler le coup joue avec piece_data exacte
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
            plateau_apres=plateau_avant_dict,  # fallback identique si erreur
        )

    # CAPTURER plateau APRÈS (copie profonde)
    plateau_apres_dict = copy.deepcopy(dict(etat_apres_joue.plateau.pieces))

    scores_apres_joue = calculer_scores(etat_apres_joue)

    # Determiner serie_apres (du joueur qui a joue)
    joueur_apres = etat_apres_joue.joueur1 if etat_apres_joue.joueur1.couleur == couleur else etat_apres_joue.joueur2
    serie_apres_joue = joueur_apres.serie_actuelle

    # ═══════════════════════════════════════════════════════════
    # CORRECTION v4.1 : Identifier le coup joué par pièce exacte
    # ═══════════════════════════════════════════════════════════
    #
    # Problème : après repiocher/scout, piece_index change. On doit comparer
    # par la forme+cellules de la pièce, pas par son index dans la main.
    #
    # 1. Créer une copie avec la pièce exacte injectée pour que lister_tous_coups
    #    la trouve correctement
    # 2. Chercher le coup joué dans les alternatives par _normaliser_piece()

    # Pour l'évaluation des alternatives, créer une copie avec la pièce exacte
    etat_pour_alternatives = copier_etat_manuel(etat_avant)
    joueur_alt = etat_pour_alternatives.joueur_actif()

    # S'assurer que la pièce exacte du coup joué est dans la main pour
    # que lister_tous_coups puisse l'évaluer comme alternative
    if piece_joue is not None and piece_joue_norm is not None:
        # Chercher si la pièce exacte est déjà dans la main
        piece_trouvee_idx = -1
        for i, p in enumerate(joueur_alt.main_active):
            if _normaliser_piece(p) == piece_joue_norm:
                piece_trouvee_idx = i
                break
        if piece_trouvee_idx < 0 and piece_idx_joue < len(joueur_alt.main_active):
            # Remplacer temporairement la pièce à l'index historique
            # (la copie etat_pour_alternatives est indépendante)
            joueur_alt.main_active[piece_idx_joue] = piece_joue

    # Generer toutes les alternatives — LIMITE selon profondeur
    MAX_ALTERNATIVES = 15 if profondeur <= 1 else 25
    tous_coups = lister_tous_coups(etat_pour_alternatives, joueur_alt)

    # Evaluer chaque alternative
    evaluations = []
    for i, alt in enumerate(tous_coups):
        if deadline and time.time() > deadline:
            break
        if i >= MAX_ALTERNATIVES:
            break

        score = simuler_coup_pour_eval(etat_pour_alternatives, alt, couleur)
        evaluations.append({
            "coup": alt,
            "score": score,
            "est_elmaas": alt.get("est_elmaas", False),
        })

    # Trier par score decroissant
    evaluations.sort(key=lambda x: x["score"], reverse=True)

    # ═══════════════════════════════════════════════════════════
    # CORRECTION v4.1 : Trouver le coup joué par identité de pièce
    # ═══════════════════════════════════════════════════════════
    # Comparer par _normaliser_piece() + origine, PAS par piece_index
    score_joue = None
    rang_joue = 0
    for i, ev in enumerate(evaluations):
        alt = ev["coup"]
        if alt["type"] == "poser":
            alt_piece = alt.get("piece")
            alt_orig = tuple(alt.get("origine", [0, 0]))
            alt_norm = _normaliser_piece(alt_piece)

            # Comparer par pièce exacte (forme + cellules) ET origine
            if (alt_norm is not None and piece_joue_norm is not None and
                alt_norm == piece_joue_norm and
                alt_orig == origine_joue):
                score_joue = ev["score"]
                rang_joue = i
                break

    # Fallback : si toujours pas trouvé (la pièce n'était pas dans les alternatives
    # car elle n'est plus jouable à cette origine dans l'état actuel), utiliser
    # le score du coup joué simulé précédemment
    if score_joue is None:
        # Évaluer le coup joué directement via simuler_coup_pour_eval
        score_joue = simuler_coup_pour_eval(etat_avant, {
            "type": "poser",
            "piece_index": piece_idx_joue,
            "origine": origine_joue,
            "piece_data": piece_joue,
        }, couleur)
        # Le rang est estimé : insérer dans la liste triée
        rang_joue = 0
        for i, ev in enumerate(evaluations):
            if score_joue >= ev["score"]:
                rang_joue = i
                break
        else:
            rang_joue = len(evaluations)

    score_optimal = evaluations[0]["score"] if evaluations else score_joue
    total_coups = len(evaluations)

    # Ecart relatif
    if score_optimal != 0:
        ecart = (score_optimal - score_joue) / abs(score_optimal)
    else:
        ecart = 0.0 if score_joue == 0 else 1.0

    # Classification
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
        if nb_puzzles >= 1 and gain_cellules >= 4:
            classification = CLASSE_ELMAASYON
        else:
            classification = CLASSE_MASSY
    elif rang_joue < max(1, total_coups * 0.10):
        classification = CLASSE_MASSY
    elif rang_joue < max(1, total_coups * 0.25):
        classification = CLASSE_NOTMESSY
    elif ecart > 0.5:
        classification = CLASSE_CHESS
    elif ecart > 0.8:
        classification = CLASSE_BLUNDER
    else:
        classification = CLASSE_MISSED

    # Meilleure alternative
    meilleur_alt = evaluations[0] if evaluations else None
    alt_est_elmaas = False
    if meilleur_alt and meilleur_alt["coup"].get("est_elmaas"):
        alt_est_elmaas = True

    # Valeurs decomposees
    val_pos = evaluer_position_complete(etat_apres_joue, couleur)
    val_tac = nb_puzzles * 10.0 + gain_cellules * 2.0 + (serie_apres_joue - serie_avant) * 5.0
    val_strat = val_pos * 0.3

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
        valeur_positionnelle=val_pos,
        valeur_tactique=val_tac,
        valeur_strategique=val_strat,
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
    """Evalue un coup 'repiocher'."""
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    scores_avant = calculer_scores(etat_avant)

    etat_apres, resultat = simuler_coup(etat_avant, {"type": "repiocher"})

    if etat_apres is None:
        return AnalyseCoup(
            index=coup_joue.get("index", 0),
            type_coup="repiocher",
            couleur=couleur,
            numero_tour=etat_avant.numero_tour,
            classification=CLASSE_MISSED,
            score_joue=0.0,
            score_optimal=0.0,
            scores_avant=scores_avant,
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
                "type": "poser",
                "piece_index": idx,
                "origine": orig,
            }, couleur)
            meilleur_score_poser = max(meilleur_score_poser, score)

        score_repiocher = evaluer_position_complete(etat_apres, couleur)

        if score_repiocher >= meilleur_score_poser - 5.0:
            classification = CLASSE_NOTMESSY
            score_joue = score_repiocher
            score_optimal = meilleur_score_poser
        elif score_repiocher >= meilleur_score_poser - 15.0:
            classification = CLASSE_MISSED
            score_joue = score_repiocher
            score_optimal = meilleur_score_poser
        else:
            classification = CLASSE_CHESS
            score_joue = score_repiocher
            score_optimal = meilleur_score_poser

    ecart = (score_optimal - score_joue) / max(abs(score_optimal), 1.0) if score_optimal != 0 else 0.0

    plateau_avant = dict(etat_avant.plateau.pieces) if etat_avant else None
    plateau_apres = dict(etat_apres.plateau.pieces) if etat_apres else None
    return AnalyseCoup(
        index=coup_joue.get("index", 0),
        type_coup="repiocher",
        couleur=couleur,
        numero_tour=etat_avant.numero_tour,
        classification=classification,
        score_joue=score_joue,
        score_optimal=score_optimal,
        ecart_relatif=ecart,
        rang=1 if classification in (CLASSE_MASSY, CLASSE_NOTMESSY) else 2,
        total_coups_possibles=2 if coups_poser else 1,
        scores_avant=scores_avant,
        scores_apres=scores_apres,
        plateau_avant=plateau_avant,
        plateau_apres=plateau_apres,
    )


def evaluer_coup_scout(etat_avant: EtatJeu, coup_joue: dict) -> AnalyseCoup:
    """Evalue un coup 'scout'."""
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    scores_avant = calculer_scores(etat_avant)

    etat_apres, resultat = simuler_coup(etat_avant, {"type": "scout"})

    if etat_apres is None:
        return AnalyseCoup(
            index=coup_joue.get("index", 0),
            type_coup="scout",
            couleur=couleur,
            numero_tour=etat_avant.numero_tour,
            classification=CLASSE_MISSED,
            score_joue=0.0,
            score_optimal=0.0,
            scores_avant=scores_avant,
        )

    scores_apres = calculer_scores(etat_apres)
    coups_poser = lister_coups_poser(etat_avant, joueur)

    # Evaluer si le scout ameliore la main
    main_avant = joueur.main_active
    joueur_apres = etat_apres.joueur1 if etat_apres.joueur1.couleur == couleur else etat_apres.joueur2
    main_apres = joueur_apres.main_active

    mobilite_avant = compter_mobilite(etat_avant, joueur)

    # Creer joueur temporaire avec nouvelle main
    from game_engine import Joueur
    joueur_temp = Joueur(
        id=joueur.id,
        couleur=joueur.couleur,
        main_active=list(main_apres),
        reserve=list(joueur.reserve),
        pieces_protegees=set(joueur.pieces_protegees),
    )
    mobilite_apres = compter_mobilite(etat_avant, joueur_temp)

    score_joue = mobilite_apres * 0.5
    score_optimal = mobilite_avant * 0.5 if mobilite_avant > 0 else 5.0

    if mobilite_apres > mobilite_avant and mobilite_avant < 10:
        classification = CLASSE_NOTMESSY
    elif mobilite_avant >= 20:
        classification = CLASSE_MISSED
    else:
        classification = CLASSE_NOTMESSY

    plateau_avant = dict(etat_avant.plateau.pieces) if etat_avant else None
    plateau_apres = dict(etat_apres.plateau.pieces) if etat_apres else None
    return AnalyseCoup(
        index=coup_joue.get("index", 0),
        type_coup="scout",
        couleur=couleur,
        numero_tour=etat_avant.numero_tour,
        classification=classification,
        score_joue=score_joue,
        score_optimal=score_optimal,
        ecart_relatif=0.2,
        rang=1,
        total_coups_possibles=3 if coups_poser else 1,
        scores_avant=scores_avant,
        scores_apres=scores_apres,
        plateau_avant=plateau_avant,
        plateau_apres=plateau_apres,
    )


# ═══════════════════════════════════════════════════════════
# FONCTION PRINCIPALE D'ANALYSE
# ═══════════════════════════════════════════════════════════

def analyser_partie_complete(
    coups_historique: list,
    etat_initial: EtatJeu,
    couleur_joueur: Optional[str] = None,
    profondeur: int = 3,
    timeout_global: int = 30
) -> dict:
    """
    Analyse complete d'une partie.

    Args:
        coups_historique: Liste des coups joues
        etat_initial: Etat initial de la partie
        couleur_joueur: "rouge", "noir", ou None pour les deux
        profondeur: 1=rapide, 2=moyen, 3=profond
        timeout_global: Timeout en secondes

    Returns:
        dict avec coups analyses, stats, resume, precision
    """
    deadline_global = time.time() + timeout_global

    etat = copier_etat_manuel(etat_initial)
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
            print(f"[analyse] Timeout global — {len(coups_analyses)}/{len(coups_historique)} coups analyses")
            break

        couleur_coup = coup.get("couleur", "")
        doit_analyser = (couleur_joueur is None or couleur_coup == couleur_joueur)

        # ═══════════════════════════════════════════════════════════
        # CORRECTION v4.1 : Synchroniser tour_actuel avec la couleur
        # ═══════════════════════════════════════════════════════════
        # Forcer le tour_actuel pour que le bon joueur soit actif AVANT
        # d'analyser ou de rejouer le coup. Cela évite le déraillement
        # quand un coup précédent a échoué silencieusement.
        if couleur_coup:
            joueur_attendu = etat.joueur1 if etat.tour_actuel == 0 else etat.joueur2
            if joueur_attendu.couleur != couleur_coup:
                # Désynchronisation détectée : forcer le basculement
                etat.tour_actuel = 1 - etat.tour_actuel
                joueur_attendu = etat.joueur1 if etat.tour_actuel == 0 else etat.joueur2

        joueur_actuel = etat.joueur1 if etat.joueur1.couleur == couleur_coup else etat.joueur2
        serie_max = max(serie_max, joueur_actuel.serie_actuelle)

        try:
            if coup["type"] == "poser" and doit_analyser:
                # Verifier si ELMAAS
                piece_idx = coup.get("piece_index", 0)
                est_elmaas_coup = False
                # CORRECTION : chercher par piece_data si disponible
                piece_data = coup.get("piece_data")
                if piece_data and piece_data.get("enlevement"):
                    est_elmaas_coup = True
                    nb_elmaas_joues += 1
                elif piece_idx < len(joueur_actuel.main_active):
                    if joueur_actuel.main_active[piece_idx].get("enlevement"):
                        est_elmaas_coup = True
                        nb_elmaas_joues += 1

                analyse = evaluer_coup_poser(
                    etat,
                    {**coup, "index": i},
                    profondeur=profondeur,
                    deadline=deadline_global
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

            # REJOUER le coup pour avancer l'etat (TOUJOURS)
            # ═══════════════════════════════════════════════════════════
            # CORRECTION v4.1 : Replay robuste avec fallback
            # ═══════════════════════════════════════════════════════════
            coup_reussi = False
            if coup["type"] == "poser":
                piece_data = coup.get("piece_data")
                idx_replay = coup.get("piece_index", 0)

                # Essayer de trouver l'index actuel de la pièce par piece_data
                if piece_data:
                    piece_data_norm = _normaliser_piece(piece_data)
                    idx_trouve = -1
                    for idx_main, p in enumerate(joueur_actuel.main_active):
                        if _normaliser_piece(p) == piece_data_norm:
                            idx_trouve = idx_main
                            break
                    if idx_trouve >= 0:
                        idx_replay = idx_trouve
                    else:
                        # Pièce non trouvée : injecter temporairement
                        if idx_replay < len(joueur_actuel.main_active):
                            joueur_actuel.main_active[idx_replay] = piece_data
                        else:
                            joueur_actuel.main_active.append(piece_data)
                            idx_replay = len(joueur_actuel.main_active) - 1

                res = jouer_tour(etat, "poser", piece_index=idx_replay,
                          origine=tuple(coup.get("origine", [0, 0])),
                          pouvoir=coup.get("pouvoir", "rien"))
                coup_reussi = res.get("succes", False)

            elif coup["type"] == "repiocher":
                res = jouer_tour(etat, "repiocher")
                coup_reussi = res.get("succes", False)

            elif coup["type"] == "scout":
                res = jouer_tour(etat, "scout")
                coup_reussi = res.get("succes", False)

            # Si le coup a échoué, forcer le passage de tour pour rester
            # synchronisé avec l'historique
            if not coup_reussi and coup["type"] in ("poser", "repiocher", "scout"):
                print(f"[analyse] Coup {i} ({coup['type']}) échoué, passage de tour forcé")
                etat.tour_actuel = 1 - etat.tour_actuel
                etat.numero_tour += 1

            erreurs_consecutives = 0

        except Exception as e:
            print(f"[analyse] Erreur coup {i} ({coup.get('type')}): {e}")
            erreurs_consecutives += 1
            if erreurs_consecutives >= MAX_ERREURS:
                print("[analyse] Trop d'erreurs consecutives, arret.")
                break
            continue

    # Calculer les tendances
    resume.serie_max_atteinte = serie_max
    resume.nb_elmaas_joues = nb_elmaas_joues
    resume.nb_elmaas_opportunites_manquees = nb_elmaas_opportunites
    resume.efficacite_elmaas = (nb_elmaas_joues / max(nb_elmaas_joues + nb_elmaas_opportunites, 1)) * 100

    tiers = max(len(coups_analyses) // 3, 1)
    if coups_analyses:
        debut = [c.classification for c in coups_analyses[:tiers]]
        milieu = [c.classification for c in coups_analyses[tiers:2*tiers]]
        fin = [c.classification for c in coups_analyses[2*tiers:]]

        def tendance(classes):
            score = sum(POIDS_CLASSIFICATION.get(c, 50) for c in classes) / max(len(classes), 1)
            if score >= 85: return "fort"
            if score >= 60: return "stable"
            return "faible"

        resume.tendance_debut = tendance(debut)
        resume.tendance_milieu = tendance(milieu)
        resume.tendance_fin = tendance(fin)

    # Meilleur et pire coup
    if coups_analyses:
        meilleurs = sorted(coups_analyses, key=lambda c: c.score_joue, reverse=True)
        resume.meilleur_coup = meilleurs[0].to_dict() if meilleurs else None
        resume.pire_coup = meilleurs[-1].to_dict() if meilleurs else None

        decisifs = sorted(coups_analyses,
                         key=lambda c: c.scores_apres.get(couleur_joueur or c.couleur, 0) -
                                      c.scores_avant.get(couleur_joueur or c.couleur, 0),
                         reverse=True)
        resume.coup_decisif = decisifs[0].to_dict() if decisifs else None

    # Precision
    nb_analyses = sum(compteur_classes.values())
    if nb_analyses > 0:
        precision = sum(POIDS_CLASSIFICATION.get(c, 50) * n
                       for c, n in compteur_classes.items()) / nb_analyses
    else:
        precision = 0.0

    resume.precision_pct = round(precision, 1)
    resume.nb_coups_analyses = nb_analyses
    resume.stats_classes = {k: v for k, v in compteur_classes.items() if v > 0}

    print(f"[analyse] Termine : {nb_analyses}/{len(coups_historique)} coups analyses")
    print(f"[analyse] Precision : {precision:.1f}%")
    print(f"[analyse] Classes : {resume.stats_classes}")

    return {
        "coups": [c.to_dict() for c in coups_analyses],
        "stats": resume.stats_classes,
        "precision_pct": resume.precision_pct,
        "total_coups_analyses": resume.nb_coups_analyses,
        "resume": resume.to_dict(),
        "nb_coups_total": len(coups_historique),
    }


# ═══════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════

def formater_analyse_rapide(resultat_analyse: dict) -> str:
    """Formate le resultat pour un affichage lisible."""
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
        "",
        f"  Serie max : {resume.get('serie_max_atteinte', 0)}",
        f"  ELMAAS joues : {resume.get('nb_elmaas_joues', 0)}",
        f"  Opportunites ELMAAS manquees : {resume.get('nb_elmaas_opportunites_manquees', 0)}",
        "=" * 50,
    ])

    return "\n".join(lines)


if __name__ == "__main__":
    print("Module analyse_partie.py v4.1 (corrigé) chargé.")
    print("Fonctions principales :")
    print("  - analyser_partie_complete(coups, etat_initial, couleur, profondeur)")
    print("  - evaluer_position_complete(etat, couleur)")
    print("  - formater_analyse_rapide(resultat)")
    print("")
    print("Classes de classification :")
    for cls, poids in POIDS_CLASSIFICATION.items():
        print(f"  {cls:12} (poids {poids})")
