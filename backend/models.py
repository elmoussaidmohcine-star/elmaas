# ============================================================
#  ELMAAS — models.py
#  Base de données : utilisateurs, ELO, quota photos
# ============================================================

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

class Utilisateur(db.Model):
    __tablename__ = "utilisateurs"

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    mot_de_passe  = db.Column(db.String(200), nullable=False)  # hashé bcrypt
    pseudo        = db.Column(db.String(50), unique=True, nullable=False)
    cree_le       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # ELO
    elo           = db.Column(db.Integer, default=1000)
    parties_jouees = db.Column(db.Integer, default=0)
    victoires     = db.Column(db.Integer, default=0)
    defaites      = db.Column(db.Integer, default=0)

    # Quota photos
    premium       = db.Column(db.Boolean, default=False)
    photo_perso_utilisee = db.Column(db.Boolean, default=False)
    stripe_customer_id = db.Column(db.String(100), default="")  # 1 photo perso gratuite
    nb_photos_mois = db.Column(db.Integer, default=0)  # reset chaque mois (premium)
    mois_quota    = db.Column(db.String(7), default="")  # ex: "2026-04"

    def peut_uploader_photo_perso(self):
        """Gratuit : 1 photo perso. Premium : illimité."""
        if self.premium:
            return True
        return not self.photo_perso_utilisee

    def to_dict(self):
        return {
            "id": self.id,
            "pseudo": self.pseudo,
            "email": self.email,
            "elo": self.elo,
            "parties_jouees": self.parties_jouees,
            "victoires": self.victoires,
            "defaites": self.defaites,
            "premium": self.premium,
            "photo_perso_utilisee": self.photo_perso_utilisee,
            "peut_uploader": self.peut_uploader_photo_perso(),
        }


class PartieDB(db.Model):
    """Stocke l'état complet d'une partie en JSON pour survivre aux redémarrages."""
    __tablename__ = "parties"

    id            = db.Column(db.String(36), primary_key=True)  # UUID
    etat_json     = db.Column(db.Text, nullable=False)           # EtatJeu sérialisé
    pixels_json   = db.Column(db.Text, nullable=True)            # pixels photo
    nom_photo     = db.Column(db.String(20), default="")
    bonus_double  = db.Column(db.Boolean, default=False)
    recon_tentee  = db.Column(db.Boolean, default=False)
    timer_sec     = db.Column(db.Integer, default=30)
    scores_manches_json = db.Column(db.String(50), default='{"rouge":0,"noir":0}')
    cree_le       = db.Column(db.DateTime, default=lambda: __import__('datetime').datetime.utcnow())
    mise_a_jour   = db.Column(db.DateTime, default=lambda: __import__('datetime').datetime.utcnow(),
                              onupdate=lambda: __import__('datetime').datetime.utcnow())


class PartieHistorique(db.Model):
    __tablename__ = "parties_historique"

    id            = db.Column(db.Integer, primary_key=True)
    joueur1_id    = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"))
    joueur2_id    = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"))
    gagnant_id    = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"), nullable=True)
    elo_j1_avant  = db.Column(db.Integer)
    elo_j2_avant  = db.Column(db.Integer)
    elo_j1_apres  = db.Column(db.Integer)
    elo_j2_apres  = db.Column(db.Integer)
    score_j1      = db.Column(db.Integer)  # cellules
    score_j2      = db.Column(db.Integer)
    jouee_le      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


# ── Calcul ELO ──────────────────────────────────────────────

K = 32  # Facteur K standard

def calculer_elo(elo_j1: int, elo_j2: int, gagnant: int) -> tuple:
    """
    Calcule les nouveaux ELO après une partie.
    gagnant : 1 si joueur1 gagne, 2 si joueur2 gagne, 0 si égalité
    Retourne (nouveau_elo_j1, nouveau_elo_j2)
    """
    esperance_j1 = 1 / (1 + 10 ** ((elo_j2 - elo_j1) / 400))
    esperance_j2 = 1 - esperance_j1

    if gagnant == 1:
        score_j1, score_j2 = 1, 0
    elif gagnant == 2:
        score_j1, score_j2 = 0, 1
    else:  # égalité
        score_j1, score_j2 = 0.5, 0.5

    nouveau_elo_j1 = round(elo_j1 + K * (score_j1 - esperance_j1))
    nouveau_elo_j2 = round(elo_j2 + K * (score_j2 - esperance_j2))

    return nouveau_elo_j1, nouveau_elo_j2