# ============================================================
#  ELMAAS — ai_player.py
#  IA joueur — 3 niveaux de difficulté
#  Niveau 1 : Aléatoire
#  Niveau 2 : Stratégique (greedy — maximise les puzzles complétés)
#  Niveau 3 : Expert (minimax léger + blocage adversaire)
# ============================================================

import random
from pieces_generator import cellules_absolues, placement_valide
import config  # Import du module entier pour lire TAILLE_TAB dynamiquement


# ── Utilitaires ──────────────────────────────────────────────

def get_taille():
    """Lit TAILLE_TAB depuis config à chaque appel (supporte le changement dynamique)."""
    return config.TAILLE_TAB


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
        possibles = placements_possibles(piece, etat.plateau.pieces, get_taille())
        if possibles:
            origine = random.choice(possibles)
            if config.DEBUG:
                print(f"[IA-1] pose {piece['forme']} en {origine}")
            return idx, origine

    return None


def ia_niveau_2(etat, joueur):
    """
    Niveau 2 — Stratégique avancé.
    Greedy + blocage adversaire + pénalité pour aider l'adversaire.
    Sait utiliser les pièces d'enlèvement.
    """
    main = joueur.main_active
    puzzles = etat.plateau.puzzles
    pieces_plateau = etat.plateau.pieces
    couleur = joueur.couleur
    couleur_adverse = "noir" if couleur == "rouge" else "rouge"

    meilleur = None
    meilleur_score = -999

    for idx, piece in enumerate(main):
        possibles = placements_possibles(piece, pieces_plateau, get_taille())
        for origine in possibles:
            nouvelles_pieces = simuler_pose(pieces_plateau, piece, origine, couleur, get_taille())

            # Score offensif
            puzzles_finis = compter_puzzles_completes(nouvelles_pieces, puzzles, couleur)
            score_cellules = score_cellules_dans_puzzles(piece, origine, puzzles, couleur, get_taille())
            bonus_enlev = score_enlevement(piece, origine, pieces_plateau, puzzles, couleur, get_taille())

            # Score défensif
            if not piece.get("enlevement"):
                score_def = score_blocage_adversaire(piece, origine, puzzles, couleur_adverse, get_taille())
            else:
                score_def = 0

            # Pénalité : aider l'adversaire
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
        if config.DEBUG:
            print(f"[IA-2] pose {main[meilleur[0]]['forme']} en {meilleur[1]} (score={meilleur_score})")
    return meilleur


def evaluer_position_globale(pieces_plateau, puzzles, couleur, couleur_adverse) -> float:
    """
    Évalue la qualité d'une position pour `couleur`.
    Prend en compte :
    - Puzzles complétés (valeur acquise)
    - Puzzles quasi-complets (1-2 cases manquantes = menace immédiate)
    - Contrôle territorial dans chaque puzzle
    - Urgence : bloquer l'adversaire avant qu'il complète
    """
    score = 0.0

    for puzzle in puzzles.values():
        if puzzle.brise:
            continue

        cellules = puzzle.cellules
        nb_total = len(cellules)
        if nb_total == 0:
            continue

        # ── Puzzles déjà complétés ──
        if puzzle.complete_par == couleur:
            score += nb_total * 12.0
            continue
        if puzzle.complete_par == couleur_adverse:
            score -= nb_total * 12.0
            continue

        # ── Puzzle en cours : analyser la progression ──
        nb_moi = 0
        nb_adv = 0
        nb_vide = 0
        for r, c in cellules:
            v = pieces_plateau.get(f"{r},{c}")
            if v is None:
                nb_vide += 1
            elif v == couleur:
                nb_moi += 1
            elif v == couleur_adverse:
                nb_adv += 1
            # diamant : neutre, ignoré

        nb_posees = nb_moi + nb_adv
        pct_rempli = nb_posees / nb_total

        if puzzle.type_couleur in ("mono_rouge", "mono_noir"):
            gagnant_naturel = "rouge" if puzzle.type_couleur == "mono_rouge" else "noir"

            if gagnant_naturel == couleur:
                if nb_adv == 0:
                    # Puzzle pur pour moi
                    # Bonus fort si quasi-complet (urgence de finir)
                    if nb_vide <= 2:
                        score += nb_total * 8.0  # Très proche de la victoire
                    else:
                        score += nb_moi * 4.0 + pct_rempli * nb_total * 2.0
                else:
                    # Contaminé : je dois soit bloquer soit abandonner
                    # Plus l'adversaire a de cases, moins ça vaut
                    score += nb_moi * 1.0 - nb_adv * 3.0
            else:
                # Puzzle favorable à l'adversaire
                if nb_moi == 0:
                    # Pas encore bloqué : l'adversaire peut le compléter
                    if nb_vide <= 2:
                        score -= nb_total * 8.0  # URGENT : bloquer !
                    else:
                        score -= nb_adv * 4.0 - pct_rempli * nb_total * 1.0
                else:
                    # J'ai des pièces dedans → je bloque activement
                    score += nb_moi * 3.0 - nb_adv * 1.0

        else:  # mixte
            # Le prochain à compléter gagne → avantage au plus avancé
            avance = nb_moi - nb_adv
            if nb_vide <= 2 and nb_posees > 0:
                # Quasi-complet : très précieux si je suis en avance
                score += avance * 6.0 + pct_rempli * 3.0
            else:
                score += avance * 2.0 + pct_rempli * 1.5

    return score


