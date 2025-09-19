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
                  data['id'] = doc.id
        
                  # Corrige o route para JSON serializável
                  route = data.get('route')
                  if route and isinstance(route, dict):
                      start = route.get('start')
                      end = route.get('end')
                      if start and end:
                          route['start'] = {
                              'latitude': start.get('latitude'),
                              'longitude': start.get('longitude')
                          }
                          route['end'] = {
                              'latitude': end.get('latitude'),
                              'longitude': end.get('longitude')
                          }
                      data['route'] = route
        
                  events_list.append(data)

                # envia para o template
                return render_template("dashboard.html", events=events_list, user=g.user)
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
                "uid" : g.user['uid'] if g.user else None
            }

            # salva no Firestore
            db.collection("events").add(event)

            return jsonify({"success": True, "message": "Evento cadastrado com sucesso!"})
        except Exception as e:
            logger.exception(f"Erro ao cadastrar evento: {e}")
            traceback.print_exc()
            return jsonify({"success": False, "message": "Erro ao cadastrar evento"}), 500
        
    
    @app.route("/perfil")
    def perfil():
        if not g.user:
            return redirect(url_for('login'))
        
        return render_template("perfil.html", user=g.user)
    
    @app.route("/join_event", methods=["POST"])
    def joinEvent():
        if not g.user:
            return redirect(url_for('login'))
        
        event_id = request.form.get("event_id")
        if not event_id:
            flash("ID do evento não fornecido.", "error")
            return redirect(url_for('dashboard'))
        try:
            event_ref = db.collection('events').document(event_id)
            event = event_ref.get()
            if not event.exists:
                flash("Evento não encontrado.", "error")
                return redirect(url_for('dashboard'))
            
            user_ref = db.collection('user').document(g.user['uid'])
            user = user_ref.get()
            if not user.exists:
                flash("Usuário não encontrado.", "error")
                return redirect(url_for('login'))
            
            user_data = user.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            if event_id in joined_events:
                flash("Você já está participando deste evento.", "info")
                return redirect(url_for('dashboard'))
            
            joined_events.append(event_id)
            user_ref.update({'joinedEvents': joined_events})
            
            flash("Você agora está participando do evento!", "success")
            return redirect(url_for('dashboard'))
        except Exception as e:
            logger.exception(f"Erro ao participar do evento: {e}")
            flash("Erro ao participar do evento. Tente novamente.", "error")
            return redirect(url_for('dashboard'))
    
    @app.route("/agenda")
    def agenda():
        if not g.user:
            return redirect(url_for("login"))

        return render_template("agenda.html", user=g.user)



    @app.route("/agenda_api_all")
    def agenda_api_all():
        if not g.user:
            return jsonify({"success": False, "events": [], "error": "Não logado"}), 401

        try:
            events = []
            for ref in g.user["joinedEvents"]:
               event_doc = db.collection("events").document(ref).get()
               if event_doc.exists:
                   data = event_doc.to_dict()
                   exit_date = data.get("exit_date")
                   return_date = data.get("return_date")

                   if isinstance(exit_date, datetime):
                       data["exit_date"] = exit_date.strftime("%Y-%m-%d")
                   if isinstance(return_date, datetime):
                       data["return_date"] = return_date.strftime("%Y-%m-%d")

                   data["id"] = event_doc.id
                   events.append(data)
               else:
                   print(f"Evento com ID {ref} não encontrado.")

            return jsonify({"success": True, "events": events})
        except Exception as e:
            logger.exception(f"Erro ao carregar agenda (all): {e}")
            return jsonify({"success": False, "events": [], "error": str(e)}), 500
    
    @app.route("/chat", methods=["POST"])
    def chat():
        if not g.user:
            return redirect(url_for("login"))
        org_uid = request.form.get("org_uid")
        return render_template("chat.html", org_uid=org_uid, user=g.user)
    
    
    @app.route("/send_message", methods=["POST"])
    def send_message():
        if not g.user:
            return jsonify({"success": False, "message": "Não logado"}), 401
    
        data = request.get_json()
        text = data.get("text")
        org_uid = data.get("org_uid")
        user_uid = g.user['uid']
    
        if not text or not org_uid:
            return jsonify({"success": False, "message": "Mensagem ou organizador vazios"}), 400
    
        # ID do chat previsível
        chat_id = f"{min(user_uid, org_uid)}_{max(user_uid, org_uid)}"
    
        # Cria/atualiza documento do chat com uids do usuário e do organizador
        chat_ref = db.collection("chats").document(chat_id)
        chat_ref.set({
            "user_uid": user_uid,
            "org_uid": org_uid,
            "updated_at": firestore.SERVER_TIMESTAMP
        }, merge=True)  # merge=True mantém campos existentes
    
        # Documento da mensagem na subcoleção
        message_doc = {
            "text": text,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "uid_sender": user_uid,
            "read": False
        }
    
        try:
            chat_ref.collection("messages").add(message_doc)
            return jsonify({"success": True})
        except Exception as e:
            logger.exception(f"Erro ao enviar mensagem: {e}")
            return jsonify({"success": False, "message": "Erro ao enviar mensagem"}), 500

    
    
    @app.route("/get_messages")
    def get_messages():
        if not g.user:
            return jsonify({"success": False, "message": "Não logado"}), 401

        org_uid = request.args.get("org_uid")
        limit = int(request.args.get("limit", 50))
        last_timestamp = request.args.get("last_timestamp")  # opcional, para paginação
        user_uid = g.user['uid']

        if not org_uid:
            return jsonify({"success": False, "message": "Organizador não especificado"}), 400

        chat_id = f"{min(user_uid, org_uid)}_{max(user_uid, org_uid)}"

        try:
            messages_ref = db.collection("chats").document(chat_id).collection("messages")\
                .order_by("timestamp", direction=firestore.Query.ASCENDING)\
                .limit(limit)

            if last_timestamp:
                # Converte para Timestamp do Firestore
                from google.protobuf.timestamp_pb2 import Timestamp
                ts = Timestamp()
                ts.FromJsonString(last_timestamp)
                messages_ref = messages_ref.start_after({"timestamp": ts})

            messages = [doc.to_dict() for doc in messages_ref.stream()]

            return jsonify({"success": True, "messages": messages})
        except Exception as e:
            logger.exception(f"Erro ao buscar mensagens: {e}")
            return jsonify({"success": False, "message": "Erro ao carregar mensagens"}), 500

    
    