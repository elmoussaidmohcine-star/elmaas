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
    user_id = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"), unique=True)
    pseudo = db.Column(db.String(50))
    elm = db.Column(db.Integer, default=500)
    timer_sec = db.Column(db.Integer, default=30)
    entree_le = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    partie_id = db.Column(db.String(100), nullable=True)  # rempli quand matché


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
            # Match trouvé : créer partie_id + update les 2 lignes
            partie_id = uuid.uuid4().hex[:8].upper()
            ma_ligne.partie_id = partie_id
            c.partie_id = partie_id
            db.session.commit()
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
        return jsonify({"erreur": "Non authentifié"}), 401

    data = request.get_json() or {}
    timer_sec = int(data.get("timer_sec", 30))

    # Supprime ancienne entrée si existante
    FileAttente.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    # Crée nouvelle entrée
    entree = FileAttente(
        user_id=user.id,
        pseudo=user.pseudo or f"Joueur{user.id}",
        elm=user.elo or 500,
        timer_sec=timer_sec,
    )
    db.session.add(entree)
    db.session.commit()

    return jsonify({"succes": True, "en_file": True})


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
        return jsonify({
            "status": "match",
            "partie_id": ma_ligne.partie_id,
            "adversaire_pseudo": autre.pseudo if autre else "Adversaire",
            "adversaire_elm": autre.elm if autre else 500,
            # Tirage aléatoire Rouge/Noir (stable : basé sur l'id le plus bas)
            "ma_couleur": "rouge" if user.id < (autre.user_id if autre else 0) else "noir",
            "rouge_choisit_photo": (user.id < (autre.user_id if autre else 0)),
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
        # Tirage au sort Rouge/Noir basé sur user_id (déterministe entre les 2 appels)
        ma_couleur = "rouge" if user.id < autre.user_id else "noir"
        return jsonify({
            "status": "match",
            "partie_id": partie_id,
            "adversaire_pseudo": autre.pseudo,
            "adversaire_elm": autre.elm,
            "ma_couleur": ma_couleur,
            "rouge_choisit_photo": (user.id < autre.user_id),
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