def meilleure_reponse_adverse(etat_simule, couleur_adverse, top_n=5):
    """
    Simule rapidement le meilleur coup de l'adversaire (greedy pur, limité à top_n coups).
    Retourne le score résultant pour l'adversaire après son meilleur coup.
    """
    joueur_adv = etat_simule.joueur_actif()
    if joueur_adv.couleur != couleur_adverse:
        joueur_adv = etat_simule.joueur_adverse()

    pieces_plateau = etat_simule.plateau.pieces
    puzzles = etat_simule.plateau.puzzles
    taille = get_taille()
    couleur_moi = "noir" if couleur_adverse == "rouge" else "rouge"

    meilleur_score_adv = -9999.0
    candidats = []

    for idx, piece in enumerate(joueur_adv.main_active):
        possibles = placements_possibles(piece, pieces_plateau, taille)
        for origine in possibles:
            nouvelles = simuler_pose(pieces_plateau, piece, origine, couleur_adverse, taille)
            puzzles_adv = compter_puzzles_completes(nouvelles, puzzles, couleur_adverse)
            sc = puzzles_adv * 200 + score_cellules_dans_puzzles(
                piece, origine, puzzles, couleur_adverse, taille)
            candidats.append((sc, nouvelles))

    if not candidats:
        return evaluer_position_globale(pieces_plateau, puzzles, couleur_moi, couleur_adverse)

    candidats.sort(key=lambda x: x[0], reverse=True)
    # Évaluer les top_n meilleurs coups adverses et retourner le pire pour moi
    pire_pour_moi = 9999.0
    for _, nouvelles in candidats[:top_n]:
        val = evaluer_position_globale(nouvelles, puzzles, couleur_moi, couleur_adverse)
        if val < pire_pour_moi:
            pire_pour_moi = val

    return pire_pour_moi


