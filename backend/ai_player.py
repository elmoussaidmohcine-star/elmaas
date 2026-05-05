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
# NIVEAU 4 — ELMAAS  (le jeu porte son nom, le robot aussi)
#
# Architecture de décision :
#   Phase 0 — Victoire immédiate série 5 ?
#   Phase 1 — Je complète un puzzle ce tour ? (normal + mixte via ELMAAS)
#   Phase 2 — L adversaire complète un puzzle AU PROCHAIN TOUR ? → bloquer
#   Phase 3 — ELMAAS tactique : destructions à haute valeur
#   Phase 4 — Minimax léger (profondeur 2, top-N candidats) + éval positionnelle
#
# Règles ELMAAS intégrées :
#   - Case ELMAAS = case vide (on ne peut pas y remettre un ELMAAS)
#   - ELMAAS sur puzzle complété adverse → les points restent SAUF si l adversaire
#     repose sa couleur dessus ensuite  → ne pas gaspiller un ELMAAS sur du complété
#   - Sur-puzzle : compléter un sous-puzzle peut voler le parent à l adversaire
#   - Fin de partie quand aucune pièce ne peut intersecter un puzzle actif
# ══════════════════════════════════════════════════════════════


# ── Import calculer_scores depuis game_engine ─────────────────
def _get_scores(etat):
    try:
        from game_engine import calculer_scores
        return calculer_scores(etat)
    except Exception:
        s = {"rouge": 0, "noir": 0}
        for p in etat.plateau.puzzles.values():
            if p.complete_par and not p.brise:
                s[p.complete_par] = s.get(p.complete_par, 0) + len(p.cellules)
        return s


# ── Utilitaires puzzle ────────────────────────────────────────

def _infos_puzzle(puzzle, pieces, couleur, couleur_adv):
    """Analyse fine d un puzzle : nb cases par couleur, vides, diamants."""
    nb_moi = nb_adv = nb_vide = nb_diam = 0
    for r, c in puzzle.cellules:
        v = pieces.get(f"{r},{c}")
        if   v is None:          nb_vide += 1
        elif v == couleur:       nb_moi  += 1
        elif v == couleur_adv:   nb_adv  += 1
        elif v == "diamant":     nb_diam += 1
    return nb_moi, nb_adv, nb_vide, nb_diam


def _gagnant_naturel(puzzle):
    if puzzle.type_couleur == "mono_rouge": return "rouge"
    if puzzle.type_couleur == "mono_noir":  return "noir"
    return None  # mixte


def _valeur_puzzle(puzzle):
    """Nombre de cases = valeur en points."""
    return len(puzzle.cellules)


def _valeur_avec_parent(puzzle, puzzles_dict, couleur):
    """
    Si ce puzzle a un parent, compléter ce sous-puzzle peut voler le parent.
    Valeur = cellules propres + cellules parent si adverse le possède.
    """
    val = _valeur_puzzle(puzzle)
    if puzzle.parent_id is not None:
        parent = puzzles_dict.get(puzzle.parent_id)
        if parent and parent.complete_par is not None and parent.complete_par != couleur:
            val += _valeur_puzzle(parent)  # bonus : on vole le parent
    return val


# ── Simulation ELMAAS (pose diamant) ─────────────────────────

def _simuler_elmaas(pieces, piece_elmaas, origine, taille):
    """Retourne un nouveau dict pièces après pose d un diamant."""
    nouvelles = dict(pieces)
    for r, c in cellules_absolues(piece_elmaas, origine):
        if 0 <= r < taille and 0 <= c < taille:
            nouvelles[f"{r},{c}"] = "diamant"
    return nouvelles


# ── Vérification complétion puzzle (fidèle aux règles moteur) ──

