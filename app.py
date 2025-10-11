import os
import json
import sqlite3
import csv
from datetime import datetime
from flask import Flask, g, render_template, request, Response, make_response, jsonify, session, redirect, url_for
from functools import wraps
import io
import pytz
from datetime import datetime

# charge .env si présent (utile en dev)
from dotenv import load_dotenv
load_dotenv()

# Config via env
DB = os.getenv("TILL_DB", "/data/till.db")
ADMIN_USER = os.getenv("ADMIN_USER", "buvette")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "secret")
FLASK_SECRET = os.getenv("FLASK_SECRET", "change_this_secret")
ACCESS_CODE = os.environ.get("ACCESS_CODE")

LOCAL_TZ = pytz.timezone("Europe/Paris")

app = Flask(__name__)
app.secret_key = FLASK_SECRET

def get_db():
    db = getattr(g, "_db", None)
    if db is None:
        # create parent dir if missing
        parent = os.path.dirname(DB)
        if parent and not os.path.exists(parent):
            try:
                os.makedirs(parent, exist_ok=True)
            except OSError:
                pass
        db = g._db = sqlite3.connect(DB, check_same_thread=False)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_conn(exc):
    db = getattr(g, "_db", None)
    if db is not None:
        db.close()

def load_products():
    with open("products.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.route("/", methods=["GET", "POST"])
def home():
    if not ACCESS_CODE:  # si la variable n'est pas définie ou vide
        session["access_granted"] = True  # autorise directement
        return redirect(url_for("buvette"))

    if session.get("access_granted"):
        return redirect(url_for("buvette"))

    return render_template("access.html")

@app.route("/validate_code", methods=["POST"])
def validate_code():
    if not ACCESS_CODE:
        session["access_granted"] = True
        return jsonify({"status": "ok"})

    data = request.get_json()
    code = data.get("code")
    if code == ACCESS_CODE:
        session["access_granted"] = True
        return jsonify({"status": "ok"})
    else:
        return jsonify({"status": "error"}), 401

@app.route("/buvette")
def buvette():
    if not session.get("access_granted"):
        return redirect(url_for("home"))
    products = load_products()
    return render_template("index.html", products=products)

@app.route("/order", methods=["POST"])
def order():
    data = request.get_json()
    if not data:
        return {"error": "No JSON payload"}, 400
    items = data.get("items", [])
    if not items:
        return {"error": "Empty order"}, 400
    try:
        total = sum(float(it.get("price", 0)) * int(it.get("qty", 0)) for it in items)
    except Exception:
        return {"error": "Invalid items data"}, 400
    created_at = datetime.utcnow().isoformat()
    db = get_db()
    c = db.cursor()
    c.execute(
        "INSERT INTO orders (items_json, total, created_at) VALUES (?, ?, ?)",
        (json.dumps(items, ensure_ascii=False), total, created_at)
    )
    db.commit()
    return {"status": "ok", "total": total}

# --- Basic Auth ---
def check_auth(username, password):
    return username == ADMIN_USER and password == ADMIN_PASSWORD

def authenticate():
    return Response(
        'Accès admin requis', 401,
        {'WWW-Authenticate': 'Basic realm="Buvette Admin"'}
    )

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

@app.route("/admin", methods=["GET"])
@requires_auth
def admin():
    db = get_db()
    c = db.cursor()
    c.execute("SELECT * FROM orders ORDER BY created_at DESC")
    rows = c.fetchall()
    orders = []
    for r in rows:
        orders.append({
            "id": r["id"],
            "items": json.loads(r["items_json"]),
            "total": r["total"],
            "created_at": r["created_at"]
        })
    totals = {}
    for o in orders:
        for it in o["items"]:
            pid = it["id"]
            price = float(it.get("price", 0))
            qty = int(it.get("qty", 1))
            it_total = price * qty
            totals.setdefault(pid, {"name": it.get("name"), "qty": 0, "total": 0})
            totals[pid]["qty"] += qty
            totals[pid]["total"] += it_total
    # total général
    total_general = sum(o["total"] for o in orders)
    return render_template("admin.html", orders=orders, totals=totals, total_general=total_general)

def generate_csv_from_orders(rows):
    output = io.StringIO()
    output.write("order_id,created_at,product_id,product_name,product_price,product_qty,product_total\n")

    for r in rows:
        # Convertir created_at UTC → local
        try:
            dt_utc = datetime.fromisoformat(r["created_at"])
            dt_utc = pytz.UTC.localize(dt_utc)
            dt_local = dt_utc.astimezone(LOCAL_TZ)
            created_at_str = dt_local.strftime("%d/%m/%Y %H:%M:%S")
        except Exception:
            created_at_str = r["created_at"]  # fallback

        items = json.loads(r["items_json"])
        for it in items:
            pid = it.get("id", "")
            name = it.get("name", "").replace('"', '""')
            price = float(it.get("price", 0))
            qty = int(it.get("qty", 1))
            total = price * qty
            output.write(f'{r["id"]},{created_at_str},{pid},"{name}",{price},{qty},{total}\n')

    return output.getvalue()

@app.route("/admin/export")
@requires_auth
def admin_export():
    db = get_db()
    c = db.cursor()
    c.execute("SELECT * FROM orders ORDER BY created_at ASC")
    rows = c.fetchall()

    # Réponse CSV
    csv_data = generate_csv_from_orders(rows)

    response = make_response(csv_data)
    response.headers["Content-Disposition"] = "attachment; filename=buvette_orders.csv"
    response.headers["Content-Type"] = "text/csv"
    return response

@app.route("/admin/clear", methods=["POST"])
@requires_auth
def admin_clear():
    db = get_db()
    c = db.cursor()
    c.execute("SELECT * FROM orders ORDER BY created_at ASC")
    rows = c.fetchall()

    # Générer le CSV avant de supprimer
    csv_data = generate_csv_from_orders(rows)

    # Supprimer toutes les commandes
    c.execute("DELETE FROM orders")
    db.commit()

    # Télécharger le CSV
    response = make_response(csv_data)
    response.headers["Content-Disposition"] = "attachment; filename=buvette_backup_before_clear.csv"
    response.headers["Content-Type"] = "text/csv"
    return response

# initialise DB si besoin (utile pour la 1re exécution en container)
def init_db():
    schema = """
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        items_json TEXT NOT NULL,
        total REAL NOT NULL,
        created_at TEXT NOT NULL
    );
    """
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.executescript(schema)
    conn.commit()
    conn.close()

# Initialise la DB au démarrage
init_db()

if __name__ == "__main__":
    # seulement utile en dev local
    app.run(host="0.0.0.0", port=7828, debug=True)
