# ============================================================
#  ELMAAS — api.py
# ============================================================
import os
import json
import uuid
import base64
import io
import time
import json as _json
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit
from PIL import Image

from image_processor import traiter_photo
from puzzle_generator import generer_puzzles, Plateau, Puzzle
from pieces_generator import serialiser_piece
from game_engine import initialiser_jeu, jouer_tour, calculer_scores, EtatJeu, calculer_score_cellules, reinitialiser_plateau
from ai_player import jouer_ia
from config import DEBUG
from models import db, Utilisateur, calculer_elo, PartieDB
from auth import auth_bp
from stripe_routes import stripe_bp
from filter_mots_sacres import contient_mot_sacre, message_blocage
from ocr_check import verifier_photo
from analyse_partie import analyser_partie_complete, copier_etat_manuel
from matchmaking import matchmaking_bp, FileAttente

# Google OAuth (optionnel)
try:
    from google_oauth import google_bp, init_google_oauth
    GOOGLE_OAUTH_DISPO = True
except ImportError as e:
    print(f"[api] Google OAuth indisponible : {e}")
    GOOGLE_OAUTH_DISPO = False


# 
# Flask app
# 
app = Flask(__name__)

# Session / sécurité
SECRET_KEY = os.environ.get("SECRET_KEY", "elmaas_secret_key_2026")
app.secret_key = SECRET_KEY
app.config["SECRET_KEY"] = SECRET_KEY
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True

