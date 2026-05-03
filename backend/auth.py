# ============================================================
#  ELMAAS — auth.py
#  Routes : inscription, connexion, profil, classement ELO
# ============================================================

import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from models import db, Utilisateur, PartieHistorique, calculer_elo

auth_bp = Blueprint("auth", __name__)
SECRET_KEY = os.environ.get("SECRET_KEY", "elmaas_secret_dev")

def generer_token(user_id):
    payload = {"user_id": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verifier_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except Exception:
        return None

def get_user_from_request():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    user_id = verifier_token(token)
    if not user_id:
        return None
    return Utilisateur.query.get(user_id)

@auth_bp.route("/auth/inscription", methods=["POST"])
def inscription():
    data = request.json or {}
    email  = data.get("email", "").strip().lower()
    pseudo = data.get("pseudo", "").strip()
    mdp    = data.get("mot_de_passe", "")
    if not email or not pseudo or not mdp:
        return jsonify({"erreur": "Tous les champs sont requis"}), 400
    if len(mdp) < 6:
        return jsonify({"erreur": "Mot de passe trop court (6 car. min)"}), 400
    if Utilisateur.query.filter_by(email=email).first():
        return jsonify({"erreur": "Email deja utilise"}), 400
    if Utilisateur.query.filter_by(pseudo=pseudo).first():
        return jsonify({"erreur": "Pseudo deja pris"}), 400
    hash_mdp = bcrypt.hashpw(mdp.encode(), bcrypt.gensalt()).decode()
    user = Utilisateur(email=email, pseudo=pseudo, mot_de_passe=hash_mdp)
    db.session.add(user)
    db.session.commit()
    return jsonify({"succes": True, "token": generer_token(user.id), "utilisateur": user.to_dict()})

@auth_bp.route("/auth/connexion", methods=["POST"])
def connexion():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    mdp   = data.get("mot_de_passe", "")
    user = Utilisateur.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(mdp.encode(), user.mot_de_passe.encode()):
        return jsonify({"erreur": "Email ou mot de passe incorrect"}), 401
    return jsonify({"succes": True, "token": generer_token(user.id), "utilisateur": user.to_dict()})

@auth_bp.route("/auth/moi", methods=["GET"])
def moi():
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifie"}), 401
    return jsonify(user.to_dict())

@auth_bp.route("/classement", methods=["GET"])
def classement():
    top = Utilisateur.query.filter(Utilisateur.parties_jouees > 0).order_by(Utilisateur.elo.desc()).limit(50).all()
    return jsonify([{
        "rang": i + 1, "pseudo": u.pseudo, "elo": u.elo,
        "parties": u.parties_jouees, "victoires": u.victoires,
        "ratio": round(u.victoires / u.parties_jouees * 100) if u.parties_jouees > 0 else 0,
    } for i, u in enumerate(top)])


# ELO fictifs des robots (non stockés en DB, utilisés pour le calcul seulement)
IA_ELO = {
    "Chess":     400,
    "Amal":      650,
    "ELMAASYON": 850,
    "ELMAAS":    1100,
}

@auth_bp.route("/fin_partie", methods=["POST"])
def fin_partie():
    data = request.json or {}
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifie"}), 401

    partie_id     = data.get("partie_id")          # UUID de la partie
    adversaire_ps = data.get("adversaire_pseudo", "")
    gagnant       = int(data.get("gagnant", 0))    # 1=moi gagne, 2=adversaire gagne, 0=égalité
    score_j1      = int(data.get("score_j1", 0))
    score_j2      = int(data.get("score_j2", 0))

    # ── Anti-double : si partie_id déjà enregistrée → renvoyer le résultat correct pour CE joueur ──
    if partie_id:
        existant = PartieHistorique.query.filter_by(partie_id=partie_id).first()
        if existant:
            # Déterminer si l'appelant est j1 ou j2
            if existant.joueur2_id and existant.joueur2_id == user.id:
                elo_avant = existant.elo_j2_avant or 500
                elo_apres = existant.elo_j2_apres or 500
            else:
                elo_avant = existant.elo_j1_avant
                elo_apres = existant.elo_j1_apres
            return jsonify({
                "succes": True,
                "deja_traite": True,
                "elo_avant": elo_avant,
                "elo_apres": elo_apres,
                "delta": elo_apres - elo_avant,
            })

    elo_user_avant = user.elo

    # ── Cas IA : adversaire fictif, ELO fixe ──
    est_ia = adversaire_ps in IA_ELO
    if est_ia:
        elo_ia = IA_ELO[adversaire_ps]
        nv_elo_user, _ = calculer_elo(user.elo, elo_ia, gagnant)
        user.elo = nv_elo_user
        user.parties_jouees += 1
        if gagnant == 1:   user.victoires += 1
        elif gagnant == 2: user.defaites  += 1

        db.session.add(PartieHistorique(
            partie_id=partie_id,
            joueur1_id=user.id,
            joueur2_id=None,
            gagnant_id=user.id if gagnant == 1 else None,
            elo_j1_avant=elo_user_avant,
            elo_j2_avant=elo_ia,
            elo_j1_apres=nv_elo_user,
            elo_j2_apres=elo_ia,
            score_j1=score_j1,
            score_j2=score_j2,
        ))
        db.session.commit()
        return jsonify({
            "succes": True,
            "elo_avant": elo_user_avant,
            "elo_apres": nv_elo_user,
            "delta": nv_elo_user - elo_user_avant,
        })

    # ── Cas multijoueur : chercher l'adversaire en DB ──
    adversaire = Utilisateur.query.filter_by(pseudo=adversaire_ps).first()
    if not adversaire:
        # Adversaire sans compte : mise à jour solo seulement
        elo_virtuel = 500
        nv_elo_user, _ = calculer_elo(user.elo, elo_virtuel, gagnant)
        user.elo = nv_elo_user
        user.parties_jouees += 1
        if gagnant == 1:   user.victoires += 1
        elif gagnant == 2: user.defaites  += 1
        db.session.add(PartieHistorique(
            partie_id=partie_id,
            joueur1_id=user.id,
            joueur2_id=None,
            gagnant_id=user.id if gagnant == 1 else None,
            elo_j1_avant=elo_user_avant,
            elo_j2_avant=elo_virtuel,
            elo_j1_apres=nv_elo_user,
            elo_j2_apres=elo_virtuel,
            score_j1=score_j1,
            score_j2=score_j2,
        ))
        db.session.commit()
        return jsonify({
            "succes": True,
            "elo_avant": elo_user_avant,
            "elo_apres": nv_elo_user,
            "delta": nv_elo_user - elo_user_avant,
        })

    # ── Deux joueurs avec comptes ──
    elo_j1_avant, elo_j2_avant = user.elo, adversaire.elo
    nv_elo_j1, nv_elo_j2 = calculer_elo(elo_j1_avant, elo_j2_avant, gagnant)

    user.elo = nv_elo_j1;        user.parties_jouees      += 1
    adversaire.elo = nv_elo_j2;  adversaire.parties_jouees += 1
    if gagnant == 1:
        user.victoires += 1;       adversaire.defaites  += 1
    elif gagnant == 2:
        adversaire.victoires += 1; user.defaites        += 1

    db.session.add(PartieHistorique(
        partie_id=partie_id,
        joueur1_id=user.id,
        joueur2_id=adversaire.id,
        gagnant_id=user.id if gagnant == 1 else (adversaire.id if gagnant == 2 else None),
        elo_j1_avant=elo_j1_avant, elo_j2_avant=elo_j2_avant,
        elo_j1_apres=nv_elo_j1,   elo_j2_apres=nv_elo_j2,
        score_j1=score_j1, score_j2=score_j2,
    ))
    db.session.commit()
    return jsonify({
        "succes": True,
        "elo_avant": elo_j1_avant,
        "elo_apres": nv_elo_j1,
        "delta": nv_elo_j1 - elo_j1_avant,
    })

@auth_bp.route("/check_upload", methods=["GET"])
def check_upload():
    user = get_user_from_request()
    if not user:
        return jsonify({"peut_uploader": False, "raison": "non_connecte"})
    if user.premium:
        return jsonify({"peut_uploader": True, "raison": "premium"})
    if not user.photo_perso_utilisee:
        return jsonify({"peut_uploader": True, "raison": "gratuit_1"})
    return jsonify({"peut_uploader": False, "raison": "quota_atteint"})

@auth_bp.route("/consommer_upload", methods=["POST"])
def consommer_upload():
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifie"}), 401
    plan = getattr(user, "plan", None) or "gratuit"
    # ELMAAS et ELMAASYON : uploads illimités
    if plan in ("elmaas", "elmaasyon"):
        return jsonify({"succes": True, "illimite": True})
    # Gratuit : 1 seul upload
    if user.photo_perso_utilisee:
        return jsonify({"erreur": "Quota upload atteint", "code": "QUOTA_UPLOAD"}), 403
    user.photo_perso_utilisee = True
    db.session.commit()
    return jsonify({"succes": True, "illimite": False})