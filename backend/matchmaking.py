# ELMAAS — matchmaking.py
# File d'attente en DB Postgres. Matching élargi progressivement.

import time
import random
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db
from auth import get_user_from_request

matchmaking_bp = Blueprint("matchmaking", __name__)


# ─────────────────────────────────────────────────────────
# Modèle DB pour la file d'attente
# ─────────────────────────────────────────────────────────
class FileAttente(db.Model):
    __tablename__ = "file_attente"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, unique=True, nullable=False, index=True)
    pseudo = db.Column(db.String(50))
    elm = db.Column(db.Integer, default=500)
    timer_sec = db.Column(db.Integer, default=30)
    entree_le = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    partie_id = db.Column(db.String(100), nullable=True)  # rempli quand matché
    ma_couleur = db.Column(db.String(10), nullable=True)  # "rouge" ou "noir", défini au match


def tolerance_elm(secondes_attente: float) -> int:
    """Élargissement progressif : ±100 puis 200, 300, 400, 500 par minute."""
    if secondes_attente < 60:
        return 100
    if secondes_attente < 120:
        return 200
    if secondes_attente < 180:
        return 300
    if secondes_attente < 240:
        return 400
    return 500


def chercher_match(user):
    """
    Essaye de matcher user avec un autre joueur en file.
    Retourne (autre_user_entry, partie_id) si match, sinon (None, None).
    """
    maintenant = datetime.now(timezone.utc)

    # Récupère mon entrée
    ma_ligne = FileAttente.query.filter_by(user_id=user.id).first()
    if not ma_ligne:
        return None, None
    if ma_ligne.partie_id:
        return None, ma_ligne.partie_id  # déjà matché

    # Temps que j'ai attendu
    attente_moi = (maintenant - ma_ligne.entree_le.replace(tzinfo=timezone.utc)).total_seconds()
    tol_moi = tolerance_elm(attente_moi)

    # Cherche candidats : même timer, pas encore matchés, ELM dans ma tolérance
    candidats = FileAttente.query.filter(
        FileAttente.user_id != user.id,
        FileAttente.timer_sec == ma_ligne.timer_sec,
        FileAttente.partie_id.is_(None),
    ).all()

    for c in candidats:
        # Vérif tolérance des DEUX côtés
        attente_c = (maintenant - c.entree_le.replace(tzinfo=timezone.utc)).total_seconds()
        tol_c = tolerance_elm(attente_c)
        ecart = abs(ma_ligne.elm - c.elm)
        if ecart <= tol_moi and ecart <= tol_c:
            # Match trouvé : créer partie_id + assigner les couleurs
            partie_id = uuid.uuid4().hex[:8].upper()
            ma_ligne.partie_id = partie_id
            c.partie_id = partie_id
            # Tirage déterministe et stocké : le user.id le plus bas joue rouge
            if ma_ligne.user_id < c.user_id:
                ma_ligne.ma_couleur = "rouge"
                c.ma_couleur = "noir"
            else:
                ma_ligne.ma_couleur = "noir"
                c.ma_couleur = "rouge"
            db.session.commit()
            print(f"[matchmaking] MATCH : {ma_ligne.pseudo}({ma_ligne.ma_couleur}) vs {c.pseudo}({c.ma_couleur}) partie={partie_id}")
            return c, partie_id

    return None, None


# ─────────────────────────────────────────────────────────
# Routes API
# ─────────────────────────────────────────────────────────
@matchmaking_bp.route("/matchmaking/rejoindre", methods=["POST"])
def rejoindre_file():
    """L'utilisateur entre dans la file d'attente."""
    user = get_user_from_request()
    if not user:
        print("[matchmaking] Rejoindre : non authentifié")
        return jsonify({"erreur": "Non authentifié"}), 401

    data = request.get_json() or {}
    timer_sec = int(data.get("timer_sec", 30))

    try:
        # Supprime ancienne entrée
        FileAttente.query.filter_by(user_id=user.id).delete()
        db.session.commit()

        # Crée nouvelle entrée
        entree = FileAttente(
            user_id=user.id,
            pseudo=user.pseudo or f"Joueur{user.id}",
            elm=user.elo if user.elo is not None else 500,
            timer_sec=timer_sec,
        )
        db.session.add(entree)
        db.session.commit()

        print(f"[matchmaking] Rejoint : user_id={user.id} pseudo={entree.pseudo} elm={entree.elm} timer={timer_sec}")

        # Vérif en DB
        verif = FileAttente.query.filter_by(user_id=user.id).first()
        print(f"[matchmaking] Vérif DB : {verif is not None}")

        return jsonify({"succes": True, "en_file": True})

    except Exception as e:
        db.session.rollback()
        import traceback; traceback.print_exc()
        print(f"[matchmaking] ERREUR REJOINDRE : {e}")
        return jsonify({"erreur": str(e)}), 500