def ia_niveau_3(etat, joueur):
    """
    Niveau 3 — ELMAAS (Expert).

    Hiérarchie de décision stricte :
    1. COMPLÉTION IMMÉDIATE : si un coup complète ≥1 puzzle, choisir celui
       qui maximise les cellules gagnées + score positionnel. Jamais passer
       cette opportunité — c'est la règle absolue.
    2. BLOCAGE URGENT : si l'adversaire peut compléter un puzzle au prochain
       coup (1-2 cases vides), le bloquer immédiatement même si ça coûte
       du positionnement.
    3. LOOK-AHEAD : si ni complétion ni urgence, simuler la meilleure
       réponse adverse sur les 10 meilleurs candidats greedy et choisir
       le coup qui laisse la meilleure position après la réponse adverse.
    """
    main = joueur.main_active
    if not main:
        return None

    puzzles = etat.plateau.puzzles
    pieces_plateau = etat.plateau.pieces
    couleur = joueur.couleur
    couleur_adverse = "noir" if couleur == "rouge" else "rouge"
    taille = get_taille()

    # ── PHASE 1 : chercher toutes les complétions directes ───
    completions = []  # (gain_cellules, idx, origine)

    for idx, piece in enumerate(main):
        if piece.get("enlevement"):
            continue  # Phase 1 : pièces normales seulement
        possibles = placements_possibles(piece, pieces_plateau, taille)
        for origine in possibles:
            nouvelles = simuler_pose(pieces_plateau, piece, origine, couleur, taille)
            nb_finis = compter_puzzles_completes(nouvelles, puzzles, couleur)
            if nb_finis > 0:
                # Compter les cellules exactes gagnées
                gain = 0
                for puzzle in puzzles.values():
                    if puzzle.complete_par == couleur or puzzle.brise:
                        continue
                    cellules = puzzle.cellules
                    couleurs_apres = {nouvelles.get(f"{r},{c}") for r, c in cellules}
                    couleurs_apres.discard(None)
                    a_diamant = "diamant" in couleurs_apres
                    cj = couleurs_apres - {"diamant"}
                    if all(nouvelles.get(f"{r},{c}") is not None for r, c in cellules):
                        if puzzle.type_couleur == "mono_rouge" and not a_diamant and cj == {"rouge"}:
                            gain += len(cellules)
                        elif puzzle.type_couleur == "mono_noir" and not a_diamant and cj == {"noir"}:
                            gain += len(cellules)
                        elif puzzle.type_couleur == "mixte" and "rouge" in cj and "noir" in cj:
                            gain += len(cellules)
                # Score de tie-break : progression positionnelle
                s_pos = score_cellules_dans_puzzles(piece, origine, puzzles, couleur, taille)
                completions.append((gain * 100 + s_pos, gain, idx, origine))

    if completions:
        # Choisir la complétion qui maximise le gain
        completions.sort(reverse=True)
        _, _, idx_ret, org_ret = completions[0]
        if config.DEBUG:
            print(f"[IA-3] COMPLÉTION: {main[idx_ret]['forme']} @ {org_ret} gain={completions[0][1]}")
        return idx_ret, org_ret

    # ── PHASE 2 : détection de blocage urgent ────────────────
    # Puzzle adverse quasi-complet (≤2 cases vides, 0 de mes pièces dedans)
    puzzles_urgents = []
    for puzzle in puzzles.values():
        if puzzle.complete_par or puzzle.brise:
            continue
        gagnant_nat = "rouge" if puzzle.type_couleur == "mono_rouge" else \
                      "noir" if puzzle.type_couleur == "mono_noir" else None
        if gagnant_nat != couleur_adverse:
            continue
        nb_adv = sum(1 for r, c in puzzle.cellules
                     if pieces_plateau.get(f"{r},{c}") == couleur_adverse)
        nb_moi = sum(1 for r, c in puzzle.cellules
                     if pieces_plateau.get(f"{r},{c}") == couleur)
        nb_vide = sum(1 for r, c in puzzle.cellules
                      if pieces_plateau.get(f"{r},{c}") is None)
        if nb_adv > 0 and nb_moi == 0 and nb_vide <= 2:
            puzzles_urgents.append(puzzle)

    if puzzles_urgents:
        # Trouver le coup qui bloque un puzzle urgent
        meilleur_blocage = None
        meilleur_s = -9999
        for idx, piece in enumerate(main):
            if piece.get("enlevement"):
                continue
            possibles = placements_possibles(piece, pieces_plateau, taille)
            for origine in possibles:
                absolues = set(cellules_absolues(piece, origine))
                for puzzle in puzzles_urgents:
                    if any(pos in puzzle.cellules for pos in absolues):
                        # Ce coup bloque le puzzle urgent
                        s = (len(puzzle.cellules) * 10
                             + score_cellules_dans_puzzles(piece, origine, puzzles, couleur, taille))
                        if s > meilleur_s:
                            meilleur_s = s
                            meilleur_blocage = (idx, origine)
        if meilleur_blocage:
            if config.DEBUG:
                print(f"[IA-3] BLOCAGE URGENT @ {meilleur_blocage[1]}")
            return meilleur_blocage

    # ── PHASE 3 : look-ahead sur top-10 candidats greedy ────
    candidats = []  # (score_greedy, idx, origine)

    for idx, piece in enumerate(main):
        est_enlev = piece.get("enlevement", False)
        possibles = placements_possibles(piece, pieces_plateau, taille)
        for origine in possibles:
            if est_enlev:
                s = score_enlevement(piece, origine, pieces_plateau, puzzles, couleur, taille) * 3
            else:
                s = score_cellules_dans_puzzles(piece, origine, puzzles, couleur, taille) * 2
                # Pénalité : poser dans un puzzle mono adverse avec des pièces adverses dedans
                absolues = cellules_absolues(piece, origine)
                for r, c in absolues:
                    for puzzle in puzzles.values():
                        if puzzle.complete_par or puzzle.brise:
                            continue
                        if (r, c) not in puzzle.cellules:
                            continue
                        nb_adv_p = sum(1 for rr, cc in puzzle.cellules
                                       if pieces_plateau.get(f"{rr},{cc}") == couleur_adverse)
                        if puzzle.type_couleur == "mono_rouge" and couleur == "noir" and nb_adv_p > 0:
                            s -= 15
                        elif puzzle.type_couleur == "mono_noir" and couleur == "rouge" and nb_adv_p > 0:
                            s -= 15
            candidats.append((s, idx, origine))

    if not candidats:
        return None

    candidats.sort(reverse=True)
    top10 = candidats[:10]

    # Look-ahead : simuler meilleure réponse adverse sur top-10
    meilleur_score_final = float("-inf")
    meilleur = (top10[0][1], top10[0][2])  # fallback

    for s_greedy, idx, origine in top10:
        piece = main[idx]
        nouvelles = simuler_pose(pieces_plateau, piece, origine, couleur, taille)

        # Évaluer position après mon coup
        pos_moi = evaluer_position_globale(nouvelles, puzzles, couleur, couleur_adverse)

        # Simuler la réponse adverse (greedy léger, max 3 pièces adverses × 15 origines)
        joueur_adv = etat.joueur_adverse()
        pire_pour_moi = pos_moi
        for idx_adv, piece_adv in enumerate(joueur_adv.main_active[:3]):
            if piece_adv.get("enlevement"):
                continue
            possibles_adv = placements_possibles(piece_adv, nouvelles, taille)
            scores_adv = []
            for org_adv in possibles_adv[:15]:
                nouv_adv = simuler_pose(nouvelles, piece_adv, org_adv, couleur_adverse, taille)
                s_adv = (compter_puzzles_completes(nouv_adv, puzzles, couleur_adverse) * 100
                         + score_cellules_dans_puzzles(piece_adv, org_adv, puzzles,
                                                       couleur_adverse, taille))
                scores_adv.append((s_adv, nouv_adv))
            if scores_adv:
                scores_adv.sort(key=lambda x: x[0], reverse=True)
                val = evaluer_position_globale(scores_adv[0][1], puzzles, couleur, couleur_adverse)
                pire_pour_moi = min(pire_pour_moi, val)

        # Score final : combinaison greedy + look-ahead
        score_final = s_greedy * 0.3 + pire_pour_moi * 0.7
        if score_final > meilleur_score_final:
            meilleur_score_final = score_final
            meilleur = (idx, origine)

    if config.DEBUG:
        print(f"[IA-3] LOOKAHEAD: {main[meilleur[0]]['forme']} @ {meilleur[1]} ({meilleur_score_final:.1f})")
    return meilleur




