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