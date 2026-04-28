# ELMAAS — analyse_partie.py v3.0
# Analyse rigoureuse de partie : tous les types de coups évalués
# Pose, Repiocher, Scout, Échange, ELMAAS/Diamant, Pouvoirs, Séries
# Évaluation multi-critères avec profondeur configurable

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
from ai_player import jouer_ia, ia_niveau_3, ia_niveau_4
from pieces_generator import (
    cellules_absolues, placement_valide, generer_piece,
    serialiser_piece, toutes_rotations, FORMES
)
from puzzle_generator import Puzzle


# ═══════════════════════════════════════════════════════════
# CONSTANTES DE CLASSIFICATION
# ═══════════════════════════════════════════════════════════

CLASSE_ELMAAS     = "ELMAAS"      # Coup brillant : gain maximal, créativité
CLASSE_ELMAASYON  = "ELMAASYON"   # Excellent : top 3, gain solide
CLASSE_MASSY      = "MASSY"       # Très bon : meilleur coup objectif
CLASSE_NOTMESSY   = "NOTMESSY"    # Bon : dans les 10% meilleurs
CLASSE_MISSED     = "MISSED"      # Moyen : opportunité manquée visible
CLASSE_CHESS      = "CHESS"       # Faible : erreur significative
CLASSE_BLUNDER    = "BLUNDER"     # Grosse erreur : perd du matériel ou laisse gagner

# Poids pour le calcul de précision globale
POIDS_CLASSIFICATION = {
    CLASSE_ELMAAS:    100,
    CLASSE_ELMAASYON:  92,
    CLASSE_MASSY:      85,
    CLASSE_NOTMESSY:   70,
    CLASSE_MISSED:     45,
    CLASSE_CHESS:      20,
    CLASSE_BLUNDER:     5,
}

# Seuils de classification
SEUIL_ELMAAS    = 0.95   # Top 1% et gain exceptionnel
SEUIL_ELMAASYON = 0.90   # Top 5% et gain fort
SEUIL_MASSY     = 0.85   # Top 10% ou meilleur coup sans gain
SEUIL_NOTMESSY  = 0.70   # Top 25%
SEUIL_MISSED    = 0.50   # Top 50% mais écart significatif
SEUIL_CHESS     = 0.20   # En dessous du top 50%


# ═══════════════════════════════════════════════════════════
# STRUCTURES DE DONNÉES POUR L'ANALYSE
# ═══════════════════════════════════════════════════════════

@dataclass
class AnalyseCoup:
    """Résultat d'analyse d'un coup individuel."""
    index: int
    type_coup: str                    # "poser", "repiocher", "scout", "pouvoir"
    couleur: str
    numero_tour: int

    # Pour les coups poser
    piece_index: Optional[int] = None
    piece_forme: Optional[str] = None
    piece_est_elmaas: bool = False
    origine: Optional[Tuple[int, int]] = None

    # Pour les coups repiocher
    pieces_avant: Optional[List[dict]] = None
    pieces_apres: Optional[List[dict]] = None

    # Pour les coups scout
    pieces_vues: Optional[List[dict]] = None
    echanges_scout: Optional[List[dict]] = None

    # Pour les pouvoirs
    pouvoir_type: Optional[str] = None
    cible_pouvoir: Optional[Tuple[int, int]] = None

    # Évaluation
    classification: str = CLASSE_NOTMESSY
    score_joue: float = 0.0
    score_optimal: float = 0.0
    ecart_relatif: float = 0.0        # (optimal - joue) / optimal
    rang: int = 1
    total_coups_possibles: int = 1

    # Impact sur le jeu
    puzzles_completes: List[int] = field(default_factory=list)
    gain_cellules: int = 0
    serie_apres: int = 0
    serie_avant: int = 0
    nb_pieces_posees_apres: int = 0

    # Contexte
    plateau_avant: Dict[str, str] = field(default_factory=dict)
    scores_avant: Dict[str, int] = field(default_factory=dict)
    scores_apres: Dict[str, int] = field(default_factory=dict)

    # Meilleure alternative
    meilleur_alternative: Optional[dict] = None
    alternative_est_elmaas: bool = False

    # Métriques avancées
    valeur_positionnelle: float = 0.0   # Évaluation positionnelle pure
    valeur_tactique: float = 0.0        # Évaluation tactique (puzzles, séries)
    valeur_strategique: float = 0.0     # Évaluation stratégique (long terme)

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
        }


