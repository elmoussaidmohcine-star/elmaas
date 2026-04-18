# ============================================================
#  ELMAAS — stripe_routes.py
#  Gestion abonnement Premium 6.99€/mois via Stripe
# ============================================================

import os
import stripe
from flask import Blueprint, request, jsonify
from models import db, Utilisateur
from auth import get_user_from_request

stripe_bp = Blueprint("stripe", __name__)
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_placeholder")
PRICE_ID     = os.environ.get("STRIPE_PRICE_ID", "price_placeholder")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://elmaas.vercel.app")
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


# ── Créer une session de paiement Stripe Checkout ───────────

@stripe_bp.route("/stripe/checkout", methods=["POST"])
def checkout():
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifié"}), 401
    data = request.get_json() or {}
    plan = data.get("plan", "elmaas")  # 'elmaasyon' ou 'elmaas'

    price_id = {
        "elmaasyon": os.environ.get("STRIPE_PRICE_ID_ELMAASYON"),
        "elmaas": os.environ.get("STRIPE_PRICE_ID_ELMAAS"),
    }.get(plan)

    if not price_id:
        return jsonify({"erreur": "Plan invalide"}), 400

    session = stripe.checkout.Session.create(
        customer_email=user.email,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{FRONTEND_URL}?paiement=succes&plan={plan}",
        cancel_url=f"{FRONTEND_URL}?paiement=annule",
        metadata={"user_id": user.id, "plan": plan},
    )
    return jsonify({"url": session.url})
def create_checkout():
    user = get_user_from_request()
    if not user:
        return jsonify({"erreur": "Non authentifie"}), 401
    if user.premium:
        return jsonify({"erreur": "Deja premium"}), 400

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{
                "price": PRICE_ID,
                "quantity": 1,
            }],
            success_url=f"{FRONTEND_URL}?premium=success",
            cancel_url=f"{FRONTEND_URL}?premium=cancel",
            metadata={"user_id": str(user.id)},
            customer_email=user.email,
        )
        return jsonify({"url": session.url})
    except Exception as e:
        return jsonify({"erreur": str(e)}), 500


# ── Webhook Stripe : activer le premium après paiement ──────

@stripe_bp.route("/stripe/webhook", methods=["POST"])
def webhook():
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature", "")

    try:
        if WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
        else:
            event = stripe.Event.construct_from(
                stripe.util.convert_to_stripe_object(
                    stripe.util.json.loads(payload), stripe.api_key, None
                ), stripe.api_key
            )
    except Exception as e:
        return jsonify({"erreur": str(e)}), 400
    # Paiement réussi → activer premium
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"].get("user_id")
        plan = session["metadata"].get("plan", "elmaas")
        user = Utilisateur.query.get(user_id)
        if user:
            user.premium = True
            user.plan = plan
            db.session.commit()

    # Abonnement annulé → désactiver premium
    elif event["type"] in ("customer.subscription.deleted", "customer.subscription.paused"):
        customer_id = event["data"]["object"].get("customer")
        if customer_id:
            user = Utilisateur.query.filter_by(stripe_customer_id=customer_id).first()
            if user:
                user.premium = False
                db.session.commit()

    return jsonify({"succes": True})


# ── Portail client Stripe (gérer abonnement) ────────────────

@stripe_bp.route("/stripe/portal", methods=["POST"])
def customer_portal():
    user = get_user_from_request()
    if not user or not user.premium:
        return jsonify({"erreur": "Non premium"}), 401

    try:
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=FRONTEND_URL,
        )
        return jsonify({"url": session.url})
    except Exception as e:
        return jsonify({"erreur": str(e)}), 500


# ── Statut premium ───────────────────────────────────────────

@stripe_bp.route("/premium/statut", methods=["GET"])
def statut_premium():
    user = get_user_from_request()
    if not user:
        return jsonify({"premium": False})
    return jsonify({
        "premium": user.premium,
        "peut_uploader": user.peut_uploader_photo_perso(),
    })