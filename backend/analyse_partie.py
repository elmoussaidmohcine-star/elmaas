# ELMAAS — analyse_partie.py
# Analyse d'une partie jouée : rejoue chaque coup du joueur,
# compare avec le meilleur coup selon minimax profond,
# classifie en ELMAAS / ELMAASYON / MASSY / NOTMESSY / MISSED / CHESS

import copy
from game_engine import jouer_tour, calculer_scores, EtatJeu
from ai_player import jouer_ia
from pieces_generator import cellules_absolues, placement_valide


# Classes de coups (meilleur → pire)
CLASSE_ELMAAS = "ELMAAS"       # Brilliant : meilleur coup + gain ≥ 6 cellules ou série 3+
CLASSE_ELMAASYON = "ELMAASYON" # Great : parmi top 3 et gain ≥ 4
CLASSE_MASSY = "MASSY"          # Best : meilleur coup objectif
CLASSE_NOTMESSY = "NOTMESSY"    # Good : parmi top 5, perte légère
CLASSE_MISSED = "MISSED"        # Bad : rate un puzzle complétable
CLASSE_CHESS = "CHESS"          # Worst : perte nette, offre plateau à l'adversaire


def evaluer_etat(etat: EtatJeu, couleur_perspective: str) -> float:
    """Évaluation numérique d'un état pour un joueur."""
    scores = calculer_scores(etat)
    diff_cellules = scores.get(couleur_perspective, 0) - scores.get(
        "noir" if couleur_perspective == "rouge" else "rouge", 0
    )
    # Bonus série
    j = etat.joueur1 if etat.joueur1.couleur == couleur_perspective else etat.joueur2
    bonus_serie = j.serie_actuelle * 2
    return diff_cellules + bonus_serie


def lister_coups_possibles(etat: EtatJeu, joueur) -> list:
    """Retourne tous les (piece_index, origine) légaux pour ce joueur."""
    coups = []
    taille = etat.plateau.grille_bicolore.shape[0]
    for idx, piece in enumerate(joueur.main_active):
        for r in range(taille):
            for c in range(taille):
                valide, _ = placement_valide(piece, (r, c), etat.plateau.pieces, taille)
                if valide:
                    coups.append((idx, (r, c)))
    return coups


def minimax(etat: EtatJeu, profondeur: int, alpha: float, beta: float,
            maximisant: bool, couleur_perspective: str) -> float:
    """Minimax simplifié avec élagage alpha-beta."""
    if profondeur == 0 or etat.manche_terminee:
        return evaluer_etat(etat, couleur_perspective)

    joueur = etat.joueur_actif()
    coups = lister_coups_possibles(etat, joueur)
    if not coups:
        return evaluer_etat(etat, couleur_perspective)

    # Limite les coups examinés pour performance (max 15 par niveau)
    if len(coups) > 15:
        coups = coups[:15]

    if maximisant:
        val = float("-inf")
        for piece_idx, origine in coups:
            etat_copie = copy.deepcopy(etat)
            try:
                jouer_tour(etat_copie, "poser",
                           piece_index=piece_idx, origine=origine, pouvoir="rien")
                score = minimax(etat_copie, profondeur - 1, alpha, beta,
                                False, couleur_perspective)
                val = max(val, score)
                alpha = max(alpha, val)
                if beta <= alpha:
                    break
            except Exception:
                continue
        return val
    else:
        val = float("inf")
        for piece_idx, origine in coups:
            etat_copie = copy.deepcopy(etat)
            try:
                jouer_tour(etat_copie, "poser",
                           piece_index=piece_idx, origine=origine, pouvoir="rien")
                score = minimax(etat_copie, profondeur - 1, alpha, beta,
                                True, couleur_perspective)
                val = min(val, score)
                beta = min(beta, val)
                if beta <= alpha:
                    break
            except Exception:
                continue
        return val


