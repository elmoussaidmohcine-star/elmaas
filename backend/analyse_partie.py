# ELMAAS — analyse_partie.py
# Analyse d'une partie jouée : rejoue chaque coup du joueur,
# compare avec le meilleur coup selon minimax indépendant,
# classifie en ELMAAS / ELMAASYON / MASSY / NOTMESSY / MISSED / CHESS

import copy
from game_engine import jouer_tour, calculer_scores, EtatJeu
from ai_player import jouer_ia
from pieces_generator import cellules_absolues, placement_valide


# Classes de coups (meilleur → pire)
CLASSE_ELMAAS    = "ELMAAS"     # Brilliant : meilleur coup + gain fort (puzzles complétés)
CLASSE_ELMAASYON = "ELMAASYON"  # Great : top 3 + gain solide
CLASSE_MASSY     = "MASSY"      # Best : meilleur coup objectif sans gain spectaculaire
CLASSE_NOTMESSY  = "NOTMESSY"   # Good : top 5, écart faible
CLASSE_MISSED    = "MISSED"     # Bad : rate une opportunité claire
CLASSE_CHESS     = "CHESS"      # Worst : perte nette significative


def evaluer_etat(etat: EtatJeu, couleur_perspective: str) -> float:
    """
    Évaluation numérique d'un état pour un joueur.
    Indépendante de l'IA — mesure objective de la position.
    """
    scores = calculer_scores(etat)
    moi = scores.get(couleur_perspective, 0)
    adv = scores.get("noir" if couleur_perspective == "rouge" else "rouge", 0)

    # Différentiel de cellules dans les puzzles complétés
    diff_cellules = moi - adv

    # Bonus pour les puzzles quasi-complets favorables (1-2 cases manquantes)
    bonus_imminence = 0
    couleur_adverse = "noir" if couleur_perspective == "rouge" else "rouge"
    for puzzle in etat.plateau.puzzles.values():
        if puzzle.complete_par or puzzle.brise:
            continue
        nb_moi = sum(1 for r, c in puzzle.cellules
                     if etat.plateau.pieces.get(f"{r},{c}") == couleur_perspective)
        nb_adv = sum(1 for r, c in puzzle.cellules
                     if etat.plateau.pieces.get(f"{r},{c}") == couleur_adverse)
        nb_vide = sum(1 for r, c in puzzle.cellules
                      if etat.plateau.pieces.get(f"{r},{c}") is None)
        nb_total = len(puzzle.cellules)

        if puzzle.type_couleur in ("mono_rouge", "mono_noir"):
            gagnant = "rouge" if puzzle.type_couleur == "mono_rouge" else "noir"
            if gagnant == couleur_perspective and nb_adv == 0 and nb_vide <= 2:
                bonus_imminence += nb_total * 0.5  # Puzzle que je vais compléter bientôt
            elif gagnant == couleur_adverse and nb_moi == 0 and nb_vide <= 2:
                bonus_imminence -= nb_total * 0.5  # Puzzle que l'adversaire va compléter bientôt
        else:  # mixte
            avance = nb_moi - nb_adv
            if nb_vide <= 2:
                bonus_imminence += avance * 0.3

    # Bonus série
    j = etat.joueur1 if etat.joueur1.couleur == couleur_perspective else etat.joueur2
    bonus_serie = j.serie_actuelle * 1.5

    return diff_cellules + bonus_imminence + bonus_serie


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

    if len(coups) > 8:
        coups = coups[:8]

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
                 profondeur: int = 1) -> dict:
    """
    Évalue objectivement un coup par rapport au meilleur coup disponible.
    Utilise minimax indépendant de l'IA.
    """
    import time
    deadline = time.time() + 4  # 4s max par coup

    joueur = etat_avant.joueur_actif()
    couleur = joueur.couleur
    coups_possibles = lister_coups_possibles(etat_avant, joueur)

    if not coups_possibles:
        return {"classification": CLASSE_NOTMESSY, "meilleur_coup": None,
                "score_joue": 0, "score_optimal": 0, "gain": 0,
                "rang": 1, "total_coups": 1}

    # Évaluer tous les coups légaux (limité pour performance)
    coups_a_evaluer = coups_possibles[:16]
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
        return {"classification": CLASSE_NOTMESSY, "meilleur_coup": None,
                "score_joue": 0, "score_optimal": 0, "gain": 0,
                "rang": 1, "total_coups": 1}

    scores_coups.sort(key=lambda x: x[1], reverse=True)
    score_optimal = scores_coups[0][1]
    meilleur_coup = scores_coups[0][0]

    # Trouver le score du coup joué
    score_joue = None
    rang_joue = 0
    for i, ((idx, org), s) in enumerate(scores_coups):
        if idx == piece_index and tuple(org) == tuple(origine):
            score_joue = s
            rang_joue = i
            break
    if score_joue is None:
        score_joue = score_optimal
        rang_joue = 0

    # Gain réel (cellules de puzzles complétés par ce coup)
    etat_apres = copy.deepcopy(etat_avant)
    couleur_coup = joueur.couleur
    try:
        res = jouer_tour(etat_apres, "poser",
                         piece_index=piece_index, origine=origine, pouvoir="rien")
        puzzles_c = res.get("puzzles_completes", [])
        gain_cellules = sum(len(p.cellules) for p in puzzles_c) if puzzles_c else 0
        nb_puzzles = len(puzzles_c) if puzzles_c else 0
        # Série du joueur après le coup (chercher par couleur, pas par index)
        j1a = etat_apres.joueur1
        j2a = etat_apres.joueur2
        jap = j1a if j1a.couleur == couleur_coup else j2a
        nouvelle_serie = jap.serie_actuelle
    except Exception:
        gain_cellules = 0
        nb_puzzles = 0
        nouvelle_serie = joueur.serie_actuelle

    ecart = score_optimal - score_joue
    total_coups = len(scores_coups)

    # ── Classification objective ──────────────────────────────
    # Basée sur le rang et l'écart réels — aucun biais en faveur d'une IA.
    est_meilleur = (rang_joue == 0)
    est_top3     = (rang_joue < min(3, total_coups))
    est_top5     = (rang_joue < min(5, total_coups))

    if est_meilleur and (nb_puzzles >= 2 or (nb_puzzles >= 1 and gain_cellules >= 6) or nouvelle_serie >= 3):
        classification = CLASSE_ELMAAS
    elif est_top3 and (nb_puzzles >= 1 and gain_cellules >= 4):
        classification = CLASSE_ELMAASYON
    elif est_meilleur:
        classification = CLASSE_MASSY
    elif est_top5 and ecart <= 2:
        classification = CLASSE_NOTMESSY
    elif ecart >= 5:
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
    return dict(etat.plateau.pieces)


