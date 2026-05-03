"""
ELMAAS — stripe_routes.py
Gestion des paiements Stripe :
  POST /stripe/checkout   → crée une session Checkout et retourne l'URL
  POST /stripe/webhook    → reçoit les événements Stripe et met à jour le plan
  GET  /stripe/portal     → portail client Stripe (gestion abonnement)
  GET  /stripe/sync       → resync manuel du plan (fallback si webhook raté)
"""

import os
import stripe
from flask import Blueprint, request, jsonify
from auth import get_user_from_request

stripe_bp = Blueprint("stripe", __name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL   = os.environ.get("FRONTEND_URL", "https://www.elmaas.fun")

# Price IDs configurés dans Render env vars
PRICE_IDS = {
    "elmaasyon": os.environ.get("STRIPE_PRICE_ID_ELMAASYON", ""),
    "elmaas":    os.environ.get("STRIPE_PRICE_ID_ELMAAS",    ""),
}

# Map price_id → plan name (rempli au démarrage si les IDs sont définis)
PRICE_TO_PLAN: dict[str, str] = {}
for _plan, _pid in PRICE_IDS.items():
    if _pid:
        PRICE_TO_PLAN[_pid] = _plan


def _get_or_create_customer(user) -> str:
    """Retourne le stripe_customer_id de l'utilisateur, le crée si absent."""
    from models import db
    if user.stripe_customer_id:
        return user.stripe_customer_id
    customer = stripe.Customer.create(
        email=user.email,
        name=user.pseudo or user.email,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    db.session.commit()
    return customer.id


def _activer_plan(user_id: int, plan: str, subscription_id: str | None = None):
    """Met à jour le plan de l'utilisateur en base de données."""
    from models import db, Utilisateur
    user = Utilisateur.query.get(user_id)
    if not user:
        print(f"[stripe] User {user_id} introuvable pour activer plan {plan}")
        return
    user.plan = plan
    if subscription_id:
        user.stripe_customer_id = user.stripe_customer_id  # déjà à jour
    user.premium = plan in ("elmaasyon", "elmaas")
    db.session.commit()
    print(f"[stripe] Plan '{plan}' activé pour user {user_id}")


# ─────────────────────────────────────────────────────────────
# POST /stripe/checkout
# ─────────────────────────────────────────────────────────────
@stripe_bp.route("/stripe/checkout", methods=["POST"])
def create_checkout():
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifié"}), 401

    plan = (request.json or {}).get("plan")
    if plan not in PRICE_IDS:
        return jsonify({"erreur": f"Plan inconnu : {plan}"}), 400

    price_id = PRICE_IDS[plan]
    if not price_id:
        return jsonify({"erreur": f"STRIPE_PRICE_ID_{plan.upper()} non configuré"}), 500

    try:
        customer_id = _get_or_create_customer(user)
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{FRONTEND_URL}?payment=success&plan={plan}",
            cancel_url=f"{FRONTEND_URL}?payment=cancel",
            metadata={"user_id": str(user.id), "plan": plan},
            subscription_data={
                "metadata": {"user_id": str(user.id), "plan": plan}
            },
        )
        return jsonify({"url": session.url})
    except stripe.StripeError as e:
        print(f"[stripe] Checkout error: {e}")
        return jsonify({"erreur": str(e)}), 500


# ─────────────────────────────────────────────────────────────
# POST /stripe/webhook
# ─────────────────────────────────────────────────────────────
@stripe_bp.route("/stripe/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.get_data()
    sig     = request.headers.get("Stripe-Signature", "")

    # Vérification signature (indispensable en production)
    if WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)
        except stripe.SignatureVerificationError as e:
            print(f"[stripe] Signature invalide: {e}")
            return jsonify({"erreur": "Signature invalide"}), 400
    else:
        import json
        event = json.loads(payload)

    etype = event["type"]
    data  = event["data"]["object"]
    print(f"[stripe] Event reçu: {etype}")

    # ── Paiement réussi (première fois ou renouvellement) ──
    if etype in ("checkout.session.completed", "invoice.payment_succeeded"):
        if etype == "checkout.session.completed":
            user_id = data.get("metadata", {}).get("user_id")
            plan    = data.get("metadata", {}).get("plan")
            sub_id  = data.get("subscription")
        else:
            # invoice.payment_succeeded → récupérer via subscription
            sub_id  = data.get("subscription")
            user_id = None
            plan    = None
            if sub_id:
                try:
                    sub = stripe.Subscription.retrieve(sub_id)
                    user_id = sub.metadata.get("user_id")
                    plan    = sub.metadata.get("plan")
                    # Fallback : déduire depuis price_id
                    if not plan:
                        price_id = sub["items"]["data"][0]["price"]["id"]
                        plan = PRICE_TO_PLAN.get(price_id)
                except Exception as e:
                    print(f"[stripe] Erreur récup subscription: {e}")

        if user_id and plan:
            _activer_plan(int(user_id), plan, sub_id)

    # ── Annulation / expiration abonnement ──
    elif etype in ("customer.subscription.deleted", "customer.subscription.paused"):
        sub_id  = data.get("id")
        user_id = data.get("metadata", {}).get("user_id")
        if not user_id:
            # Chercher via customer_id
            customer_id = data.get("customer")
            if customer_id:
                from models import Utilisateur
                u = Utilisateur.query.filter_by(stripe_customer_id=customer_id).first()
                if u:
                    user_id = str(u.id)
        if user_id:
            _activer_plan(int(user_id), "gratuit", None)

    # ── Mise à jour abonnement (upgrade/downgrade) ──
    elif etype == "customer.subscription.updated":
        sub_id  = data.get("id")
        user_id = data.get("metadata", {}).get("user_id")
        status  = data.get("status")
        if user_id and status == "active":
            price_id = data["items"]["data"][0]["price"]["id"]
            plan = PRICE_TO_PLAN.get(price_id)
            if plan:
                _activer_plan(int(user_id), plan, sub_id)

    return jsonify({"received": True}), 200


# ─────────────────────────────────────────────────────────────
# GET /stripe/portal
# ─────────────────────────────────────────────────────────────
@stripe_bp.route("/stripe/portal", methods=["POST"])
def billing_portal():
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifié"}), 401
    if not user.stripe_customer_id:
        return jsonify({"erreur": "Aucun abonnement trouvé"}), 404
    try:
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=FRONTEND_URL,
        )
        return jsonify({"url": session.url})
    except stripe.StripeError as e:
        return jsonify({"erreur": str(e)}), 500