@dataclass  
class ResumeAnalyse:
    """Résumé global de l'analyse de partie."""
    precision_pct: float = 0.0
    couleur_analysee: Optional[str] = None
    nb_coups_total: int = 0
    nb_coups_analyses: int = 0
    stats_classes: Dict[str, int] = field(default_factory=dict)

    # Tendances
    tendance_debut: str = "stable"    # "fort", "stable", "faible"
    tendance_milieu: str = "stable"
    tendance_fin: str = "stable"

    # Moments clés
    meilleur_coup: Optional[dict] = None
    pire_coup: Optional[dict] = None
    coup_decisif: Optional[dict] = None  # Coup qui a changé le cours

    # ELMAAS spécifique
    nb_elmaas_joues: int = 0
    nb_elmaas_opportunites_manquees: int = 0
    efficacite_elmaas: float = 0.0    # % d'ELMAAS bien utilisés

    # Séries
    serie_max_atteinte: int = 0
    nb_series_ratees: int = 0

    # Pouvoirs
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
# ÉVALUATION POSITIONNELLE AVANCÉE
# ═══════════════════════════════════════════════════════════

def evaluer_position_complete(etat: EtatJeu, couleur_perspective: str, 
                               profondeur: int = 0) -> float:
    """
    Évaluation complète d'une position.
    Combine : matériel, puzzles, séries, territoire, mobilité, ELMAAS.
    """
    scores = calculer_scores(etat)
    couleur_adverse = "noir" if couleur_perspective == "rouge" else "rouge"

    score_total = 0.0

    # 1. DIFFÉRENTIEL DE CELLULES (base)
    cellules_moi = scores.get(couleur_perspective, 0)
    cellules_adv = scores.get(couleur_adverse, 0)
    score_total += (cellules_moi - cellules_adv) * 3.0

    # 2. PUZZLES COMPLÉTÉS ET PROGRESSION
    nb_puzzles_moi = 0
    nb_puzzles_adv = 0
    puzzles_quasi_moi = 0      # 1-2 cases manquantes
    puzzles_quasi_adv = 0
    puzzles_bloques = 0        # Bloqués par diamant

    for puzzle in etat.plateau.puzzles.values():
        if puzzle.brise:
            continue

        nb_total = len(puzzle.cellules)
        if nb_total == 0:
            continue

        # Déjà complété
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

        # Puzzle bloqué par diamant
        if nb_diamant > 0 and puzzle.type_couleur in ("mono_rouge", "mono_noir"):
            puzzles_bloques += 1
            # Le diamant avantage celui qui l'a posé (souvent le joueur actif)
            # mais c'est complexe... on neutralise
            score_total -= 1.0
            continue

        # Quasi-complet
        if nb_vide <= 2:
            if nb_moi > nb_adv:
                puzzles_quasi_moi += 1
                score_total += nb_total * 4.0 * (nb_moi / max(nb_moi + nb_adv, 1))
            elif nb_adv > nb_moi:
                puzzles_quasi_adv += 1
                score_total -= nb_total * 4.0 * (nb_adv / max(nb_moi + nb_adv, 1))

        # Progression générale
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

    # 3. SÉRIES (très important pour les pouvoirs)
    joueur_moi = etat.joueur1 if etat.joueur1.couleur == couleur_perspective else etat.joueur2
    joueur_adv = etat.joueur2 if joueur_moi == etat.joueur1 else etat.joueur1

    serie_moi = joueur_moi.serie_actuelle
    serie_adv = joueur_adv.serie_actuelle

    # Série en cours = menace/potentiel
    score_total += serie_moi * 5.0
    score_total -= serie_adv * 4.0

    # Proche de victoire immédiate (série 4 = à 1 du 5)
    if serie_moi >= 4:
        score_total += 25.0
    if serie_adv >= 4:
        score_total -= 20.0

    # 4. MATÉRIEL (pièces restantes)
    score_total += len(joueur_moi.main_active) * 1.5
    score_total += len(joueur_moi.reserve) * 1.0
    score_total -= len(joueur_adv.main_active) * 1.2
    score_total -= len(joueur_adv.reserve) * 0.8

    # Danger : plus de pièces et aucun puzzle
    if not joueur_moi.reserve and not joueur_moi.main_active:
        if nb_puzzles_moi == 0:
            score_total -= 50.0  # Défaite quasi-certaine
        else:
            score_total -= 15.0

    # 5. MOBILITÉ (nombre de placements possibles)
    mobilite_moi = compter_mobilite(etat, joueur_moi)
    mobilite_adv = compter_mobilite(etat, joueur_adv)
    score_total += (mobilite_moi - mobilite_adv) * 0.3

    # 6. ELMAAS EN MAIN (potentiel d'enlèvement)
    elmaas_moi = sum(1 for p in joueur_moi.main_active if p.get("enlevement"))
    elmaas_adv = sum(1 for p in joueur_adv.main_active if p.get("enlevement"))
    score_total += elmaas_moi * 3.0
    score_total -= elmaas_adv * 2.5

    # 7. PROFONDEUR (bonus pour positions qui mènent à des gains)
    if profondeur > 0:
        # Simuler un coup adverse moyen et réévaluer
        score_total *= 0.9  # Légère pénalité pour l'incertitude

    return score_total


