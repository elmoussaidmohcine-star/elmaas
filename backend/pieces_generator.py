# ============================================================
#  ELMAAS — pieces_generator.py
#  Génère les pièces tetrominos distribuées aux joueurs
#  Chaque pièce = liste de tuples (dr, dc) relatifs à l'origine
# ============================================================

import random
from config import DEBUG

# ── Formes fixes (coordonnées relatives à l'origine (0,0)) ───

FORMES = {
    "I2": [(0,0), (0,1)],
    "I3": [(0,0), (0,1), (0,2)],
    "I4": [(0,0), (0,1), (0,2), (0,3)],
    "L":  [(0,0), (1,0), (2,0), (2,1)],
    "J":  [(0,1), (1,1), (2,0), (2,1)],
    "T":  [(0,0), (0,1), (0,2), (1,1)],
    "S":  [(0,1), (0,2), (1,0), (1,1)],
    "Z":  [(0,0), (0,1), (1,1), (1,2)],
    "O":  [(0,0), (0,1), (1,0), (1,1)],
    "1":  [(0,0)],
}

# Raretés : plus le poids est élevé, plus la pièce est commune
POIDS = {
    "I2": 22,
    "I3": 18,
    "I4": 10,
    "L":  13,
    "J":  13,
    "T":  13,
    "S":  9,
    "Z":  9,
    "O":  11,
    "1":  2,   # très rare
}

# ── Rotations ────────────────────────────────────────────────

def rotation_90(cellules: list) -> list:
    """Rotation 90° horaire : (r, c) → (c, -r)"""
    return [(c, -r) for r, c in cellules]

def normaliser(cellules: list) -> list:
    """Déplace les cellules pour que le min (r,c) soit (0,0)."""
    min_r = min(r for r, c in cellules)
    min_c = min(c for r, c in cellules)
    return sorted([(r - min_r, c - min_c) for r, c in cellules])

def toutes_rotations(forme: list) -> list:
    """Retourne toutes les rotations uniques d'une forme."""
    vues = set()
    rotations = []
    current = forme
    for _ in range(4):
        norm = tuple(normaliser(current))
        if norm not in vues:
            vues.add(norm)
            rotations.append(list(norm))
        current = normaliser(rotation_90(current))
    return rotations

# ── Génération d'une pièce ───────────────────────────────────

def generer_piece(nom_forme: str = None, est_enlevement: bool = False) -> dict:
    """
    Génère une pièce aléatoire (ou d'une forme donnée).
    Retourne un dict :
      {
        "forme": str,           nom de la forme
        "cellules": [(r,c)...], coordonnées relatives
        "rotation": int,        0-3
        "enlevement": bool,     True si pièce diamant qui efface
      }
    """
    if nom_forme is None:
        noms = list(POIDS.keys())
        poids = [POIDS[n] for n in noms]
        nom_forme = random.choices(noms, weights=poids, k=1)[0]

    rotations = toutes_rotations(FORMES[nom_forme])
    rotation_choisie = random.randint(0, len(rotations) - 1)
    cellules = rotations[rotation_choisie]

    return {
        "forme": nom_forme,
        "cellules": cellules,
        "rotation": rotation_choisie,
        "enlevement": est_enlevement,
    }


# ── Génération de pièces d'enlèvement (Diamond/ELMAAS) ────────
# Une pièce d'enlèvement a une taille (1, 2 ou 3 cellules).
# On les génère par PAIRES partagées entre les 2 joueurs : la somme
# des tailles des 2 pièces du même slot vaut 2, 4 ou 6.

PAIRES_TAILLES_ENLEVEMENT = [
    (1, 1),  # somme = 2
    (1, 3),  # somme = 4
    (2, 2),  # somme = 4
    (3, 3),  # somme = 6
    (2, 4),  # somme = 6 (rare, pièce de taille 4)
]

FORMES_PAR_TAILLE = {
    1: ["1"],
    2: ["I2"],
    3: ["I3"],
    4: ["I4", "L", "J", "T", "S", "Z", "O"],
}


def generer_paire_enlevement() -> tuple:
    """
    Génère une paire (piece_pour_J1, piece_pour_J2) de pièces d'enlèvement
    dont la somme des tailles vaut 2, 4 ou 6.
    Les deux joueurs reçoivent la MÊME paire (même tailles, même slot).
    """
    t1, t2 = random.choice(PAIRES_TAILLES_ENLEVEMENT)
    forme1 = random.choice(FORMES_PAR_TAILLE[t1])
    forme2 = random.choice(FORMES_PAR_TAILLE[t2])
    p1 = generer_piece(forme1, est_enlevement=True)
    p2 = generer_piece(forme2, est_enlevement=True)
    return p1, p2

