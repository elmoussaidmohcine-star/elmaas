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

# Paramètres de performance
MAX_COUPS_PAR_NIVEAU = 8   # était 15 → explosion exponentielle
MAX_SECONDES_PAR_COUP = 4  # timeout dur par coup analysé


def evaluer_etat(etat: EtatJeu, couleur_perspective: str) -> float:
    """Évaluation numérique d'un état pour un joueur."""
    scores = calculer_scores(etat)
    diff_cellules = scores.get(couleur_perspective, 0) - scores.get(
        "noir" if couleur_perspective == "rouge" else "rouge", 0
    )
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
            maximisant: bool, couleur_perspective: str,
            deadline: float = None) -> float:
    """Minimax avec élagage alpha-beta et timeout."""
    import time
    if deadline and time.time() > deadline:
        return evaluer_etat(etat, couleur_perspective)

    if profondeur == 0 or etat.manche_terminee:
        return evaluer_etat(etat, couleur_perspective)

    joueur = etat.joueur_actif()
    coups = lister_coups_possibles(etat, joueur)
    if not coups:
        return evaluer_etat(etat, couleur_perspective)

    # Limite dure pour éviter l'explosion exponentielle
    if len(coups) > MAX_COUPS_PAR_NIVEAU:
        coups = coups[:MAX_COUPS_PAR_NIVEAU]

    if maximisant:
        val = float("-inf")
        for piece_idx, origine in coups:
            if deadline and time.time() > deadline:
                break
            etat_copie = copy.deepcopy(etat)
            try:
                jouer_tour(etat_copie, "poser",
                           piece_index=piece_idx, origine=origine, pouvoir="rien")
                score = minimax(etat_copie, profondeur - 1, alpha, beta,
                                False, couleur_perspective, deadline)
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
            if deadline and time.time() > deadline:
                break
            etat_copie = copy.deepcopy(etat)
            try:
                jouer_tour(etat_copie, "poser",
                           piece_index=piece_idx, origine=origine, pouvoir="rien")
                score = minimax(etat_copie, profondeur - 1, alpha, beta,
                                True, couleur_perspective, deadline)
                val = min(val, score)
                beta = min(beta, val)
                if beta <= alpha:
                    break
            except Exception:
                continue
        return val


def evaluer_coup(etat_avant: EtatJeu, piece_index: int, origine: tuple,
                 profondeur: int = 2) -> dict:
    """
    Évalue un coup avec timeout dur par coup.
    profondeur=1 → rapide, profondeur=2 → profonde (était 3, trop lent).
    """
    import time
    deadline = time.time() + MAX_SECONDES_PAR_COUP

    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    coups_possibles = lister_coups_possibles(etat_avant, joueur)

    if not coups_possibles:
        return {
            "classification": CLASSE_NOTMESSY,
            "meilleur_coup": None,
            "score_joue": 0, "score_optimal": 0, "gain": 0,
        }

    # Limite les coups évalués
    coups_a_evaluer = coups_possibles[:MAX_COUPS_PAR_NIVEAU * 2]

    scores_coups = []
    for idx, org in coups_a_evaluer:
        if time.time() > deadline:
            break
        etat_test = copy.deepcopy(etat_avant)
        try:
            jouer_tour(etat_test, "poser",
                       piece_index=idx, origine=org, pouvoir="rien")
            score = minimax(etat_test, profondeur - 1,
                            float("-inf"), float("inf"),
                            False, couleur, deadline)
            scores_coups.append(((idx, org), score))
        except Exception:
            continue

    if not scores_coups:
        return {
            "classification": CLASSE_NOTMESSY,
            "meilleur_coup": None,
            "score_joue": 0, "score_optimal": 0, "gain": 0,
        }

    scores_coups.sort(key=lambda x: x[1], reverse=True)
    score_optimal = scores_coups[0][1]
    meilleur_coup = scores_coups[0][0]

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

    ecart = score_optimal - score_joue
    total_coups = len(scores_coups)
    rang_joue_reel = rang_joue if rang_joue >= 0 else total_coups

    est_meilleur = rang_joue_reel == 0
    est_top_3 = rang_joue_reel < min(3, total_coups)
    est_top_5 = rang_joue_reel < min(5, total_coups)

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
        "rang": rang_joue_reel + 1,
        "total_coups": total_coups,
    }
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


def snapshot_pieces(etat: EtatJeu) -> dict:
    """Copie légère des pièces posées (pour affichage Board dans EcranAnalyse)."""
    return dict(etat.plateau.pieces)