# ─────────────────────────────────────────────────────────────
# GET /stripe/sync  — resync manuel si webhook raté
# ─────────────────────────────────────────────────────────────
@stripe_bp.route("/stripe/sync", methods=["GET"])
def sync_plan():
    """
    Appelé automatiquement depuis le frontend après un paiement réussi
    (?payment=success) pour forcer la mise à jour du plan si le webhook
    a eu du retard.
    """
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifié"}), 401

    if not user.stripe_customer_id:
        return jsonify({"plan": user.plan or "gratuit"})

    try:
        subs = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status="active",
            limit=5,
        )
        from models import db
        plan_actuel = None
        for sub in subs.auto_paging_iter():
            price_id = sub["items"]["data"][0]["price"]["id"]
            plan_actuel = PRICE_TO_PLAN.get(price_id)
            if plan_actuel:
                break

        if plan_actuel and user.plan != plan_actuel:
            user.plan = plan_actuel
            user.premium = True
            db.session.commit()
            print(f"[stripe/sync] Plan '{plan_actuel}' synced pour user {user.id}")

        return jsonify({
            "plan": user.plan or "gratuit",
            "premium": user.premium,
            "elo": user.elo,
            "pseudo": user.pseudo,
            "email": user.email,
        })
    except stripe.StripeError as e:
        print(f"[stripe/sync] Erreur: {e}")
        return jsonify({"plan": user.plan or "gratuit"})