def _puzzle_serait_complete(puzzle, pieces_sim, couleur):
    """
    Après simulation, ce puzzle serait-il complété pour `couleur` ?
    Règles exactes du moteur :
      mono : toutes cases remplies, pas de diamant, une seule couleur joueur présente
             → le joueur de CETTE couleur le gagne (pas forcément `couleur`)
      mixte: toutes cases remplies, rouge ET noir présents (hors diamant)
             → le joueur qui vient de jouer le gagne (= couleur passé en arg)
    Retourne (bool gagné pour couleur, nb_cellules_gagnées)
    """
    cellules = puzzle.cellules
    if not all(pieces_sim.get(f"{r},{c}") is not None for r, c in cellules):
        return False, 0
    couleurs = {pieces_sim.get(f"{r},{c}") for r, c in cellules} - {None}
    a_diam = "diamant" in couleurs
    cj = couleurs - {"diamant"}

    if puzzle.type_couleur == "mixte":
        if "rouge" in cj and "noir" in cj:
            return True, len(cellules)   # gagne le joueur actif = couleur
        return False, 0

    # mono
    if a_diam:
        return False, 0
    gagnant_nat = _gagnant_naturel(puzzle)
    if cj == {gagnant_nat}:
        return gagnant_nat == couleur, len(cellules)
    if len(cj) == 1:
        # Une seule couleur adverse : l adverse gagne ce mono
        return False, 0
    return False, 0


def _gain_si_pose(piece, origine, pieces, puzzles, couleur, couleur_adv, taille):
    """
    Calcule le gain total en cellules si on pose cette pièce à cette origine.
    Tient compte de la hiérarchie parent/enfant (sur-puzzles).
    Retourne (gain_cellules, nb_puzzles_gagnes, vol_parent_possible)
    """
    est_elmaas = piece.get("enlevement", False)
    if est_elmaas:
        pieces_sim = _simuler_elmaas(pieces, piece, origine, taille)
    else:
        pieces_sim = simuler_pose(pieces, piece, origine, couleur, taille)

    total_gain = 0
    nb_puzzles = 0
    parent_vole = False

    for puzzle in puzzles.values():
        if puzzle.complete_par or puzzle.brise:
            continue
        gagne, cellules_gagnees = _puzzle_serait_complete(puzzle, pieces_sim, couleur)
        if gagne:
            total_gain += cellules_gagnees
            nb_puzzles += 1
            # Sur-puzzle : vol du parent ?
            if puzzle.parent_id is not None:
                parent = puzzles.get(puzzle.parent_id)
                if parent and parent.complete_par == couleur_adv and not parent.brise:
                    total_gain += _valeur_puzzle(parent)
                    parent_vole = True

    return total_gain, nb_puzzles, parent_vole


# ── Score ELMAAS tactique ────────────────────────────────────