def evaluer_coup(etat_avant: EtatJeu, piece_index: int, origine: tuple,
                 profondeur: int = 3) -> dict:
    """
    Évalue un coup donné en le comparant au meilleur coup possible.
    Retourne {classification, meilleur_coup, score_joue, score_optimal, gain}
    """
    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    coups_possibles = lister_coups_possibles(etat_avant, joueur)

    if not coups_possibles:
        return {
            "classification": CLASSE_NOTMESSY,
            "meilleur_coup": None,
            "score_joue": 0,
            "score_optimal": 0,
            "gain": 0,
        }

    # Évalue tous les coups légaux
    scores_coups = []
    for idx, org in coups_possibles:
        etat_test = copy.deepcopy(etat_avant)
        try:
            jouer_tour(etat_test, "poser",
                       piece_index=idx, origine=org, pouvoir="rien")
            score = minimax(etat_test, profondeur - 1,
                            float("-inf"), float("inf"),
                            False, couleur)
            scores_coups.append(((idx, org), score))
        except Exception:
            continue

    if not scores_coups:
        return {
            "classification": CLASSE_NOTMESSY,
            "meilleur_coup": None,
            "score_joue": 0,
            "score_optimal": 0,
            "gain": 0,
        }

    # Tri décroissant
    scores_coups.sort(key=lambda x: x[1], reverse=True)
    score_optimal = scores_coups[0][1]
    meilleur_coup = scores_coups[0][0]

    # Trouve le score du coup joué
    score_joue = None
    rang_joue = -1
    for i, ((idx, org), s) in enumerate(scores_coups):
        if idx == piece_index and tuple(org) == tuple(origine):
            score_joue = s
            rang_joue = i
            break

    if score_joue is None:
        score_joue = score_optimal
        rang_joue = 0

    # Calcul gain (cellules complétées par ce coup)
    etat_apres = copy.deepcopy(etat_avant)
    try:
        resultat_coup = jouer_tour(etat_apres, "poser",
                                   piece_index=piece_index, origine=origine,
                                   pouvoir="rien")
        puzzles_completes = resultat_coup.get("puzzles_completes", [])
        gain_cellules = sum(len(p.cellules) for p in puzzles_completes) if puzzles_completes else 0
        nouvelle_serie = etat_apres.joueur_actif().serie_actuelle if resultat_coup.get("tour_change") is False else joueur.serie_actuelle
    except Exception:
        gain_cellules = 0
        nouvelle_serie = joueur.serie_actuelle

    # Écart entre coup optimal et coup joué
    ecart = score_optimal - score_joue

    # Classification
    total_coups = len(scores_coups)
    top_3 = scores_coups[:min(3, total_coups)]
    top_5 = scores_coups[:min(5, total_coups)]

    est_top_3 = rang_joue < len(top_3)
    est_top_5 = rang_joue < len(top_5)
    est_meilleur = rang_joue == 0

    if est_meilleur and (gain_cellules >= 6 or nouvelle_serie >= 3):
        classification = CLASSE_ELMAAS
    elif est_top_3 and gain_cellules >= 4:
        classification = CLASSE_ELMAASYON
    elif est_meilleur:
        classification = CLASSE_MASSY
    elif est_top_5 and ecart <= 3:
        classification = CLASSE_NOTMESSY
    elif ecart >= 6:
        classification = CLASSE_CHESS
    else:
        classification = CLASSE_MISSED

    return {
        "classification": classification,
        "meilleur_coup": {"piece_index": meilleur_coup[0],
                          "origine": list(meilleur_coup[1])} if meilleur_coup else None,
        "score_joue": float(score_joue),
        "score_optimal": float(score_optimal),
        "gain": int(gain_cellules),
        "rang": rang_joue + 1,
        "total_coups": total_coups,
    }


def analyser_partie_complete(coups_historique: list, etat_initial: EtatJeu,
                             couleur_joueur: str, profondeur: int = 3) -> dict:
    """
    Analyse chaque coup joué par `couleur_joueur` dans l'historique.

    coups_historique : liste de {
        "type": "poser" | "pouvoir" | "repiocher" | "scout",
        "piece_index": int,
        "origine": [r, c],
        "couleur": str,
        "numero_tour": int,
    }

    Retourne {
        "coups": [{...coup original + classification}],
        "stats": {"ELMAAS": n, "ELMAASYON": n, ...},
        "precision_pct": float (0-100),
    }
    """
    etat = copy.deepcopy(etat_initial)
    coups_analyses = []
    compteur = {CLASSE_ELMAAS: 0, CLASSE_ELMAASYON: 0, CLASSE_MASSY: 0,
                CLASSE_NOTMESSY: 0, CLASSE_MISSED: 0, CLASSE_CHESS: 0}

    for coup in coups_historique:
        couleur_trait = etat.joueur_actif().couleur

        if coup["type"] == "poser" and couleur_trait == couleur_joueur:
            eval_result = evaluer_coup(
                etat, coup["piece_index"], tuple(coup["origine"]), profondeur
            )
            coups_analyses.append({**coup, "evaluation": eval_result})
            compteur[eval_result["classification"]] += 1

        # Applique le coup à l'état pour continuer la simulation
        try:
            if coup["type"] == "poser":
                jouer_tour(etat, "poser",
                           piece_index=coup["piece_index"],
                           origine=tuple(coup["origine"]),
                           pouvoir=coup.get("pouvoir", "rien"))
            elif coup["type"] == "repiocher":
                jouer_tour(etat, "repiocher")
            elif coup["type"] == "scout":
                jouer_tour(etat, "scout")
            # Pouvoirs après puzzle : gérés par game_engine
        except Exception as e:
            print(f"[analyse] Erreur rejouant coup : {e}")
            break

    total_analyses = sum(compteur.values())
    if total_analyses > 0:
        # Score pondéré sur 100 :
        # ELMAAS=100, ELMAASYON=90, MASSY=85, NOTMESSY=70, MISSED=40, CHESS=15
        ponderation = {
            CLASSE_ELMAAS: 100, CLASSE_ELMAASYON: 90, CLASSE_MASSY: 85,
            CLASSE_NOTMESSY: 70, CLASSE_MISSED: 40, CLASSE_CHESS: 15,
        }
        precision = sum(ponderation[k] * v for k, v in compteur.items()) / total_analyses
    else:
        precision = 0

    return {
        "coups": coups_analyses,
        "stats": compteur,
        "precision_pct": round(precision, 1),
        "total_coups_analyses": total_analyses,
    }