@matchmaking_bp.route("/matchmaking/verifier", methods=["GET"])
def verifier_match():
    """
    À appeler toutes les 3-5s côté frontend.
    Retourne status : "attente" | "match" | "pas_en_file" | "timeout"
    """
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifié"}), 401

    ma_ligne = FileAttente.query.filter_by(user_id=user.id).first()
    if not ma_ligne:
        return jsonify({"status": "pas_en_file"})

    # Déjà matché ?
    if ma_ligne.partie_id:
        autre = FileAttente.query.filter(
            FileAttente.partie_id == ma_ligne.partie_id,
            FileAttente.user_id != user.id
        ).first()
        # La couleur est lue depuis la DB (assignée au moment du match).
        # Si pour une raison historique elle n'est pas définie, on la recalcule.
        ma_couleur = ma_ligne.ma_couleur
        if not ma_couleur and autre:
            ma_couleur = "rouge" if user.id < autre.user_id else "noir"
        elif not ma_couleur:
            ma_couleur = "rouge"  # fallback ultime
        return jsonify({
            "status": "match",
            "partie_id": ma_ligne.partie_id,
            "adversaire_pseudo": autre.pseudo if autre else "Adversaire",
            "adversaire_elm": autre.elm if autre else 500,
            "ma_couleur": ma_couleur,
            "rouge_choisit_photo": ma_couleur == "rouge",
        })

    # Chercher un match
    maintenant = datetime.now(timezone.utc)
    attente_sec = (maintenant - ma_ligne.entree_le.replace(tzinfo=timezone.utc)).total_seconds()

    # Timeout après 5 min
    if attente_sec >= 300:
        FileAttente.query.filter_by(user_id=user.id).delete()
        db.session.commit()
        return jsonify({"status": "timeout"})

    autre, partie_id = chercher_match(user)
    if autre and partie_id:
        # Après chercher_match, ma_ligne.ma_couleur a été défini en DB.
        # Mais l'objet ma_ligne local peut ne pas refléter ça : on recharge.
        db.session.refresh(ma_ligne)
        ma_couleur = ma_ligne.ma_couleur or ("rouge" if user.id < autre.user_id else "noir")
        return jsonify({
            "status": "match",
            "partie_id": partie_id,
            "adversaire_pseudo": autre.pseudo,
            "adversaire_elm": autre.elm,
            "ma_couleur": ma_couleur,
            "rouge_choisit_photo": ma_couleur == "rouge",
        })

    return jsonify({
        "status": "attente",
        "temps_attente": int(attente_sec),
        "tolerance": tolerance_elm(attente_sec),
    })


@matchmaking_bp.route("/matchmaking/quitter", methods=["POST"])
def quitter_file():
    """L'utilisateur annule sa recherche."""
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifié"}), 401

    FileAttente.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return jsonify({"succes": True})


@matchmaking_bp.route("/matchmaking/nettoyer", methods=["POST"])
def nettoyer_file():
    """Admin : nettoie les entrées de plus de 10 min (à appeler périodiquement)."""
    from sqlalchemy import and_
    limite = datetime.now(timezone.utc).timestamp() - 600
    FileAttente.query.filter(
        FileAttente.entree_le < datetime.fromtimestamp(limite, tz=timezone.utc)
    ).delete()
    db.session.commit()
    return jsonify({"succes": True})
@matchmaking_bp.route("/matchmaking/debug", methods=["GET"])
def debug_file():
    """Route debug temporaire : liste les joueurs en file."""
    entrees = FileAttente.query.all()
    return jsonify({
        "nombre": len(entrees),
        "joueurs": [
            {
                "user_id": e.user_id,
                "pseudo": e.pseudo,
                "elm": e.elm,
                "timer_sec": e.timer_sec,
                "entree_le": e.entree_le.isoformat() if e.entree_le else None,
                "partie_id": e.partie_id,
            }
            for e in entrees
        ]
    })
@matchmaking_bp.route("/matchmaking/debug-tables", methods=["GET"])
def debug_tables():
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    return jsonify({
        "tables_existantes": tables,
        "file_attente_existe": "file_attente" in tables,
    })