def _score_elmaas_tactique(piece, origine, pieces, puzzles, couleur, couleur_adv, taille):
    """
    Score stratégique d une pose de pièce ELMAAS (diamant).
    Logique : une case ELMAAS = case vide mais implaçable pour ELMAAS futur.
    
    Valeur positive :
      - Effacer case adverse dans puzzle mono adverse quasi-complet → blocage pur
      - Effacer case adverse dans puzzle mono adverse → dégradation
      - Compléter un mixte (rouge+noir toujours présents après) → gain
    
    Valeur négative :
      - Effacer MES cases dans MES puzzles mono → catastrophique
      - Effacer cases dans puzzle adverse déjà complété → inutile (points restent)
    """
    if not piece.get("enlevement"):
        return -9999

    absolues = [(r, c) for r, c in cellules_absolues(piece, origine)
                 if 0 <= r < taille and 0 <= c < taille]
    pieces_sim = _simuler_elmaas(pieces, piece, origine, taille)

    score = 0.0

    # Complétion mixte via ELMAAS ?
    gain, nb_p, _ = _gain_si_pose(piece, origine, pieces, puzzles, couleur, couleur_adv, taille)
    if gain > 0:
        score += gain * 120  # complétion mixte = jackpot

    for puzzle in puzzles.values():
        cellules = puzzle.cellules
        cases_touchees = [(r, c) for r, c in absolues if (r, c) in cellules]
        if not cases_touchees:
            continue

        nb_moi_t = sum(1 for r, c in cases_touchees if pieces.get(f"{r},{c}") == couleur)
        nb_adv_t = sum(1 for r, c in cases_touchees if pieces.get(f"{r},{c}") == couleur_adv)
        nb_moi, nb_adv, nb_vide, nb_diam = _infos_puzzle(puzzle, pieces, couleur, couleur_adv)
        gagnant = _gagnant_naturel(puzzle)
        val = _valeur_puzzle(puzzle)

        # ── Puzzle adverse déjà complété ──
        if puzzle.complete_par == couleur_adv and not puzzle.brise:
            # ELMAAS ne retire PAS les points de l adversaire directement
            # → inutile sauf si on peut poser notre couleur dessus juste après
            # On donne un petit score seulement si le puzzle est gros (investissement futur)
            score += nb_adv_t * 2   # très faible — l adversaire garde ses points
            continue

        if puzzle.brise:
            continue

        # ── Puzzle mono adverse : bloquer ──
        if gagnant == couleur_adv and puzzle.complete_par is None:
            if nb_moi == 0:
                # Puzzle pur adverse, on peut le bloquer
                urgence = 3.0 if nb_vide <= 1 else (2.0 if nb_vide <= 2 else 1.0)
                score += nb_adv_t * val * urgence
            else:
                # J ai déjà des pièces dedans → moins urgent
                score += nb_adv_t * 5

        # ── Puzzle mono pour moi : NE PAS effacer mes cases ──
        elif gagnant == couleur and puzzle.complete_par is None:
            if nb_adv == 0:
                # Puzzle pur à moi → catastrophique d effacer mes cases
                score -= nb_moi_t * val * 3
            else:
                score -= nb_moi_t * 10

        # ── Mixte en cours ──
        elif puzzle.type_couleur == "mixte" and puzzle.complete_par is None:
            # Effacer adversaire dans un mixte = pas utile (les deux couleurs doivent être là)
            score -= nb_adv_t * 3
            score -= nb_moi_t * 5  # encore moins utile

    return score


# ── Évaluation positionnelle ──────────────────────────────────

def evaluer_position_elo2500(etat, couleur_perspective):
    """
    Évaluation positionnelle complète.
    Prend en compte :
    - Cellules acquises via puzzles (score réel)
    - Puzzles quasi-complets pour moi (menace de gain)
    - Puzzles quasi-complets pour l adversaire (danger)
    - Hiérarchie sur-puzzles
    - Matériel et série
    """
    pieces = etat.plateau.pieces
    puzzles = etat.plateau.puzzles
    couleur_adv = "noir" if couleur_perspective == "rouge" else "rouge"

    try:
        scores = _get_scores(etat)
        diff_score = scores.get(couleur_perspective, 0) - scores.get(couleur_adv, 0)
    except Exception:
        diff_score = 0.0

    val = diff_score * 15.0  # chaque cellule gagnée = 15 pts d éval

    for puzzle in puzzles.values():
        if puzzle.brise:
            continue
        nb_total = len(puzzle.cellules)
        if nb_total == 0:
            continue
        gagnant = _gagnant_naturel(puzzle)
        nb_moi, nb_adv, nb_vide, nb_diam = _infos_puzzle(puzzle, pieces, couleur_perspective, couleur_adv)
        pct = 1.0 - nb_vide / nb_total

        # Puzzles déjà complétés → déjà dans diff_score
        if puzzle.complete_par:
            continue

        # Valeur avec bonus parent
        val_puzzle = _valeur_avec_parent(puzzle, puzzles, couleur_perspective)

        if puzzle.type_couleur == "mixte":
            avance = nb_moi - nb_adv
            if nb_vide <= 1:
                val += avance * val_puzzle * 0.8
            elif nb_vide <= 3:
                val += avance * val_puzzle * 0.4
            else:
                val += avance * 2.0

        else:
            # Mono
            if gagnant == couleur_perspective:
                if nb_adv == 0 and nb_diam == 0:
                    if nb_vide <= 1:   val += val_puzzle * 8.0
                    elif nb_vide <= 2: val += val_puzzle * 4.0
                    else:              val += nb_moi * 2.0 + pct * val_puzzle
                else:
                    # Contaminé → valeur réduite
                    val += nb_moi * 1.0 - nb_adv * 3.0 - nb_diam * 1.5
            else:
                # Puzzle adverse
                if nb_moi == 0 and nb_diam == 0:
                    if nb_vide <= 1:   val -= val_puzzle * 8.0   # DANGER IMMÉDIAT
                    elif nb_vide <= 2: val -= val_puzzle * 4.5
                    else:              val -= nb_adv * 2.0 + pct * val_puzzle
                else:
                    # Je bloque déjà
                    val += nb_moi * 4.0 - nb_adv * 0.5

    # Série active
    j = etat.joueur1 if etat.joueur1.couleur == couleur_perspective else etat.joueur2
    j_adv = etat.joueur2 if j == etat.joueur1 else etat.joueur1
    val += j.serie_actuelle * 10.0
    val -= j_adv.serie_actuelle * 7.0

    # Matériel
    val += (len(j.main_active) + len(j.reserve)) * 0.8
    val -= (len(j_adv.main_active) + len(j_adv.reserve)) * 0.5

    return val


