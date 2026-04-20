# ELMAAS — google_oauth.py (version finale)
# Google OAuth 2.0 avec choix de pseudo obligatoire à la première connexion
# pip install Authlib==1.3.2

import os
import secrets
from flask import Blueprint, redirect, request, jsonify
from authlib.integrations.flask_client import OAuth
from models import db, Utilisateur
from auth import generer_token, get_user_from_request

google_bp = Blueprint("google_oauth", __name__)
oauth = OAuth()

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.elmaas.fun")
BACKEND_URL = "https://elmaas.up.railway.app"  # En dur pour Railway (SSL termination)


def init_google_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name="google",
        client_id="68474294787-lj8ntgrgf7b3igheug7ln6aqpta7hfuq.apps.googleusercontent.com",
        client_secret="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",
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


@google_bp.route("/auth/google")
def google_login():
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"
    return oauth.google.authorize_redirect(redirect_uri)


@google_bp.route("/auth/google/callback")
def google_callback():
    try:
        token = oauth.google.authorize_access_token()
        info = token.get("userinfo") or oauth.google.parse_id_token(token)
        if not info:
            return redirect(f"{FRONTEND_URL}?auth_error=no_info")

        email = (info.get("email") or "").lower()
        google_id = info.get("sub", "")
        if not email:
            return redirect(f"{FRONTEND_URL}?auth_error=no_email")

        user = Utilisateur.query.filter_by(email=email).first()
        if not user:
            # Nouveau compte : pas de pseudo, frontend devra en demander un
            user = Utilisateur(
                email=email,
                pseudo=None,
                mot_de_passe="",
                google_id=google_id,
            )
            db.session.add(user)
            db.session.commit()
        elif not getattr(user, "google_id", None):
            user.google_id = google_id
            db.session.commit()

        token_jwt = generer_token(user.id)
        # Si pas de pseudo → redirige avec besoin_pseudo=1
        if not user.pseudo:
            return redirect(f"{FRONTEND_URL}?google_token={token_jwt}&besoin_pseudo=1")
        return redirect(f"{FRONTEND_URL}?google_token={token_jwt}")
    except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print(f"[google_oauth] ERREUR : {e}")
            print(tb)
            # Expose l'erreur dans l'URL pour debug
            from urllib.parse import quote
            err_msg = quote(str(e)[:200])
            return redirect(f"{FRONTEND_URL}?auth_error=oauth_failed&detail={err_msg}")


# ── Validation + changement de pseudo ──
@google_bp.route("/auth/pseudo/disponible", methods=["GET"])
def pseudo_disponible():
    pseudo = (request.args.get("pseudo") or "").strip()
    if not pseudo or len(pseudo) < 2:
        return jsonify({"disponible": False, "raison": "trop_court"})
    # Filtre mots sacrés
    from filter_mots_sacres import contient_mot_sacre
    bloque, mot = contient_mot_sacre(pseudo)
    if bloque:
        return jsonify({"disponible": False, "raison": "mot_sacre", "mot": mot})
    # Check unicité
    existe = Utilisateur.query.filter_by(pseudo=pseudo).first()
    return jsonify({"disponible": existe is None})


@google_bp.route("/auth/pseudo/definir", methods=["POST"])
def definir_pseudo():
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifié"}), 401
    data = request.get_json() or {}
    pseudo = (data.get("pseudo") or "").strip()
    if not pseudo or len(pseudo) < 2:
        return jsonify({"erreur": "Pseudo trop court"}), 400
    from filter_mots_sacres import contient_mot_sacre
    bloque, _ = contient_mot_sacre(pseudo)
    if bloque:
        return jsonify({"erreur": "mot_sacre"}), 400
    # Check unicité (sauf soi-même)
    autre = Utilisateur.query.filter_by(pseudo=pseudo).first()
    if autre and autre.id != user.id:
        return jsonify({"erreur": "deja_pris"}), 400
    user.pseudo = pseudo
    db.session.commit()
    return jsonify({"succes": True, "utilisateur": user.to_dict()})