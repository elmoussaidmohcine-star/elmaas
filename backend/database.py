import sqlite3
import hashlib
import os
from datetime import datetime, timedelta

DB_PATH = "elmaas.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_premium INTEGER DEFAULT 0,
            photos_ce_mois INTEGER DEFAULT 0,
            mois_actuel TEXT DEFAULT ''
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def creer_utilisateur(email, password):
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, hash_password(password))
        )
        conn.commit()
        return True, "Compte créé"
    except sqlite3.IntegrityError:
        return False, "Email déjà utilisé"
    finally:
        conn.close()

def connecter_utilisateur(email, password):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email=? AND password_hash=?",
        (email, hash_password(password))
    ).fetchone()
    conn.close()
    return dict(user) if user else None

def get_utilisateur(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None

def peut_uploader(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    if not user:
        return False, "Utilisateur introuvable"
    user = dict(user)
    if user["is_premium"]:
        return True, "Premium"
    mois_actuel = datetime.now().strftime("%Y-%m")
    if user["mois_actuel"] != mois_actuel:
        # Nouveau mois — reset compteur
        conn = get_db()
        conn.execute(
            "UPDATE users SET photos_ce_mois=0, mois_actuel=? WHERE id=?",
            (mois_actuel, user_id)
        )
        conn.commit()
        conn.close()
        return True, "OK"
    if user["photos_ce_mois"] >= 10:
        return False, "Quota mensuel atteint (10 photos gratuites)"
    return True, "OK"

def incrementer_photos(user_id):
    mois_actuel = datetime.now().strftime("%Y-%m")
    conn = get_db()
    conn.execute(
        "UPDATE users SET photos_ce_mois=photos_ce_mois+1, mois_actuel=? WHERE id=?",
        (mois_actuel, user_id)
    )
    conn.commit()
    conn.close()

init_db()