# Upload max 10 MB
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# Base de données
db_url = os.environ.get("DATABASE_URL", "sqlite:///elmaas.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# CORS — supports_credentials pour que les cookies de session passent
CORS(app,
     resources={r"/*": {"origins": ["https://www.elmaas.fun", "https://elmaas.fun", "https://elmaas.vercel.app"]}},
     supports_credentials=True)
# SocketIO
socketio = SocketIO(app,
    cors_allowed_origins="*",
    async_mode="threading",
    transports=["polling", "websocket"])
# Extensions
db.init_app(app)

# Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(stripe_bp)
if GOOGLE_OAUTH_DISPO:
    app.register_blueprint(google_bp)
    init_google_oauth(app)

app.register_blueprint(matchmaking_bp)

# Stockage des états initiaux pour analyse correcte
etats_initiaux = {}

with app.app_context():
    db.create_all()
#  Migration ponctuelle Google OAuth 
#  Migration ponctuelle 
with app.app_context():
    try:
        db.session.execute(db.text("ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE"))
        db.session.execute(db.text("ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS plan VARCHAR(20)"))
        db.session.execute(db.text("ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS date_inscription TIMESTAMP DEFAULT NOW()"))
        db.session.execute(db.text("ALTER TABLE utilisateurs ALTER COLUMN mot_de_passe DROP NOT NULL"))
        db.session.execute(db.text("ALTER TABLE utilisateurs ALTER COLUMN pseudo DROP NOT NULL"))
        db.session.commit()
        print("[migration] Colonnes Google ajoutées")
    except Exception as e:
        print(f"[migration] Erreur colonnes : {e}")
        db.session.rollback()

    # Force l'import de TOUS les modèles avant create_all
    from matchmaking import FileAttente
    
    try:
        db.create_all()
        # Log quelles tables existent maintenant
        from sqlalchemy import inspect
        tables = inspect(db.engine).get_table_names()
        print(f"[migration] Tables après create_all : {tables}")
    except Exception as e:
        print(f"[migration] Erreur create_all : {e}")
        import traceback; traceback.print_exc()

# Cache mémoire
parties: dict[str, EtatJeu] = {}
pixels_par_partie: dict[str, list] = {}
noms_par_partie: dict[str, str] = {}
bonus_double_tour: dict[str, bool] = {}
reconnaissance_tentee: dict[str, bool] = {}
joueurs_connectes: dict[str, dict] = {}
pseudos_par_partie: dict[str, dict] = {}   # partie_id -> {joueur1: pseudo, joueur2: pseudo}
demandes_pause: dict[str, str] = {}
pause_active: dict[str, bool] = {}
scores_manches: dict[str, dict] = {}
timer_par_partie: dict[str, int] = {}
historique_coups: dict[str, list] = {}    # partie_id -> liste de coups
etats_initiaux: dict[str, dict] = {}      # partie_id -> etat sérialisé initial
analyses_quotidiennes: dict[int, dict] = {}  # user_id -> {"date": date, "count": int
users_par_partie: dict[str, dict] = {}    # partie_id -> {"rouge": user_id, "noir": user_id}
elo_deja_mis_a_jour: set = set()          # partie_id déjà traités (anti-double)

# ── Timestamps pour nettoyage automatique ──
partie_timestamps: dict[str, float] = {}  # partie_id -> dernière activité (time.time())

def nettoyer_partie(partie_id: str):
    """Supprime TOUTES les données en mémoire associées à une partie."""
    parties.pop(partie_id, None)
    pixels_par_partie.pop(partie_id, None)
    noms_par_partie.pop(partie_id, None)
    bonus_double_tour.pop(partie_id, None)
    reconnaissance_tentee.pop(partie_id, None)
    joueurs_connectes.pop(partie_id, None)
    pseudos_par_partie.pop(partie_id, None)
    demandes_pause.pop(partie_id, None)
    pause_active.pop(partie_id, None)
    scores_manches.pop(partie_id, None)
    timer_par_partie.pop(partie_id, None)
    historique_coups.pop(partie_id, None)
    etats_initiaux.pop(partie_id, None)
    users_par_partie.pop(partie_id, None)
    elo_deja_mis_a_jour.discard(partie_id)
    partie_timestamps.pop(partie_id, None)

def nettoyer_parties_anciennes():
    """Supprime les parties inactives depuis plus de 45 minutes."""
    seuil = time.time() - 2700  # 45 minutes
    parties_a_supprimer = [
        pid for pid, ts in partie_timestamps.items() if ts < seuil
    ]
    # Limite absolue : max 40 parties en mémoire — supprimer les plus vieilles
    if len(parties) > 40:
        triees = sorted(partie_timestamps.items(), key=lambda x: x[1])
        for pid, _ in triees[:len(parties) - 40]:
            if pid not in parties_a_supprimer:
                parties_a_supprimer.append(pid)
    for pid in parties_a_supprimer:
        print(f"[cleanup] Nettoyage automatique partie {pid}")
        nettoyer_partie(pid)
    if parties_a_supprimer:
        print(f"[cleanup] {len(parties_a_supprimer)} parties nettoyées. "
              f"Restant en mémoire : {len(parties)} parties")


def sauvegarder_partie(partie_id: str):
    try:
        etat = parties.get(partie_id)
        if not etat:
            return
        etat_dict = serialiser_etat(etat)
        partie_db = PartieDB.query.get(partie_id)
        if not partie_db:
            partie_db = PartieDB(id=partie_id)
            db.session.add(partie_db)
        partie_db.etat_json = _json.dumps(etat_dict)
        partie_db.pixels_json = _json.dumps(pixels_par_partie.get(partie_id, []))
        partie_db.nom_photo = noms_par_partie.get(partie_id, "")
        partie_db.bonus_double = bonus_double_tour.get(partie_id, False)
        partie_db.recon_tentee = reconnaissance_tentee.get(partie_id, False)
        partie_db.timer_sec = timer_par_partie.get(partie_id, 30)
        partie_db.scores_manches_json = _json.dumps(scores_manches.get(partie_id, {"rouge": 0, "noir": 0}))
        db.session.commit()
    except Exception as e:
        if DEBUG:
            print(f"[DB] Erreur sauvegarde: {e}")


def enregistrer_elo_fin_partie(partie_id: str, gagnant_couleur: str):
    """Met à jour l'ELO des deux joueurs après une fin de partie multijoueur."""
    if partie_id in elo_deja_mis_a_jour:
        return  # Anti-double
    users = users_par_partie.get(partie_id, {})
    rouge_id = users.get("rouge")
    noir_id = users.get("noir")
    if not rouge_id or not noir_id:
        return  # Partie solo ou IDs manquants
    try:
        with app.app_context():
            j_rouge = Utilisateur.query.get(rouge_id)
            j_noir = Utilisateur.query.get(noir_id)
            if not j_rouge or not j_noir:
                return
            elo_rouge_avant = j_rouge.elo or 500
            elo_noir_avant = j_noir.elo or 500
            if gagnant_couleur == "rouge":
                gagnant_num = 1
            elif gagnant_couleur == "noir":
                gagnant_num = 2
            else:
                gagnant_num = 0
            new_rouge, new_noir = calculer_elo(elo_rouge_avant, elo_noir_avant, gagnant_num)
            j_rouge.elo = new_rouge
            j_noir.elo = new_noir
            j_rouge.parties_jouees = (j_rouge.parties_jouees or 0) + 1
            j_noir.parties_jouees = (j_noir.parties_jouees or 0) + 1
            if gagnant_couleur == "rouge":
                j_rouge.victoires = (j_rouge.victoires or 0) + 1
                j_noir.defaites = (j_noir.defaites or 0) + 1
            elif gagnant_couleur == "noir":
                j_noir.victoires = (j_noir.victoires or 0) + 1
                j_rouge.defaites = (j_rouge.defaites or 0) + 1
            db.session.commit()
            elo_deja_mis_a_jour.add(partie_id)
            print(f"[ELO] {partie_id} rouge:{elo_rouge_avant}->{new_rouge} noir:{elo_noir_avant}->{new_noir} gagnant:{gagnant_couleur}")
            # Libérer les pixels de mémoire après la fin (économie RAM)
            pixels_par_partie.pop(partie_id, None)
            historique_coups.pop(partie_id, None)
    except Exception as e:
        print(f"[ELO] Erreur mise à jour ELO: {e}")
        import traceback; traceback.print_exc()


# ── Thread de nettoyage périodique (toutes les 15 min) ──
import threading
def _cleanup_loop():
    while True:
        time.sleep(900)  # 15 minutes
        try:
            with app.app_context():
                nettoyer_parties_anciennes()
        except Exception as e:
            print(f"[cleanup_thread] Erreur: {e}")

_cleanup_thread = threading.Thread(target=_cleanup_loop, daemon=True)
_cleanup_thread.start()


def serialiser_puzzle(puzzle: Puzzle) -> dict:
    return {
        "id": puzzle.id,
        "cellules": list(puzzle.cellules),
        "type_couleur": puzzle.type_couleur,
        "niveau": puzzle.niveau,
        "parent_id": puzzle.parent_id,
        "enfants_ids": puzzle.enfants_ids,
        "est_chef": puzzle.est_chef,
        "brise": puzzle.brise,
        "complete_par": puzzle.complete_par,
        "protege": puzzle.protege,
        "taille": puzzle.taille(),
    }


def serialiser_plateau(plateau: Plateau) -> dict:
    pieces_normalisees = {}
    for cle, couleur in plateau.pieces.items():
        if isinstance(cle, tuple):
            cle = f"{cle[0]},{cle[1]}"
        pieces_normalisees[cle] = couleur

    def normaliser_cellule(x):
        if isinstance(x, tuple):
            return list(x)
        if isinstance(x, str):
            return [int(v) for v in x.split(",")]
        return list(x)

    return {
        "pieces": pieces_normalisees,
        "puzzles": {str(pid): serialiser_puzzle(p) for pid, p in plateau.puzzles.items()},
        "cellules_libres": [normaliser_cellule(x) for x in plateau.cellules_libres],
        "cellules_actives": [normaliser_cellule(x) for x in plateau.cellules_actives],
        "grille_bicolore": plateau.grille_bicolore.tolist(),
    }


def serialiser_joueur(joueur) -> dict:
    return {
        "id": joueur.id,
        "couleur": joueur.couleur,
        "main_active": [serialiser_piece(p) for p in joueur.main_active],
        "nb_pieces_reserve": len(joueur.reserve),
        "pieces_protegees": list(joueur.pieces_protegees),
        "serie_actuelle": joueur.serie_actuelle,
        "nb_puzzles_completes": len(joueur.score_puzzles),
        "nb_pieces_posees_depuis_regen": joueur.nb_pieces_posees_depuis_regen,
        "seuil_regen_actuel": joueur.seuil_regen_actuel,
        "puzzles_completes_depuis_regen": joueur.puzzles_completes_depuis_regen,
    }


def serialiser_etat(etat: EtatJeu) -> dict:
    return {
        "plateau": serialiser_plateau(etat.plateau),
        "joueur1": serialiser_joueur(etat.joueur1),
        "joueur2": serialiser_joueur(etat.joueur2),
        "tour_actuel": etat.tour_actuel,
        "numero_tour": etat.numero_tour,
        "manche_terminee": etat.manche_terminee,
        "gagnant": etat.gagnant,
        "victoire_immediate": etat.victoire_immediate,
        "scores": calculer_scores(etat),
        "piece_initiale_pos": list(etat.piece_initiale_pos) if etat.piece_initiale_pos else None,
        "timestamp_debut_tour": etat.timestamp_debut_tour,
    }


@socketio.on("connect")
def on_connect():
    if DEBUG:
        print(f"[ws] Client connecté : {request.sid}")


@socketio.on("disconnect")
def on_disconnect():
    if DEBUG:
        print(f"[ws] Client déconnecté : {request.sid}")
    for partie_id, slots in list(joueurs_connectes.items()):
        for role, sid in list(slots.items()):
            if sid == request.sid:
                del joueurs_connectes[partie_id][role]


@socketio.on("rejoindre_partie")
def on_rejoindre_partie(data):
    partie_id = data.get("partie_id")
    role      = data.get("joueur")
    pseudo    = data.get("pseudo", "")   # pseudo du joueur qui se connecte
    user_id   = data.get("user_id")      # user_id pour le suivi ELO

    if partie_id not in parties:
        emit("erreur", {"message": "Partie introuvable"})
        return

    if role not in ("joueur1", "joueur2"):
        emit("erreur", {"message": "Rôle invalide"})
        return

    join_room(partie_id)

    if partie_id not in joueurs_connectes:
        joueurs_connectes[partie_id] = {}
    joueurs_connectes[partie_id][role] = request.sid

    # Mémoriser le pseudo de ce joueur
    if partie_id not in pseudos_par_partie:
        pseudos_par_partie[partie_id] = {}
    if pseudo:
        pseudos_par_partie[partie_id][role] = pseudo

    # Stocker user_id pour le suivi ELO — joueur2 = noir
    if user_id:
        if partie_id not in users_par_partie:
            users_par_partie[partie_id] = {"rouge": None, "noir": None}
        if role == "joueur2":
            users_par_partie[partie_id]["noir"] = user_id
        elif role == "joueur1":
            users_par_partie[partie_id]["rouge"] = user_id

    emit("rejoint", {
        "partie_id": partie_id,
        "ton_role": role,
        "etat": serialiser_etat(parties[partie_id]),
    })

    slots = joueurs_connectes[partie_id]
    if "joueur1" in slots and "joueur2" in slots:
        parties[partie_id].timestamp_debut_tour = time.time()
        pseudos = pseudos_par_partie.get(partie_id, {})
        socketio.emit("partie_prete", {
            "message": "Les deux joueurs sont connectés !",
            "etat": serialiser_etat(parties[partie_id]),
            "pseudo_j1": pseudos.get("joueur1", ""),
            "pseudo_j2": pseudos.get("joueur2", ""),
            "partie_id_pixels": partie_id,
        }, room=partie_id)


@app.route("/photos_fixes", methods=["GET"])
def photos_fixes():
    photos = [
        "city.jpeg", "sea.jpeg", "see_purple.jpeg",
        "sky_scappers.jpeg", "tiano.jpeg", "tools.jpeg",
        "photo_girl.jpeg", "phto.jpg", "Untitled.jpeg",
        "champ-lavande-au-coucher-du-soleil-pres-valensole_268835-3910.avif"
    ]
    return jsonify({"photos": [f"/photo_fixe/{p}" for p in photos]})


@app.route("/photo_fixe/<nom>", methods=["GET"])
def photo_fixe(nom):
    from flask import send_from_directory
    dossier = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(dossier, nom)


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "message": "ELMAAS API en ligne"})
@app.route("/debug/env", methods=["GET"])
def debug_env():
    import os
    return jsonify({
        "google_id_defini": bool(os.environ.get("GOOGLE_CLIENT_ID")),
        "google_id_longueur": len(os.environ.get("GOOGLE_CLIENT_ID") or ""),
        "google_id_debut": (os.environ.get("GOOGLE_CLIENT_ID") or "")[:15],
        "google_secret_defini": bool(os.environ.get("GOOGLE_CLIENT_SECRET")),
        "google_secret_longueur": len(os.environ.get("GOOGLE_CLIENT_SECRET") or ""),
        "google_secret_debut": (os.environ.get("GOOGLE_CLIENT_SECRET") or "")[:7],
        "frontend_url": os.environ.get("FRONTEND_URL", "NON_DEFINI"),
        "toutes_vars": sorted([k for k in os.environ.keys() if not k.startswith("_")])
    })