# ══════════════════════════════════════════════════════════════
# NIVEAU 4 — ELMAAS GRANDMASTER (ELO 2500+)
# Minimax profondeur 2 + évaluation positionnelle avancée
# ══════════════════════════════════════════════════════════════

def _lister_coups_possibles(etat, joueur):
    """Génère tous les coups légaux (pièce_index, origine)."""
    coups = []
    taille = get_taille()
    for idx, piece in enumerate(joueur.main_active):
        for r in range(taille):
            for c in range(taille):
                valide, _ = placement_valide(piece, (r, c), etat.plateau.pieces, taille)
                if valide:
                    coups.append((idx, (r, c)))
    return coups


def _evaluer_main(joueur, etat):
    """Évalue la qualité des pièces en main (0-10)."""
    if not joueur.main_active:
        return 0
    score = 0
    taille = get_taille()
    for piece in joueur.main_active:
        possibles = placements_possibles(piece, etat.plateau.pieces, taille)
        if len(possibles) > 0:
            score += min(len(possibles), 5)  # Plus de placements = plus utile
        else:
            score -= 2  # Pièce inplaçable = mauvaise
    return score / max(len(joueur.main_active), 1)


def evaluer_position_elo2500(etat, couleur_perspective):
    """
    Évaluation fine pour ELO 2500+.
    Prend en compte : puzzles, imminence, territoire, séries, matériel.
    """
    scores = calculer_scores(etat)
    moi = scores.get(couleur_perspective, 0)
    adv = scores.get("noir" if couleur_perspective == "rouge" else "rouge", 0)
    diff_cellules = moi - adv
    couleur_adverse = "noir" if couleur_perspective == "rouge" else "rouge"

    score = 0.0
    nb_puzzles_moi = 0
    nb_puzzles_adv = 0

    for puzzle in etat.plateau.puzzles.values():
        if puzzle.brise:
            continue
        nb_total = len(puzzle.cellules)
        if nb_total == 0:
            continue

        # Déjà complété
        if puzzle.complete_par == couleur_perspective:
            score += nb_total * 12.0
            nb_puzzles_moi += 1
            continue
        if puzzle.complete_par == couleur_adverse:
            score -= nb_total * 12.0
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

        pct_rempli = 1.0 - (nb_vide / nb_total)
        a_diamant = nb_diamant > 0

        if puzzle.type_couleur in ("mono_rouge", "mono_noir"):
            gagnant = "rouge" if puzzle.type_couleur == "mono_rouge" else "noir"
            if gagnant == couleur_perspective:
                # Puzzle naturellement à moi
                if nb_adv == 0 and not a_diamant:
                    if nb_vide <= 1:
                        score += nb_total * 10.0   # Victoire imminente
                    elif nb_vide <= 3:
                        score += nb_total * 5.0    # Très proche
                    else:
                        score += nb_moi * 3.0 + pct_rempli * nb_total * 1.5
                else:
                    # Contaminé par adverse ou diamant
                    score += nb_moi * 1.5 - nb_adv * 4.0 - nb_diamant * 2.0
            else:
                # Puzzle naturellement adverse
                if nb_moi == 0 and not a_diamant:
                    if nb_vide <= 1:
                        score -= nb_total * 10.0   # URGENT : adverse gagne bientôt
                    elif nb_vide <= 3:
                        score -= nb_total * 6.0
                    else:
                        score -= nb_adv * 3.0 + pct_rempli * nb_total * 1.5
                else:
                    # Je bloque activement
                    score += nb_moi * 4.0 - nb_adv * 1.5
        else:
            # Mixte : celui qui a l'avance et complète en premier gagne
            avance = nb_moi - nb_adv
            if nb_vide <= 1 and (nb_moi > 0 or nb_adv > 0):
                score += avance * 8.0 + pct_rempli * 4.0
            elif nb_vide <= 3:
                score += avance * 4.0 + pct_rempli * 2.0
            else:
                score += avance * 1.5 + pct_rempli * 0.8

    # Bonus série (très important pour les pouvoirs)
    j = etat.joueur1 if etat.joueur1.couleur == couleur_perspective else etat.joueur2
    adv_j = etat.joueur2 if j == etat.joueur1 else etat.joueur1
    score += j.serie_actuelle * 8.0
    score -= adv_j.serie_actuelle * 5.0

    # Matériel (pièces restantes)
    score += len(j.main_active) * 1.5
    score += len(j.reserve) * 1.0
    score -= len(adv_j.main_active) * 1.0
    score -= len(adv_j.reserve) * 0.8

    # Danger : plus de pièces et aucun puzzle complété = mort
    if not j.reserve and not j.main_active:
        if nb_puzzles_moi == 0:
            score -= 80.0  # Défaite quasi-certaine
        else:
            score -= 20.0  # Régénération coûteuse

    # Qualité de la main
    score += _evaluer_main(j, etat) * 2.0

    return diff_cellules + score


