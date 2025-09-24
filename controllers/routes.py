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
    
    # rota para buscar mensagens nos chats individuais
    @app.route("/get_messages")
    def get_messages():
        if not g.user:
            return jsonify({"success": False, "messages": [], "error": "Não logado"}), 401

        # aceita chat_uid ou org_uid por compatibilidade
        chat_uid = request.args.get("chat_uid") or request.args.get("org_uid")
        if not chat_uid:
            return jsonify({"success": False, "messages": [], "error": "chat_uid não enviado"}), 400

        try:
            limit = int(request.args.get("limit", 50))
            msgs_ref = (
                db.collection("chats")
                  .document(chat_uid)
                  .collection("messages")
                  .order_by("timestamp")
                  .limit(limit)
            )

            messages = []
            for doc in msgs_ref.stream():
                d = doc.to_dict()

                ts = d.get("timestamp")
                # Normaliza o timestamp para um dicionário serializável compatível com o front
                if isinstance(ts, datetime):
                    d["timestamp"] = {
                        "_seconds": int(ts.timestamp()),
                        "_nanoseconds": ts.microsecond * 1000
                    }
                else:
                    # Se for firestore.Timestamp (possível), tenta pegar atributos
                    try:
                        d["timestamp"] = {
                            "_seconds": int(ts.seconds),
                            "_nanoseconds": int(getattr(ts, "nanos", 0))
                        }
                    except Exception:
                        d["timestamp"] = None

                d["id"] = doc.id
                messages.append(d)

            return jsonify({"success": True, "messages": messages})
        except Exception as e:
            logger.exception(f"Erro em get_messages: {e}")
            return jsonify({"success": False, "messages": [], "error": str(e)}), 500
    
    # rota para enviar mensagens nos chats individuais
    @app.route("/send_message", methods=["POST"])
    def send_message():
        if not g.user:
            return jsonify({"success": False, "message": "Não logado"}), 401
    
        data = request.get_json() if request.is_json else request.form
        text = (data.get("text") or "").strip()
        chat_uid = data.get("chat_uid") or data.get("org_uid")
    
        if not text or not chat_uid:
            return jsonify({"success": False, "message": "Texto ou chat_uid faltando"}), 400
    
        try:
            msg = {
                "text": text,
                "uid_sender": g.user["uid"],
                "user_uid": g.user["uid"],
                "read": False,
                "timestamp": firestore.SERVER_TIMESTAMP,  # usa SERVER_TIMESTAMP para consistência
            }
    
            # garante que o documento 'chat' exista e atualiza updated_at
            chat_ref = db.collection("chats").document(chat_uid)
            chat_ref.set({"updated_at": firestore.SERVER_TIMESTAMP}, merge=True)
    
            # adiciona a mensagem
            chat_ref.collection("messages").add(msg)
    
            return jsonify({"success": True, "message": "Mensagem enviada"})
        except Exception as e:
            logger.exception(f"Erro em send_message: {e}")
            return jsonify({"success": False, "message": str(e)}), 500

    

    @app.route("/chat_group", methods=["POST"])
    def chat_group():
        if not g.user:
            return redirect(url_for("login"))
        
        event_id = request.form.get("chat_uid")
        print(event_id)
        if not event_id:
            flash("ID do evento não informado.", "error")
            return redirect(url_for("dashboard"))
        
        return render_template("chat_group.html", user=g.user, event_id=event_id)
    
    
    @app.route("/send_group_message", methods=["POST"])
    def send_group_message():
        if not g.user:
            return jsonify({"success": False, "message": "Não logado"}), 401

        try:
            data = request.get_json()
            event_id = data.get("event_id")
            text = data.get("text", "").strip()

            # Validação básica
            if not event_id or not text:
                return jsonify({"success": False, "message": "Dados incompletos"}), 400

            # Estrutura da mensagem
            message_data = {
                "text": text,
                "timestamp": firestore.SERVER_TIMESTAMP,
                "uid_sender": g.user["uid"],
                "name": g.user.get("name", "Anônimo")
            }

            # Salva mensagem na subcoleção do grupo
            db.collection("chat-group").document(f"group_{event_id}")\
              .collection("messages").add(message_data)

            return jsonify({"success": True})

        except Exception as e:
            logger.exception(f"Erro ao enviar mensagem no chat em grupo: {e}")
            return jsonify({"success": False, "message": "Erro ao enviar"}), 500


    @app.route("/get_group_messages")
    def get_group_messages():
        if not g.user:
            return jsonify({"success": False, "message": "Não logado"}), 401

        event_id = request.args.get("event_id")
        limit = int(request.args.get("limit", 50))

        if not event_id:
            return jsonify({"success": False, "message": "ID do evento não fornecido"}), 400

        try:
            messages_ref = db.collection("chat-group") \
                             .document(f"group_{event_id}") \
                             .collection("messages") \
                             .order_by("timestamp", direction=firestore.Query.ASCENDING) \
                             .limit(limit)

            messages = [doc.to_dict() for doc in messages_ref.stream()]

            return jsonify({"success": True, "messages": messages})
        except Exception as e:
            logger.exception(f"Erro ao buscar mensagens do grupo: {e}")
            return jsonify({"success": False, "message": "Erro ao carregar mensagens"}), 500

    
    @app.route("/chat_individual", methods=["POST"])
    def chat_individual():
        if not g.user:
            return redirect(url_for("login"))
    
        chat_uid = request.form.get("chat_uid")
        if not chat_uid:
            flash("Chat não informado.", "error")
            return redirect(url_for("my_chats"))
    
        return render_template("chat_individual.html", user=g.user, chat_uid=chat_uid)

    
    @app.route("/my_chats")
    def my_chats():
        if not g.user:
            return redirect(url_for("login"))
        
        try:
            chats_group = []
            chats_individual = []
            chats_ref_ind = db.collection("chats")\
                          .where("participants", "array_contains", g.user["uid"])\
                          .order_by("updated_at", direction=firestore.Query.DESCENDING)\
                          .stream()
            chats_ref_grp = db.collection("chat-group")\
                           .where("members", "array_contains", g.user["uid"])\
                           .order_by("updated_at", direction=firestore.Query.DESCENDING)\
                           .stream()        
                           
            

            for doc in chats_ref_ind:
                chat_data = doc.to_dict()
                chat_data["id"] = doc.id
                chats_individual.append(chat_data)
                
            for doc in chats_ref_grp:
                chat_data = doc.to_dict()
                chat_data["id"] = doc.id
                chats_group.append(chat_data)

        except Exception as e:
            logger.exception(f"Erro ao carregar meus chats: {e}")
            flash("Erro ao carregar seus chats. Tente novamente.", "error")
            return render_template("my_chats.html", user=g.user, chats_group=[], chats_individual=[])
        
        return render_template("my_chats.html", user=g.user, chats_group=chats_group, chats_individual=chats_individual)
    
    
    @app.route("/my_vacations")
    def my_vacations():
        if not g.user:
            return redirect(url_for("login"))
        
        try:
            joined_events = g.user.get("joinedEvents", [])
            joined_vacations = []
            my_vacations = []
            vacations_ref = db.collection("events")\
                              .where("uid", "==", g.user["uid"])\
                              .order_by("created_at", direction=firestore.Query.DESCENDING)\
                              .stream()
            
            if joined_events:
                 # Firestore permite até 10 elementos no 'in'
                  chunks = [joined_events[i:i+10] for i in range(0, len(joined_events), 10)]
                  for chunk in chunks:
                      joined_query = db.collection("events").where("__name__", "in", chunk).stream()
                      for doc in joined_query:
                          data = doc.to_dict()
                          data["id"] = doc.id
                          joined_vacations.append(data)
            
            for doc in vacations_ref:
                vac_data = doc.to_dict()
                vac_data["id"] = doc.id
                my_vacations.append(vac_data)

            
        except Exception as e:
            logger.exception(f"Erro ao carregar minhas viagens: {e}")
            flash("Erro ao carregar suas viagens. Tente novamente.", "error")
            return render_template("minhas_viagens.html", user=g.user, my_vacations=[], joined_vacations=[])
        
        return render_template("minhas_viagens.html", user=g.user, my_vacations=my_vacations, joined_vacations=joined_vacations)
    
    
    @app.route("/favorite")
    def favorites():
        if not g.user:
            return redirect(url_for("login"))
        fav_vacations = []
        favorited_vacations = g.user.get("favoritePosts", [])
        if favorited_vacations:
          # Firestore permite até 10 elementos no 'in'
           chunks = [favorited_vacations[i:i+10] for i in range(0, len(favorited_vacations), 10)]
           for chunk in chunks:
               fav_query = db.collection("events").where("__name__", "in", chunk).stream()
               for doc in fav_query:
                   data = doc.to_dict()
                   data["id"] = doc.id
                   fav_vacations.append(data)
                   
        return render_template("favoritos.html", user=g.user, fav_vacations=fav_vacations)