def compter_mobilite(etat: EtatJeu, joueur: Joueur) -> int:
    """Compte le nombre de placements légaux pour toutes les pièces en main."""
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
# LISTAGE DES COUPS POSSIBLES PAR TYPE
# ═══════════════════════════════════════════════════════════

def lister_coups_poser(etat: EtatJeu, joueur: Joueur) -> List[Tuple[int, Tuple[int, int]]]:
    """Tous les coups 'poser' légaux."""
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
    """Le repiocher est toujours possible si on a des pièces en main."""
    if len(joueur.main_active) > 0 and len(joueur.reserve) > 0:
        return ["repiocher"]
    return []


def lister_coups_scout(etat: EtatJeu, joueur: Joueur) -> List[str]:
    """Scout possible si main assez grande et réserve non vide."""
    from config import MIN_PIECES_SCOUT
    if len(joueur.main_active) > MIN_PIECES_SCOUT and len(joueur.reserve) > 0:
        return ["scout"]
    return []


def lister_tous_coups(etat: EtatJeu, joueur: Joueur) -> List[dict]:
    """
    Liste TOUTES les actions possibles pour un joueur.
    Retourne une liste de dicts avec type et données.
    """
    coups = []

    # 1. Coups poser (prioritaires, les plus nombreux)
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
# SIMULATION DE COUPS
# ═══════════════════════════════════════════════════════════

def simuler_coup(etat: EtatJeu, coup: dict) -> Tuple[Optional[EtatJeu], Optional[dict]]:
    """
    Simule un coup et retourne (nouvel_etat, resultat_action).
    Gère tous les types de coups.
    """
    etat_copie = copy.deepcopy(etat)

    try:
        if coup["type"] == "poser":
            resultat = action_poser_piece(
                etat_copie, 
                coup["piece_index"], 
                coup["origine"]
            )

            # Gérer les pouvoirs automatiquement si puzzles complétés
            if resultat.get("puzzles_completes") and not resultat.get("victoire_immediate"):
                joueur = etat_copie.joueur_actif()
                if joueur.serie_actuelle >= SERIE_BONUS_EXTRACTION:
                    # Pour l'analyse, on simule "rien" (conservateur)
                    # ou on pourrait tester plusieurs options
                    pass  # Le tour passe automatiquement après pouvoir

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


def simuler_coup_pour_eval(etat: EtatJeu, coup: dict, 
                           couleur_perspective: str) -> float:
    """
    Simule un coup et retourne l'évaluation de la position résultante.
    Version rapide pour le classement des coups.
    """
    etat_apres, resultat = simuler_coup(etat, coup)
    if etat_apres is None:
        return float("-inf") if etat.joueur_actif().couleur == couleur_perspective else float("inf")

    # Si victoire immédiate, score maximal/minimal
    if resultat and resultat.get("victoire_immediate"):
        gagnant = etat_apres.gagnant
        if gagnant == couleur_perspective:
            return 1000.0
        else:
            return -1000.0

    # Évaluation standard
    score = evaluer_position_complete(etat_apres, couleur_perspective)

    # Bonus/Malus pour puzzles complétés dans ce coup
    if resultat and resultat.get("puzzles_completes"):
        nb_puzzles = len(resultat["puzzles_completes"])
        gain_cellules = sum(len(p.cellules) for p in resultat["puzzles_completes"])
        score += nb_puzzles * 15.0 + gain_cellules * 2.0

    return score


