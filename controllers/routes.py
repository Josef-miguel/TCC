from flask import render_template, redirect, url_for, request, flash, session, g, jsonify
from firebase_admin import auth, firestore
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)  

def init_app(app, db):
    @app.before_request
    def load_logged_in_user():
        uid = session.get('user_uid')
        if uid:
            try:
                g.user = db.collection('user').document(uid).get().to_dict()
            except Exception as e:
                logger.exception(f"Erro carregando user g: {e}")
                g.user = None
        else:
            g.user = None

    @app.route("/")
    def home():
        try:
            events = []
            events_ref = db.collection('events').order_by('exit_date').stream()
            for doc in events_ref:
                data = doc.to_dict()
                data['id'] = doc.id
                events.append(data)
            return render_template('home.html', events=events)
        except Exception as e:
            logger.exception(f"Home error: {e}")
            flash('Erro ao carregar eventos. Tente novamente.', 'error')
            return render_template('home.html', events=[])

    
    @app.route("/login", methods=["GET","POST"])
    def login():
        if request.method == "GET":
            return render_template("login.html")
        elif request.method == "POST":
            data = request.get_json()
            if not data or "token" not in data:
                return jsonify({"success": False, "message": "Token não enviado"}), 400
            id_token = data["token"]
            try:
                decoded = auth.verify_id_token(id_token)
                uid = decoded["uid"]
                session['user_uid'] = uid
                return jsonify({"success": True, "redirect": url_for("dashboard")})
            except Exception:
                return jsonify({"success": False, "message": "Token inválido"}), 401

    @app.route("/register", methods=["GET","POST"])
    def register():
        if request.method == "GET":
            return render_template("register.html")

        # POST JSON
        data = request.get_json()
        if not data or "token" not in data or "name" not in data:
            return jsonify({"success": False, "message": "Token ou nome não enviados"}), 400

        id_token = data["token"]
        name = data["name"].strip()

        try:
            # verifica token Firebase
            decoded = auth.verify_id_token(id_token)
            uid = decoded["uid"]

            # salva usuário no Firestore
            user_ref = db.collection('user').document(uid)
            user_ref.set({
                "name": name,
                "email": decoded.get("email"),
                "cpf": data.get("cpf"),
                "dataNasc": data.get("dataNasc"),
                "isOrganizer" : False,
                "joinedEvents": [],
                "created_at": firestore.SERVER_TIMESTAMP,
                "uid" : uid
            })

            # loga automaticamente
            session['user_uid'] = uid

            return jsonify({"success": True, "redirect": url_for("dashboard")})

        except Exception as e:
            logger.exception(f"Erro no registro: {e}")
            return jsonify({"success": False, "message": "Token inválido ou erro ao salvar"}), 401


    @app.route("/dashboard")
    def dashboard():
            try:
                events_list = []
                # pega todos os eventos da collection 'events', ordenando pela data de saída
                events_ref = db.collection('events').order_by('exit_date').stream()
                for doc in events_ref:
                    data = doc.to_dict()
                    data['id'] = doc.id  # adiciona o ID do doc
                    events_list.append(data)

                # envia para o template
                return render_template("dashboard_usuario.html", events=events_list)
            except Exception as e:
                return f"Erro ao carregar eventos: {e}"

    