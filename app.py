import os
import json
import sqlite3
import csv
from datetime import datetime
from flask import Flask, g, render_template, request, Response
from functools import wraps
from io import StringIO

DB = os.getenv("TILL_DB", "till.db")
ADMIN_USER = os.getenv("ADMIN_USER", "buvette")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "secret")

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "change_this_secret")

def get_db():
    db = getattr(g, "_db", None)
    if db is None:
        db = g._db = sqlite3.connect(DB)
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

@app.route("/", methods=["GET"])
def index():
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
    total = sum(float(it.get("price", 0)) * int(it.get("qty", 0)) for it in items)
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
        from flask import request
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
            qty = int(it.get("qty", 1))
            totals.setdefault(pid, {"name": it.get("name"), "qty": 0})
            totals[pid]["qty"] += qty
    return render_template("admin.html", orders=orders, totals=totals)

@app.route("/admin/export")
@requires_auth
def admin_export():
    db = get_db()
    c = db.cursor()
    c.execute("SELECT * FROM orders ORDER BY created_at DESC")
    rows = c.fetchall()

    output = StringIO()
    writer = csv.writer(output)  # utilisera l'échappement CSV correct
    writer.writerow(["order_id", "created_at", "total", "items_json"])

    for r in rows:
        writer.writerow([r["id"], r["created_at"], r["total"], r["items_json"]])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=orders.csv"}
    )

if __name__ == "__main__":
    if not os.path.exists(DB):
        import init_db
        init_db.init()
    app.run(host="0.0.0.0", port=7828, debug=True)
