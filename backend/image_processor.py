# ============================================================
#  ELMAAS — image_processor.py
#  Transforme une photo en grille 14x14 bicolore (chaud/froid)
#  prête à être utilisée par puzzle_generator.py
# ============================================================

import numpy as np
from PIL import Image
from config import (
    TAILLE_TAB,
    TAILLE_REDIMENSIONNEMENT,
    CANAL_BINARISATION,
    NIVEAUX_SEGMENTATION,
    DEBUG,
)


# ── Constantes internes ──────────────────────────────────────

CHAUD = 1   # Cellule "chaude" (au-dessus de la médiane verte)
FROID = 0   # Cellule "froide" (en-dessous de la médiane verte)


# ── Fonctions utilitaires ────────────────────────────────────

def charger_image(chemin: str) -> Image.Image:
    """
    Charge une image depuis un chemin fichier.
    Retourne une image PIL en mode RGB.
    """
    img = Image.open(chemin).convert("RGB")
    if DEBUG:
        print(f"[image_processor] Image chargée : {chemin} — taille originale : {img.size}")
    return img


def redimensionner(img: Image.Image) -> Image.Image:
    """
    Redimensionne l'image en TAILLE_TAB x TAILLE_TAB pixels.
    Chaque pixel deviendra une cellule de la grille.
    Utilise LANCZOS pour préserver les transitions de couleur.
    """
    img_redim = img.resize(TAILLE_REDIMENSIONNEMENT, Image.LANCZOS)
    if DEBUG:
        print(f"[image_processor] Redimensionnée en {TAILLE_REDIMENSIONNEMENT}")
    return img_redim


def rgb_vers_lab(img_rgb: Image.Image) -> np.ndarray:
    """
    Convertit une image PIL RGB en tableau NumPy dans l'espace LAB.
    L'espace LAB sépare la luminosité (L) de la chrominance (A, B).
    Le canal A encode l'axe vert (-) / rouge (+) — idéal pour ELMAAS.
    
    Retourne un tableau (H, W, 3) en float32 normalisé [0, 1].
    """
    # Conversion manuelle RGB → XYZ → LAB (pas besoin de scikit-image ici)
    arr = np.array(img_rgb, dtype=np.float32) / 255.0

    # Linearisation gamma sRGB
    mask = arr > 0.04045
    arr[mask] = ((arr[mask] + 0.055) / 1.055) ** 2.4
    arr[~mask] /= 12.92

    # RGB → XYZ (matrice standard D65)
    M = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041],
    ])
    xyz = arr @ M.T

    # Normalisation par illuminant D65
    xyz /= np.array([0.95047, 1.00000, 1.08883])

    # XYZ → LAB
    epsilon = 0.008856
    kappa = 903.3
    fx = np.where(xyz > epsilon, xyz ** (1/3), (kappa * xyz + 16) / 116)

    L = 116 * fx[..., 1] - 16
    A = 500 * (fx[..., 0] - fx[..., 1])
    B = 200 * (fx[..., 1] - fx[..., 2])

    lab = np.stack([L, A, B], axis=-1)

    if DEBUG:
        print(f"[image_processor] Conversion LAB — canal A : min={A.min():.2f}, max={A.max():.2f}, médiane={np.median(A):.2f}")

    return lab


def extraire_canal(lab: np.ndarray, canal: str) -> np.ndarray:
    """
    Extrait un canal spécifique du tableau LAB.
    canal : "L", "A" ou "B"
    Retourne un tableau 2D (H, W).
    """
    index = {"L": 0, "A": 1, "B": 2}
    if canal not in index:
        raise ValueError(f"Canal invalide : '{canal}'. Choisir parmi L, A, B.")
    return lab[..., index[canal]]


def binariser(canal_2d: np.ndarray, seuil: float = None) -> np.ndarray:
    """
    Binarise un canal 2D en CHAUD (1) / FROID (0).
    Si seuil=None, utilise la médiane comme seuil automatique.
    Retourne une grille (H, W) d'entiers 0 ou 1.
    """
    if seuil is None:
        seuil = float(np.median(canal_2d))
    grille = (canal_2d >= seuil).astype(np.int8)
    if DEBUG:
        nb_chaud = int(grille.sum())
        nb_froid = int((grille == 0).sum())
        print(f"[image_processor] Binarisation (seuil={seuil:.2f}) → {nb_chaud} chauds, {nb_froid} froids")
    return grille