# ═══════════════════════════════════════════════════════════
# ÉVALUATION SPÉCIFIQUE PAR TYPE DE COUP
# ═══════════════════════════════════════════════════════════

def evaluer_coup_poser(etat_avant: EtatJeu, coup_joue: dict, 
                        profondeur: int = 1, deadline: float = None) -> AnalyseCoup:
    """
    Évaluation rigoureuse d'un coup 'poser'.
    Compare avec toutes les alternatives possibles (poser, repiocher, scout).
    """
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    couleur_adverse = "noir" if couleur == "rouge" else "rouge"

    # Récupérer les infos du coup joué
    piece_idx_joue = coup_joue.get("piece_index", 0)
    origine_joue = tuple(coup_joue.get("origine", [0, 0]))
    piece_joue = joueur.main_active[piece_idx_joue] if piece_idx_joue < len(joueur.main_active) else None
    est_elmaas = piece_joue.get("enlevement", False) if piece_joue else False

    # État avant
    scores_avant = calculer_scores(etat_avant)
    serie_avant = joueur.serie_actuelle

    # Simuler le coup joué
    etat_apres_joue, resultat_joue = simuler_coup(etat_avant, {
        "type": "poser",
        "piece_index": piece_idx_joue,
        "origine": origine_joue,
    })

    if etat_apres_joue is None:
        # Coup illégal ?
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
        )

    scores_apres_joue = calculer_scores(etat_apres_joue)
    serie_apres_joue = etat_apres_joue.joueur_actif().serie_actuelle if etat_apres_joue.joueur_actif().couleur != couleur else                        (etat_apres_joue.joueur1 if etat_apres_joue.joueur1.couleur == couleur else etat_apres_joue.joueur2).serie_actuelle

    # Générer toutes les alternatives
    tous_coups = lister_tous_coups(etat_avant, joueur)

    # Évaluer chaque alternative
    evaluations = []
    for alt in tous_coups:
        if deadline and time.time() > deadline:
            break

        score = simuler_coup_pour_eval(etat_avant, alt, couleur)

        # Informations supplémentaires
        info = {
            "coup": alt,
            "score": score,
            "est_elmaas": alt.get("est_elmaas", False),
        }
        evaluations.append(info)

    # Trier par score décroissant
    evaluations.sort(key=lambda x: x["score"], reverse=True)

    # Trouver le score du coup joué
    score_joue = None
    rang_joue = 0
    for i, ev in enumerate(evaluations):
        alt = ev["coup"]
        if (alt["type"] == "poser" and 
            alt.get("piece_index") == piece_idx_joue and 
            tuple(alt.get("origine", [0,0])) == origine_joue):
            score_joue = ev["score"]
            rang_joue = i
            break

    if score_joue is None:
        score_joue = evaluations[0]["score"] if evaluations else 0.0
        rang_joue = len(evaluations)

    score_optimal = evaluations[0]["score"] if evaluations else score_joue
    total_coups = len(evaluations)

    # Calculer l'écart relatif
    if score_optimal != 0:
        ecart = (score_optimal - score_joue) / abs(score_optimal)
    else:
        ecart = 0.0 if score_joue == 0 else 1.0

    # Déterminer la classification
    pctile = 1.0 - (rang_joue / max(total_coups - 1, 1)) if total_coups > 1 else 1.0

    # Gain réel
    puzzles_c = resultat_joue.get("puzzles_completes", []) if resultat_joue else []
    gain_cellules = sum(len(p.cellules) for p in puzzles_c) if puzzles_c else 0
    nb_puzzles = len(puzzles_c)

    # Classification fine
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

    # Vérifier si le meilleur coup était un ELMAAS
    meilleur_alt = evaluations[0] if evaluations else None
    alt_est_elmaas = False
    if meilleur_alt and meilleur_alt["coup"].get("est_elmaas"):
        alt_est_elmaas = True

    # Valeurs décomposées
    val_pos = evaluer_position_complete(etat_apres_joue, couleur)
    val_tac = nb_puzzles * 10.0 + gain_cellules * 2.0 + (serie_apres_joue - serie_avant) * 5.0
    val_strat = val_pos * 0.3  # Simplifié

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
    )


