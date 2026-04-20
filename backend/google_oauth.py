import os
import secrets
import time
from flask import Blueprint, redirect, request, jsonify
from authlib.integrations.requests_client import OAuth2Session
from models import db, Utilisateur
from auth import generer_token, get_user_from_request

google_bp = Blueprint("google_oauth", __name__)

# Hardcode temporaire (on déplacera en var env après)
GOOGLE_CLIENT_ID = "68474294787-lj8ntgrgf7b3igheug7ln6aqpta7hfuq.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"   #  remplace par ton vrai secret

BACKEND_URL = "https://elmaas-backend.onrender.com"   #  remplace par l'URL Render exacte
FRONTEND_URL = "https://www.elmaas.fun"
REDIRECT_URI = f"{BACKEND_URL}/auth/google/callback"

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# Stockage in-memory des states valides (remplace la session Flask)
# Format : {state: timestamp}
_states_valides = {}
_DUREE_VALIDITE_STATE = 600  # 10 minutes


def _nettoyer_states():
    """Supprime les states expirés."""
    maintenant = time.time()
    expires = [s for s, t in _states_valides.items() if maintenant - t > _DUREE_VALIDITE_STATE]
    for s in expires:
        del _states_valides[s]


def init_google_oauth(app):
    """Pas besoin d'init Authlib — on gère tout nous-mêmes."""
    pass


@google_bp.route("/auth/google")
def google_login():
    """Démarre le flow OAuth."""
    _nettoyer_states()
    state = secrets.token_urlsafe(32)
    _states_valides[state] = time.time()

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    from urllib.parse import urlencode
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return redirect(url)


@google_bp.route("/auth/google/callback")
def google_callback():
    """Reçoit le code Google, échange contre un token, crée/récupère l'utilisateur."""
    try:
        from urllib.parse import quote
        code = request.args.get("code")
        state = request.args.get("state")

        if not code:
            return redirect(f"{FRONTEND_URL}?auth_error=no_code")

        # Vérifie le state (notre propre CSRF check)
        _nettoyer_states()
        if not state or state not in _states_valides:
            return redirect(f"{FRONTEND_URL}?auth_error=invalid_state")
        del _states_valides[state]  # usage unique

        # Échange le code contre un token
        import requests
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        token_resp = requests.post(GOOGLE_TOKEN_URL, data=token_data, timeout=10)
        if token_resp.status_code != 200:
            err = quote(f"Token exchange failed: {token_resp.text[:200]}")
            return redirect(f"{FRONTEND_URL}?auth_error=oauth_failed&detail={err}")

        access_token = token_resp.json().get("access_token")
        if not access_token:
            return redirect(f"{FRONTEND_URL}?auth_error=no_token")

        # Récupère les infos utilisateur
        user_resp = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if user_resp.status_code != 200:
            return redirect(f"{FRONTEND_URL}?auth_error=userinfo_failed")

        info = user_resp.json()
        email = (info.get("email") or "").lower()
        google_id = info.get("sub", "")

        if not email:
            return redirect(f"{FRONTEND_URL}?auth_error=no_email")

        # Crée ou récupère l'utilisateur
        user = Utilisateur.query.filter_by(email=email).first()
        if not user:
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

        if not user.pseudo:
            return redirect(f"{FRONTEND_URL}?google_token={token_jwt}&besoin_pseudo=1")
        return redirect(f"{FRONTEND_URL}?google_token={token_jwt}")

    except Exception as e:
        import traceback
        from urllib.parse import quote
        tb = traceback.format_exc()
        print(f"[google_oauth] ERREUR CALLBACK : {e}")
        print(tb)
        err_msg = quote(str(e)[:300])
        return redirect(f"{FRONTEND_URL}?auth_error=oauth_failed&detail={err_msg}")


# ── Routes pseudo ──
@google_bp.route("/auth/pseudo/disponible", methods=["GET"])
def pseudo_disponible():
    pseudo = (request.args.get("pseudo") or "").strip()
    if not pseudo or len(pseudo) < 2:
        return jsonify({"disponible": False, "raison": "trop_court"})
    try:
        from filter_mots_sacres import contient_mot_sacre
        bloque, mot = contient_mot_sacre(pseudo)
        if bloque:
            return jsonify({"disponible": False, "raison": "mot_sacre", "mot": mot})
    except ImportError:
        pass
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
    try:
        from filter_mots_sacres import contient_mot_sacre
        bloque, _ = contient_mot_sacre(pseudo)
        if bloque:
            return jsonify({"erreur": "mot_sacre"}), 400
    except ImportError:
        pass
    autre = Utilisateur.query.filter_by(pseudo=pseudo).first()
    if autre and autre.id != user.id:
        return jsonify({"erreur": "deja_pris"}), 400
    user.pseudo = pseudo
    db.session.commit()
    return jsonify({"succes": True, "utilisateur": user.to_dict()})