@socketio.on("message_envoye")
def on_message(data):
    partie_id = data.get("partie_id")
    texte = (data.get("texte") or "")[:30]
    couleur = data.get("couleur")
    if not partie_id or not texte:
        return
    # Diffuse à l'autre joueur dans la room
    socketio.emit("message_recu", {
        "texte": texte, "couleur": couleur
    }, room=partie_id, include_self=False)
@app.route("/nouvelle-partie", methods=["POST"])
def nouvelle_partie():
    try:
        # ── Vérification quota upload ──────────────────────────
        from auth import get_user_from_request
        user = get_user_from_request()
        if user:
            plan = getattr(user, "plan", None) or "gratuit"
            if plan == "elmaas":
                pass  # illimité
            elif plan == "elmaasyon":
                pass  # illimité côté upload
            else:
                # Gratuit : 1 seul upload
                if user.photo_perso_utilisee:
                    return jsonify({
                        "erreur": "Quota upload atteint. Passez au plan ELMAASYON pour des uploads illimités.",
                        "code": "QUOTA_UPLOAD"
                    }), 403
        prop_j1 = int(request.form.get("prop_j1", 16))
        prop_j2 = int(request.form.get("prop_j2", 16))

        from config import calculer_taille
        import config as cfg
        taille = calculer_taille(prop_j1, prop_j2)
        cfg.TAILLE_TAB = taille
        cfg.TAILLE_REDIMENSIONNEMENT = (taille, taille)

        if "photo" in request.files:
            fichier = request.files["photo"]
            img = Image.open(fichier.stream).convert("RGB")
            chemin_temp = f"/tmp/elmaas_{uuid.uuid4().hex}.jpg"
            img.save(chemin_temp)
        elif request.json and "photo_base64" in request.json:
            data = base64.b64decode(request.json["photo_base64"])
            img = Image.open(io.BytesIO(data)).convert("RGB")
            chemin_temp = f"/tmp/elmaas_{uuid.uuid4().hex}.jpg"
            img.save(chemin_temp)
        else:
            return jsonify({"erreur": "Aucune photo fournie"}), 400
        langue = request.form.get("langue", "fr")
        ocr_resultat = verifier_photo(chemin_temp, langue=langue)
        if not ocr_resultat["autorisee"]:
            import os as _os
            try: _os.remove(chemin_temp)
            except: pass
            return jsonify({
                "erreur": ocr_resultat["message"],
                "code": "OCR_BLOCKED",
                "mot_trouve": ocr_resultat.get("mot_trouve")
            }), 403
        donnees = traiter_photo(chemin_temp)
        plateau = generer_puzzles(donnees)
        etat = initialiser_jeu(plateau)
        # S'assurer que le timestamp est bien à présent
        etat.timestamp_debut_tour = time.time()

        import numpy as np
        img_redim = Image.open(chemin_temp).convert("RGB").resize((taille, taille), Image.LANCZOS)
        pixels = np.array(img_redim).tolist()

        partie_id_match = request.form.get("partie_id_match", "").strip()
        if partie_id_match:
            partie_id = partie_id_match
        else:
            partie_id = str(uuid.uuid4())

        # Marquer l'upload consommé pour le plan gratuit
        if user:
            plan = getattr(user, "plan", None) or "gratuit"
            if plan not in ("elmaasyon", "elmaas") and not user.photo_perso_utilisee:
                user.photo_perso_utilisee = True
                db.session.commit()
        parties[partie_id] = etat
        partie_timestamps[partie_id] = time.time()
        # Nettoyage automatique des vieilles parties
        nettoyer_parties_anciennes()
        etats_initiaux[partie_id] = copier_etat_manuel(etat)
        print(f"[api] État initial sauvegardé : {partie_id}")
        pixels_par_partie[partie_id] = pixels
        historique_coups[partie_id] = []
        etats_initiaux[partie_id] = serialiser_etat(etat)
        # Stocker le user_id du joueur rouge (celui qui upload la photo)
        if user:
            users_par_partie[partie_id] = {"rouge": user.id, "noir": None}
        nom_photo = request.form.get("nom_photo", "")[:10].strip()
        # Filtre mots sacrés sur nom photo
        if nom_photo:
            bloque, _ = contient_mot_sacre(nom_photo)
            if bloque:
                langue = request.form.get("langue", "fr")
                return jsonify({
                    "erreur": message_blocage(langue),
                    "code": "MOT_SACRE"
                }), 400
        noms_par_partie[partie_id] = nom_photo
        reconnaissance_tentee[partie_id] = False
        bonus_double_tour[partie_id] = False
        scores_manches[partie_id] = {"rouge": 0, "noir": 0}
        pause_active[partie_id] = False
        demandes_pause[partie_id] = None
        timer_val = int(request.form.get("timer_sec", 30))
        timer_par_partie[partie_id] = timer_val

        return jsonify({
            "partie_id": partie_id,
            "etat": serialiser_etat(etat),
            "pixels_photo": pixels,
            "taille": taille,
            "timer_sec": timer_val,
            "scores_manches": scores_manches[partie_id],
        })

    except Exception as e:
        if DEBUG:
            import traceback
            traceback.print_exc()
        return jsonify({"erreur": str(e)}), 500


