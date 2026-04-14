# ============================================================
#  ELMAAS — Configuration centrale
#  Toutes les variables du jeu sont ici.
# ============================================================

# --- Plateau ---
TAILLE_TAB = 16          # Modifié dynamiquement selon le choix des joueurs
TAILLE_MIN = 10          # Taille minimum autorisée
TAILLE_MAX_TAB = 20      # Taille maximum autorisée
NB_PUZZLES = 12          # Nombre total de puzzles générés sur le plateau
POURCENTAGE_SOUDE = 0.06

# --- Puzzles ---
SEUIL_INCLUSION = 0.50   # Réduit pour favoriser les sous-puzzles
NB_GRANDS_PUZZLES = 2
DISTANCE_MAX_PUZZLES = 2  # Distance max entre puzzles (saturation plateau)

DISTRIBUTION_TYPES_PUZZLES = {
    "mono_rouge": 4,
    "mono_noir": 4,
    "mixte": 4,
}

# --- Main et pioche ---
TAILLE_MAIN = 5
NB_SCOUT = 10
NB_ECHANGE_SCOUT = 2
MIN_PIECES_SCOUT = 3

# --- Séries et bonus ---
SERIE_BONUS_EXTRACTION = 3
NB_PIECES_EXTRACTION = 2
SERIE_VICTOIRE_IMMEDIATE = 5

POUVOIRS_DISPONIBLES = [
    "rien",
    "proteger",
    "echanger",
]

# --- Image / Traitement photo ---
TAILLE_REDIMENSIONNEMENT = (TAILLE_TAB, TAILLE_TAB)
ESPACE_COULEUR = "LAB"
CANAL_BINARISATION = "A"
NIVEAUX_SEGMENTATION = [0.3, 0.5, 0.7]

# --- Couleurs joueurs ---
COULEUR_JOUEUR_1 = "rouge"
COULEUR_JOUEUR_2 = "noir"

# --- Pièces tetrominos ---
# Poids de rareté — pièce solo très rare
POIDS_PIECES = {
    "I2": 20,
    "I3": 15,
    "I4": 8,
    "L":  12,
    "J":  12,
    "T":  12,
    "S":  8,
    "Z":  8,
    "O":  10,
    "1":  1,   # très rare
}

# --- Debug ---
DEBUG = True


# --- Utilitaire : calcul taille depuis propositions joueurs ---
def calculer_taille(prop_j1: int, prop_j2: int) -> int:
    """
    Calcule la taille finale du plateau depuis les deux propositions.
    Règle : pair le plus proche <= moyenne, borné entre TAILLE_MIN et TAILLE_MAX_TAB.
    """
    moyenne = (prop_j1 + prop_j2) / 2
    # Pair le plus proche <= moyenne
    taille = int(moyenne) if int(moyenne) % 2 == 0 else int(moyenne) - 1
    taille = max(TAILLE_MIN, min(TAILLE_MAX_TAB, taille))
    return taille