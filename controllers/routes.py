from flask import render_template, redirect, url_for, request, flash, session, g, jsonify
import traceback
from datetime import datetime
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
    
    @app.route("/new_event", methods=["GET", "POST"])     
    def new_event():
        if request.method == "GET":
            return render_template("novo_evento.html")

        
        try:
            data = request.get_json(force=True) if request.is_json else request.form
            if not data:
                return jsonify({"sucess" : False, "message" : "Nenhum dado recebido"}), 400
            
            exit_date = datetime.fromisoformat(data["exit_date"]) if data.get("exit_date") else None
            return_date = datetime.fromisoformat(data["return_date"]) if data.get("return_date") else None

            
            event = {
                "title": data.get("title"),
                "desc": data.get("desc"),
                "price": data.get("price"),
                "numSlots": data.get("numSlots"),
                "exit_date": exit_date,   
                "return_date": return_date,
                "type": int(data.get("type", 0)),
                "comments": [],
                "numAcess": 0,
                "images": data.get("image_urls", []),
                "route": data.get("route", []),
                "created_at": firestore.SERVER_TIMESTAMP,
            }

            # salva no Firestore
            db.collection("events").add(event)

            return jsonify({"success": True, "message": "Evento cadastrado com sucesso!"})
        except Exception as e:
            logger.exception(f"Erro ao cadastrar evento: {e}")
            traceback.print_exc()
            return jsonify({"success": False, "message": "Erro ao cadastrar evento"}), 500
        
    