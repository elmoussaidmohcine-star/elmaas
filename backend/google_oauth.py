# ELMAAS — google_oauth.py
# Google OAuth 2.0 : connexion via compte Google
# Installation : pip install Authlib requests
#
# Variables Railway à ajouter :
#   GOOGLE_CLIENT_ID     = ton_client_id.apps.googleusercontent.com
#   GOOGLE_CLIENT_SECRET = ton_secret
#
# Callback URL à configurer sur Google Cloud Console :
#   https://elmaas.up.railway.app/auth/google/callback

import os
from flask import Blueprint, redirect, request, jsonify, url_for
from authlib.integrations.flask_client import OAuth
from models import db, Utilisateur
from auth import generer_token
import secrets
import string

google_bp = Blueprint("google_oauth", __name__)

oauth = OAuth()

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.elmaas.fun")


def init_google_oauth(app):
    """Initialise Google OAuth avec l'app Flask. Appeler dans api.py."""
    oauth.init_app(app)
    oauth.register(
        name="google",
        client_id="68474294787-lj8ntgrgf7b3igheug7ln6aqpta7hfuq.apps.googleusercontent.com",
        client_secret="GOCSPX-TON_SECRET_COMPLET_ICI",
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def generer_pseudo_unique(base: str) -> str:
    """Génère un pseudo unique à partir d'un nom (ex: "jean.dupont" → "JeanDupont123")."""
    base = "".join(c for c in base if c.isalnum())[:20] or "Joueur"
    for _ in range(10):
        suffix = "".join(secrets.choice(string.digits) for _ in range(3))
        pseudo = f"{base}{suffix}"
        if not Utilisateur.query.filter_by(pseudo=pseudo).first():
            return pseudo
    return f"Joueur{secrets.token_hex(4)}"


@google_bp.route("/auth/google")
def google_login():
    # URL de callback en dur en HTTPS (Railway termine le SSL au proxy, url_for() renvoie http)
    redirect_uri = "https://elmaas.up.railway.app/auth/google/callback"
    return oauth.google.authorize_redirect(redirect_uri)


@google_bp.route("/auth/google/callback")
def google_callback():
    """Callback après autorisation Google. Crée/récupère l'utilisateur, génère un token, redirige."""
    try:
        token = oauth.google.authorize_access_token()
        info = token.get("userinfo") or oauth.google.parse_id_token(token)
        if not info:
            return redirect(f"{FRONTEND_URL}?auth_error=no_info")

        email = info.get("email", "").lower()
        nom = info.get("name", "") or info.get("given_name", "")
        google_id = info.get("sub", "")

        if not email:
            return redirect(f"{FRONTEND_URL}?auth_error=no_email")

        # Chercher ou créer l'utilisateur
        user = Utilisateur.query.filter_by(email=email).first()
        if not user:
            pseudo = generer_pseudo_unique(nom)
            user = Utilisateur(
                email=email,
                pseudo=pseudo,
                mot_de_passe="",  # pas de mot de passe pour Google login
                google_id=google_id,
            )
            db.session.add(user)
            db.session.commit()
        elif not getattr(user, "google_id", None):
            user.google_id = google_id
            db.session.commit()

        token_jwt = generer_token(user.id)
        # Redirige vers le frontend avec le token
        return redirect(f"{FRONTEND_URL}?google_token={token_jwt}")

    except Exception as e:
        print(f"[google_oauth] Erreur callback : {e}")
        return redirect(f"{FRONTEND_URL}?auth_error=oauth_failed")