def analyser_partie_complete(coups_historique: list, etat_initial: EtatJeu,
                             couleur_joueur, profondeur: int = 1) -> dict:
    """
    Analyse chaque coup joué.
    couleur_joueur : "rouge", "noir", ou None (= analyser les deux joueurs).
    Timeout global 90s.
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
            print(f"[analyse] Timeout global — {len(coups_analyses)} coups analysés")
            break

        couleur_coup = coup.get("couleur", "")
        doit_analyser = (couleur_joueur is None or couleur_coup == couleur_joueur)

        if coup["type"] == "poser" and doit_analyser:
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
            except Exception as e:
                print(f"[analyse] Erreur évaluation coup {i}: {e}")
                coups_analyses.append({
                    **coup,
                    "evaluation": {"classification": CLASSE_NOTMESSY,
                                   "meilleur_coup": None, "score_joue": 0,
                                   "score_optimal": 0, "gain": 0,
                                   "rang": 1, "total_coups": 1},
                    "plateau_avant": snapshot_pieces(etat),
                    "index_historique": i,
                })
                compteur[CLASSE_NOTMESSY] += 1

        # Rejouer le coup pour avancer l'état simulé
        try:
            if coup["type"] == "poser":
                piece_data = coup.get("piece_data")
                if piece_data and etat.joueur_actif().main_active:
                    joueur_r = etat.joueur_actif()
                    piece_trouvee = False
                    for j, p in enumerate(joueur_r.main_active):
                        if (p.get("forme") == piece_data.get("forme") and
                                p.get("enlevement") == piece_data.get("enlevement")):
                            jouer_tour(etat, "poser", piece_index=j,
                                       origine=tuple(coup["origine"]),
                                       pouvoir=coup.get("pouvoir", "rien"))
                            piece_trouvee = True
                            break
                    if not piece_trouvee:
                        idx_safe = min(coup["piece_index"],
                                       len(joueur_r.main_active) - 1)
                        jouer_tour(etat, "poser", piece_index=idx_safe,
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
            print(f"[analyse] Erreur rejouant coup {i}: {e}")
            erreurs_consecutives += 1
            if erreurs_consecutives >= 5:
                print("[analyse] Trop d'erreurs, arrêt.")
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

    print(f"[analyse] Terminé : {total_analyses} coups analysés sur {len(coups_historique)}")

    return {
        "coups": coups_analyses,
        "stats": compteur,
        "precision_pct": round(precision, 1),
        "total_coups_analyses": total_analyses,
    }