@app.route("/etat/<partie_id>", methods=["GET"])
def get_etat(partie_id: str):
    etat = parties.get(partie_id)
    if not etat:
        return jsonify({"erreur": "Partie introuvable"}), 404
    return jsonify(serialiser_etat(etat))
@app.route("/analyse/quota", methods=["GET"])
def quota_analyse():
    from auth import get_user_from_request
    user = get_user_from_request()
    if not user:
        return jsonify({"limite": 0, "utilise": 0, "plan": "non_connecte"})
 
    aujourd_hui = datetime.now(timezone.utc).date()
    quota_user = analyses_quotidiennes.get(user.id, {"date": aujourd_hui, "count": 0})
    if quota_user["date"] != aujourd_hui:
        quota_user = {"date": aujourd_hui, "count": 0}
 
    plan = getattr(user, "plan", None) or "gratuit"
    if plan == "elmaas":
        limite = -1  # illimité
    elif plan == "elmaasyon":
        limite = 3
    else:
        limite = 1  # gratuit

    count = quota_user.get("count", 0)
    restant = -1 if limite == -1 else max(0, limite - count)

    return jsonify({
        "limite": limite,
        "utilise": count,
        "plan": plan,
        "restant": restant
    })


@app.route("/analyse/<partie_id>", methods=["POST"])
def lancer_analyse(partie_id: str):
    # EXTRAIRE LE JSON DE LA REQUÊTE — CETTE LIGNE MANQUAIT
    data = request.get_json() or {}
    
    # ═══════════════════════════════════════════════════════════
    # Récupérer historique + etat_initial depuis RAM, DB, ou BODY
    # ═══════════════════════════════════════════════════════════
    historique = historique_coups.get(partie_id, [])
    etat_initial = etats_initiaux.get(partie_id)  # EtatJeu ou None
    etat_init_dict = None  # dict JSON

    # Si etat_initial est un dict (bug ancien), le convertira plus bas
    if isinstance(etat_initial, dict):
        etat_init_dict = etat_initial
        etat_initial = None

    # 1. Fallback : body de la requête (frontend envoie l'état)
    if not etat_initial and not etat_init_dict:
        etat_init_dict = data.get("etat_initial")
        if etat_init_dict:
            print(f"[analyse] État reçu du frontend (body)")

    # 2. Fallback : base de données
    if not historique or not etat_initial:
        from models import PartieDB
        partie_db = PartieDB.query.get(partie_id)
        if partie_db:
            if not historique and partie_db.historique_json:
                historique = _json.loads(partie_db.historique_json)
                historique_coups[partie_id] = historique
            if not etat_initial and not etat_init_dict and partie_db.etat_initial_json:
                etat_init_dict = _json.loads(partie_db.etat_initial_json)

    if not historique:
        return jsonify({"erreur": "Historique de partie introuvable"}), 404

    # Vérif authentification + quotas
    from auth import get_user_from_request
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Connexion requise pour analyser une partie"}), 401

    aujourd_hui = datetime.now(timezone.utc).date()
    quota_user = analyses_quotidiennes.get(user.id)
    if not quota_user or quota_user["date"] != aujourd_hui:
        analyses_quotidiennes[user.id] = {"date": aujourd_hui, "count": 0}
        quota_user = analyses_quotidiennes[user.id]

    plan = getattr(user, "plan", None) or "gratuit"
    if plan == "elmaas":
        limite = float("inf")
    elif plan == "elmaasyon":
        limite = 3
    else:
        limite = 1  # gratuit : 1 analyse/jour

    # FORCER PROFONDE — ignorer le mode demandé par le client
    profondeur = 2
    timeout_analyse = 25  # Moins que timeout axios (30s)

    # Reconstruire EtatJeu depuis le snapshot initial
    def deserialiser_etat_local(d):
        from puzzle_generator import Plateau, Puzzle
        import numpy as np
        taille = len(d["plateau"]["grille_bicolore"])
        grille = np.array(d["plateau"]["grille_bicolore"], dtype=int)
        puzzles = {}
        for pid, pdata in d["plateau"]["puzzles"].items():
            puzzle = Puzzle(
                id=pdata["id"],
                cellules=set(tuple(c) for c in pdata["cellules"]),
                type_couleur=pdata["type_couleur"],
            )
            puzzle.complete_par = pdata.get("complete_par")
            puzzle.brise = pdata.get("brise", False)
            puzzle.protege = pdata.get("protege", False)
            puzzles[pid] = puzzle
        pieces_raw = d["plateau"].get("pieces", {})
        pieces = {k: v for k, v in pieces_raw.items() if v is not None}
        cellules_actives = set()
        for c in d["plateau"].get("cellules_actives", []):
            if isinstance(c, str):
                parts = c.split(",")
                cellules_actives.add((int(parts[0]), int(parts[1])))
            else:
                cellules_actives.add(tuple(c))
        plateau = Plateau(
            grille_bicolore=grille,
            puzzles=puzzles,
            pieces=pieces,
            cellules_actives=cellules_actives,
            cellules_libres=[tuple(c) for c in d["plateau"].get("cellules_libres", [])],
        )
        from game_engine import Joueur
        def deser_joueur(jd):
            j = Joueur(couleur=jd["couleur"])
            j.main_active = jd.get("main_active", [])
            j.reserve = jd.get("reserve", [])
            j.nb_pieces_posees_depuis_regen = jd.get("nb_pieces_posees_depuis_regen", 0)
            j.seuil_regen_actuel = jd.get("seuil_regen_actuel", 5)
            j.serie_actuelle = jd.get("serie_actuelle", 0)
            j.pieces_protegees = set(jd.get("pieces_protegees", []))
            return j
        etat = EtatJeu(plateau=plateau)
        etat.joueur1 = deser_joueur(d["joueur1"])
        etat.joueur2 = deser_joueur(d["joueur2"])
        etat.tour_actuel = d.get("tour_actuel", 0)
        etat.numero_tour = d.get("numero_tour", 0)
        etat.manche_terminee = d.get("manche_terminee", False)
        etat.gagnant = d.get("gagnant")
        return etat

    try:
        # ═══════════════════════════════════════════════════════════
        # Obtenir un EtatJeu propre (plateau vide, puzzles frais)
        # ═══════════════════════════════════════════════════════════

        # 1. Si on a déjà un EtatJeu en mémoire (nouvelle partie)
        if etat_initial is not None and hasattr(etat_initial, 'plateau'):
            print(f"[analyse] Utilisation état initial en mémoire (EtatJeu)")

        # 2. Sinon, convertir depuis le dict JSON (DB ou frontend)
        elif etat_init_dict is not None:
            print(f"[analyse] Conversion état depuis dict JSON...")
            try:
                etat_initial = deserialiser_etat_local(etat_init_dict)
                # Stocker l'objet EtatJeu (pas le dict) pour les prochaines fois
                etats_initiaux[partie_id] = etat_initial
            except Exception as e_deser:
                import traceback; traceback.print_exc()
                print(f"[analyse] Erreur désérialisation : {e_deser}")
                # Fallback : essayer l'état en cours dans parties
                etat_initial = parties.get(partie_id)

        # 3. Dernier fallback
        else:
            etat_initial = parties.get(partie_id)

        if etat_initial is None or not hasattr(etat_initial, 'plateau'):
            return jsonify({"erreur": "Impossible de reconstruire l'état initial de la partie"}), 500

        # Vérifier que c'est bien un EtatJeu propre
        nb_p = len([v for v in etat_initial.plateau.pieces.values() if v is not None])
        print(f"[analyse] État : J1 main={len(etat_initial.joueur1.main_active)} res={len(etat_initial.joueur1.reserve)}")
        print(f"[analyse] État : J2 main={len(etat_initial.joueur2.main_active)} res={len(etat_initial.joueur2.reserve)}")
        print(f"[analyse] État : plateau={nb_p} pièces posées (doit être proche de 0)")

        resultat = analyser_partie_complete(
            coups_historique=historique,
            etat_initial=etat_initial,
            couleur_joueur=data.get("couleur"),
            profondeur=profondeur,
            timeout_global=timeout_analyse
        )

        quota_user["count"] += 1

        return jsonify({
            "succes": True,
            "analyse": resultat,
            "quota_restant": (limite - quota_user["count"]) if limite != float("inf") else -1,
            "plan": plan or "gratuit",
        })

    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"erreur": f"Erreur analyse : {str(e)}"}), 500