def generer_niveaux_segmentation(canal_2d: np.ndarray) -> list[np.ndarray]:
    """
    Génère plusieurs grilles binarisées à différents niveaux de seuil.
    Utilisé par puzzle_generator pour construire la hiérarchie des puzzles.
    
    Les seuils dans NIVEAUX_SEGMENTATION sont des quantiles (0 à 1).
    Ex: 0.3 = 30e percentile → beaucoup de CHAUD
        0.7 = 70e percentile → peu de CHAUD
    
    Retourne une liste de grilles, du seuil le plus bas au plus haut.
    """
    niveaux = []
    valeurs = canal_2d.flatten()
    for quantile in NIVEAUX_SEGMENTATION:
        seuil = float(np.quantile(valeurs, quantile))
        grille = binariser(canal_2d, seuil=seuil)
        niveaux.append(grille)
        if DEBUG:
            print(f"[image_processor] Niveau q={quantile} → seuil={seuil:.2f}")
    return niveaux


def calculer_statistiques(grille: np.ndarray) -> dict:
    """
    Calcule des statistiques utiles sur la grille binarisée.
    Utilisé pour valider l'équilibre chaud/froid avant de générer les puzzles.
    """
    total = grille.size
    nb_chaud = int(grille.sum())
    nb_froid = total - nb_chaud
    ratio = nb_chaud / total

    stats = {
        "total_cellules": total,
        "nb_chaud": nb_chaud,
        "nb_froid": nb_froid,
        "ratio_chaud": round(ratio, 3),
        "equilibre": abs(ratio - 0.5) < 0.2,  # Acceptable si entre 30% et 70% chaud
    }

    if DEBUG:
        print(f"[image_processor] Stats grille : {stats}")
        if not stats["equilibre"]:
            print("[image_processor] ⚠️  Grille déséquilibrée — envisager un autre canal ou photo")

    return stats


# ── Fonction principale ──────────────────────────────────────

def traiter_photo(chemin: str) -> dict:
    """
    Pipeline complet : photo → données prêtes pour puzzle_generator.
    
    Retourne un dictionnaire contenant :
    - "grille"          : grille principale 14x14 binarisée (canal A, seuil médiane)
    - "niveaux"         : liste de grilles à différents seuils (pour hiérarchie puzzles)
    - "statistiques"    : stats de la grille principale
    - "canal_brut"      : valeurs brutes du canal A (float) — pour usage avancé
    - "taille"          : (TAILLE_TAB, TAILLE_TAB)
    """
    # 1. Chargement et redimensionnement
    img = charger_image(chemin)
    img_redim = redimensionner(img)

    # 2. Conversion LAB
    lab = rgb_vers_lab(img_redim)

    # 3. Extraction du canal cible
    canal = extraire_canal(lab, CANAL_BINARISATION)

    # 4. Grille principale (seuil médiane automatique)
    grille_principale = binariser(canal)

    # 5. Niveaux de segmentation (pour hiérarchie des puzzles)
    niveaux = generer_niveaux_segmentation(canal)

    # 6. Statistiques
    stats = calculer_statistiques(grille_principale)

    if DEBUG:
        print(f"[image_processor] ✅ Traitement terminé — grille {TAILLE_TAB}x{TAILLE_TAB} prête")
        print(f"[image_processor] Grille principale :\n{grille_principale}")

    return {
        "grille": grille_principale,
        "niveaux": niveaux,
        "statistiques": stats,
        "canal_brut": canal,
        "taille": (TAILLE_TAB, TAILLE_TAB),
    }


# ── Test rapide (python image_processor.py image.jpg) ───────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage : python image_processor.py <chemin_image>")
        print("Exemple : python image_processor.py photo.jpg")
        sys.exit(1)

    resultat = traiter_photo(sys.argv[1])

    print("\n=== Résultat ===")
    print(f"Taille grille : {resultat['taille']}")
    print(f"Statistiques  : {resultat['statistiques']}")
    print(f"Nombre de niveaux de segmentation : {len(resultat['niveaux'])}")
    print("\nGrille principale (1=chaud, 0=froid) :")
    for ligne in resultat["grille"]:
        print(" ".join("█" if c == CHAUD else "·" for c in ligne))