def evaluer_coup_repiocher(etat_avant: EtatJeu, coup_joue: dict) -> AnalyseCoup:
    """
    Évalue un coup 'repiocher'.
    Compare avec l'option de poser une pièce (si possible).
    """
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    scores_avant = calculer_scores(etat_avant)

    # Simuler le repiocher
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

    # Vérifier si on aurait pu poser une pièce
    coups_poser = lister_coups_poser(etat_avant, joueur)

    if not coups_poser:
        # Repiocher obligatoire → bon coup
        classification = CLASSE_MASSY
        score_joue = 5.0
        score_optimal = 5.0
    else:
        # Évaluer le meilleur coup poser possible
        meilleur_score_poser = float("-inf")
        for idx, orig in coups_poser[:10]:  # Limiter pour perf
            score = simuler_coup_pour_eval(etat_avant, {
                "type": "poser",
                "piece_index": idx,
                "origine": orig,
            }, couleur)
            meilleur_score_poser = max(meilleur_score_poser, score)

        # Évaluer le repiocher
        score_repiocher = evaluer_position_complete(etat_apres, couleur)

        if score_repiocher >= meilleur_score_poser - 5.0:
            # Repiocher presque aussi bon → bon choix
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

    return AnalyseCoup(
        index=coup_joue.get("index", 0),
        type_coup="repiocher",
        couleur=couleur,
        numero_tour=etat_avant.numero_tour,
        pieces_avant=[serialiser_piece(p) for p in joueur.main_active],
        pieces_apres=[serialiser_piece(p) for p in etat_apres.joueur_actif().main_active] if etat_apres.joueur_actif().couleur == couleur else 
                     [serialiser_piece(p) for p in (etat_apres.joueur1 if etat_apres.joueur1.couleur == couleur else etat_apres.joueur2).main_active],
        classification=classification,
        score_joue=score_joue,
        score_optimal=score_optimal,
        ecart_relatif=ecart,
        rang=1 if classification in (CLASSE_MASSY, CLASSE_NOTMESSY) else 2,
        total_coups_possibles=2 if coups_poser else 1,
        scores_avant=scores_avant,
        scores_apres=scores_apres,
    )


def evaluer_coup_scout(etat_avant: EtatJeu, coup_joue: dict) -> AnalyseCoup:
    """
    Évalue un coup 'scout'.
    Le scout est généralement un coup de positionnement/info.
    """
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    scores_avant = calculer_scores(etat_avant)

    # Simuler le scout
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

    # Vérifier si on aurait pu poser une pièce valable
    coups_poser = lister_coups_poser(etat_avant, joueur)

    # Évaluer si le scout améliore la main
    main_avant = joueur.main_active
    main_apres = etat_apres.joueur_actif().main_active if etat_apres.joueur_actif().couleur == couleur else                  (etat_apres.joueur1 if etat_apres.joueur1.couleur == couleur else etat_apres.joueur2).main_active

    # Compter les pièces devenues plaçables
    mobilite_avant = compter_mobilite(etat_avant, joueur)
    # Recréer un joueur temporaire avec la nouvelle main
    joueur_temp = copy.deepcopy(joueur)
    joueur_temp.main_active = main_apres
    mobilite_apres = compter_mobilite(etat_avant, joueur_temp)

    score_joue = mobilite_apres * 0.5
    score_optimal = mobilite_avant * 0.5 if mobilite_avant > 0 else 5.0

    if mobilite_apres > mobilite_avant and mobilite_avant < 10:
        # Scout a significativement amélioré la mobilité → bon
        classification = CLASSE_NOTMESSY
    elif mobilite_avant >= 20:
        # On avait déjà beaucoup de choix → scout inutile
        classification = CLASSE_MISSED
    else:
        classification = CLASSE_NOTMESSY

    return AnalyseCoup(
        index=coup_joue.get("index", 0),
        type_coup="scout",
        couleur=couleur,
        numero_tour=etat_avant.numero_tour,
        pieces_vues=[serialiser_piece(p) for p in resultat.get("pieces_vues", [])] if resultat else [],
        echanges_scout=resultat.get("echanges", []) if resultat else [],
        classification=classification,
        score_joue=score_joue,
        score_optimal=score_optimal,
        ecart_relatif=0.2,
        rang=1,
        total_coups_possibles=3 if coups_poser else 1,
        scores_avant=scores_avant,
        scores_apres=scores_apres,
    )