def tourner_piece(piece: dict) -> dict:
    """Tourne une pièce de 90° supplémentaires."""
    rotations = toutes_rotations(FORMES[piece["forme"]])
    nouvelle_rotation = (piece["rotation"] + 1) % len(rotations)
    return {
        "forme": piece["forme"],
        "cellules": rotations[nouvelle_rotation],
        "rotation": nouvelle_rotation,
    }

# ── Placement d'une pièce ────────────────────────────────────

def cellules_absolues(piece: dict, origine: tuple) -> list:
    """
    Retourne les coordonnées absolues d'une pièce
    placée à l'origine (r0, c0).
    """
    r0, c0 = origine
    return [(r0 + dr, c0 + dc) for dr, dc in piece["cellules"]]

def placement_valide(piece: dict, origine: tuple,
                     pieces_posees: dict, taille: int) -> tuple:
    """
    Vérifie si une pièce peut être placée à l'origine donnée.
    Retourne (valide: bool, raison: str).
    
    Pièce normale : toutes les cases doivent être vides et dans la grille.
    Pièce d'enlèvement : peut être placée sur cases vides OU occupées
      (rouge/noir). La seule restriction est qu'elle ne peut pas écraser
      une autre pièce d'enlèvement (diamant) déjà posée.
    """
    absolues = cellules_absolues(piece, origine)
    est_enlevement = piece.get("enlevement", False)

    for r, c in absolues:
        # Hors grille
        if not (0 <= r < taille and 0 <= c < taille):
            return False, f"Hors grille : ({r},{c})"
        cle = f"{r},{c}"
        contenu = pieces_posees.get(cle)

        if est_enlevement:
            # Pièce d'enlèvement : peut aller sur cases vides ou occupées,
            # MAIS pas sur une case déjà diamant (sinon ça n'enlève rien).
            if contenu == "diamant":
                return False, f"Case déjà diamant : ({r},{c})"
        else:
            # Pièce normale : il FAUT que la case soit vide
            if contenu is not None:
                return False, f"Case occupée : ({r},{c})"

    return True, "ok"

# ── Distribution initiale ────────────────────────────────────

def distribuer_pieces(nb_total: int) -> tuple:
    """
    Génère nb_total pièces et les distribue équitablement.
    Garantit un nombre total impair.
    Retourne (reserve_j1, reserve_j2).
    """
    # Garantir impair
    if nb_total % 2 == 0:
        nb_total += 1

    pieces = [generer_piece() for _ in range(nb_total)]
    random.shuffle(pieces)

    mi = len(pieces) // 2
    reserve_j1 = pieces[:mi]
    reserve_j2 = pieces[mi:]

    # La pièce du milieu (index mi) va sur le plateau au départ
    piece_initiale = pieces[mi] if len(pieces) > mi else generer_piece()

    if DEBUG:
        print(f"[pieces_generator] {nb_total} pièces générées")
        print(f"  J1 : {len(reserve_j1)} pièces")
        print(f"  J2 : {len(reserve_j2)} pièces")
        print(f"  Pièce initiale : {piece_initiale['forme']}")

    return reserve_j1, reserve_j2, piece_initiale

# ── Sérialisation ────────────────────────────────────────────

def serialiser_piece(piece: dict) -> dict:
    """Convertit une pièce en dict JSON-serialisable."""
    return {
        "forme": piece["forme"],
        "cellules": piece["cellules"],
        "rotation": piece["rotation"],
        "enlevement": piece.get("enlevement", False),
    }

# ── Test rapide ──────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Formes disponibles ===")
    for nom, forme in FORMES.items():
        rotations = toutes_rotations(forme)
        print(f"\n{nom} ({len(rotations)} rotation(s)) :")
        for rot in rotations:
            grille = [["·"] * 5 for _ in range(4)]
            for r, c in rot:
                if 0 <= r < 4 and 0 <= c < 5:
                    grille[r][c] = "█"
            for ligne in grille:
                print("  " + " ".join(ligne))

    print("\n=== Distribution test (21 pièces) ===")
    j1, j2, init = distribuer_pieces(21)
    print(f"J1 : {[p['forme'] for p in j1]}")
    print(f"J2 : {[p['forme'] for p in j2]}")
    print(f"Initiale : {init['forme']} — {init['cellules']}")