# ── Génération et tri des candidats ──────────────────────────

def _heuristique_rapide(piece, origine, pieces, puzzles, couleur, couleur_adv, taille):
    """Score rapide pour classer les coups avant le minimax."""
    est_elmaas = piece.get("enlevement", False)
    if est_elmaas:
        return _score_elmaas_tactique(piece, origine, pieces, puzzles, couleur, couleur_adv, taille)
    gain, nb_p, vol = _gain_si_pose(piece, origine, pieces, puzzles, couleur, couleur_adv, taille)
    sc_cell = score_cellules_dans_puzzles(piece, origine, puzzles, couleur, taille)
    sc_bloc = score_blocage_adversaire(piece, origine, puzzles, couleur_adv, taille)
    return gain * 200 + vol * 300 + sc_cell * 3 + sc_bloc * 2


def _candidats_tries(joueur, pieces, puzzles, couleur, couleur_adv, taille, n_max=35):
    """Retourne les n_max meilleurs coups triés par heuristique rapide."""
    candidats = []
    for idx, piece in enumerate(joueur.main_active):
        for r in range(taille):
            for c in range(taille):
                valide, _ = placement_valide(piece, (r, c), pieces, taille)
                if valide:
                    s = _heuristique_rapide(piece, (r, c), pieces, puzzles,
                                            couleur, couleur_adv, taille)
                    candidats.append((s, idx, (r, c)))
    candidats.sort(reverse=True)
    return candidats[:n_max]


# ── Simulation coup complet (sans deepcopy) ──────────────────

def _simuler_coup_leger(pieces, piece, origine, couleur, taille):
    """Simulation légère sans deepcopy : retourne nouveau dict pieces uniquement."""
    if piece.get("enlevement"):
        return _simuler_elmaas(pieces, piece, origine, taille)
    return simuler_pose(pieces, piece, origine, couleur, taille)


# ── Adversaire peut-il compléter au prochain coup ? ──────────

def _adversaire_peut_completer(joueur_adv, pieces, puzzles, couleur_adv, couleur, taille):
    """
    Retourne la liste des (idx, origine, gain) pour lesquels l adversaire
    complèterait un puzzle au prochain coup.
    Limité à un scan rapide (top menaces).
    """
    menaces = []
    for idx, piece in enumerate(joueur_adv.main_active):
        if piece.get("enlevement"):
            continue  # ELMAAS ne complète pas de mono
        for r in range(taille):
            for c in range(taille):
                valide, _ = placement_valide(piece, (r, c), pieces, taille)
                if not valide:
                    continue
                gain, nb_p, _ = _gain_si_pose(piece, (r, c), pieces, puzzles,
                                               couleur_adv, couleur, taille)
                if gain > 0:
                    menaces.append((gain, idx, (r, c)))
    menaces.sort(reverse=True)
    return menaces


# ── IA NIVEAU 4 — ELMAAS ─────────────────────────────────────