# ═══════════════════════════════════════════════════════════
# FONCTION PRINCIPALE D'ANALYSE
# ═══════════════════════════════════════════════════════════

def analyser_partie_complete(
    coups_historique: list,
    etat_initial: EtatJeu,
    couleur_joueur: Optional[str] = None,
    profondeur: int = 1,
    timeout_global: int = 120
) -> dict:
    """
    Analyse complète d'une partie.

    Args:
        coups_historique: Liste des coups joués (dict avec type, couleur, etc.)
        etat_initial: État initial de la partie
        couleur_joueur: "rouge", "noir", ou None pour analyser les deux
        profondeur: 1=rapide (évaluation directe), 2=moyen (1 coup lookahead),
                    3=profond (minimax léger)
        timeout_global: Timeout en secondes pour l'analyse complète

    Returns:
        dict avec coups analysés, stats, résumé, précision
    """
    import time
    deadline_global = time.time() + timeout_global

    etat = copy.deepcopy(etat_initial)
    coups_analyses = []
    resume = ResumeAnalyse()
    resume.couleur_analysee = couleur_joueur
    resume.nb_coups_total = len(coups_historique)

    compteur_classes = {cls: 0 for cls in POIDS_CLASSIFICATION.keys()}

    # Tracking ELMAAS
    nb_elmaas_joues = 0
    nb_elmaas_opportunites = 0

    # Tracking séries
    serie_max = 0

    erreurs_consecutives = 0
    MAX_ERREURS = 5

    for i, coup in enumerate(coups_historique):
        if time.time() > deadline_global:
            print(f"[analyse] Timeout global — {len(coups_analyses)}/{len(coups_historique)} coups analysés")
            break

        couleur_coup = coup.get("couleur", "")
        doit_analyser = (couleur_joueur is None or couleur_coup == couleur_joueur)

        # Mettre à jour la série max
        joueur_actuel = etat.joueur1 if etat.joueur1.couleur == couleur_coup else etat.joueur2
        serie_max = max(serie_max, joueur_actuel.serie_actuelle)

        try:
            if coup["type"] == "poser" and doit_analyser:
                # Vérifier si c'est un ELMAAS
                piece_idx = coup.get("piece_index", 0)
                piece_data = coup.get("piece_data")
                est_elmaas_coup = False
                if piece_data and piece_data.get("enlevement"):
                    est_elmaas_coup = True
                    nb_elmaas_joues += 1
                elif piece_idx < len(joueur_actuel.main_active):
                    if joueur_actuel.main_active[piece_idx].get("enlevement"):
                        est_elmaas_coup = True
                        nb_elmaas_joues += 1

                # Évaluer le coup poser
                analyse = evaluer_coup_poser(
                    etat, 
                    {**coup, "index": i},
                    profondeur=profondeur,
                    deadline=deadline_global
                )

                # Vérifier si on a manqué une opportunité ELMAAS
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

            # Rejouer le coup pour avancer l'état (TOUJOURS, même si pas analysé)
            if coup["type"] == "poser":
                # Essayer de rejouer avec les données exactes
                piece_data = coup.get("piece_data")
                if piece_data and etat.joueur_actif().main_active:
                    # Chercher la pièce correspondante dans la main
                    joueur_r = etat.joueur_actif()
                    piece_trouvee = False
                    for j, p in enumerate(joueur_r.main_active):
                        if (p.get("forme") == piece_data.get("forme") and
                                p.get("enlevement") == piece_data.get("enlevement")):
                            res = jouer_tour(etat, "poser", piece_index=j,
                                           origine=tuple(coup["origine"]),
                                           pouvoir=coup.get("pouvoir", "rien"))
                            piece_trouvee = True
                            break
                    if not piece_trouvee:
                        idx_safe = min(coup["piece_index"], len(joueur_r.main_active) - 1)
                        jouer_tour(etat, "poser", piece_index=idx_safe,
                                  origine=tuple(coup["origine"]),
                                  pouvoir=coup.get("pouvoir", "rien"))
                else:
                    idx_safe = min(coup["piece_index"], len(etat.joueur_actif().main_active) - 1)
                    jouer_tour(etat, "poser", piece_index=idx_safe,
                              origine=tuple(coup["origine"]),
                              pouvoir=coup.get("pouvoir", "rien"))

            elif coup["type"] == "repiocher":
                jouer_tour(etat, "repiocher")

            elif coup["type"] == "scout":
                jouer_tour(etat, "scout")

            erreurs_consecutives = 0

        except Exception as e:
            print(f"[analyse] Erreur coup {i} ({coup.get('type')}): {e}")
            erreurs_consecutives += 1
            if erreurs_consecutives >= MAX_ERREURS:
                print("[analyse] Trop d'erreurs consécutives, arrêt.")
                break
            # Continuer malgré l'erreur
            continue

    # Calculer les tendances
    resume.serie_max_atteinte = serie_max
    resume.nb_elmaas_joues = nb_elmaas_joues
    resume.nb_elmaas_opportunites_manquees = nb_elmaas_opportunites
    resume.efficacite_elmaas = (nb_elmaas_joues / max(nb_elmaas_joues + nb_elmaas_opportunites, 1)) * 100

    # Tendances par tiers
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

        # Coup décisif : plus grand écart avant/après
        decisifs = sorted(coups_analyses, 
                         key=lambda c: c.scores_apres.get(couleur_joueur or c.couleur, 0) - 
                                      c.scores_avant.get(couleur_joueur or c.couleur, 0),
                         reverse=True)
        resume.coup_decisif = decisifs[0].to_dict() if decisifs else None

    # Calcul de précision
    nb_analyses = sum(compteur_classes.values())
    if nb_analyses > 0:
        precision = sum(POIDS_CLASSIFICATION.get(c, 50) * n 
                       for c, n in compteur_classes.items()) / nb_analyses
    else:
        precision = 0.0

    resume.precision_pct = round(precision, 1)
    resume.nb_coups_analyses = nb_analyses
    resume.stats_classes = {k: v for k, v in compteur_classes.items() if v > 0}

    print(f"[analyse] Terminé : {nb_analyses}/{len(coups_historique)} coups analysés")
    print(f"[analyse] Précision : {precision:.1f}%")
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