@app.route("/jouer/<partie_id>", methods=["POST"])
def jouer(partie_id: str):
    etat = parties.get(partie_id)
    if not etat:
        return jsonify({"erreur": "Partie introuvable"}), 404
    partie_timestamps[partie_id] = time.time()  # Garder la partie "active"
    # Nettoyage toutes les 50 requêtes environ
    if len(parties) > 10:
        nettoyer_parties_anciennes()

    data = request.json or {}
    action = data.get("action")
    if not action:
        return jsonify({"erreur": "Action manquante"}), 400
        # Enregistrer le coup pour analyse ultérieure
    if action in ("poser", "repiocher", "scout") and etat:
        coup_enregistre = {
            "type": action,
            "numero_tour": etat.numero_tour,
            "couleur": etat.joueur_actif().couleur,
        }
        if action == "poser":
            piece_idx = int(data.get("piece_index", 0))
            coup_enregistre["piece_index"] = piece_idx
            coup_enregistre["origine"] = list(data.get("origine", [0, 0]))
            coup_enregistre["pouvoir"] = data.get("pouvoir", "rien")
            # Enregistrer la piece complete pour que l'analyse puisse la rejouer exactement
            joueur_actuel = etat.joueur_actif()
            if 0 <= piece_idx < len(joueur_actuel.main_active):
                coup_enregistre["piece_data"] = serialiser_piece(joueur_actuel.main_active[piece_idx])
        if partie_id not in historique_coups:
            historique_coups[partie_id] = []
        historique_coups[partie_id].append(coup_enregistre)
    kwargs = {}
    if "piece_index" in data:
        kwargs["piece_index"] = int(data["piece_index"])
    if "origine" in data:
        kwargs["origine"] = tuple(data["origine"])
    if "pouvoir" in data:
        kwargs["pouvoir"] = data["pouvoir"]
    if "cible_pouvoir" in data:
        kwargs["cible_pouvoir"] = tuple(data["cible_pouvoir"])
    if "extraire" in data:
        kwargs["extraire"] = [tuple(p) for p in data["extraire"]]
    if "recoloriage" in data:
        kwargs["recoloriage"] = tuple(data["recoloriage"])

    if action == "pouvoir":
        from game_engine import appliquer_pouvoir, appliquer_bonus_serie, recolorier_piece
        pouvoir = data.get("pouvoir", "rien")
        cible = tuple(data["cible_pouvoir"]) if "cible_pouvoir" in data else None
        resultat = {"succes": True}
        passer = True

        if pouvoir == "extraire":
            positions = [tuple(p) for p in data.get("extraire", [])]
            bonus = appliquer_bonus_serie(etat, positions if positions else None)
            resultat.update(bonus)
            nb_recol = bonus.get("recoloriages_possibles", 0)
            resultat["recoloriages_possibles"] = nb_recol
            if nb_recol > 0:
                passer = False
        elif pouvoir == "recoloriage":
            if cible:
                r = recolorier_piece(etat, cible)
                resultat.update(r)
        elif pouvoir == "proteger_main":
            idx = data.get("piece_index")
            joueur = etat.joueur_actif()
            if idx is not None and 0 <= int(idx) < len(joueur.main_active):
                cle = f"main_{idx}"
                joueur.pieces_protegees.add(cle)
                resultat["succes"] = True
                resultat["protege"] = cle
            else:
                resultat["succes"] = False
                resultat["erreur"] = "Index invalide"
        elif pouvoir == "echanger_main":
            idx_adverse = data.get("piece_index_adverse")
            idx_donner = data.get("piece_index_donner")
            joueur = etat.joueur_actif()
            adverse = etat.joueur_adverse()
            ok_adverse = idx_adverse is not None and 0 <= int(idx_adverse) < len(adverse.main_active)
            ok_donner = idx_donner is not None and 0 <= int(idx_donner) < len(joueur.main_active)
            if ok_adverse and ok_donner:
                piece_prise = adverse.main_active.pop(int(idx_adverse))
                piece_donnee = joueur.main_active.pop(int(idx_donner))
                joueur.main_active.append(piece_prise)
                adverse.main_active.append(piece_donnee)
                joueur.piocher()
                adverse.piocher()
                resultat["succes"] = True
            elif ok_adverse:
                piece = adverse.main_active.pop(int(idx_adverse))
                joueur.main_active.append(piece)
                resultat["succes"] = True
            else:
                resultat["succes"] = False
                resultat["erreur"] = "Index invalide"
        else:
            r = appliquer_pouvoir(etat, pouvoir, cible)
            resultat.update(r)

        if passer:
            etat.passer_tour()
        etat_serialise = serialiser_etat(etat)
        resultat["etat"] = etat_serialise
        resultat["scores"] = calculer_scores(etat)
        resultat["manche_terminee"] = etat.manche_terminee
        resultat["gagnant"] = etat.gagnant
        socketio.emit("etat_mis_a_jour", {
            "etat": etat_serialise, "action": "pouvoir",
            "puzzles_completes": [], "manche_terminee": etat.manche_terminee,
            "gagnant": etat.gagnant,
        }, room=partie_id)
        return jsonify(resultat)

    joueur_avant = etat.tour_actuel
    resultat = jouer_tour(etat, action, **kwargs)

    if resultat.get("succes") and not resultat.get("attente_pouvoir", False):
        if bonus_double_tour.get(partie_id):
            etat.tour_actuel = joueur_avant
            etat.numero_tour -= 1
            etat.timestamp_debut_tour = time.time()  # FIX: remettre timestamp au double tour
            bonus_double_tour[partie_id] = False
            resultat["double_tour_consomme"] = True

    etat_serialise = serialiser_etat(etat)
    resultat["etat"] = etat_serialise

    if "puzzles_completes" in resultat:
        resultat["puzzles_completes"] = [
            serialiser_puzzle(p) for p in resultat["puzzles_completes"]
        ]

    if resultat.get("manche_terminee") and not resultat.get("manche_deja_comptee") and etat.gagnant in ("rouge", "noir"):
        if not resultat.get("attente_pouvoir"):
            scores_manches[partie_id][etat.gagnant] = scores_manches.get(partie_id, {}).get(etat.gagnant, 0) + 1
            resultat["scores_manches"] = scores_manches.get(partie_id, {"rouge": 0, "noir": 0})
            # Mise à jour ELO multijoueur
            threading.Thread(
                target=enregistrer_elo_fin_partie,
                args=(partie_id, etat.gagnant),
                daemon=True
            ).start()

    if resultat.get("succes"):
        sauvegarder_partie(partie_id)
        socketio.emit("etat_mis_a_jour", {
            "etat": etat_serialise,
            "action": action,
            "puzzles_completes": resultat.get("puzzles_completes", []),
            "manche_terminee": etat.manche_terminee,
            "gagnant": etat.gagnant,
            "scores_manches": scores_manches.get(partie_id, {"rouge": 0, "noir": 0}),
            "regeneration": resultat.get("regeneration"),
            "defaite_regen": resultat.get("defaite_regen", False),
        }, room=partie_id)

    return jsonify(resultat)