def _heuristique_rapide(etat, idx, origine, couleur, couleur_adv):
    """Score rapide pour filtrer les coups (pas cher)."""
    piece = etat.joueur_actif().main_active[idx]
    nouvelles = simuler_pose(etat.plateau.pieces, piece, origine, couleur, get_taille())
    puzzles_finis = compter_puzzles_completes(nouvelles, etat.plateau.puzzles, couleur)
    sc = score_cellules_dans_puzzles(piece, origine, etat.plateau.puzzles, couleur, get_taille())
    bloc = score_blocage_adversaire(piece, origine, etat.plateau.puzzles, couleur_adv, get_taille())
    enlev = score_enlevement(piece, origine, etat.plateau.pieces, etat.plateau.puzzles, couleur, get_taille())
    return puzzles_finis * 200 + sc * 3 + bloc * 2 + enlev * 6


def _meilleurs_coups(etat, joueur, n_max=40):
    """Retourne les n_max meilleurs coups selon heuristique rapide."""
    coups = _lister_coups_possibles(etat, joueur)
    if not coups:
        return []
    couleur = joueur.couleur
    couleur_adv = "noir" if couleur == "rouge" else "rouge"
    scores = []
    for idx, orig in coups:
        s = _heuristique_rapide(etat, idx, orig, couleur, couleur_adv)
        scores.append((s, idx, orig))
    scores.sort(key=lambda x: x[0], reverse=True)
    return [(idx, orig) for _, idx, orig in scores[:n_max]]