def ia_niveau_4(etat, joueur):
    """
    ELMAAS — Le robot qui porte le nom du jeu.

    Phase 0 : Victoire immédiate (série 5 → fin de manche) ?
    Phase 1 : Je complète un/des puzzles maintenant ?
              → choisir le coup à gain max (cellules + vol de parent)
    Phase 2 : L adversaire complète un puzzle au prochain coup ?
              → bloquer coûte que coûte (pièce normale ou ELMAAS)
    Phase 3 : ELMAAS tactique → si j ai une pièce diamant et une cible à haute valeur
    Phase 4 : Minimax léger (profondeur 2, top-35 candidats) + éval positionnelle
    """
    import time
    debut = time.time()
    DEADLINE = 3.5  # secondes max

    main = joueur.main_active
    if not main:
        return None

    pieces    = etat.plateau.pieces
    puzzles   = etat.plateau.puzzles
    couleur   = joueur.couleur
    couleur_adv = "noir" if couleur == "rouge" else "rouge"
    taille    = get_taille()
    joueur_adv = etat.joueur_adverse()

    # ────────────────────────────────────────────────────────
    # PHASE 0 — Victoire immédiate
    # Si série actuelle == 4, le prochain puzzle complété = fin de manche
    # Priorité absolue.
    # ────────────────────────────────────────────────────────
    if joueur.serie_actuelle >= 4:
        for idx, piece in enumerate(main):
            if piece.get("enlevement"):
                continue
            for r in range(taille):
                for c in range(taille):
                    valide, _ = placement_valide(piece, (r, c), pieces, taille)
                    if not valide:
                        continue
                    gain, nb_p, _ = _gain_si_pose(piece, (r, c), pieces, puzzles,
                                                   couleur, couleur_adv, taille)
                    if gain > 0:
                        return idx, (r, c)

    # ────────────────────────────────────────────────────────
    # PHASE 1 — Complétion immédiate
    # Trouver le coup qui complète le plus de cellules (+ vol de parent)
    # ────────────────────────────────────────────────────────
    meilleures_completions = []  # (gain_total, vol_parent, idx, origine)

    for idx, piece in enumerate(main):
        for r in range(taille):
            for c in range(taille):
                valide, _ = placement_valide(piece, (r, c), pieces, taille)
                if not valide:
                    continue
                gain, nb_p, vol = _gain_si_pose(piece, (r, c), pieces, puzzles,
                                                 couleur, couleur_adv, taille)
                if gain > 0:
                    # Tie-break : préférer aussi ce qui bloque l adversaire
                    sc_pos = score_cellules_dans_puzzles(piece, (r, c), puzzles, couleur, taille)
                    meilleures_completions.append((gain + vol * 20 + sc_pos * 0.1,
                                                   gain, vol, idx, (r, c)))

    if meilleures_completions:
        meilleures_completions.sort(reverse=True)
        _, gain_reel, vol, idx_ret, org_ret = meilleures_completions[0]
        if config.DEBUG:
            print(f"[ELMAAS] PHASE1 complétion {gain_reel} cells vol={vol} "
                  f"pièce={main[idx_ret]['forme']} @{org_ret}")
        return idx_ret, org_ret

    # ────────────────────────────────────────────────────────
    # PHASE 2 — Blocage d urgence
    # L adversaire peut compléter un puzzle au prochain coup ?
    # ────────────────────────────────────────────────────────
    if time.time() < DEADLINE:
        menaces = _adversaire_peut_completer(joueur_adv, pieces, puzzles,
                                              couleur_adv, couleur, taille)
        if menaces:
            best_menace_gain = menaces[0][0]
            # Chercher le coup qui intercepte ces cases
            cellules_menacees = set()
            for gm, idxm, orgm in menaces[:3]:  # top 3 menaces
                piece_adv = joueur_adv.main_active[idxm]
                for r, c in cellules_absolues(piece_adv, orgm):
                    if 0 <= r < taille and 0 <= c < taille:
                        cellules_menacees.add((r, c))

            meilleur_blocage = None
            meilleur_s_bloc = -9999
            for idx, piece in enumerate(main):
                for r in range(taille):
                    for c in range(taille):
                        valide, _ = placement_valide(piece, (r, c), pieces, taille)
                        if not valide:
                            continue
                        absolues = set(cellules_absolues(piece, (r, c)))
                        # Intersection avec les cases menacées ?
                        if absolues & cellules_menacees:
                            sc = (len(absolues & cellules_menacees) * best_menace_gain
                                  + score_cellules_dans_puzzles(piece, (r, c), puzzles, couleur, taille))
                            if sc > meilleur_s_bloc:
                                meilleur_s_bloc = sc
                                meilleur_blocage = (idx, (r, c))

            if meilleur_blocage:
                if config.DEBUG:
                    print(f"[ELMAAS] PHASE2 blocage urgence @{meilleur_blocage[1]}")
                return meilleur_blocage

    # ────────────────────────────────────────────────────────
    # PHASE 3 — ELMAAS tactique
    # Si j ai des pièces diamant ET une cible à très haute valeur
    # ────────────────────────────────────────────────────────
    if time.time() < DEADLINE:
        elmaas_coups = []  # (score, idx, origine)
        for idx, piece in enumerate(main):
            if not piece.get("enlevement"):
                continue
            for r in range(taille):
                for c in range(taille):
                    valide, _ = placement_valide(piece, (r, c), pieces, taille)
                    if not valide:
                        continue
                    sc = _score_elmaas_tactique(piece, (r, c), pieces, puzzles,
                                                couleur, couleur_adv, taille)
                    elmaas_coups.append((sc, idx, (r, c)))

        if elmaas_coups:
            elmaas_coups.sort(reverse=True)
            best_elmaas_sc, best_elmaas_idx, best_elmaas_org = elmaas_coups[0]
            # N utiliser ELMAAS que si le gain est vraiment significatif
            # (on ne gaspille pas une pièce ELMAAS pour un gain marginal)
            # Seuil : valeur équivalente à ~4 cases bloquées dans un puzzle urgent
            if best_elmaas_sc >= 60:
                # Vérifier qu un coup normal ne ferait pas mieux
                meilleur_normal = None
                meilleur_normal_sc = -9999
                for idx2, piece2 in enumerate(main):
                    if piece2.get("enlevement"):
                        continue
                    for r in range(taille):
                        for c in range(taille):
                            valide, _ = placement_valide(piece2, (r, c), pieces, taille)
                            if not valide:
                                continue
                            sc2 = _heuristique_rapide(piece2, (r, c), pieces, puzzles,
                                                       couleur, couleur_adv, taille)
                            if sc2 > meilleur_normal_sc:
                                meilleur_normal_sc = sc2
                                meilleur_normal = (idx2, (r, c))

                # ELMAAS gagne si son score dépasse nettement le meilleur coup normal
                if best_elmaas_sc > meilleur_normal_sc * 0.85:
                    if config.DEBUG:
                        print(f"[ELMAAS] PHASE3 ELMAAS tactique sc={best_elmaas_sc:.0f} "
                              f"vs normal={meilleur_normal_sc:.0f} @{best_elmaas_org}")
                    return best_elmaas_idx, best_elmaas_org

    # ────────────────────────────────────────────────────────
    # PHASE 4 — Minimax léger
    # Top-35 candidats → simuler meilleure réponse adverse → éval positionnelle
    # ────────────────────────────────────────────────────────
    candidats = _candidats_tries(joueur, pieces, puzzles, couleur, couleur_adv, taille, n_max=35)
    if not candidats:
        return None

    meilleur_score = float("-inf")
    meilleur = (candidats[0][1], candidats[0][2])

    for sc_greedy, idx, origine in candidats:
        if time.time() > DEADLINE:
            break

        piece = main[idx]
        pieces_apres = _simuler_coup_leger(pieces, piece, origine, couleur, taille)

        # Évaluer position après mon coup (via puzzles simulés)
        # On utilise l éval positionnelle sur le plateau simulé
        # (on ne deepcopy pas l état complet pour des raisons de performance)
        val_moi = evaluer_position_apres(pieces_apres, puzzles, couleur, couleur_adv)

        # Simuler les top-5 réponses adverses
        candidats_adv = []
        for idx_a, piece_a in enumerate(joueur_adv.main_active[:4]):
            for r in range(taille):
                for c in range(taille):
                    valide, _ = placement_valide(piece_a, (r, c), pieces_apres, taille)
                    if not valide:
                        continue
                    s_a = _heuristique_rapide(piece_a, (r, c), pieces_apres, puzzles,
                                              couleur_adv, couleur, taille)
                    candidats_adv.append((s_a, idx_a, (r, c)))
        candidats_adv.sort(reverse=True)

        pire = val_moi
        for _, idx_a, org_a in candidats_adv[:5]:
            if time.time() > DEADLINE:
                break
            piece_a = joueur_adv.main_active[idx_a]
            pieces_apres2 = _simuler_coup_leger(pieces_apres, piece_a, org_a, couleur_adv, taille)
            val_apres = evaluer_position_apres(pieces_apres2, puzzles, couleur, couleur_adv)
            if val_apres < pire:
                pire = val_apres

        score_final = sc_greedy * 0.2 + pire * 0.8
        if score_final > meilleur_score:
            meilleur_score = score_final
            meilleur = (idx, origine)

    if config.DEBUG:
        print(f"[ELMAAS] PHASE4 minimax → {main[meilleur[0]]['forme']} @{meilleur[1]} "
              f"({meilleur_score:.1f})")
    return meilleur


