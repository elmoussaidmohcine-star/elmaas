# ============================================================
#  ELMAAS — puzzle_generator.py
#  Génère 12 puzzles imbriqués depuis les niveaux de segmentation
#  produits par image_processor.py
# ============================================================

import numpy as np
import random
import hashlib
from dataclasses import dataclass, field
from typing import Optional
from config import (
    TAILLE_TAB,
    NB_PUZZLES,
    SEUIL_INCLUSION,
    NB_GRANDS_PUZZLES,
    DISTRIBUTION_TYPES_PUZZLES,
    POURCENTAGE_SOUDE,
    DEBUG,
)


# ── Structures de données ────────────────────────────────────

@dataclass
class Puzzle:
    id: int
    cellules: set              # ensemble de tuples (ligne, col) appartenant au puzzle
    type_couleur: str          # "mono_rouge", "mono_noir", "mixte"
    niveau: int                # 0=petit, 1=moyen, 2=grand (chef)
    parent_id: Optional[int]   # id du puzzle parent (None si chef)
    enfants_ids: list          # ids des sous-puzzles directs
    est_chef: bool             # True si puzzle chef de hiérarchie
    brise: bool = False        # True si le puzzle est brisé
    complete_par: Optional[str] = None  # "rouge" ou "noir"
    protege: bool = False
    ordre_completion: int = 0  # Ordre de complétion (0 = pas encore complété)

    def taille(self) -> int:
        return len(self.cellules)

    def __repr__(self):
        return (
            f"Puzzle(id={self.id}, niveau={self.niveau}, "
            f"type={self.type_couleur}, taille={self.taille()}, "
            f"parent={self.parent_id}, enfants={self.enfants_ids}, "
            f"chef={self.est_chef})"
        )

    def __deepcopy__(self, memo):
        """Deepcopy personnalisé - évite la récursion infinie sur parent/enfants."""
        import copy
        new_obj = Puzzle(
            id=self.id,
            cellules=copy.deepcopy(self.cellules, memo),
            type_couleur=self.type_couleur,
            niveau=self.niveau,
            parent_id=self.parent_id,
            enfants_ids=copy.deepcopy(self.enfants_ids, memo),
            est_chef=self.est_chef,
            brise=self.brise,
            complete_par=self.complete_par,
            protege=self.protege,
            ordre_completion=self.ordre_completion,
        )
        memo[id(self)] = new_obj
        return new_obj


@dataclass
class Plateau:
    grille_bicolore: np.ndarray          # 14x14 — 1=chaud, 0=froid
    pieces: dict                          # (ligne, col) → "rouge"|"noir"|None
    puzzles: dict                         # id → Puzzle
    cellules_libres: set                  # cellules sans appartenance à aucun puzzle
    cellules_actives: set                 # cellules qui ont une pièce posée

    def __deepcopy__(self, memo):
        """Deepcopy personnalisé - shallow copy des puzzles (immuable pendant la simulation)."""
        import copy
        new_obj = Plateau(
            grille_bicolore=copy.deepcopy(self.grille_bicolore, memo),
            pieces=copy.deepcopy(self.pieces, memo),
            puzzles=copy.deepcopy(self.puzzles, memo),
            cellules_libres=copy.deepcopy(self.cellules_libres, memo),
            cellules_actives=copy.deepcopy(self.cellules_actives, memo),
        )
        memo[id(self)] = new_obj
        return new_obj


# ── Extraction de régions connexes ──────────────────────────

def extraire_regions(grille: np.ndarray, valeur: int) -> list[set]:
    """
    Extrait toutes les régions connexes (4-voisins) d'une valeur donnée dans la grille.
    Retourne une liste de sets de tuples (ligne, col).
    """
    visited = np.zeros_like(grille, dtype=bool)
    regions = []

    def bfs(start_r, start_c):
        region = set()
        queue = [(start_r, start_c)]
        visited[start_r, start_c] = True
        while queue:
            r, c = queue.pop()
            region.add((r, c))
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                nr, nc = r+dr, c+dc
                if 0 <= nr < TAILLE_TAB and 0 <= nc < TAILLE_TAB:
                    if not visited[nr, nc] and grille[nr, nc] == valeur:
                        visited[nr, nc] = True
                        queue.append((nr, nc))
        return region

    for r in range(TAILLE_TAB):
        for c in range(TAILLE_TAB):
            if grille[r, c] == valeur and not visited[r, c]:
                regions.append(bfs(r, c))

    return regions