@app.route("/scores/<partie_id>", methods=["GET"])
def scores(partie_id: str):
    etat = parties.get(partie_id)
    if not etat:
        return jsonify({"erreur": "Partie introuvable"}), 404
    return jsonify(calculer_scores(etat))


@app.route("/parties", methods=["GET"])
def lister_parties():
    return jsonify({"nb_parties": len(parties), "parties": list(parties.keys())})


@app.route("/ia/<partie_id>", methods=["POST"])
def coup_ia(partie_id: str):
    etat = parties.get(partie_id)
    if not etat:
        return jsonify({"erreur": "Partie introuvable"}), 404

    data = request.json or {}
    niveau = int(data.get("niveau", 2))

    # CAPTURER le joueur IA AVANT tout (avant que jouer_tour ne change tour_actuel)
    joueur_ia = etat.joueur_actif()
    couleur_ia = joueur_ia.couleur
    adverse = etat.joueur_adverse()

    # Jouer le coup IA
    coup = jouer_ia(etat, joueur_ia, niveau)

    # Si aucun coup possible -> repiocher
    if coup is None:
        from game_engine import action_passer_repiocher
        action_passer_repiocher(etat)
        etat.passer_tour()
        etat.timestamp_debut_tour = time.time()
        etat_serialise = serialiser_etat(etat)
        socketio.emit("etat_mis_a_jour", {
            "etat": etat_serialise, "action": "repiocher",
            "puzzles_completes": [], "manche_terminee": etat.manche_terminee,
            "gagnant": etat.gagnant,
        }, room=partie_id)
        return jsonify({"succes": True, "action": "repiocher", "etat": etat_serialise})

    piece_index, origine = coup
    resultat = jouer_tour(etat, "poser", piece_index=piece_index, origine=list(origine), pouvoir="rien")

    # === GESTION POUVOIR POST-COMPLETION ===
    if resultat.get("attente_pouvoir") and not resultat.get("victoire_immediate"):

        # NIVEAU 4: choix intelligent du pouvoir
        if niveau >= 4:
            from ai_player import choisir_pouvoir_niveau_4
            pouvoir_choisi, cible = choisir_pouvoir_niveau_4(etat, joueur_ia, resultat.get("puzzles_completes", []))

            if pouvoir_choisi == "extraire" and cible:
                from game_engine import appliquer_bonus_serie
                positions = cible if isinstance(cible, list) else [cible]
                bonus = appliquer_bonus_serie(etat, positions)
                if bonus.get("recoloriages_possibles", 0) > 0 and positions:
                    from game_engine import recolorier_piece
                    recolorier_piece(etat, positions[0])
            elif pouvoir_choisi == "echanger" and cible:
                from game_engine import appliquer_pouvoir
                appliquer_pouvoir(etat, "echanger", cible)
            else:
                from game_engine import appliquer_pouvoir
                appliquer_pouvoir(etat, "rien")

        # NIVEAU 2-3: echange automatique simple
        elif niveau >= 2 and adverse.main_active:
            piece_prise = adverse.main_active.pop(0)
            if joueur_ia.main_active:
                piece_donnee = joueur_ia.main_active.pop(-1)
                adverse.main_active.append(piece_donnee)
            joueur_ia.main_active.append(piece_prise)
            # Appliquer le pouvoir "rien" pour terminer proprement
            from game_engine import appliquer_pouvoir
            appliquer_pouvoir(etat, "rien")
        else:
            # Niveau 1 ou pas d'adversaire -> rien
            from game_engine import appliquer_pouvoir
            appliquer_pouvoir(etat, "rien")

        # UN SEUL passer_tour() ici car jouer_tour() ne l'a PAS fait (attente_pouvoir=True)
        if not etat.manche_terminee:
            etat.passer_tour()

    # Si PAS d'attente_pouvoir, jouer_tour() a DEJA appele passer_tour()
    # -> on ne fait RIEN, juste mettre a jour le timestamp
    etat.timestamp_debut_tour = time.time()

    # Serialiser et retourner
    etat_serialise = serialiser_etat(etat)
    resultat["etat"] = etat_serialise
    resultat["manche_terminee"] = etat.manche_terminee
    resultat["gagnant"] = etat.gagnant
    if "puzzles_completes" in resultat:
        resultat["puzzles_completes"] = [serialiser_puzzle(p) for p in resultat["puzzles_completes"]]

    # Mise à jour ELO si la manche vient de se terminer
    if etat.manche_terminee and etat.gagnant in ("rouge", "noir"):
        threading.Thread(
            target=enregistrer_elo_fin_partie,
            args=(partie_id, etat.gagnant),
            daemon=True
        ).start()

    socketio.emit("etat_mis_a_jour", {
        "etat": etat_serialise, "action": "poser",
        "puzzles_completes": resultat.get("puzzles_completes", []),
        "manche_terminee": etat.manche_terminee,
        "gagnant": etat.gagnant,
    }, room=partie_id)

    return jsonify(resultat)