def evaluer_position_apres(pieces_sim, puzzles, couleur, couleur_adv):
    """
    Évaluation positionnelle sur un plateau simulé (dict pieces uniquement).
    Version rapide sans deepcopy de l état.
    """
    val = 0.0
    for puzzle in puzzles.values():
        if puzzle.brise:
            continue
        nb_total = len(puzzle.cellules)
        if nb_total == 0:
            continue
        gagnant = _gagnant_naturel(puzzle)

        nb_moi = nb_adv = nb_vide = nb_diam = 0
        for r, c in puzzle.cellules:
            v = pieces_sim.get(f"{r},{c}")
            if   v is None:          nb_vide += 1
            elif v == couleur:       nb_moi  += 1
            elif v == couleur_adv:   nb_adv  += 1
            elif v == "diamant":     nb_diam += 1

        pct = 1.0 - nb_vide / nb_total

        # Déjà complété (dans la sim on ne change pas complete_par, on déduit)
        if puzzle.complete_par == couleur:
            val += nb_total * 12.0
            continue
        if puzzle.complete_par == couleur_adv:
            val -= nb_total * 12.0
            continue

        if puzzle.type_couleur == "mixte":
            avance = nb_moi - nb_adv
            if nb_vide <= 1:   val += avance * nb_total * 0.7
            elif nb_vide <= 3: val += avance * nb_total * 0.35
            else:              val += avance * 2.0
        else:
            if gagnant == couleur:
                if nb_adv == 0 and nb_diam == 0:
                    if nb_vide <= 1:   val += nb_total * 9.0
                    elif nb_vide <= 2: val += nb_total * 4.5
                    else:              val += nb_moi * 2.5 + pct * nb_total
                else:
                    val += nb_moi * 1.0 - nb_adv * 3.5 - nb_diam * 1.5
            else:
                if nb_moi == 0 and nb_diam == 0:
                    if nb_vide <= 1:   val -= nb_total * 9.0
                    elif nb_vide <= 2: val -= nb_total * 5.0
                    else:              val -= nb_adv * 2.5 + pct * nb_total
                else:
                    val += nb_moi * 4.0 - nb_adv * 0.5
    return val


# ── Interface principale ──────────────────────────────────────

def jouer_ia(etat, joueur, niveau: int):
    """
    Point d entrée de l IA.
    niveau : 1 (facile/Amal), 2 (moyen), 3 (expert/ELMAASYON), 4 (ELMAAS)
    """
    if niveau == 1:
        return ia_niveau_1(etat, joueur)
    elif niveau == 2:
        return ia_niveau_2(etat, joueur)
    elif niveau == 3:
        return ia_niveau_3(etat, joueur)
    elif niveau >= 4:
        return ia_niveau_4(etat, joueur)
    return ia_niveau_1(etat, joueur)