# ── Calcul d'inclusion (quasi-sous-puzzle) ──────────────────

def ratio_inclusion(petit: set, grand: set) -> float:
    """
    Calcule le ratio de cellules de 'petit' contenues dans 'grand'.
    Si >= SEUIL_INCLUSION, 'petit' est un quasi-sous-puzzle de 'grand'.
    """
    if not petit:
        return 0.0
    intersection = len(petit & grand)
    return intersection / len(petit)


def construire_hierarchie(puzzles_par_niveau: list[list[set]]) -> list[tuple[set, int, Optional[int]]]:
    """
    Prend les régions extraites à chaque niveau de segmentation
    et construit la hiérarchie parent/enfant.

    puzzles_par_niveau[0] = petites régions (seuil bas)
    puzzles_par_niveau[1] = régions moyennes
    puzzles_par_niveau[2] = grandes régions (chefs)

    Retourne une liste de (cellules, niveau, parent_index_dans_niveau_superieur).
    """
    resultat = []

    # Aplatir : on associe chaque région à son niveau
    tous = []
    for niveau, regions in enumerate(puzzles_par_niveau):
        for region in regions:
            tous.append({"cellules": region, "niveau": niveau, "parent_idx": None})

    # Pour chaque région de niveau N, chercher un parent au niveau N+1
    for i, p in enumerate(tous):
        if p["niveau"] < len(puzzles_par_niveau) - 1:
            # Chercher un parent possible au niveau supérieur
            for j, q in enumerate(tous):
                if q["niveau"] == p["niveau"] + 1:
                    if ratio_inclusion(p["cellules"], q["cellules"]) >= SEUIL_INCLUSION:
                        p["parent_idx"] = j
                        break  # Un seul parent

    return tous


# ── Sélection et équilibrage des puzzles ────────────────────

def fragmenter_region(cellules: set, taille_max: int) -> list[set]:
    """
    Divise une région trop grande en sous-régions de taille <= taille_max.
    Utilise un découpage BFS séquentiel.
    """
    if len(cellules) <= taille_max:
        return [cellules]

    fragments = []
    restantes = set(cellules)
    cellules_list = list(cellules)
    random.shuffle(cellules_list)

    while restantes:
        graine = next(iter(restantes))
        fragment = set()
        queue = [graine]
        while queue and len(fragment) < taille_max:
            cell = queue.pop(0)
            if cell not in restantes:
                continue
            fragment.add(cell)
            restantes.discard(cell)
            r, c = cell
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                voisin = (r+dr, c+dc)
                if voisin in restantes:
                    queue.append(voisin)
        if len(fragment) >= 2:
            fragments.append(fragment)

    return fragments


