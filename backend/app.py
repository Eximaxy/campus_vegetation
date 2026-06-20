from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

try:
    from flask import Flask, jsonify, send_from_directory
except ModuleNotFoundError:
    Flask = None


if Flask:
    app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/api/health")
    def health():
        return jsonify(
            {
                "name": "Campus Plant Care WebGIS",
                "status": "ok",
                "storage": "localStorage demo + PostGIS migration scripts",
            }
        )

    @app.get("/api/config")
    def config():
        return jsonify(
            {
                "campus": "河海大学江宁校区",
                "center": {"lng": 118.785863, "lat": 31.914453},
                "version": "1.0.0",
            }
        )

else:
    app = None


def run_static_fallback():
    os.chdir(FRONTEND_DIR)
    server = ThreadingHTTPServer(("127.0.0.1", 5000), SimpleHTTPRequestHandler)
    print("Flask is not installed; serving static frontend at http://127.0.0.1:5000")
    server.serve_forever()


if __name__ == "__main__":
    if app:
        app.run(host="127.0.0.1", port=5000, debug=True)
    else:
        run_static_fallback()