def _simuler_coup(etat, idx, origine):
    """Simule un coup poser et retourne l'état modifié (deepcopy)."""
    import copy
    e = copy.deepcopy(etat)
    try:
        from game_engine import jouer_tour
        res = jouer_tour(e, "poser", piece_index=idx, origine=list(origine), pouvoir="rien")
        # Si attente pouvoir, on consomme automatiquement "rien" pour simplifier
        if res.get("attente_pouvoir") and not res.get("victoire_immediate"):
            from game_engine import appliquer_pouvoir
            appliquer_pouvoir(e, "rien")
            if not e.manche_terminee:
                e.passer_tour()
        return e, res
    except Exception:
        return None, None


def _coup_adverse_greedy(etat, niveau_adv=2):
    """Simule le meilleur coup adverse (greedy)."""
    adv = etat.joueur_actif()
    if niveau_adv == 2:
        return ia_niveau_2(etat, adv)
    return ia_niveau_1(etat, adv)


def ia_niveau_4(etat, joueur):
    """
    ELMAAS Grandmaster — Minimax profondeur 2 avec évaluation ELO 2500.
    """
    import copy, time
    deadline = time.time() + 2.5  # 2.5s max
    couleur = joueur.couleur
    couleur_adv = "noir" if couleur == "rouge" else "rouge"

    # 1. Coups gagnants immédiats (série 5)
    coups = _lister_coups_possibles(etat, joueur)
    for idx, orig in coups:
        if time.time() > deadline:
            break
        e_test, res = _simuler_coup(etat, idx, orig)
        if res and res.get("victoire_immediate"):
            if config.DEBUG:
                print(f"[IA-4] VICTOIRE IMMÉDIATE détectée : {orig}")
            return idx, orig

    # 2. Générer top 30 coups
    meilleurs = _meilleurs_coups(etat, joueur, n_max=30)
    if not meilleurs:
        return None

    # 3. Minimax profondeur 2
    meilleur_score = float("-inf")
    meilleur_coup = meilleurs[0]

    for idx, orig in meilleurs:
        if time.time() > deadline:
            break

        e1, res1 = _simuler_coup(etat, idx, orig)
        if e1 is None:
            continue

        # Si victoire immédiate, score maximal
        if res1 and res1.get("victoire_immediate"):
            return idx, orig

        # Simuler réponse adverse (top 5 coups adverses)
        adv_coups = _meilleurs_coups(e1, e1.joueur_actif(), n_max=8)
        pire_score = float("inf")

        if not adv_coups:
            # Adverse ne peut pas jouer → évaluation directe
            pire_score = evaluer_position_elo2500(e1, couleur)
        else:
            for adv_idx, adv_orig in adv_coups:
                if time.time() > deadline:
                    break
                e2, res2 = _simuler_coup(e1, adv_idx, adv_orig)
                if e2 is None:
                    continue
                val = evaluer_position_elo2500(e2, couleur)
                if val < pire_score:
                    pire_score = val
                if pire_score < meilleur_score:
                    break  # Élagage : déjà pire que notre meilleur

        # Score final = minimax (on maximise le pire cas adverse)
        if pire_score > meilleur_score:
            meilleur_score = pire_score
            meilleur_coup = (idx, orig)

    if config.DEBUG:
        print(f"[IA-4] Choix : {joueur.main_active[meilleur_coup[0]]['forme']} @ {meilleur_coup[1]} (score={meilleur_score:.1f})")
    return meilleur_coup