@app.route("/pixels/<partie_id>", methods=["GET"])
def get_pixels(partie_id: str):
    pixels = pixels_par_partie.get(partie_id)
    if not pixels:
        return jsonify({"erreur": "Pixels introuvables"}), 404
    etat = parties.get(partie_id)
    taille = len(pixels)
    nom = noms_par_partie.get(partie_id, "")
    timer_sec = timer_par_partie.get(partie_id, 30)
    return jsonify({
        "pixels_photo": pixels,
        "taille": taille,
        "timer_sec": timer_sec,
        "etat": serialiser_etat(etat) if etat else None,
        "indice": {
            "longueur": len(nom),
            "premiere_lettre": nom[0].upper() if nom else "?"
        }
    })


@app.route("/reconnaitre/<partie_id>", methods=["POST"])
def reconnaitre(partie_id: str):
    if partie_id not in parties:
        return jsonify({"erreur": "Partie introuvable"}), 404
    if reconnaissance_tentee.get(partie_id):
        return jsonify({"succes": False, "message": "Tentative déjà utilisée"}), 400

    reconnaissance_tentee[partie_id] = True
    data = request.json or {}
    proposition = data.get("proposition", "").strip()
    nom_reel = noms_par_partie.get(partie_id, "")
    longueur = len(nom_reel)
    tolerance = 1 if longueur <= 5 else 2

    def levenshtein(a, b):
        a, b = a.lower(), b.lower()
        dp = list(range(len(b) + 1))
        for i, ca in enumerate(a):
            ndp = [i + 1]
            for j, cb in enumerate(b):
                ndp.append(min(dp[j] + (ca != cb), dp[j+1] + 1, ndp[j] + 1))
            dp = ndp
        return dp[len(b)]

    distance = levenshtein(proposition, nom_reel)
    gagne = distance <= tolerance
    if gagne:
        bonus_double_tour[partie_id] = True

    return jsonify({
        "succes": gagne, "distance": distance, "tolerance": tolerance,
        "nom_reel": nom_reel if not gagne else None,
        "bonus_actif": bonus_double_tour.get(partie_id, False)
    })


