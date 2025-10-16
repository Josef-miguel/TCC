from flask import render_template, redirect, url_for, request, flash, session, g, jsonify
import traceback
from datetime import datetime
from firebase_admin import auth, firestore
import logging
from models.ai_engine import TravelAIEngine
from models.ai_models import AIDataManager

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)  

def init_app(app, db):
    # Inicializar engine de IA
    ai_engine = TravelAIEngine(db)
    ai_data_manager = AIDataManager(db)
    
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
    def landing_page():
        try:
            events = []
            events_ref = db.collection('events').order_by('exit_date').stream()
            for doc in events_ref:
                data = doc.to_dict()
                data['id'] = doc.id
                events.append(data)
            return render_template('landing_page.html', events=events)
        except Exception as e:
            logger.exception(f"Home error: {e}")
            flash('Erro ao carregar eventos. Tente novamente.', 'error')
            return render_template('landing_page.html', events=[])


    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for('landing_page'))
    
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
                return jsonify({"success": True, "redirect": url_for("home")})
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

            return jsonify({"success": True, "redirect": url_for("home")})

        except Exception as e:
            logger.exception(f"Erro no registro: {e}")
            return jsonify({"success": False, "message": "Token inválido ou erro ao salvar"}), 401

    
    @app.route("/home")
    def home():
            try:
                events_list = []
                # pega todos os eventos da collection 'events', ordenando pela data de saída
                events_ref = db.collection('events').order_by('exit_date').stream()
                for doc in events_ref:
                  data = doc.to_dict()
                  data['id'] = doc.id
        
                  # Buscar dados do organizador
                  if data.get('uid'):
                      try:
                          organizer_doc = db.collection('user').document(data['uid']).get()
                          if organizer_doc.exists:
                              organizer_data = organizer_doc.to_dict()
                              data['organizer'] = {
                                  'name': organizer_data.get('name', 'Organizador'),
                                  'uid': data['uid']
                              }
                      except Exception as e:
                          logger.exception(f"Erro ao buscar organizador: {e}")
                          data['organizer'] = {'name': 'Organizador', 'uid': data['uid']}
                  else:
                      data['organizer'] = {'name': 'Organizador', 'uid': None}
        
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
                return render_template("home.html", events=events_list, user=g.user)
            except Exception as e:
                return f"Erro ao carregar eventos: {e}"
    
    
    @app.route("/new_event", methods=["GET", "POST"])     
    def new_event():
        # Verificar se o usuário está logado
        if not g.user:
            if request.method == "GET":
                return redirect(url_for('login'))
            else:
                return jsonify({"success": False, "message": "Usuário não autenticado"}), 401
        
        if request.method == "GET":
            return render_template("novo_evento.html", user=g.user)

        
        try:
            data = request.get_json(force=True) if request.is_json else request.form
            if not data:
                return jsonify({"success" : False, "message" : "Nenhum dado recebido"}), 400
            
            # Validações básicas
            if not data.get("title"):
                return jsonify({"success": False, "message": "Título do evento é obrigatório"}), 400
            
            # Processar datas com tratamento de erro
            exit_date = None
            return_date = None
            
            if data.get("exit_date"):
                try:
                    exit_date = datetime.fromisoformat(data["exit_date"])
                except ValueError:
                    return jsonify({"success": False, "message": "Formato de data de saída inválido"}), 400
            
            if data.get("return_date"):
                try:
                    return_date = datetime.fromisoformat(data["return_date"])
                except ValueError:
                    return jsonify({"success": False, "message": "Formato de data de retorno inválido"}), 400

            
            # Processar números com tratamento de erro
            try:
                price = float(data.get("price", 0)) if data.get("price") else 0
                num_slots = int(data.get("numSlots", 0)) if data.get("numSlots") else 0
                event_type = int(data.get("type", 0)) if data.get("type") else 0
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Valores numéricos inválidos"}), 400

            event = {
                "title": data.get("title"),
                "desc": data.get("desc", ""),
                "price": price,
                "numSlots": num_slots,
                "exit_date": exit_date,   
                "return_date": return_date,
                "type": event_type,
                "tags": data.get("tags", []),
                "comments": [],
                "numAcess": 0,
                "images": data.get("image_urls", []),
                "route": data.get("route", None),
                "created_at": firestore.SERVER_TIMESTAMP,
                "uid" : g.user['uid'] if g.user else None
            }
            
            # Log para debug
            print(f"Criando evento com UID: {g.user['uid'] if g.user else None}")
            logger.info(f"Criando evento com UID: {g.user['uid'] if g.user else None}")
            
            # Salva o evento no Firestore
            event_ref = db.collection("events").add(event)
            event_id = event_ref[1].id  # O ID do documento está na posição [1]
            
            # Log para confirmar criação
            print(f"Evento criado com ID: {event_id}, UID: {event.get('uid')}")
            logger.info(f"Evento criado com ID: {event_id}, UID: {event.get('uid')}")

            # Cria grupo de chat vinculado ao evento
            try:
                chat_group_ref = db.collection("chat-group").document(f"group_{event_id}")
                chat_group_ref.set({
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "updated_at": firestore.SERVER_TIMESTAMP,
                    "group_name": event["title"],
                    "id_org": g.user['uid'] if g.user else None,
                    "members": [g.user['uid']] if g.user else []
                })

                # Cria subcoleção messages com mensagem inicial
                chat_group_ref.collection("messages").add({
                    "system": True,
                    "text": "Grupo criado",
                    "timestamp": firestore.SERVER_TIMESTAMP
                })
            except Exception as chat_error:
                logger.exception(f"Erro ao criar chat group: {chat_error}")
                # Não falha o evento se o chat falhar, apenas loga o erro


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
            return redirect(url_for('home'))
        try:
            event_ref = db.collection('events').document(event_id)
            event = event_ref.get()
            if not event.exists:
                flash("Evento não encontrado.", "error")
                return redirect(url_for('home'))
            
            user_ref = db.collection('user').document(g.user['uid'])
            user = user_ref.get()
            if not user.exists:
                flash("Usuário não encontrado.", "error")
                return redirect(url_for('login'))
            
            user_data = user.to_dict()
            joined_events = user_data.get('joinedEvents', [])
            if event_id in joined_events:
                flash("Você já está participando deste evento.", "info")
                return redirect(url_for('home'))
            
            joined_events.append(event_id)
            user_ref.update({'joinedEvents': joined_events})
            
            flash("Você agora está participando do evento!", "success")
            return redirect(url_for('home'))
        except Exception as e:
            logger.exception(f"Erro ao participar do evento: {e}")
            flash("Erro ao participar do evento. Tente novamente.", "error")
            return redirect(url_for('home'))
    
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
                "name": f"{g.user.get('name', '')} {g.user.get('surname', '')}".strip() or "Usuário",
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
        
        # Aceita tanto chat_uid quanto org_uid para compatibilidade
        event_id = request.form.get("chat_uid") or request.form.get("org_uid")
        
        if not event_id:
            flash("ID do evento não informado.", "error")
            return redirect(url_for("home"))
        
        # Se o event_id começar com "group_", extrair o ID real do evento
        if event_id.startswith("group_"):
            event_id = event_id[6:]  # Remove "group_" do início
            logger.info(f"ID do grupo extraído: {event_id}")
        
        logger.info(f"Processando chat do grupo para evento: {event_id}")
        
        # Buscar informações do grupo/evento
        group_name = "Grupo de Viagem"
        group_members_count = 0
        members = []
        
        try:
            logger.info(f"Tentando acessar chat do grupo para evento: {event_id}")
            
            # Buscar dados do grupo de chat
            group_doc = db.collection("chat-group").document(f"group_{event_id}").get()
            logger.info(f"Grupo de chat existe: {group_doc.exists}")
            
            if group_doc.exists:
                group_data = group_doc.to_dict()
                group_name = group_data.get("group_name", "Grupo de Viagem")
                members = group_data.get("members", [])
                group_members_count = len(members)
                logger.info(f"Grupo encontrado: {group_name}, membros: {group_members_count}")
                
                # Verificar se o usuário atual é membro do grupo
                if g.user["uid"] not in members:
                    # Adicionar usuário ao grupo se não for membro
                    members.append(g.user["uid"])
                    db.collection("chat-group").document(f"group_{event_id}")\
                      .update({"members": members})
                    group_members_count = len(members)
                    logger.info(f"Usuário adicionado ao grupo. Novo total de membros: {group_members_count}")
            else:
                # Grupo não existe, criar um novo
                logger.info(f"Grupo não existe, buscando evento {event_id}")
                event_doc = db.collection("events").document(event_id).get()
                logger.info(f"Evento existe: {event_doc.exists}")
                
                if event_doc.exists:
                    event_data = event_doc.to_dict()
                    group_name = event_data.get("title", "Grupo de Viagem")
                    logger.info(f"Evento encontrado: {group_name}")
                    
                    # Criar grupo de chat
                    members = [g.user['uid']]
                    db.collection("chat-group").document(f"group_{event_id}").set({
                        "created_at": firestore.SERVER_TIMESTAMP,
                        "updated_at": firestore.SERVER_TIMESTAMP,
                        "group_name": group_name,
                        "id_org": g.user['uid'],
                        "members": members
                    })
                    group_members_count = len(members)
                    logger.info(f"Grupo de chat criado para evento: {group_name}")
                else:
                    logger.warning(f"Evento {event_id} não encontrado na coleção 'events'")
                    flash("Evento não encontrado.", "error")
                    return redirect(url_for("home"))
            
            # Buscar dados do evento para informações adicionais se ainda não foi feito
            if not group_name or group_name == "Grupo de Viagem":
                event_doc = db.collection("events").document(event_id).get()
                if event_doc.exists:
                    event_data = event_doc.to_dict()
                    group_name = event_data.get("title", "Grupo de Viagem")
                    
        except Exception as e:
            logger.warning(f"Erro ao buscar informações do grupo {event_id}: {e}")
            flash("Erro ao acessar chat do grupo.", "error")
            return redirect(url_for("home"))
        
        # Buscar informações dos participantes
        participants_info = []
        try:
            if group_members_count > 0 and members:
                # Buscar dados dos participantes
                for member_uid in members:
                    try:
                        member_doc = db.collection("users").document(member_uid).get()
                        if member_doc.exists:
                            member_data = member_doc.to_dict()
                            participants_info.append({
                                "uid": member_uid,
                                "name": f"{member_data.get('name', '')} {member_data.get('surname', '')}".strip(),
                                "is_current_user": member_uid == g.user["uid"]
                            })
                        else:
                            # Fallback para coleção 'user' se 'users' não existir
                            member_doc = db.collection("user").document(member_uid).get()
                            if member_doc.exists:
                                member_data = member_doc.to_dict()
                                participants_info.append({
                                    "uid": member_uid,
                                    "name": f"{member_data.get('name', '')} {member_data.get('surname', '')}".strip(),
                                    "is_current_user": member_uid == g.user["uid"]
                                })
                    except Exception as e:
                        logger.warning(f"Erro ao buscar dados do participante {member_uid}: {e}")
                        participants_info.append({
                            "uid": member_uid,
                            "name": "Usuário",
                            "is_current_user": member_uid == g.user["uid"]
                        })
        except Exception as e:
            logger.warning(f"Erro ao buscar participantes: {e}")
        
        return render_template("chat_group.html", user=g.user, event_id=event_id, 
                             group_name=group_name, group_members_count=group_members_count,
                             participants=participants_info)
    
    
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
                "name": f"{g.user.get('name', '')} {g.user.get('surname', '')}".strip() or "Usuário"
            }

            # Salva mensagem na subcoleção do grupo
            db.collection("chat-group").document(f"group_{event_id}")\
              .collection("messages").add(message_data)
            
            # Atualizar timestamp do grupo
            db.collection("chat-group").document(f"group_{event_id}")\
              .update({"updated_at": firestore.SERVER_TIMESTAMP})

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

            messages = []
            for doc in messages_ref.stream():
                message_data = doc.to_dict()
                message_data['id'] = doc.id  # Adicionar o ID da mensagem
                
                # Normalizar timestamp para compatibilidade com o frontend
                ts = message_data.get("timestamp")
                if isinstance(ts, datetime):
                    message_data["timestamp"] = {
                        "_seconds": int(ts.timestamp()),
                        "_nanoseconds": ts.microsecond * 1000
                    }
                elif hasattr(ts, 'seconds'):
                    message_data["timestamp"] = {
                        "_seconds": int(ts.seconds),
                        "_nanoseconds": int(getattr(ts, "nanos", 0))
                    }
                
                messages.append(message_data)

            return jsonify({"success": True, "messages": messages})
        except Exception as e:
            logger.exception(f"Erro ao buscar mensagens do grupo: {e}")
            return jsonify({"success": False, "message": "Erro ao carregar mensagens"}), 500

    
    @app.route("/chat_individual", methods=["GET", "POST"])
    def chat_individual():
        try:
            logger.info("=== INÍCIO chat_individual ===")
            
            if not g.user:
                logger.warning("Usuário não logado tentando acessar chat individual")
                return redirect(url_for("login"))
            
            logger.info(f"Usuário logado: {g.user['uid']}")
        
            if request.method == "GET":
                # Para GET, usar user_id como parâmetro
                user_id = request.args.get("user_id")
                logger.info(f"Acessando chat individual - User logado: {g.user['uid']}, User alvo: {user_id}")
                
                if not user_id:
                    logger.warning("user_id não informado")
                    flash("Usuário não informado.", "error")
                    return redirect(url_for("my_chats"))
                
                # Verificar se o usuário está tentando conversar consigo mesmo
                if user_id == g.user['uid']:
                    logger.warning(f"Usuário tentando conversar consigo mesmo: {user_id}")
                    flash("Você não pode conversar consigo mesmo.", "error")
                    return redirect(url_for("my_chats"))
                
                # Verificar se o usuário alvo existe
                try:
                    target_user_ref = db.collection('user').document(user_id)
                    target_user_doc = target_user_ref.get()
                    if not target_user_doc.exists:
                        logger.warning(f"Usuário alvo não encontrado: {user_id}")
                        flash("Usuário não encontrado.", "error")
                        return redirect(url_for("my_chats"))
                except Exception as e:
                    logger.exception(f"Erro ao verificar usuário alvo: {e}")
                    flash("Erro ao verificar usuário.", "error")
                    return redirect(url_for("my_chats"))
                
                # Criar ou buscar chat individual
                logger.info("Chamando create_or_get_individual_chat...")
                chat_uid = create_or_get_individual_chat(g.user["uid"], user_id)
                logger.info(f"Resultado create_or_get_individual_chat: {chat_uid}")
                
                if not chat_uid:
                    logger.error(f"Falha ao criar/buscar chat entre {g.user['uid']} e {user_id}")
                    flash("Erro ao criar chat individual.", "error")
                    return redirect(url_for("my_chats"))
                
                logger.info(f"Chat individual criado/encontrado: {chat_uid}")
                
                # Buscar informações do outro usuário
                other_user_name = "Usuário"
                try:
                    target_user_doc = db.collection("user").document(user_id).get()
                    if target_user_doc.exists:
                        target_user_data = target_user_doc.to_dict()
                        other_user_name = f"{target_user_data.get('name', '')} {target_user_data.get('surname', '')}".strip()
                except Exception as e:
                    logger.warning(f"Erro ao buscar dados do usuário {user_id}: {e}")
                
                logger.info("Renderizando template chat_individual.html...")
                return render_template("chat_individual.html", user=g.user, chat_uid=chat_uid, other_user_name=other_user_name)
            else:
                # Para POST, usar chat_uid do formulário
                chat_uid = request.form.get("chat_uid")
                if not chat_uid:
                    flash("Chat não informado.", "error")
                    return redirect(url_for("my_chats"))
                
                # Buscar informações do outro usuário no chat
                other_user_name = "Usuário"
                try:
                    chat_doc = db.collection("chats").document(chat_uid).get()
                    if chat_doc.exists:
                        chat_data = chat_doc.to_dict()
                        participants = chat_data.get("participants", [])
                        other_user_uid = None
                        for uid in participants:
                            if uid != g.user["uid"]:
                                other_user_uid = uid
                                break
                        
                        if other_user_uid:
                            other_user_doc = db.collection("user").document(other_user_uid).get()
                            if other_user_doc.exists:
                                other_user_data = other_user_doc.to_dict()
                                other_user_name = f"{other_user_data.get('name', '')} {other_user_data.get('surname', '')}".strip()
                except Exception as e:
                    logger.warning(f"Erro ao buscar dados do outro usuário: {e}")
            
                return render_template("chat_individual.html", user=g.user, chat_uid=chat_uid, other_user_name=other_user_name)
                
        except Exception as e:
            logger.exception(f"ERRO GERAL em chat_individual: {e}")
            flash("Erro interno ao criar chat individual.", "error")
            return redirect(url_for("my_chats"))

    def create_or_get_individual_chat(user1_uid, user2_uid):
        """Criar ou buscar chat individual entre dois usuários"""
        try:
            logger.info(f"Criando/buscando chat entre {user1_uid} e {user2_uid}")
            
            # Verificar se já existe um chat entre os dois usuários
            # Firestore não suporta múltiplos array_contains na mesma query
            # Vamos buscar chats onde o primeiro usuário participa e filtrar no código
            existing_chats = db.collection("chats")\
                .where("participants", "array_contains", user1_uid)\
                .where("type", "==", "individual")\
                .stream()
            
            for doc in existing_chats:
                chat_data = doc.to_dict()
                participants = chat_data.get("participants", [])
                # Verificar se ambos os usuários estão na lista de participantes
                if user1_uid in participants and user2_uid in participants:
                    logger.info(f"Chat existente encontrado: {doc.id}")
                    return doc.id
            
            # Se não existe, criar novo chat
            logger.info("Criando novo chat individual")
            chat_data = {
                "participants": [user1_uid, user2_uid],
                "type": "individual",
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP
            }
            
            doc_ref = db.collection("chats").add(chat_data)
            chat_id = doc_ref[1].id
            logger.info(f"Chat criado com sucesso: {chat_id}")
            return chat_id
            
        except Exception as e:
            logger.exception(f"Erro ao criar/buscar chat individual: {e}")
            return None

    
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
                
                # Buscar informações do outro usuário para chat individual
                participants = chat_data.get("participants", [])
                other_user_uid = None
                for uid in participants:
                    if uid != g.user["uid"]:
                        other_user_uid = uid
                        break
                
                if other_user_uid:
                    try:
                        other_user_doc = db.collection("user").document(other_user_uid).get()
                        if other_user_doc.exists:
                            other_user_data = other_user_doc.to_dict()
                            chat_data["other_user_name"] = f"{other_user_data.get('name', '')} {other_user_data.get('surname', '')}".strip()
                            chat_data["other_user_avatar"] = other_user_data.get("profile_image")
                        else:
                            chat_data["other_user_name"] = "Usuário"
                    except Exception as e:
                        logger.warning(f"Erro ao buscar dados do usuário {other_user_uid}: {e}")
                        chat_data["other_user_name"] = "Usuário"
                
                # Processar data da última mensagem
                updated_at = chat_data.get("updated_at")
                if updated_at:
                    if hasattr(updated_at, 'timestamp'):
                        # Firestore Timestamp
                        last_message_time = datetime.fromtimestamp(updated_at.timestamp())
                    elif isinstance(updated_at, datetime):
                        last_message_time = updated_at
                    else:
                        last_message_time = datetime.now()
                    
                    now = datetime.now()
                    time_diff = now - last_message_time
                    
                    if time_diff.total_seconds() < 60:  # Menos de 1 minuto
                        chat_data["last_message_time"] = "Agora"
                    elif time_diff.total_seconds() < 3600:  # Menos de 1 hora
                        minutes = int(time_diff.total_seconds() / 60)
                        chat_data["last_message_time"] = f"{minutes}min"
                    elif time_diff.total_seconds() < 86400:  # Menos de 1 dia
                        hours = int(time_diff.total_seconds() / 3600)
                        chat_data["last_message_time"] = f"{hours}h"
                    else:
                        days = int(time_diff.total_seconds() / 86400)
                        chat_data["last_message_time"] = f"{days}d"
                else:
                    chat_data["last_message_time"] = "Agora"
                
                # Buscar a última mensagem do chat individual
                try:
                    messages_ref = db.collection("chats").document(doc.id).collection("messages")\
                        .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                        .limit(1)
                    
                    last_message_docs = list(messages_ref.stream())
                    if last_message_docs:
                        last_message_data = last_message_docs[0].to_dict()
                        chat_data["last_message"] = last_message_data.get("text", "Nenhuma mensagem ainda")
                    else:
                        chat_data["last_message"] = "Nenhuma mensagem ainda"
                except Exception as e:
                    logger.warning(f"Erro ao buscar última mensagem do chat {doc.id}: {e}")
                    chat_data["last_message"] = "Nenhuma mensagem ainda"
                
                chats_individual.append(chat_data)
                
            for doc in chats_ref_grp:
                chat_data = doc.to_dict()
                chat_data["id"] = doc.id
                
                # Processar data da última mensagem para chat em grupo
                updated_at = chat_data.get("updated_at")
                if updated_at:
                    if hasattr(updated_at, 'timestamp'):
                        # Firestore Timestamp
                        last_message_time = datetime.fromtimestamp(updated_at.timestamp())
                    elif isinstance(updated_at, datetime):
                        last_message_time = updated_at
                    else:
                        last_message_time = datetime.now()
                    
                    now = datetime.now()
                    time_diff = now - last_message_time
                    
                    if time_diff.total_seconds() < 60:  # Menos de 1 minuto
                        chat_data["last_message_time"] = "Agora"
                    elif time_diff.total_seconds() < 3600:  # Menos de 1 hora
                        minutes = int(time_diff.total_seconds() / 60)
                        chat_data["last_message_time"] = f"{minutes}min"
                    elif time_diff.total_seconds() < 86400:  # Menos de 1 dia
                        hours = int(time_diff.total_seconds() / 3600)
                        chat_data["last_message_time"] = f"{hours}h"
                    else:
                        days = int(time_diff.total_seconds() / 86400)
                        chat_data["last_message_time"] = f"{days}d"
                else:
                    chat_data["last_message_time"] = "Agora"
                
                # Buscar a última mensagem do chat em grupo
                try:
                    # Extrair event_id do ID do grupo (remover prefixo "group_")
                    group_id = doc.id
                    if group_id.startswith("group_"):
                        event_id = group_id[6:]  # Remove "group_" do início
                        
                        messages_ref = db.collection("chat-group").document(group_id).collection("messages")\
                            .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                            .limit(1)
                        
                        last_message_docs = list(messages_ref.stream())
                        if last_message_docs:
                            last_message_data = last_message_docs[0].to_dict()
                            chat_data["last_message"] = last_message_data.get("text", "Nenhuma mensagem ainda")
                        else:
                            chat_data["last_message"] = "Nenhuma mensagem ainda"
                    else:
                        chat_data["last_message"] = "Nenhuma mensagem ainda"
                except Exception as e:
                    logger.warning(f"Erro ao buscar última mensagem do grupo {doc.id}: {e}")
                    chat_data["last_message"] = "Nenhuma mensagem ainda"
                
                chats_group.append(chat_data)

        except Exception as e:
            logger.exception(f"Erro ao carregar meus chats: {e}")
            flash("Erro ao carregar seus chats. Tente novamente.", "error")
            return render_template("my_chats.html", user=g.user, chats_group=[], chats_individual=[])
        
        return render_template("my_chats.html", user=g.user, chats_group=chats_group, chats_individual=chats_individual)
    
    
    @app.route("/my_vacations")
    def my_vacations():
        print("=== INÍCIO DA FUNÇÃO MY_VACATIONS ===")
        if not g.user:
            print("Usuário não logado, redirecionando para login")
            return redirect(url_for("login"))
        
        try:
            print(f"Usuário logado: {g.user.get('name', 'Sem nome')}")
            print(f"UID do usuário: {g.user.get('uid')}")
            logger.info(f"Carregando viagens para usuário: {g.user.get('uid')}")
            
            # Verificar se o usuário tem UID válido
            if not g.user.get('uid'):
                print("ERRO: Usuário não possui UID válido")
                logger.error("Usuário não possui UID válido")
                flash("Erro: Usuário não possui identificação válida.", "error")
                return render_template("minhas_viagens.html", user=g.user, my_vacations=[], joined_vacations=[])
            
            joined_events = g.user.get("joinedEvents", [])
            logger.info(f"Eventos que participa: {len(joined_events)}")
            
            joined_vacations = []
            my_vacations = []
            
            # NOVA LÓGICA SIMPLIFICADA: Buscar todas as viagens e separar as criadas das participadas
            try:
                print("=== NOVA LÓGICA: Buscando todas as viagens do usuário ===")
                
                # Primeiro, buscar viagens criadas pelo usuário (onde uid = user_uid)
                print(f"Buscando viagens CRIADAS para UID: {g.user['uid']}")
                try:
                    created_events_ref = db.collection("events")\
                                           .where("uid", "==", g.user["uid"])\
                                           .stream()
                    
                    for doc in created_events_ref:
                        try:
                            event_data = doc.to_dict()
                            event_data["id"] = doc.id
                            
                            print(f"Viagem CRIADA encontrada - ID: {doc.id}, Título: {event_data.get('title', 'Sem título')}")
                            
                            # Processar data de expiração
                            return_date = event_data.get('return_date')
                            try:
                                if return_date and isinstance(return_date, datetime):
                                    # Remove timezone info para comparação
                                    if return_date.tzinfo is not None:
                                        return_date = return_date.replace(tzinfo=None)
                                    event_data['is_expired'] = return_date < datetime.now()
                                else:
                                    event_data['is_expired'] = False
                            except Exception:
                                event_data['is_expired'] = False
                            
                            # Marcar como viagem criada pelo usuário
                            event_data['is_creator'] = True
                            my_vacations.append(event_data)
                            
                        except Exception as doc_error:
                            logger.exception(f"Erro ao processar viagem criada: {doc_error}")
                            continue
                
                except Exception as created_error:
                    logger.exception(f"Erro ao buscar viagens criadas: {created_error}")
                
                print(f"Total de viagens CRIADAS encontradas: {len(my_vacations)}")
                
                # Segundo, buscar viagens onde o usuário participa (usando joinedEvents)
                if joined_events:
                    print(f"Buscando viagens PARTICIPADAS: {len(joined_events)} eventos")
                    try:
                        # Firestore permite até 10 elementos no 'in'
                        chunks = [joined_events[i:i+10] for i in range(0, len(joined_events), 10)]
                        for chunk in chunks:
                            try:
                                joined_query = db.collection("events").where("__name__", "in", chunk).stream()
                                for doc in joined_query:
                                    try:
                                        event_data = doc.to_dict()
                                        event_data["id"] = doc.id
                                        
                                        # Só adicionar se NÃO for uma viagem criada pelo usuário
                                        if event_data.get('uid') != g.user['uid']:
                                            print(f"Viagem PARTICIPADA encontrada - ID: {doc.id}, Título: {event_data.get('title', 'Sem título')}")
                                            event_data['is_creator'] = False
                                            joined_vacations.append(event_data)
                                        else:
                                            print(f"Ignorando viagem {doc.id} - usuário é o criador")
                                            
                                    except Exception as doc_error:
                                        logger.exception(f"Erro ao processar viagem participada: {doc_error}")
                                        continue
                            except Exception as chunk_error:
                                logger.exception(f"Erro ao processar chunk de eventos: {chunk_error}")
                                continue
                    except Exception as joined_error:
                        logger.exception(f"Erro ao buscar viagens participadas: {joined_error}")
                
                print(f"Total de viagens PARTICIPADAS encontradas: {len(joined_vacations)}")
                        
            except Exception as general_error:
                logger.exception(f"Erro geral ao buscar viagens: {general_error}")
                flash("Erro ao carregar suas viagens. Tente novamente.", "error")
                return render_template("minhas_viagens.html", user=g.user, my_vacations=[], joined_vacations=[])
            
            print(f"=== RESULTADO FINAL ===")
            print(f"Total de viagens CRIADAS: {len(my_vacations)}")
            print(f"Total de viagens PARTICIPADAS: {len(joined_vacations)}")
            logger.info(f"Total de viagens criadas: {len(my_vacations)}")
            logger.info(f"Total de viagens participadas: {len(joined_vacations)}")
            
            print("=== FINAL DA FUNÇÃO MY_VACATIONS ===")
            
        except Exception as e:
            print(f"ERRO GERAL: {e}")
            logger.exception(f"Erro geral ao carregar minhas viagens: {e}")
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

    @app.route("/edit_profile")
    def edit_profile():
        if not g.user:
            return redirect(url_for('login'))
        return render_template("editProfile.html", user=g.user)

    @app.route("/updateProfile", methods=["POST"])
    def updateProfile():
        if not g.user:
            return redirect(url_for('login'))
        
        try:
            # Obter dados do formulário
            username = request.form.get('username', '').strip()
            surname = request.form.get('surname', '').strip()
            desc = request.form.get('desc', '').strip()
            is_organizer = request.form.get('isOrganizer') == 'true'
            
            # Validações básicas
            if not username:
                flash('Nome de usuário é obrigatório.', 'error')
                return redirect(url_for('edit_profile'))
            
            # Preparar dados para atualização
            update_data = {
                'name': username,
                'surname': surname,
                'desc': desc,
                'isOrganizer': is_organizer,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            
            # # Processar upload de imagem se houver
            # if 'profileImage' in request.files:
            #     profile_image = request.files['profileImage']
            #     if profile_image and profile_image.filename:
            #         try:
            #             # Aqui você pode implementar upload para Firebase Storage
            #             # Por enquanto, vamos apenas salvar a referência
            #             image_url = f"profile_images/{g.user['uid']}/{profile_image.filename}"
            #             update_data['profileImage'] = image_url
                        
            #             # TODO: Implementar upload real para Firebase Storage
            #             # from firebase_admin import storage
            #             # bucket = storage.bucket()
            #             # blob = bucket.blob(image_url)
            #             # blob.upload_from_file(profile_image)
            #             # blob.make_public()
            #             # update_data['profileImage'] = blob.public_url
                        
            #         except Exception as e:
            #             logger.exception(f"Erro ao processar imagem: {e}")
            #             flash('Erro ao processar imagem de perfil.', 'error')
            
            # Processar dados de verificação de identidade se fornecidos
            verification_type = request.form.get('verificationType')
            if verification_type:
                verification_data = {
                    'verificationType': verification_type,
                    'verificationStatus': 'pending',
                    'verificationDate': firestore.SERVER_TIMESTAMP
                }
                
                if verification_type == 'company':
                    verification_data.update({
                        'companyName': request.form.get('companyName', '').strip(),
                        'cnpj': request.form.get('cnpj', '').strip(),
                        'vehiclePlate': request.form.get('companyVehiclePlate', '').strip(),
                        'vehicleModel': request.form.get('companyVehicleModel', '').strip()
                    })
                elif verification_type == 'organizer':
                    verification_data.update({
                        'cnh': request.form.get('cnh', '').strip(),
                        'vehiclePlate': request.form.get('organizerVehiclePlate', '').strip(),
                        'vehicleModel': request.form.get('organizerVehicleModel', '').strip()
                    })
                
                update_data['verificationData'] = verification_data
            
            # Atualizar no Firestore
            user_ref = db.collection('user').document(g.user['uid'])
            user_ref.update(update_data)
            
            # Atualizar dados na sessão
            updated_user = user_ref.get().to_dict()
            g.user.update(updated_user)
            
            flash('Perfil atualizado com sucesso!', 'success')
            return redirect(url_for('perfil'))
            
        except Exception as e:
            logger.exception(f"Erro ao atualizar perfil: {e}")
            flash('Erro ao atualizar perfil. Tente novamente.', 'error')
            return redirect(url_for('edit_profile'))

    @app.route("/submitVerification", methods=["POST"])
    def submitVerification():
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            verification_type = request.form.get('verificationType')
            if not verification_type:
                return jsonify({"success": False, "message": "Tipo de verificação não especificado"}), 400
            
            # Preparar dados de verificação
            verification_data = {
                'verificationType': verification_type,
                'verificationStatus': 'pending',
                'verificationDate': firestore.SERVER_TIMESTAMP,
                'submittedBy': g.user['uid']
            }
            
            # Validar e processar dados específicos do tipo
            if verification_type == 'company':
                company_name = request.form.get('companyName', '').strip()
                cnpj = request.form.get('cnpj', '').strip()
                vehicle_plate = request.form.get('companyVehiclePlate', '').strip()
                vehicle_model = request.form.get('companyVehicleModel', '').strip()
                
                if not all([company_name, cnpj, vehicle_plate, vehicle_model]):
                    return jsonify({"success": False, "message": "Todos os campos são obrigatórios para empresas"}), 400
                
                verification_data.update({
                    'companyName': company_name,
                    'cnpj': cnpj,
                    'vehiclePlate': vehicle_plate,
                    'vehicleModel': vehicle_model
                })
                
            elif verification_type == 'organizer':
                cnh = request.form.get('cnh', '').strip()
                vehicle_plate = request.form.get('organizerVehiclePlate', '').strip()
                vehicle_model = request.form.get('organizerVehicleModel', '').strip()
                
                if not all([cnh, vehicle_plate, vehicle_model]):
                    return jsonify({"success": False, "message": "Todos os campos são obrigatórios para organizadores"}), 400
                
                verification_data.update({
                    'cnh': cnh,
                    'vehiclePlate': vehicle_plate,
                    'vehicleModel': vehicle_model
                })
            
            else:
                return jsonify({"success": False, "message": "Tipo de verificação inválido"}), 400
            
            # Salvar dados de verificação no Firestore
            verification_ref = db.collection('verifications').document()
            verification_ref.set(verification_data)
            
            # Atualizar dados do usuário com referência à verificação
            user_ref = db.collection('user').document(g.user['uid'])
            user_ref.update({
                'verificationData': verification_data,
                'verificationId': verification_ref.id,
                'updated_at': firestore.SERVER_TIMESTAMP
            })
            
            return jsonify({"success": True, "message": "Verificação enviada com sucesso"})
            
        except Exception as e:
            logger.exception(f"Erro ao processar verificação: {e}")
            return jsonify({"success": False, "message": "Erro interno do servidor"}), 500

    @app.route("/search")
    def search():
        """Rota para a página de pesquisa"""
        return render_template("search.html", user=g.user)

    @app.route("/debug_events")
    def debug_events():
        """Rota de debug para verificar eventos no banco"""
        if not g.user:
            return jsonify({"error": "Usuário não logado"}), 401
        
        try:
            events = []
            all_events = db.collection("events").stream()
            
            for doc in all_events:
                event_data = doc.to_dict()
                event_data["id"] = doc.id
                events.append(event_data)
            
            return jsonify({
                "success": True,
                "user_uid": g.user.get('uid'),
                "total_events": len(events),
                "events": events
            })
        except Exception as e:
            logger.exception(f"Erro no debug: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route("/search_api", methods=["GET"])
    def search_api():
        """API para realizar busca de eventos com filtros"""
        try:
            # Obter parâmetros de busca
            query = request.args.get('q', '').strip()
            tags = request.args.getlist('tags')  # Múltiplas tags
            price_range = request.args.get('price', '').strip()
            rating = request.args.get('rating', '').strip()
            date_filter = request.args.get('date', '').strip()
            
            # Construir query base
            events_query = db.collection('events')
            
            # Aplicar filtros
            filters_applied = []
            
            # Filtro por tags
            if tags:
                # Firestore não suporta array_contains com múltiplos valores diretamente
                # Vamos filtrar no código Python após buscar os eventos
                filters_applied.append(f"tags: {', '.join(tags)}")
            
            # Filtro por faixa de preço
            if price_range:
                if price_range == '0-100':
                    events_query = events_query.where('price', '<=', 100)
                elif price_range == '100-300':
                    events_query = events_query.where('price', '>=', 100).where('price', '<=', 300)
                elif price_range == '300-500':
                    events_query = events_query.where('price', '>=', 300).where('price', '<=', 500)
                elif price_range == '500-1000':
                    events_query = events_query.where('price', '>=', 500).where('price', '<=', 1000)
                elif price_range == '1000+':
                    events_query = events_query.where('price', '>=', 1000)
                filters_applied.append(f"preço: {price_range}")
            
            # Filtro por data
            if date_filter:
                try:
                    filter_date = datetime.fromisoformat(date_filter)
                    events_query = events_query.where('exit_date', '>=', filter_date)
                    filters_applied.append(f"data: {date_filter}")
                except ValueError:
                    pass  # Ignorar data inválida
            
            # Executar query
            events_docs = events_query.stream()
            events = []
            
            for doc in events_docs:
                event_data = doc.to_dict()
                event_data['id'] = doc.id
                
                # Verificar se o usuário logado já participa deste evento
                if g.user:
                    user_ref = db.collection('user').document(g.user['uid'])
                    user_doc = user_ref.get()
                    if user_doc.exists:
                        user_data = user_doc.to_dict()
                        joined_events = user_data.get('joinedEvents', [])
                        event_data['isParticipating'] = event_data['id'] in joined_events
                    else:
                        event_data['isParticipating'] = False
                else:
                    event_data['isParticipating'] = False
                
                # Filtrar por tags se especificado
                if tags:
                    event_tags = event_data.get('tags', [])
                    if not any(tag in event_tags for tag in tags):
                        continue
                
                # Filtrar por texto de busca se especificado
                if query:
                    searchable_text = f"{event_data.get('title', '')} {event_data.get('desc', '')}".lower()
                    if query.lower() not in searchable_text:
                        continue
                
                # Processar datas para serialização JSON
                exit_date = event_data.get('exit_date')
                return_date = event_data.get('return_date')
                
                if isinstance(exit_date, datetime):
                    event_data['exit_date'] = {
                        'seconds': int(exit_date.timestamp()),
                        'nanoseconds': exit_date.microsecond * 1000
                    }
                elif hasattr(exit_date, 'seconds'):
                    event_data['exit_date'] = {
                        'seconds': exit_date.seconds,
                        'nanoseconds': getattr(exit_date, 'nanoseconds', 0)
                    }
                
                if isinstance(return_date, datetime):
                    event_data['return_date'] = {
                        'seconds': int(return_date.timestamp()),
                        'nanoseconds': return_date.microsecond * 1000
                    }
                elif hasattr(return_date, 'seconds'):
                    event_data['return_date'] = {
                        'seconds': return_date.seconds,
                        'nanoseconds': getattr(return_date, 'nanoseconds', 0)
                    }
                
                # Processar rota para JSON serializável
                route = event_data.get('route')
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
                    event_data['route'] = route
                
                events.append(event_data)
            
            # Ordenar resultados por relevância (título primeiro, depois data)
            if query:
                events.sort(key=lambda x: (
                    query.lower() in x.get('title', '').lower(),
                    x.get('exit_date', {}).get('seconds', 0)
                ), reverse=True)
            else:
                events.sort(key=lambda x: x.get('exit_date', {}).get('seconds', 0), reverse=True)
            
            return jsonify({
                "success": True,
                "results": events,
                "total": len(events),
                "filters_applied": filters_applied,
                "query": query
            })
            
        except Exception as e:
            logger.exception(f"Erro na busca: {e}")
            return jsonify({
                "success": False,
                "message": "Erro ao realizar busca",
                "results": [],
                "total": 0
            }), 500

    @app.route("/search_users_api", methods=["GET"])
    def search_users_api():
        """API para realizar busca de usuários"""
        try:
            # Obter parâmetros de busca
            query = request.args.get('q', '').strip()
            
            # Construir query base
            users_query = db.collection('user')
            
            # Executar query
            users_docs = users_query.stream()
            users = []
            
            for doc in users_docs:
                user_data = doc.to_dict()
                user_data['uid'] = doc.id
                
                # Filtrar por texto de busca se especificado
                if query:
                    searchable_text = f"{user_data.get('name', '')} {user_data.get('email', '')}".lower()
                    if query.lower() not in searchable_text:
                        continue
                
                # Contar eventos organizados pelo usuário
                organized_events_query = db.collection('events').where('uid', '==', doc.id)
                organized_events = list(organized_events_query.stream())
                user_data['organizedEventsCount'] = len(organized_events)
                
                # Contar eventos participados pelo usuário
                joined_events = user_data.get('joinedEvents', [])
                user_data['joinedEventsCount'] = len(joined_events)
                
                # Processar data de criação para serialização JSON
                created_at = user_data.get('created_at')
                if hasattr(created_at, 'seconds'):
                    user_data['created_at'] = {
                        'seconds': created_at.seconds,
                        'nanoseconds': getattr(created_at, 'nanoseconds', 0)
                    }
                
                users.append(user_data)
            
            # Ordenar resultados
            if query:
                users.sort(key=lambda x: (
                    query.lower() in x.get('name', '').lower(),
                    x.get('organizedEventsCount', 0)
                ), reverse=True)
            else:
                users.sort(key=lambda x: x.get('organizedEventsCount', 0), reverse=True)
            
            return jsonify({
                "success": True,
                "results": users,
                "total": len(users),
                "query": query
            })
            
        except Exception as e:
            logger.exception(f"Erro na busca de usuários: {e}")
            return jsonify({
                "success": False,
                "message": "Erro ao realizar busca de usuários",
                "results": [],
                "total": 0
            }), 500

    @app.route("/user_details_api", methods=["GET"])
    def user_details_api():
        """API para obter detalhes de um usuário específico e suas viagens organizadas"""
        try:
            uid = request.args.get('uid', '').strip()
            
            if not uid:
                return jsonify({
                    "success": False,
                    "message": "UID do usuário não fornecido"
                }), 400
            
            # Buscar dados do usuário
            user_doc = db.collection('user').document(uid).get()
            
            if not user_doc.exists:
                return jsonify({
                    "success": False,
                    "message": "Usuário não encontrado"
                }), 404
            
            user_data = user_doc.to_dict()
            user_data['uid'] = uid
            
            # Buscar eventos organizados pelo usuário
            events_query = db.collection('events').where('uid', '==', uid)
            events_docs = events_query.stream()
            events = []
            
            for doc in events_docs:
                event_data = doc.to_dict()
                event_data['id'] = doc.id
                
                # Processar datas para serialização JSON
                exit_date = event_data.get('exit_date')
                return_date = event_data.get('return_date')
                
                if isinstance(exit_date, datetime):
                    event_data['exit_date'] = {
                        'seconds': int(exit_date.timestamp()),
                        'nanoseconds': exit_date.microsecond * 1000
                    }
                elif hasattr(exit_date, 'seconds'):
                    event_data['exit_date'] = {
                        'seconds': exit_date.seconds,
                        'nanoseconds': getattr(exit_date, 'nanoseconds', 0)
                    }
                
                if isinstance(return_date, datetime):
                    event_data['return_date'] = {
                        'seconds': int(return_date.timestamp()),
                        'nanoseconds': return_date.microsecond * 1000
                    }
                elif hasattr(return_date, 'seconds'):
                    event_data['return_date'] = {
                        'seconds': return_date.seconds,
                        'nanoseconds': getattr(return_date, 'nanoseconds', 0)
                    }
                
                # Processar rota para JSON serializável
                route = event_data.get('route')
                if route and isinstance(route, dict):
                    start = route.get('start')
                    end = route.get('end')
                    if start and hasattr(start, 'latitude'):
                        route['start'] = {
                            'latitude': start.latitude,
                            'longitude': start.longitude
                        }
                    if end and hasattr(end, 'latitude'):
                        route['end'] = {
                            'latitude': end.latitude,
                            'longitude': end.longitude
                        }
                
                events.append(event_data)
            
            # Ordenar eventos por data de saída
            events.sort(key=lambda x: x.get('exit_date', {}).get('seconds', 0), reverse=True)
            
            # Adicionar contadores ao usuário
            user_data['organizedEventsCount'] = len(events)
            joined_events = user_data.get('joinedEvents', [])
            user_data['joinedEventsCount'] = len(joined_events)
            
            # Processar data de criação para serialização JSON
            created_at = user_data.get('created_at')
            if hasattr(created_at, 'seconds'):
                user_data['created_at'] = {
                    'seconds': created_at.seconds,
                    'nanoseconds': getattr(created_at, 'nanoseconds', 0)
                }
            
            return jsonify({
                "success": True,
                "user": user_data,
                "events": events
            })
            
        except Exception as e:
            logger.exception(f"Erro ao obter detalhes do usuário: {e}")
            return jsonify({
                "success": False,
                "message": "Erro ao obter detalhes do usuário"
            }), 500

    @app.route("/user/<user_id>")
    def user_profile(user_id):
        """Página de perfil de um usuário específico"""
        try:
            logger.info(f"Acessando perfil do usuário: {user_id}")
            # Buscar dados do usuário
            user_doc = db.collection('user').document(user_id).get()
            
            if not user_doc.exists:
                flash('Usuário não encontrado.', 'error')
                return redirect(url_for('home'))
            
            user_data = user_doc.to_dict()
            user_data['uid'] = user_id
            
            # Contar eventos organizados pelo usuário
            organized_events_query = db.collection('events').where('uid', '==', user_id)
            organized_events = list(organized_events_query.stream())
            user_data['organizedEventsCount'] = len(organized_events)
            
            # Contar eventos participados pelo usuário
            joined_events = user_data.get('joinedEvents', [])
            user_data['joinedEventsCount'] = len(joined_events)
            
            # Processar data de criação
            created_at = user_data.get('created_at')
            if hasattr(created_at, 'timestamp'):
                user_data['created_at'] = datetime.fromtimestamp(created_at.timestamp())
            elif hasattr(created_at, 'seconds'):
                user_data['created_at'] = datetime.fromtimestamp(created_at.seconds)
            
            logger.info(f"Renderizando perfil do usuário: {user_data.get('name', 'Nome não informado')}")
            return render_template('user_profile.html', user=user_data)
            
        except Exception as e:
            logger.exception(f"Erro ao carregar perfil do usuário: {e}")
            flash('Erro ao carregar perfil do usuário.', 'error')
            return redirect(url_for('home'))

    @app.route("/user_participated_events_api", methods=["GET"])
    def user_participated_events_api():
        """API para obter eventos participados por um usuário"""
        try:
            uid = request.args.get('uid', '').strip()
            
            if not uid:
                return jsonify({
                    "success": False,
                    "message": "UID do usuário não fornecido"
                }), 400
            
            # Buscar dados do usuário para obter eventos participados
            user_doc = db.collection('user').document(uid).get()
            
            if not user_doc.exists:
                return jsonify({
                    "success": False,
                    "message": "Usuário não encontrado"
                }), 404
            
            user_data = user_doc.to_dict()
            joined_events_ids = user_data.get('joinedEvents', [])
            
            if not joined_events_ids:
                return jsonify({
                    "success": True,
                    "events": []
                })
            
            # Buscar eventos participados
            events = []
            for event_id in joined_events_ids:
                try:
                    event_doc = db.collection('events').document(event_id).get()
                    if event_doc.exists:
                        event_data = event_doc.to_dict()
                        event_data['id'] = event_doc.id
                        
                        # Processar datas para serialização JSON
                        exit_date = event_data.get('exit_date')
                        return_date = event_data.get('return_date')
                        
                        if isinstance(exit_date, datetime):
                            event_data['exit_date'] = {
                                'seconds': int(exit_date.timestamp()),
                                'nanoseconds': exit_date.microsecond * 1000
                            }
                        elif hasattr(exit_date, 'seconds'):
                            event_data['exit_date'] = {
                                'seconds': exit_date.seconds,
                                'nanoseconds': getattr(exit_date, 'nanoseconds', 0)
                            }
                        
                        if isinstance(return_date, datetime):
                            event_data['return_date'] = {
                                'seconds': int(return_date.timestamp()),
                                'nanoseconds': return_date.microsecond * 1000
                            }
                        elif hasattr(return_date, 'seconds'):
                            event_data['return_date'] = {
                                'seconds': return_date.seconds,
                                'nanoseconds': getattr(return_date, 'nanoseconds', 0)
                            }
                        
                        # Processar rota para JSON serializável
                        route = event_data.get('route')
                        if route and isinstance(route, dict):
                            start = route.get('start')
                            end = route.get('end')
                            if start and hasattr(start, 'latitude'):
                                route['start'] = {
                                    'latitude': start.latitude,
                                    'longitude': start.longitude
                                }
                            if end and hasattr(end, 'latitude'):
                                route['end'] = {
                                    'latitude': end.latitude,
                                    'longitude': end.longitude
                                }
                        
                        events.append(event_data)
                except Exception as e:
                    logger.warning(f"Erro ao buscar evento {event_id}: {e}")
                    continue
            
            # Ordenar eventos por data de saída
            events.sort(key=lambda x: x.get('exit_date', {}).get('seconds', 0), reverse=True)
            
            return jsonify({
                "success": True,
                "events": events
            })
            
        except Exception as e:
            logger.exception(f"Erro ao obter eventos participados: {e}")
            return jsonify({
                "success": False,
                "message": "Erro ao obter eventos participados"
            }), 500

    @app.route("/event/<event_id>")
    def event_detail(event_id):
        """Página de detalhes de um evento específico"""
        try:
            # Buscar o evento no Firestore
            event_ref = db.collection('events').document(event_id)
            event_doc = event_ref.get()
            
            if not event_doc.exists:
                flash('Evento não encontrado.', 'error')
                return redirect(url_for('home'))
            
            event_data = event_doc.to_dict()
            event_data['id'] = event_doc.id
            
            # Buscar dados do organizador
            if event_data.get('uid'):
                try:
                    organizer_doc = db.collection('user').document(event_data['uid']).get()
                    if organizer_doc.exists:
                        organizer_data = organizer_doc.to_dict()
                        event_data['organizer'] = {
                            'name': organizer_data.get('name', 'Organizador'),
                            'uid': event_data['uid'],
                            'profile_picture': organizer_data.get('profile_picture'),
                            'email': organizer_data.get('email'),
                            'is_organizer': organizer_data.get('isOrganizer', False)
                        }
                except Exception as e:
                    logger.exception(f"Erro ao buscar organizador: {e}")
                    event_data['organizer'] = {'name': 'Organizador', 'uid': event_data['uid']}
            else:
                event_data['organizer'] = {'name': 'Organizador', 'uid': None}
            
            # Processar rota para JSON serializável
            route = event_data.get('route')
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
                event_data['route'] = route
            
            # Incrementar contador de acessos
            try:
                event_ref.update({
                    'numAcess': firestore.Increment(1)
                })
            except Exception as e:
                logger.exception(f"Erro ao incrementar acessos: {e}")
            
            return render_template("event_detail.html", event=event_data, user=g.user)
            
        except Exception as e:
            logger.exception(f"Erro ao carregar detalhes do evento: {e}")
            flash('Erro ao carregar evento. Tente novamente.', 'error')
            return redirect(url_for('home'))

    @app.route("/edit_post/<event_id>", methods=["GET", "POST"])
    def edit_post(event_id):
        """Rota para editar um evento existente"""
        if not g.user:
            return redirect(url_for('login'))
        
        try:
            # Buscar o evento no Firestore
            event_ref = db.collection('events').document(event_id)
            event_doc = event_ref.get()
            
            if not event_doc.exists:
                flash('Evento não encontrado.', 'error')
                return redirect(url_for('my_vacations'))
            
            event_data = event_doc.to_dict()
            
            # Verificar se o usuário é o organizador do evento
            if event_data.get('uid') != g.user['uid']:
                flash('Você não tem permissão para editar este evento.', 'error')
                return redirect(url_for('my_vacations'))
            
            if request.method == "GET":
                return render_template("edit_post.html", user=g.user, event=event_data, event_id=event_id)
            
            # Processar dados do formulário (POST)
            try:
                data = request.get_json(force=True) if request.is_json else request.form
                if not data:
                    return jsonify({"success": False, "message": "Nenhum dado recebido"}), 400
                
                # Validações básicas
                if not data.get("title"):
                    return jsonify({"success": False, "message": "Título do evento é obrigatório"}), 400
                
                # Processar datas com tratamento de erro
                exit_date = None
                return_date = None
                
                if data.get("exit_date"):
                    try:
                        exit_date = datetime.fromisoformat(data["exit_date"])
                    except ValueError:
                        return jsonify({"success": False, "message": "Formato de data de saída inválido"}), 400
                
                if data.get("return_date"):
                    try:
                        return_date = datetime.fromisoformat(data["return_date"])
                    except ValueError:
                        return jsonify({"success": False, "message": "Formato de data de retorno inválido"}), 400
                
                # Processar números com tratamento de erro
                try:
                    price = float(data.get("price", 0)) if data.get("price") else 0
                    num_slots = int(data.get("numSlots", 0)) if data.get("numSlots") else 0
                    event_type = int(data.get("type", 0)) if data.get("type") else 0
                except (ValueError, TypeError):
                    return jsonify({"success": False, "message": "Valores numéricos inválidos"}), 400
                
                # Preparar dados para atualização
                update_data = {
                    "title": data.get("title"),
                    "desc": data.get("desc", ""),
                    "price": price,
                    "numSlots": num_slots,
                    "exit_date": exit_date,   
                    "return_date": return_date,
                    "type": event_type,
                    "tags": data.get("tags", []),
                    "images": data.get("image_urls", []),
                    "route": data.get("route", None),
                    "updated_at": firestore.SERVER_TIMESTAMP
                }
                
                # Atualizar o evento no Firestore
                event_ref.update(update_data)
                
                return jsonify({"success": True, "message": "Evento atualizado com sucesso!"})
                
            except Exception as e:
                logger.exception(f"Erro ao atualizar evento: {e}")
                return jsonify({"success": False, "message": "Erro ao atualizar evento"}), 500
                
        except Exception as e:
            logger.exception(f"Erro ao carregar evento para edição: {e}")
            flash('Erro ao carregar evento. Tente novamente.', 'error')
            return redirect(url_for('my_vacations'))

    # ==================== ROTAS DA IA ====================
    
    @app.route("/ai_assistant")
    def ai_assistant():
        """Página principal do assistente de IA"""
        if not g.user:
            return redirect(url_for('login'))
        
        try:
            # Buscar sugestões ativas
            suggestions = ai_data_manager.get_user_suggestions(g.user['uid'], limit=5)
            
            # Buscar insights recentes
            insights = ai_data_manager.get_user_insights(g.user['uid'], limit=3)
            
            # Buscar histórico de chat recente
            chat_history = ai_data_manager.get_user_chat_history(g.user['uid'], limit=10)
            
            return render_template("ai_assistant.html", 
                                 user=g.user, 
                                 suggestions=suggestions,
                                 insights=insights,
                                 chat_history=chat_history)
        except Exception as e:
            logger.exception(f"Erro ao carregar assistente de IA: {e}")
            flash('Erro ao carregar assistente de IA. Tente novamente.', 'error')
            return render_template("ai_assistant.html", 
                                 user=g.user, 
                                 suggestions=[],
                                 insights=[],
                                 chat_history=[])
    
    @app.route("/ai_chat", methods=["POST"])
    def ai_chat():
        """Endpoint para chat com IA"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            data = request.get_json()
            message = data.get('message', '').strip()
            
            if not message:
                return jsonify({"success": False, "message": "Mensagem vazia"}), 400
            
            # Processar mensagem com IA
            chat_response = ai_engine.process_chat_message(g.user['uid'], message)
            
            return jsonify({
                "success": True,
                "response": chat_response.response,
                "intent": chat_response.intent,
                "confidence": chat_response.confidence
            })
            
        except Exception as e:
            logger.exception(f"Erro no chat com IA: {e}")
            return jsonify({"success": False, "message": "Erro ao processar mensagem"}), 500
    
    @app.route("/ai_suggestions")
    def ai_suggestions():
        """API para buscar sugestões da IA"""
        if not g.user:
            return jsonify({"success": False, "suggestions": []}), 401
        
        try:
            limit = int(request.args.get('limit', 10))
            suggestions = ai_data_manager.get_user_suggestions(g.user['uid'], limit=limit)
            
            # Converter para formato JSON serializável
            suggestions_data = []
            for suggestion in suggestions:
                suggestion_dict = suggestion.to_dict()
                # Converter datetime para string
                suggestion_dict['created_at'] = suggestion.created_at.isoformat()
                if suggestion.expires_at:
                    suggestion_dict['expires_at'] = suggestion.expires_at.isoformat()
                suggestions_data.append(suggestion_dict)
            
            return jsonify({
                "success": True,
                "suggestions": suggestions_data
            })
            
        except Exception as e:
            logger.exception(f"Erro ao buscar sugestões: {e}")
            return jsonify({"success": False, "suggestions": []}), 500
    
    @app.route("/ai_insights")
    def ai_insights():
        """API para buscar insights da IA"""
        if not g.user:
            return jsonify({"success": False, "insights": []}), 401
        
        try:
            limit = int(request.args.get('limit', 5))
            insights = ai_data_manager.get_user_insights(g.user['uid'], limit=limit)
            
            # Converter para formato JSON serializável
            insights_data = []
            for insight in insights:
                insight_dict = insight.to_dict()
                insight_dict['created_at'] = insight.created_at.isoformat()
                insights_data.append(insight_dict)
            
            return jsonify({
                "success": True,
                "insights": insights_data
            })
            
        except Exception as e:
            logger.exception(f"Erro ao buscar insights: {e}")
            return jsonify({"success": False, "insights": []}), 500
    
    @app.route("/ai_reminders")
    def ai_reminders():
        """API para buscar lembretes da IA"""
        if not g.user:
            return jsonify({"success": False, "reminders": []}), 401
        
        try:
            reminders = ai_data_manager.get_pending_reminders(g.user['uid'])
            
            # Converter para formato JSON serializável
            reminders_data = []
            for reminder in reminders:
                reminder_dict = reminder.to_dict()
                reminder_dict['created_at'] = reminder.created_at.isoformat()
                reminder_dict['reminder_date'] = reminder.reminder_date.isoformat()
                reminders_data.append(reminder_dict)
            
            return jsonify({
                "success": True,
                "reminders": reminders_data
            })
            
        except Exception as e:
            logger.exception(f"Erro ao buscar lembretes: {e}")
            return jsonify({"success": False, "reminders": []}), 500
    
    @app.route("/ai_dismiss_suggestion", methods=["POST"])
    def ai_dismiss_suggestion():
        """Marcar sugestão como dispensada"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            data = request.get_json()
            suggestion_id = data.get('suggestion_id')
            
            if not suggestion_id:
                return jsonify({"success": False, "message": "ID da sugestão não fornecido"}), 400
            
            # Atualizar sugestão no Firestore
            suggestion_ref = db.collection('ai_suggestions').document(suggestion_id)
            suggestion_doc = suggestion_ref.get()
            
            if not suggestion_doc.exists:
                return jsonify({"success": False, "message": "Sugestão não encontrada"}), 404
            
            # Verificar se a sugestão pertence ao usuário
            suggestion_data = suggestion_doc.to_dict()
            if suggestion_data.get('user_uid') != g.user['uid']:
                return jsonify({"success": False, "message": "Acesso negado"}), 403
            
            # Marcar como dispensada
            suggestion_ref.update({
                'is_dismissed': True,
                'dismissed_at': firestore.SERVER_TIMESTAMP
            })
            
            return jsonify({"success": True, "message": "Sugestão dispensada"})
            
        except Exception as e:
            logger.exception(f"Erro ao dispensar sugestão: {e}")
            return jsonify({"success": False, "message": "Erro ao dispensar sugestão"}), 500
    
    @app.route("/ai_generate_reminders", methods=["POST"])
    def ai_generate_reminders():
        """Gerar lembretes automáticos"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            # Gerar lembretes diários
            reminders = ai_engine.generate_daily_reminders(g.user['uid'])
            
            return jsonify({
                "success": True,
                "message": f"{len(reminders)} lembretes gerados",
                "reminders_count": len(reminders)
            })
            
        except Exception as e:
            logger.exception(f"Erro ao gerar lembretes: {e}")
            return jsonify({"success": False, "message": "Erro ao gerar lembretes"}), 500
    
    @app.route("/ai_generate_insights", methods=["POST"])
    def ai_generate_insights():
        """Gerar insights semanais"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            # Gerar insights semanais
            insights = ai_engine.generate_weekly_insights(g.user['uid'])
            
            return jsonify({
                "success": True,
                "message": f"{len(insights)} insights gerados",
                "insights_count": len(insights)
            })
            
        except Exception as e:
            logger.exception(f"Erro ao gerar insights: {e}")
            return jsonify({"success": False, "message": "Erro ao gerar insights"}), 500
    
    @app.route("/ai_chat_history")
    def ai_chat_history():
        """API para buscar histórico de chat"""
        if not g.user:
            return jsonify({"success": False, "messages": []}), 401
        
        try:
            limit = int(request.args.get('limit', 20))
            chat_history = ai_data_manager.get_user_chat_history(g.user['uid'], limit=limit)
            
            # Converter para formato JSON serializável
            messages_data = []
            for message in chat_history:
                message_dict = message.to_dict()
                message_dict['created_at'] = message.created_at.isoformat()
                messages_data.append(message_dict)
            
            return jsonify({
                "success": True,
                "messages": messages_data
            })
            
        except Exception as e:
            logger.exception(f"Erro ao buscar histórico de chat: {e}")
            return jsonify({"success": False, "messages": []}), 500

    # ==================== ROTAS DE COMENTÁRIOS ====================
    
    @app.route("/api/comments/<event_id>", methods=["GET"])
    def get_comments(event_id):
        """Buscar avaliações de um evento da subcoleção avaliacoes com paginação"""
        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 5))
            offset = (page - 1) * limit
            
            # Buscar avaliações da subcoleção do evento
            event_ref = db.collection('events').document(event_id)
            avaliacoes_ref = event_ref.collection('avaliacoes')
            
            # Ordenar por data de criação (mais recentes primeiro)
            avaliacoes_query = avaliacoes_ref.order_by('createdAt', direction=firestore.Query.DESCENDING)
            
            # Aplicar paginação
            avaliacoes_query = avaliacoes_query.offset(offset).limit(limit + 1)  # +1 para verificar se há mais
            avaliacoes_docs = list(avaliacoes_query.stream())
            
            # Verificar se há mais páginas
            has_more = len(avaliacoes_docs) > limit
            if has_more:
                avaliacoes_docs = avaliacoes_docs[:limit]  # Remove o documento extra
            
            comments = []
            for doc in avaliacoes_docs:
                avaliacao_data = doc.to_dict()
                avaliacao_data['id'] = doc.id
                
                # Usar os dados já disponíveis na avaliação
                comment_data = {
                    'id': doc.id,
                    'texto': avaliacao_data.get('comment_text', ''),
                    'nota': avaliacao_data.get('nota', 0),
                    'author_name': avaliacao_data.get('username', 'Usuário Anônimo'),
                    'author_email': avaliacao_data.get('username', ''),
                    'user_id': avaliacao_data.get('user_id', ''),
                    'data_criacao': avaliacao_data.get('createdAt'),
                    'data_criacao_formatted': ''
                }
                
                # Formatar data
                if comment_data.get('data_criacao'):
                    comment_data['data_criacao_formatted'] = comment_data['data_criacao'].strftime('%d/%m/%Y às %H:%M')
                
                comments.append(comment_data)
            
            return jsonify({
                "success": True,
                "comments": comments,
                "has_more": has_more,
                "current_page": page,
                "total_comments": len(comments)
            })
            
        except Exception as e:
            logger.exception(f"Erro ao buscar comentários: {e}")
            return jsonify({"success": False, "message": "Erro ao buscar comentários"}), 500
    
    @app.route("/api/comments/<event_id>/count", methods=["GET"])
    def get_comments_count(event_id):
        """Obter contagem total de avaliações de um evento"""
        try:
            # Buscar avaliações da subcoleção do evento
            event_ref = db.collection('events').document(event_id)
            avaliacoes_ref = event_ref.collection('avaliacoes')
            avaliacoes = list(avaliacoes_ref.stream())
            count = len(avaliacoes)
            
            return jsonify({
                "success": True,
                "count": count
            })
            
        except Exception as e:
            logger.exception(f"Erro ao contar avaliações: {e}")
            return jsonify({"success": False, "count": 0}), 500
    
    @app.route("/api/comments", methods=["POST"])
    def create_comment():
        """Criar uma nova avaliação na subcoleção avaliacoes"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            data = request.get_json()
            event_id = data.get('event_id')
            texto = data.get('texto', '').strip()
            nota = data.get('nota', 5)  # Nota padrão 5 estrelas
            
            if not event_id:
                return jsonify({"success": False, "message": "ID do evento é obrigatório"}), 400
            
            if not texto or len(texto) < 1:
                return jsonify({"success": False, "message": "Texto do comentário é obrigatório"}), 400
            
            if len(texto) > 500:
                return jsonify({"success": False, "message": "Comentário muito longo (máximo 500 caracteres)"}), 400
            
            # Validar nota (1-5)
            if not isinstance(nota, int) or nota < 1 or nota > 5:
                nota = 5
            
            # Verificar se o evento existe
            event_ref = db.collection('events').document(event_id).get()
            if not event_ref.exists:
                return jsonify({"success": False, "message": "Evento não encontrado"}), 404
            
            # Criar avaliação na subcoleção
            avaliacao_data = {
                'comment_text': texto,
                'nota': nota,
                'user_id': g.user['uid'],
                'username': g.user.get('name', g.user.get('email', 'Usuário Anônimo')),
                'createdAt': datetime.utcnow()
            }
            
            # Salvar na subcoleção avaliacoes do evento
            event_doc_ref = db.collection('events').document(event_id)
            avaliacao_ref = event_doc_ref.collection('avaliacoes').document()
            avaliacao_ref.set(avaliacao_data)
            
            # Retornar dados da avaliação criada
            avaliacao_data['id'] = avaliacao_ref.id
            avaliacao_data['texto'] = avaliacao_data['comment_text']
            avaliacao_data['author_name'] = avaliacao_data['username']
            avaliacao_data['author_email'] = avaliacao_data['username']
            avaliacao_data['data_criacao'] = avaliacao_data['createdAt']
            avaliacao_data['data_criacao_formatted'] = avaliacao_data['createdAt'].strftime('%d/%m/%Y às %H:%M')
            
            return jsonify({
                "success": True,
                "message": "Avaliação criada com sucesso",
                "comment": avaliacao_data
            })
            
        except Exception as e:
            logger.exception(f"Erro ao criar avaliação: {e}")
            return jsonify({"success": False, "message": "Erro ao criar avaliação"}), 500

    # ==================== ROTAS DE FAVORITOS ====================
    
    @app.route("/api/favorites/<event_id>", methods=["POST"])
    def toggle_favorite(event_id):
        """Adicionar ou remover evento dos favoritos do usuário"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            user_uid = g.user['uid']
            
            # Verificar se o evento existe
            event_ref = db.collection('events').document(event_id).get()
            if not event_ref.exists:
                return jsonify({"success": False, "message": "Evento não encontrado"}), 404
            
            # Buscar dados do usuário
            user_ref = db.collection('user').document(user_uid)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({"success": False, "message": "Usuário não encontrado"}), 404
            
            user_data = user_doc.to_dict()
            favorite_posts = user_data.get('favoritePosts', [])
            
            # Verificar se já está favoritado
            is_favorited = event_id in favorite_posts
            
            if is_favorited:
                # Remover dos favoritos
                favorite_posts.remove(event_id)
                # Decrementar contador
                event_ref = db.collection('events').document(event_id)
                event_ref.update({
                    'favoriteCount': firestore.Increment(-1)
                })
                action = "removed"
            else:
                # Adicionar aos favoritos
                favorite_posts.append(event_id)
                # Incrementar contador
                event_ref = db.collection('events').document(event_id)
                event_ref.update({
                    'favoriteCount': firestore.Increment(1)
                })
                action = "added"
            
            # Atualizar array de favoritos do usuário
            user_ref.update({
                'favoritePosts': favorite_posts
            })
            
            return jsonify({
                "success": True,
                "action": action,
                "is_favorited": not is_favorited,
                "message": f"Evento {'adicionado aos' if action == 'added' else 'removido dos'} favoritos"
            })
            
        except Exception as e:
            logger.exception(f"Erro ao alterar favorito: {e}")
            return jsonify({"success": False, "message": "Erro ao alterar favorito"}), 500
    
    @app.route("/api/favorites/<event_id>/status", methods=["GET"])
    def get_favorite_status(event_id):
        """Verificar se o evento está favoritado pelo usuário"""
        if not g.user:
            return jsonify({"success": False, "is_favorited": False}), 401
        
        try:
            user_uid = g.user['uid']
            
            # Buscar dados do usuário
            user_ref = db.collection('user').document(user_uid)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({"success": False, "is_favorited": False}), 404
            
            user_data = user_doc.to_dict()
            favorite_posts = user_data.get('favoritePosts', [])
            is_favorited = event_id in favorite_posts
            
            return jsonify({
                "success": True,
                "is_favorited": is_favorited
            })
            
        except Exception as e:
            logger.exception(f"Erro ao verificar status do favorito: {e}")
            return jsonify({"success": False, "is_favorited": False}), 500

    # ==================== ROTAS DE EDIÇÃO E EXCLUSÃO DE MENSAGENS ====================
    
    @app.route("/api/messages/<message_id>/edit", methods=["PUT"])
    def edit_message(message_id):
        """Editar uma mensagem existente"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            data = request.get_json()
            new_text = data.get('text', '').strip()
            chat_type = data.get('chat_type', 'individual')  # 'individual' ou 'group'
            chat_id = data.get('chat_id')  # chat_uid para individual ou event_id para group
            
            if not new_text:
                return jsonify({"success": False, "message": "Texto da mensagem é obrigatório"}), 400
            
            if not chat_id:
                return jsonify({"success": False, "message": "ID do chat é obrigatório"}), 400
            
            if len(new_text) > 1000:
                return jsonify({"success": False, "message": "Mensagem muito longa (máximo 1000 caracteres)"}), 400
            
            # Buscar a mensagem
            if chat_type == 'individual':
                message_ref = db.collection("chats").document(chat_id).collection("messages").document(message_id)
            else:  # group
                message_ref = db.collection("chat-group").document(f"group_{chat_id}").collection("messages").document(message_id)
            
            logger.info(f"Buscando mensagem {message_id} no chat {chat_type} com ID {chat_id}")
            message_doc = message_ref.get()
            
            if not message_doc.exists:
                logger.error(f"Mensagem {message_id} não encontrada no chat {chat_type} com ID {chat_id}")
                return jsonify({"success": False, "message": "Mensagem não encontrada"}), 404
            
            message_data = message_doc.to_dict()
            
            # Verificar se o usuário é o autor da mensagem
            if message_data.get('uid_sender') != g.user['uid']:
                return jsonify({"success": False, "message": "Você só pode editar suas próprias mensagens"}), 403
            
            # Verificar se a mensagem não é muito antiga (máximo 1 hora)
            timestamp = message_data.get('timestamp')
            logger.info(f"Timestamp da mensagem: {timestamp}, tipo: {type(timestamp)}")
            
            if timestamp:
                try:
                    if hasattr(timestamp, 'seconds'):
                        message_time = datetime.fromtimestamp(timestamp.seconds)
                    elif isinstance(timestamp, dict) and '_seconds' in timestamp:
                        message_time = datetime.fromtimestamp(timestamp['_seconds'])
                    elif isinstance(timestamp, datetime):
                        message_time = timestamp
                    else:
                        message_time = datetime.now()  # Fallback
                    
                    time_diff = datetime.now() - message_time
                    logger.info(f"Diferença de tempo: {time_diff.total_seconds()} segundos")
                    
                    if time_diff.total_seconds() > 3600:  # 1 hora
                        return jsonify({"success": False, "message": "Não é possível editar mensagens com mais de 1 hora"}), 400
                except Exception as time_error:
                    logger.error(f"Erro ao processar timestamp: {time_error}")
                    # Continuar sem validação de tempo em caso de erro
            
            # Atualizar a mensagem
            message_ref.update({
                'text': new_text,
                'edited': True,
                'edited_at': firestore.SERVER_TIMESTAMP
            })
            
            return jsonify({
                "success": True,
                "message": "Mensagem editada com sucesso",
                "new_text": new_text
            })
            
        except Exception as e:
            logger.exception(f"Erro ao editar mensagem: {e}")
            return jsonify({"success": False, "message": "Erro ao editar mensagem"}), 500
    
    @app.route("/api/messages/<message_id>/delete", methods=["DELETE"])
    def delete_message(message_id):
        """Excluir uma mensagem existente"""
        if not g.user:
            return jsonify({"success": False, "message": "Usuário não logado"}), 401
        
        try:
            data = request.get_json()
            chat_type = data.get('chat_type', 'individual')  # 'individual' ou 'group'
            chat_id = data.get('chat_id')  # chat_uid para individual ou event_id para group
            
            if not chat_id:
                return jsonify({"success": False, "message": "ID do chat é obrigatório"}), 400
            
            # Buscar a mensagem
            if chat_type == 'individual':
                message_ref = db.collection("chats").document(chat_id).collection("messages").document(message_id)
            else:  # group
                message_ref = db.collection("chat-group").document(f"group_{chat_id}").collection("messages").document(message_id)
            
            logger.info(f"Buscando mensagem {message_id} para exclusão no chat {chat_type} com ID {chat_id}")
            message_doc = message_ref.get()
            
            if not message_doc.exists:
                logger.error(f"Mensagem {message_id} não encontrada para exclusão no chat {chat_type} com ID {chat_id}")
                return jsonify({"success": False, "message": "Mensagem não encontrada"}), 404
            
            message_data = message_doc.to_dict()
            
            # Verificar se o usuário é o autor da mensagem
            if message_data.get('uid_sender') != g.user['uid']:
                return jsonify({"success": False, "message": "Você só pode excluir suas próprias mensagens"}), 403
            
            # Verificar se a mensagem não é muito antiga (máximo 1 hora)
            timestamp = message_data.get('timestamp')
            logger.info(f"Timestamp da mensagem para exclusão: {timestamp}, tipo: {type(timestamp)}")
            
            if timestamp:
                try:
                    if hasattr(timestamp, 'seconds'):
                        message_time = datetime.fromtimestamp(timestamp.seconds)
                    elif isinstance(timestamp, dict) and '_seconds' in timestamp:
                        message_time = datetime.fromtimestamp(timestamp['_seconds'])
                    elif isinstance(timestamp, datetime):
                        message_time = timestamp
                    else:
                        message_time = datetime.now()  # Fallback
                    
                    time_diff = datetime.now() - message_time
                    logger.info(f"Diferença de tempo para exclusão: {time_diff.total_seconds()} segundos")
                    
                    if time_diff.total_seconds() > 3600:  # 1 hora
                        return jsonify({"success": False, "message": "Não é possível excluir mensagens com mais de 1 hora"}), 400
                except Exception as time_error:
                    logger.error(f"Erro ao processar timestamp para exclusão: {time_error}")
                    # Continuar sem validação de tempo em caso de erro
            
            # Excluir a mensagem
            message_ref.delete()
            
            return jsonify({
                "success": True,
                "message": "Mensagem excluída com sucesso"
            })
            
        except Exception as e:
            logger.exception(f"Erro ao excluir mensagem: {e}")
            return jsonify({"success": False, "message": "Erro ao excluir mensagem"}), 500

    # ==================== ROTAS DE AVALIAÇÕES ====================
    
    @app.route("/api/events/<event_id>/rating", methods=["GET"])
    def get_event_rating(event_id):
        """Calcular média das avaliações de um evento"""
        try:
            # Buscar todas as avaliações da subcoleção do evento
            event_ref = db.collection('events').document(event_id)
            avaliacoes_ref = event_ref.collection('avaliacoes')
            avaliacoes_docs = list(avaliacoes_ref.stream())
            
            if not avaliacoes_docs:
                return jsonify({
                    "success": True,
                    "average_rating": 0,
                    "total_ratings": 0,
                    "stars": [0, 0, 0, 0, 0]
                })
            
            # Calcular média das notas
            total_notas = 0
            count = 0
            
            for doc in avaliacoes_docs:
                avaliacao_data = doc.to_dict()
                nota = avaliacao_data.get('nota', 0)
                if nota > 0:  # Só conta notas válidas
                    total_notas += nota
                    count += 1
            
            if count == 0:
                average_rating = 0
            else:
                average_rating = round(total_notas / count, 1)
            
            # Converter para array de estrelas (0-5)
            stars = []
            full_stars = int(average_rating)
            has_half_star = (average_rating - full_stars) >= 0.5
            
            for i in range(5):
                if i < full_stars:
                    stars.append(1)  # Estrela cheia
                elif i == full_stars and has_half_star:
                    stars.append(0.5)  # Meia estrela
                else:
                    stars.append(0)  # Estrela vazia
            
            return jsonify({
                "success": True,
                "average_rating": average_rating,
                "total_ratings": count,
                "stars": stars
            })
            
        except Exception as e:
            logger.exception(f"Erro ao calcular avaliação do evento: {e}")
            return jsonify({"success": False, "message": "Erro ao calcular avaliação"}), 500