# ELMAAS — ocr_check.py
# Bloque les photos contenant des noms sacrés (Allah, Dieu, God, etc.)
# Installation : pip install pytesseract Pillow
# Sur Railway : ajouter `tesseract-ocr tesseract-ocr-ara` dans nixpacks.toml ou aptfile

import re

try:
    import pytesseract
    from PIL import Image
    OCR_DISPONIBLE = True
except ImportError:
    OCR_DISPONIBLE = False
    print("[ocr_check] pytesseract non installé — OCR désactivé")

# Noms sacrés à bloquer, par langue
NOMS_SACRES = {
    "ar": ["الله", "إله", "محمد", "ﷲ"],
    "fr": ["dieu", "allah", "jéhovah", "jehovah", "yahweh", "yahvé", "yahve"],
    "en": ["god", "allah", "jehovah", "yahweh", "jesus", "christ"],
    "es": ["dios", "alá", "ala", "jehová", "jehova", "yahvé", "yahve"],
}

# Messages traduits (doivent correspondre au frontend)
MESSAGES_BLOCAGE = {
    "fr": "Le nom de Dieu n'est pas pour jouer. Veuillez choisir une autre photo.",
    "en": "The name of God is not for playing. Please choose another photo.",
    "ar": "اسم الله ليس للعب. الرجاء اختيار صورة أخرى.",
    "es": "El nombre de Dios no es para jugar. Elige otra foto.",
}


def extraire_texte(chemin_image: str) -> str:
    """Extrait tout le texte d'une image (français + anglais + arabe + espagnol)."""
    if not OCR_DISPONIBLE:
        return ""
    try:
        img = Image.open(chemin_image)
        # Langues combinées : fra + eng + ara + spa
        # Si Tesseract n'a pas toutes les langues, on tombe sur celles disponibles
        try:
            texte = pytesseract.image_to_string(img, lang="fra+eng+ara+spa")
        except pytesseract.TesseractError:
            # Fallback si certaines langues manquent
            try:
                texte = pytesseract.image_to_string(img, lang="eng")
            except:
                texte = pytesseract.image_to_string(img)
        return texte.lower()
    except Exception as e:
        print(f"[ocr_check] Erreur extraction : {e}")
        return ""


def contient_nom_sacre(texte: str) -> tuple[bool, str]:
    """
    Vérifie si le texte contient un nom sacré.
    Retourne (bloque: bool, mot_trouve: str).
    """
    if not texte:
        return False, ""

    texte_norm = texte.lower()

    for langue, noms in NOMS_SACRES.items():
        for nom in noms:
            # Recherche en mot complet (avec frontières)
            # Pour l'arabe, les frontières \b ne marchent pas bien → recherche directe
            if langue == "ar":
                if nom in texte:
                    return True, nom
            else:
                pattern = r"\b" + re.escape(nom.lower()) + r"\b"
                if re.search(pattern, texte_norm):
                    return True, nom

    return False, ""


def verifier_photo(chemin_image: str, langue: str = "fr") -> dict:
    """
    Interface publique.
    Retourne : {
      "autorisee": bool,
      "raison": str ou None,
      "mot_trouve": str ou None,
      "message": str localisé
    }
    """
    if not OCR_DISPONIBLE:
        # Si OCR pas disponible, on laisse passer (pas bloquant)
        return {"autorisee": True, "raison": None, "mot_trouve": None, "message": None}

    texte = extraire_texte(chemin_image)
    bloque, mot = contient_nom_sacre(texte)

    if bloque:
        msg = MESSAGES_BLOCAGE.get(langue, MESSAGES_BLOCAGE["fr"])
        return {
            "autorisee": False,
            "raison": "nom_sacre_detecte",
            "mot_trouve": mot,
            "message": msg
        }

    return {"autorisee": True, "raison": None, "mot_trouve": None, "message": None}


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage : python ocr_check.py <image>")
        sys.exit(1)
    res = verifier_photo(sys.argv[1], langue="fr")
    print(res)
