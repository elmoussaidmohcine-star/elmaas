# ELMAAS — filter_mots_sacres.py
# Bloque les mots sacrés dans les champs texte (pseudo, nom photo)
# Ne s'applique PAS aux messages entre joueurs (citer Dieu en conversation n'est pas grave)

import re

MOTS_SACRES = [
    # Arabe
    "الله", "إله", "اللَّه", "ﷲ", "محمد", "الرحمن", "الرحيم",
    # Français
    "dieu", "allah", "jéhovah", "jehovah", "yahweh", "yahvé", "yahve",
    # Anglais
    "god", "jehovah", "yahweh", "jesus", "christ", "lord",
    # Espagnol
    "dios", "alá", "ala", "jehová",
]


def normaliser(texte: str) -> str:
    return (texte or "").strip().lower()


def contient_mot_sacre(texte: str) -> tuple[bool, str]:
    """
    Retourne (bloque: bool, mot_trouve: str).
    Ex: "Abdallah" → (True, "allah") — mais on laisse le message expliquer.
    """
    if not texte:
        return False, ""
    texte_norm = normaliser(texte)

    # Arabe : recherche directe (pas de frontières de mots)
    # Les autres langues : mot entier OU sous-chaîne (ex: Abdallah contient allah)
    for mot in MOTS_SACRES:
        mot_norm = mot.lower()
        if re.search(r"[\u0600-\u06FF]", mot):
            # Mot arabe : sous-chaîne directe
            if mot in texte:
                return True, mot
        else:
            # Latin : cherche comme sous-chaîne (bloque Abdallah aussi)
            if mot_norm in texte_norm:
                return True, mot_norm
    return False, ""


MESSAGE_PAR_LANGUE = {
    "fr": "Ce mot contient une référence sacrée. Si votre vrai nom contient ce mot (ex: Abdallah), choisissez un pseudo différent pour jouer. Avec nos excuses.",
    "en": "This word contains a sacred reference. If your real name contains this word, please choose a different username. Our apologies.",
    "ar": "هذا الاسم يحتوي على اسم مقدس. إن كان اسمك الحقيقي يحتوي هذا الاسم (مثل عبد الله)، الرجاء اختيار اسم آخر للعب. معذرتنا.",
    "es": "Esta palabra contiene una referencia sagrada. Si tu nombre real contiene esta palabra, elige un nombre de usuario diferente. Disculpas.",
}


def message_blocage(langue="fr"):
    return MESSAGE_PAR_LANGUE.get(langue, MESSAGE_PAR_LANGUE["fr"])


if __name__ == "__main__":
    tests = ["Abdallah", "GodLike", "MikeRoss", "عبدالله", "DiosMio", "SimpleName"]
    for t in tests:
        b, m = contient_mot_sacre(t)
        print(f"{t:20} → bloque={b}, mot={m}")