def choisir_pouvoir_niveau_4(etat, joueur, puzzles_completes):
    """
    Choisit le meilleur pouvoir après complétion de puzzle.
    Retourne : ('rien', None) | ('echanger', position) | ('extraire', [pos1, pos2])
    """
    import random
    couleur = joueur.couleur
    adv = etat.joueur_adverse()
    couleur_adv = adv.couleur

    # Si série >= 4 : on est proche de victoire immédiate, ne pas gaspiller
    if joueur.serie_actuelle >= 4:
        return "rien", None

    # Si série >= 3 : extraire est disponible
    if joueur.serie_actuelle >= 3:
        # Chercher les meilleures cases adverses à extraire
        cibles = []
        for (r, c), val in etat.plateau.pieces.items():
            if val == couleur_adv:
                # Évaluer l'importance de cette case
                importance = 0
                pos = (int(r), int(c)) if isinstance(r, str) else (r, c)
                for puzzle in etat.plateau.puzzles.values():
                    if puzzle.complete_par or puzzle.brise:
                        continue
                    if pos in puzzle.cellules:
                        nb_vide = sum(1 for rr, cc in puzzle.cellules
                                      if etat.plateau.pieces.get(f"{rr},{cc}") is None)
                        if nb_vide <= 2:
                            importance += len(puzzle.cellules) * 3  # Bloque puzzle quasi-complet
                        else:
                            importance += len(puzzle.cellules)
                cibles.append((importance, pos))
        cibles.sort(reverse=True)
        if cibles:
            nb = min(2, len(cibles))
            extraire = [cibles[i][1] for i in range(nb)]
            return "extraire", extraire

    # Sinon : échanger une case adverse importante
    best_cible = None
    best_score = -1
    for (r, c), val in etat.plateau.pieces.items():
        if val == couleur_adv:
            pos = (int(r), int(c)) if isinstance(r, str) else (r, c)
            score = 0
            for puzzle in etat.plateau.puzzles.values():
                if puzzle.complete_par or puzzle.brise:
                    continue
                if pos in puzzle.cellules:
                    nb_vide = sum(1 for rr, cc in puzzle.cellules
                                  if etat.plateau.pieces.get(f"{rr},{cc}") is None)
                    if nb_vide <= 2:
                        score += len(puzzle.cellules) * 2
                    else:
                        score += len(puzzle.cellules) * 0.5
            if score > best_score:
                best_score = score
                best_cible = pos
    if best_cible and best_score >= 3:
        return "echanger", best_cible

    return "rien", None


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
    elif niveau >= 4:
        return ia_niveau_4(etat, joueur)
    else:
        return ia_niveau_1(etat, joueur)