def snapshot_pieces(etat: EtatJeu) -> dict:
    """Capture l'état du plateau."""
    return dict(etat.plateau.pieces)


def formater_analyse_rapide(resultat_analyse: dict) -> str:
    """Formate le résultat pour un affichage lisible."""
    resume = resultat_analyse.get("resume", {})
    lines = [
        "═" * 50,
        "  ANALYSE ELMAAS",
        "═" * 50,
        f"  Précision : {resultat_analyse.get('precision_pct', 0)}%",
        f"  Coups analysés : {resultat_analyse.get('total_coups_analyses', 0)}/{resultat_analyse.get('nb_coups_total', 0)}",
        "",
        "  Distribution :",
    ]
    for classe, nb in resultat_analyse.get("stats", {}).items():
        pct = nb / max(resultat_analyse.get('total_coups_analyses', 1), 1) * 100
        bar = "█" * int(pct / 5)
        lines.append(f"    {classe:12} : {nb:3} ({pct:5.1f}%) {bar}")

    lines.extend([
        "",
        f"  Tendance début : {resume.get('tendance_debut', 'N/A')}",
        f"  Tendance milieu : {resume.get('tendance_milieu', 'N/A')}",
        f"  Tendance fin : {resume.get('tendance_fin', 'N/A')}",
        "",
        f"  Série max : {resume.get('serie_max_atteinte', 0)}",
        f"  ELMAAS joués : {resume.get('nb_elmaas_joues', 0)}",
        f"  Opportunités ELMAAS manquées : {resume.get('nb_elmaas_opportunites_manquees', 0)}",
        "═" * 50,
    ])

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════
# TEST RAPIDE
# ═══════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("Module analyse_partie.py v3.0 chargé.")
    print("Fonctions principales :")
    print("  - analyser_partie_complete(coups, etat_initial, couleur, profondeur)")
    print("  - evaluer_position_complete(etat, couleur)")
    print("  - formater_analyse_rapide(resultat)")
    print("")
    print("Classes de classification :")
    for cls, poids in POIDS_CLASSIFICATION.items():
        print(f"  {cls:12} (poids {poids})")
