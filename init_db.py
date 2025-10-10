import sqlite3
import os

DB = os.getenv("TILL_DB", "till.db")

schema = """
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items_json TEXT NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL
);
"""

def init():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.executescript(schema)
    conn.commit()
    conn.close()
    print("DB initialized:", DB)

if __name__ == "__main__":
    init()
