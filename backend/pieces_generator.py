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
    "I2": 20,
    "I3": 15,
    "I4": 8,
    "L":  12,
    "J":  12,
    "T":  12,
    "S":  8,
    "Z":  8,
    "O":  10,
    "1":  5,   # pièce solo — rare mais utile
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

def generer_piece(nom_forme: str = None) -> dict:
    """
    Génère une pièce aléatoire (ou d'une forme donnée).
    Retourne un dict :
      {
        "forme": str,           nom de la forme
        "cellules": [(r,c)...], coordonnées relatives
        "rotation": int,        0-3
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
    }

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
    """
    absolues = cellules_absolues(piece, origine)

    for r, c in absolues:
        # Hors grille
        if not (0 <= r < taille and 0 <= c < taille):
            return False, f"Hors grille : ({r},{c})"
        # Case déjà occupée
        cle = f"{r},{c}"
        if pieces_posees.get(cle) is not None:
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