def selectionner_puzzles(tous: list[dict], grille: np.ndarray) -> list[dict]:
    """
    Sélectionne NB_PUZZLES puzzles avec :
    - Saturation du plateau (distance max 2 entre puzzles)
    - Maximum de sous-puzzles
    - 2 chefs équilibrés
    """
    taille = grille.shape[0]
    TAILLE_MAX_PUZZLE = max(6, taille // 3)  # Taille max générale des sous-puzzles
    TAILLE_MAX_CHEF = taille - 2  # Chef prend presque toute la moitié du plateau
    TAILLE_MIN_PUZZLE = 3

    grands = [p for p in tous if p["niveau"] == 2]
    moyens = [p for p in tous if p["niveau"] == 1]
    petits = [p for p in tous if p["niveau"] == 0]

    if DEBUG:
        print(f"[puzzle_generator] Candidats — grands:{len(grands)}, moyens:{len(moyens)}, petits:{len(petits)}")

    grands.sort(key=lambda p: len(p["cellules"]), reverse=True)

    # Chefs : 2 grandes régions fragmentées
    chefs = []
    for g in grands[:NB_GRANDS_PUZZLES]:
        frags = fragmenter_region(g["cellules"], TAILLE_MAX_CHEF)
        frags.sort(key=len, reverse=True)
        chef = dict(g)
        chef["cellules"] = frags[0]
        chef["parent_idx"] = None
        chefs.append(chef)

    if len(chefs) == 2:
        t1, t2 = len(chefs[0]["cellules"]), len(chefs[1]["cellules"])
        if DEBUG:
            print(f"[puzzle_generator] Chefs : taille {t1} vs {t2}")

    # Générer BEAUCOUP de sous-puzzles depuis toutes les régions
    sous_puzzles = []

    # Fragmenter agressivement toutes les régions pour couvrir le plateau
    toutes_regions = [p for p in tous]
    toutes_regions.sort(key=lambda p: len(p["cellules"]), reverse=True)

    for p in toutes_regions:
        frags = fragmenter_region(p["cellules"], TAILLE_MAX_PUZZLE)
        for frag in frags:
            if len(frag) >= TAILLE_MIN_PUZZLE:
                sous = dict(p)
                sous["cellules"] = frag
                sous_puzzles.append(sous)

    # Générer des puzzles supplémentaires par grille régulière
    # pour saturer le plateau (distance <= 2)
    cellules_couvertes = set()
    for chef in chefs:
        cellules_couvertes |= chef["cellules"]

    # Diviser le plateau en blocs réguliers pour couvrir les zones vides
    bloc_size = max(3, taille // 4)
    for r0 in range(0, taille, bloc_size):
        for c0 in range(0, taille, bloc_size):
            bloc = set()
            for r in range(r0, min(r0 + bloc_size, taille)):
                for c in range(c0, min(c0 + bloc_size, taille)):
                    if (r, c) not in cellules_couvertes:
                        bloc.add((r, c))
            if len(bloc) >= TAILLE_MIN_PUZZLE:
                sous_puzzles.append({
                    "cellules": bloc,
                    "niveau": 0,
                    "parent_idx": None,
                })
                cellules_couvertes |= bloc

    # Construire le pool
    pool = chefs[:]
    random.shuffle(sous_puzzles)
    for sp in sous_puzzles:
        if len(pool) >= NB_PUZZLES:
            break
        pool.append(sp)

    # Compléter si pas assez
    while len(pool) < NB_PUZZLES:
        if chefs:
            extra = fragmenter_region(chefs[0]["cellules"], TAILLE_MIN_PUZZLE + 1)
            for frag in extra:
                if len(pool) >= NB_PUZZLES:
                    break
                if len(frag) >= TAILLE_MIN_PUZZLE:
                    pool.append({"cellules": frag, "niveau": 0, "parent_idx": None})
        break

    pool = pool[:NB_PUZZLES]

    # Recalculer hiérarchie — chercher inclusion géométrique réelle
    for i, p in enumerate(pool):
        p["parent_idx"] = None
        best_ratio = SEUIL_INCLUSION
        best_j = None
        for j, q in enumerate(pool):
            if i == j: continue
            # Un parent doit être plus grand ET contenir géométriquement p
            if len(q["cellules"]) <= len(p["cellules"]): continue
            ratio = ratio_inclusion(p["cellules"], q["cellules"])
            if ratio >= best_ratio:
                best_ratio = ratio
                best_j = j
        if best_j is not None:
            p["parent_idx"] = best_j

    nb_sous = sum(1 for p in pool if p["parent_idx"] is not None)
    if DEBUG:
        print(f"[puzzle_generator] {len(pool)} puzzles — {nb_sous} sous-puzzles")
        for i, p in enumerate(pool):
            print(f"  [{i}] taille={len(p['cellules'])} parent={p['parent_idx']}")

    return pool, chefs


def assigner_types_couleur(pool: list[dict], chefs: list[dict]) -> list[dict]:
    """
    Assigne un type de couleur à chaque puzzle :
    - "mono_rouge", "mono_noir", "mixte"
    - Les puzzles mixtes ne peuvent pas être des sous-puzzles
    - Distribution équitable selon DISTRIBUTION_TYPES_PUZZLES
    """
    types_disponibles = []
    for type_couleur, count in DISTRIBUTION_TYPES_PUZZLES.items():
        types_disponibles.extend([type_couleur] * count)

    # Compléter si besoin
    while len(types_disponibles) < len(pool):
        types_disponibles.append(random.choice(["mono_rouge", "mono_noir"]))

    random.shuffle(types_disponibles)

    # Identifier les sous-puzzles (ont un parent)
    sous_puzzles_indices = [i for i, p in enumerate(pool) if p.get("parent_idx") is not None]
    non_sous_puzzles_indices = [i for i in range(len(pool)) if i not in sous_puzzles_indices]

    # Assurer que les "mixte" vont uniquement aux non-sous-puzzles
    mixtes = [t for t in types_disponibles if t == "mixte"]
    non_mixtes = [t for t in types_disponibles if t != "mixte"]

    types_assignes = [""] * len(pool)

    # Non-sous-puzzles peuvent recevoir n'importe quel type
    idx_non_sous = list(non_sous_puzzles_indices)
    random.shuffle(idx_non_sous)
    for i, idx in enumerate(idx_non_sous):
        if mixtes:
            types_assignes[idx] = mixtes.pop()
        elif non_mixtes:
            types_assignes[idx] = non_mixtes.pop()

    # Sous-puzzles reçoivent seulement mono
    for idx in sous_puzzles_indices:
        if types_assignes[idx] == "":
            if non_mixtes:
                types_assignes[idx] = non_mixtes.pop()
            else:
                types_assignes[idx] = random.choice(["mono_rouge", "mono_noir"])

    # Remplir les vides restants
    for i in range(len(pool)):
        if types_assignes[i] == "":
            types_assignes[i] = random.choice(["mono_rouge", "mono_noir"])

    for i, p in enumerate(pool):
        p["type_couleur"] = types_assignes[i]

    # Appliquer la limite de 6 cellules aux puzzles mono
    # Les puzzles mixtes et chefs ne sont pas limités
    pool_final = []
    for p in pool:
        if p["type_couleur"] in ("mono_rouge", "mono_noir") and len(p["cellules"]) > 6:
            # Fragmenter en morceaux de 6
            frags = fragmenter_region(p["cellules"], 6)
            for frag in frags:
                if len(frag) >= 3:
                    pool_final.append(dict(p, cellules=frag))
        else:
            pool_final.append(p)

    return pool_final


# ── Placement des pièces sur le plateau ─────────────────────

def generer_pieces(puzzles: list[Puzzle], grille: np.ndarray) -> dict:
    """
    Toutes les cellules des puzzles ont une pièce.
    Plus 3-5 zones libres pour les tours de repos.
    Nombre total impair garanti.
    """
    toutes_cellules = {(r, c) for r in range(TAILLE_TAB) for c in range(TAILLE_TAB)}

    cellules_puzzle = set()
    for p in puzzles:
        cellules_puzzle |= p.cellules

    # Zones libres : 3-5 cellules hors puzzle
    hors_puzzle = list(toutes_cellules - cellules_puzzle)
    random.shuffle(hors_puzzle)
    nb_libres = min(5, len(hors_puzzle))
    zones_libres = set(hors_puzzle[:nb_libres])

    toutes_pieces = cellules_puzzle | zones_libres

    # Garantir impair
    if len(toutes_pieces) % 2 == 0:
        extra = [c for c in hors_puzzle[nb_libres:]]
        if extra:
            toutes_pieces.add(extra[0])

    if DEBUG:
        print(f"[puzzle_generator] Pièces totales : {len(toutes_pieces)} (impair={len(toutes_pieces)%2==1})")
        print(f"[puzzle_generator] Pièces puzzle : {len(cellules_puzzle)}, zones libres : {len(zones_libres)}")

    return {f"{r},{c}": None for r, c in toutes_pieces}


# ── Fonction principale ──────────────────────────────────────

def generer_puzzles(donnees_image: dict) -> Plateau:
    """
    Pipeline complet : données image → Plateau avec puzzles, pièces, hiérarchie.
    Le résultat est DÉTERMINISTE : la même photo produit toujours le même plateau.

    Entrée : dict retourné par image_processor.traiter_photo()
    Sortie : objet Plateau prêt pour game_engine.py
    """
    grille = donnees_image["grille"]
    niveaux_grilles = donnees_image["niveaux"]

    # Seed déterministe basé sur le contenu de la grille
    grille_bytes = grille.tobytes()
    seed = int(hashlib.md5(grille_bytes).hexdigest()[:8], 16)
    random.seed(seed)
    if DEBUG:
        print(f"[puzzle_generator] Seed déterministe : {seed}")

    # 1. Extraire les régions à chaque niveau de segmentation
    puzzles_par_niveau = []
    for niveau_grille in niveaux_grilles:
        regions_chaud = extraire_regions(niveau_grille, 1)
        regions_froid = extraire_regions(niveau_grille, 0)
        # Garder uniquement les régions de taille significative (>= 2 cellules)
        toutes_regions = [r for r in regions_chaud + regions_froid if len(r) >= 2]
        puzzles_par_niveau.append(toutes_regions)

    if DEBUG:
        for i, lvl in enumerate(puzzles_par_niveau):
            print(f"[puzzle_generator] Niveau {i} : {len(lvl)} régions")

    # 2. Construire la hiérarchie
    tous_candidats = construire_hierarchie(puzzles_par_niveau)

    # 3. Sélectionner et équilibrer
    pool, chefs = selectionner_puzzles(tous_candidats, grille)

    # 4. Assigner les types de couleur
    pool = assigner_types_couleur(pool, chefs)

    # 5. Construire les objets Puzzle
    chefs_cellules = {frozenset(c["cellules"]) for c in chefs}
    puzzles_objets = {}
    for i, p in enumerate(pool):
        est_chef = frozenset(p["cellules"]) in chefs_cellules
        puzzle = Puzzle(
            id=i,
            cellules=p["cellules"],
            type_couleur=p["type_couleur"],
            niveau=p["niveau"],
            parent_id=p.get("parent_idx"),
            enfants_ids=[],
            est_chef=est_chef,
        )
        puzzles_objets[i] = puzzle

    # 6. Remplir les enfants
    for pid, puzz in puzzles_objets.items():
        if puzz.parent_id is not None and puzz.parent_id in puzzles_objets:
            puzzles_objets[puzz.parent_id].enfants_ids.append(pid)

    # 7. Générer les pièces
    pieces = generer_pieces(list(puzzles_objets.values()), grille)

    # 8. Cellules libres (appartenant à aucun puzzle)
    toutes_cellules_puzzle = set()
    for p in puzzles_objets.values():
        toutes_cellules_puzzle |= p.cellules
    cellules_libres = set(pieces.keys()) - toutes_cellules_puzzle

    plateau = Plateau(
        grille_bicolore=grille,
        pieces=pieces,
        puzzles=puzzles_objets,
        cellules_libres=cellules_libres,
        cellules_actives=set(),
    )

    if DEBUG:
        print(f"\n[puzzle_generator] ✅ Plateau généré")
        print(f"  Puzzles : {len(puzzles_objets)}")
        print(f"  Pièces totales : {len(pieces)}")
        print(f"  Cellules libres : {len(cellules_libres)}")
        print(f"  Chefs : {[pid for pid,p in puzzles_objets.items() if p.est_chef]}")
        for pid, p in puzzles_objets.items():
            print(f"  {p}")

    return plateau


# ── Test rapide ──────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    from image_processor import traiter_photo

    if len(sys.argv) < 2:
        print("Usage : python puzzle_generator.py <chemin_image>")
        sys.exit(1)

    donnees = traiter_photo(sys.argv[1])
    plateau = generer_puzzles(donnees)

    print("\n=== Plateau généré ===")
    print(f"Puzzles      : {len(plateau.puzzles)}")
    print(f"Pièces       : {len(plateau.pieces)}")
    print(f"Zones libres : {len(plateau.cellules_libres)}")

    print("\nVisualisaton grille (P=puzzle, .=libre, _=vide) :")
    cell_to_puzzle = {}
    for pid, puzz in plateau.puzzles.items():
        for cell in puzz.cellules:
            cell_to_puzzle[cell] = pid

    for r in range(TAILLE_TAB):
        ligne = ""
        for c in range(TAILLE_TAB):
            if (r, c) in cell_to_puzzle:
                ligne += f"{cell_to_puzzle[(r,c)]:2d} "
            elif (r, c) in plateau.cellules_libres:
                ligne += " .  "
            else:
                ligne += " _  "
        print(ligne)