@app.route("/bonus/<partie_id>", methods=["GET"])
def get_bonus(partie_id: str):
    return jsonify({
        "bonus_double_tour": bonus_double_tour.get(partie_id, False),
        "reconnaissance_tentee": reconnaissance_tentee.get(partie_id, False)
    })


@app.route("/bonus/consommer/<partie_id>", methods=["POST"])
def consommer_bonus(partie_id: str):
    if bonus_double_tour.get(partie_id):
        bonus_double_tour[partie_id] = False
        return jsonify({"succes": True})
    return jsonify({"succes": False, "message": "Pas de bonus actif"}), 400


#  Pause mutuelle 
@app.route("/pause/demander/<partie_id>", methods=["POST"])
def demander_pause(partie_id: str):
    if partie_id not in parties:
        return jsonify({"erreur": "Partie introuvable"}), 404
    data = request.json or {}
    couleur = data.get("couleur")
    if pause_active.get(partie_id):
        return jsonify({"succes": False, "message": "Déjà en pause"})
    demandes_pause[partie_id] = couleur
    socketio.emit("pause_demandee", {"couleur": couleur}, room=partie_id)
    return jsonify({"succes": True, "demandeur": couleur})


@app.route("/pause/accepter/<partie_id>", methods=["POST"])
def accepter_pause(partie_id: str):
    if partie_id not in parties:
        return jsonify({"erreur": "Partie introuvable"}), 404
    pause_active[partie_id] = True
    demandes_pause[partie_id] = None
    socketio.emit("pause_active", {}, room=partie_id)
    return jsonify({"succes": True})


@app.route("/pause/reprendre/<partie_id>", methods=["POST"])
def reprendre_pause(partie_id: str):
    if partie_id not in parties:
        return jsonify({"erreur": "Partie introuvable"}), 404
    pause_active[partie_id] = False
    # Remettre le timestamp à la reprise pour que le timer reparte
    parties[partie_id].timestamp_debut_tour = time.time()
    socketio.emit("pause_terminee", {"etat": serialiser_etat(parties[partie_id])}, room=partie_id)
    return jsonify({"succes": True})


@app.route("/pause/refuser/<partie_id>", methods=["POST"])
def refuser_pause(partie_id: str):
    if partie_id not in parties:
        return jsonify({"erreur": "Partie introuvable"}), 404
    demandes_pause[partie_id] = None
    socketio.emit("pause_refusee", {}, room=partie_id)
    return jsonify({"succes": True})




@app.route("/scores_manches/<partie_id>", methods=["GET"])
def get_scores_manches(partie_id: str):
    return jsonify({
        "scores_manches": scores_manches.get(partie_id, {"rouge": 0, "noir": 0}),
        "pause_active": pause_active.get(partie_id, False),
        "demande_pause": demandes_pause.get(partie_id),
    })


@app.route("/supprimer/<partie_id>", methods=["DELETE"])
def supprimer_partie(partie_id: str):
    if partie_id in parties:
        nettoyer_partie(partie_id)
        return jsonify({"succes": True})
    return jsonify({"erreur": "Partie introuvable"}), 404


@app.route("/debug/memoire", methods=["GET"])
def debug_memoire():
    """Diagnostic mémoire — nombre de parties en RAM."""
    return jsonify({
        "parties_en_memoire": len(parties),
        "pixels_en_memoire": len(pixels_par_partie),
        "historiques_en_memoire": len(historique_coups),
        "etats_initiaux": len(etats_initiaux),
        "joueurs_connectes": len(joueurs_connectes),
    })


if __name__ == "__main__":
    print("=" * 50)
    print("  ELMAAS API — Démarrage")
    print("=" * 50)
    port = int(os.environ.get("PORT", 8080))
    socketio.run(app, debug=False, port=port, host="0.0.0.0",
                 allow_unsafe_werkzeug=True)