def analyser_partie_complete(coups_historique: list, etat_initial: EtatJeu,
                             couleur_joueur: str, profondeur: int = 2) -> dict:
    """
    Analyse chaque coup joué par `couleur_joueur` dans l'historique.
    - Utilise la couleur stockée dans le coup (pas l'état simulé) pour filtrer.
    - Continue même si un coup échoue au rejeu (ne break pas).
    - Timeout global 90s + timeout par coup 4s.
    """
    import time
    deadline_global = time.time() + 90

    etat = copy.deepcopy(etat_initial)
    coups_analyses = []
    compteur = {CLASSE_ELMAAS: 0, CLASSE_ELMAASYON: 0, CLASSE_MASSY: 0,
                CLASSE_NOTMESSY: 0, CLASSE_MISSED: 0, CLASSE_CHESS: 0}
    erreurs_consecutives = 0

    for i, coup in enumerate(coups_historique):
        if time.time() > deadline_global:
            print(f"[analyse] Timeout global — {len(coups_analyses)} coups analysés sur {len(coups_historique)}")
            break

        # Filtrage : on utilise la couleur stockée dans le coup lui-même,
        # pas couleur_trait déduit de l'état (qui peut être décalé si rejeu a planté).
        couleur_coup = coup.get("couleur", "")

        if coup["type"] == "poser" and couleur_coup == couleur_joueur:
            try:
                eval_result = evaluer_coup(
                    etat, coup["piece_index"], tuple(coup["origine"]), profondeur
                )
                coups_analyses.append({
                    **coup,
                    "evaluation": eval_result,
                    "plateau_avant": snapshot_pieces(etat),
                    "index_historique": i,
                })
                compteur[eval_result["classification"]] += 1
                erreurs_consecutives = 0
            except Exception as e_eval:
                print(f"[analyse] Erreur évaluation coup {i}: {e_eval}")
                # On enregistre quand même le coup comme NOTMESSY
                coups_analyses.append({
                    **coup,
                    "evaluation": {"classification": CLASSE_NOTMESSY, "meilleur_coup": None,
                                   "score_joue": 0, "score_optimal": 0, "gain": 0, "rang": 1, "total_coups": 1},
                    "plateau_avant": snapshot_pieces(etat),
                    "index_historique": i,
                })
                compteur[CLASSE_NOTMESSY] += 1

        # Rejouer le coup pour avancer l'état simulé
        try:
            if coup["type"] == "poser":
                # Si piece_data est disponible, injecter la pièce directement
                # pour un rejeu fidèle (évite les problèmes d'index décalés)
                piece_data = coup.get("piece_data")
                if piece_data and etat.joueur_actif().main_active is not None:
                    # Trouver la pièce correspondante dans la main ou l'insérer temporairement
                    joueur_replay = etat.joueur_actif()
                    piece_trouvee = False
                    for j, p in enumerate(joueur_replay.main_active):
                        if p.get("forme") == piece_data.get("forme") and p.get("enlevement") == piece_data.get("enlevement"):
                            jouer_tour(etat, "poser",
                                       piece_index=j,
                                       origine=tuple(coup["origine"]),
                                       pouvoir=coup.get("pouvoir", "rien"))
                            piece_trouvee = True
                            break
                    if not piece_trouvee:
                        # Fallback sur piece_index
                        jouer_tour(etat, "poser",
                                   piece_index=min(coup["piece_index"], len(joueur_replay.main_active) - 1),
                                   origine=tuple(coup["origine"]),
                                   pouvoir=coup.get("pouvoir", "rien"))
                else:
                    jouer_tour(etat, "poser",
                               piece_index=coup["piece_index"],
                               origine=tuple(coup["origine"]),
                               pouvoir=coup.get("pouvoir", "rien"))
            elif coup["type"] == "repiocher":
                jouer_tour(etat, "repiocher")
            elif coup["type"] == "scout":
                jouer_tour(etat, "scout")
            erreurs_consecutives = 0
        except Exception as e:
            print(f"[analyse] Erreur rejouant coup {i} ({coup.get('type')}): {e}")
            erreurs_consecutives += 1
            if erreurs_consecutives >= 5:
                print(f"[analyse] Trop d'erreurs consécutives, arrêt.")
                break

    total_analyses = sum(compteur.values())
    if total_analyses > 0:
        ponderation = {
            CLASSE_ELMAAS: 100, CLASSE_ELMAASYON: 90, CLASSE_MASSY: 85,
            CLASSE_NOTMESSY: 70, CLASSE_MISSED: 40, CLASSE_CHESS: 15,
        }
        precision = sum(ponderation[k] * v for k, v in compteur.items()) / total_analyses
    else:
        precision = 0

    print(f"[analyse] Terminé : {total_analyses} coups analysés sur {len(coups_historique)} dans l'historique")

    return {
        "coups": coups_analyses,
        "stats": compteur,
        "precision_pct": round(precision, 1),
        "total_coups_analyses": total_analyses,
    }