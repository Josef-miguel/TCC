from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from models.database import db, Usuario, Evento, Organizador, Reserva, Favorito, ComentarioEvento, Mensagem
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from forms import (FirebaseRegistrationForm, FirebaseLoginForm, PerfilForm, 
                  SenhaForm, OrganizadorForm, EventoForm, ComentarioForm, MensagemForm)
from flask_login import UserMixin
from flask import current_app
import firebase_admin
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError
import logging
from app import db, login_manager

from flask_login import LoginManager


# Configura o user_loader
@login_manager.user_loader
def load_user(user_id):
    from models.database import Usuario  # Importação local para evitar circular
    return Usuario.query.get(int(user_id))

routes = Blueprint('routes', __name__)




# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================
# Rotas de Autenticação com Firebase
# =============================================



@routes.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('routes.dashboard'))

    form = FirebaseLoginForm()

    if form.validate_on_submit():
        try:
            # Autenticar com Firebase
            firebase_user = auth.get_user_by_email(form.email.data)
            
            # Verificar se usuário existe localmente
            user = Usuario.query.filter_by(firebase_uid=firebase_user.uid).first()
            
            if user:
                login_user(user, remember=form.remember.data)
                flash('Login realizado com sucesso!', 'success')
                next_page = request.args.get('next')
                return redirect(next_page or url_for('routes.dashboard'))
            else:
                flash('Usuário não cadastrado no sistema', 'error')
                
        except auth.UserNotFoundError:
            flash('E-mail não cadastrado', 'error')
        except FirebaseError as e:
            logger.error(f"Firebase error: {str(e)}")
            flash('Erro ao autenticar. Tente novamente.', 'error')
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            flash('Erro interno no servidor', 'error')

    return render_template('login.html', form=form)

@routes.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('routes.dashboard'))

    form = FirebaseRegistrationForm()

    if form.validate_on_submit():
        try:
            # 1. Criar usuário no Firebase
            firebase_user = auth.create_user(
                email=form.email.data,
                password=form.password.data,
                display_name=form.name.data
            )
            
            # 2. Criar usuário no banco local
            new_user = Usuario(
                nome=form.name.data,
                email=form.email.data,
                telefone=form.phone.data,
                cpf=form.cpf.data,
                senha=generate_password_hash(form.password.data),
                tipo='organizador' if form.is_organizer.data else 'comum',
                firebase_uid=firebase_user.uid
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            # 3. Se for organizador, criar registro na tabela Organizador
            if form.is_organizer.data:
                organizador = Organizador(
                    nome_empresa=form.company_name.data,
                    cnpj=form.cnpj.data,
                    endereco=form.address.data,
                    descricao=form.company_description.data,
                    id_usuario=new_user.id_usuario
                )
                db.session.add(organizador)
                db.session.commit()
            
            flash('Cadastro realizado com sucesso!', 'success')
            return redirect(url_for('routes.login'))
            
        except auth.EmailAlreadyExistsError:
            db.session.rollback()
            flash('E-mail já cadastrado', 'error')
        except IntegrityError:
            db.session.rollback()
            flash('CPF ou CNPJ já cadastrado', 'error')
        except FirebaseError as e:
            db.session.rollback()
            logger.error(f"Firebase error: {str(e)}")
            flash(f'Erro ao cadastrar: {str(e)}', 'error')
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error: {str(e)}")
            flash('Erro interno no servidor', 'error')

    return render_template('register.html', form=form)

@routes.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('routes.home'))

# =============================================
# API para Login com Firebase
# =============================================

@routes.route('/api/login', methods=['POST'])
def api_login():
    if current_user.is_authenticated:
        return jsonify({'success': True, 'redirect': url_for('routes.dashboard')})

    id_token = request.json.get('token')
    if not id_token:
        return jsonify({'success': False, 'message': 'Token não fornecido'}), 400

    try:
        # Verificar token JWT do Firebase
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Buscar usuário no banco local
        user = Usuario.query.filter_by(firebase_uid=uid).first()
        
        if user:
            login_user(user)
            return jsonify({
                'success': True,
                'redirect': url_for('routes.dashboard'),
                'user': {
                    'id': user.id_usuario,
                    'name': user.nome,
                    'email': user.email,
                    'type': user.tipo
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Usuário não encontrado no sistema'
            }), 404
            
    except auth.ExpiredIdTokenError:
        return jsonify({'success': False, 'message': 'Token expirado'}), 401
    except auth.InvalidIdTokenError:
        return jsonify({'success': False, 'message': 'Token inválido'}), 401
    except Exception as e:
        logger.error(f"API login error: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro interno no servidor'}), 500

# =============================================
# Rotas Principais
# =============================================

@routes.route('/')
def home():
    try:
        eventos = Evento.query.options(db.joinedload(Evento.organizador))\
            .order_by(Evento.data_de_saida.asc()).all()
        return render_template('home.html', eventos=eventos)
    except Exception as e:
        logger.error(f"Home error: {str(e)}")
        flash('Erro ao carregar eventos. Tente novamente.', 'error')
        return render_template('home.html', eventos=[])

@routes.route('/dashboard')
@login_required
def dashboard():
    if current_user.tipo == 'organizador':
        organizador = Organizador.query.filter_by(id_usuario=current_user.id_usuario).first()
        if not organizador:
            flash('Complete seu perfil de organizador primeiro', 'error')
            return redirect(url_for('routes.perfil'))
            
        eventos = Evento.query.filter_by(id_organizador=organizador.id_organizador)\
            .order_by(Evento.data_de_saida.desc()).all()
        return render_template('dashboard_organizador.html', eventos=eventos)
    
    # Usuário comum
    reservas = Reserva.query.filter_by(id_usuario=current_user.id_usuario)\
        .options(db.joinedload(Reserva.evento)).all()
    return render_template('dashboard_usuario.html', reservas=reservas)

@routes.route('/evento/<int:id_evento>')
def detalhes_evento(id_evento):
    evento = Evento.query.options(
        db.joinedload(Evento.organizador),
        db.joinedload(Evento.comentarios).joinedload(ComentarioEvento.usuario)
    ).get_or_404(id_evento)
    
    form = ComentarioForm()
    return render_template('detalhes_evento.html', evento=evento, form=form)




# =============================================
# Error Handlers
# =============================================

@routes.app_errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@routes.app_errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500








from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify, current_app
from flask_login import login_user, login_required, logout_user, current_user
from datetime import datetime
import logging
import firebase_admin
from firebase_admin import auth, firestore
from firebase_admin.exceptions import FirebaseError
from werkzeug.security import generate_password_hash
from forms import (
    FirebaseRegistrationForm, FirebaseLoginForm, PerfilForm, 
    SenhaForm, OrganizadorForm, EventoForm, ComentarioForm, MensagemForm
)

# Configuração básica
routes = Blueprint('routes', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper para acessar o Firestore
def get_db():
    return firebase_admin.firestore.client()

# Classe de usuário para o Flask-Login
class FirebaseUser:
    def __init__(self, uid, user_data):
        self.uid = uid
        self.id = uid  # Necessário para Flask-Login
        self.email = user_data.get('email')
        self.nome = user_data.get('nome')
        self.tipo = user_data.get('tipo', 'comum')
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
    
    def get_id(self):
        return self.uid

# =============================================
# Rotas de Autenticação com Firebase
# =============================================

@routes.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('routes.dashboard'))

    form = FirebaseLoginForm()

    if form.validate_on_submit():
        try:
            # Autenticar com Firebase
            firebase_user = auth.get_user_by_email(form.email.data)
            db = get_db()
            
            # Buscar dados do usuário no Firestore
            user_ref = db.collection('usuarios').document(firebase_user.uid)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user = FirebaseUser(firebase_user.uid, user_doc.to_dict())
                login_user(user, remember=form.remember.data)
                flash('Login realizado com sucesso!', 'success')
                next_page = request.args.get('next')
                return redirect(next_page or url_for('routes.dashboard'))
            else:
                flash('Usuário não cadastrado no sistema', 'error')
                
        except auth.UserNotFoundError:
            flash('E-mail não cadastrado', 'error')
        except FirebaseError as e:
            logger.error(f"Firebase error: {str(e)}")
            flash('Erro ao autenticar. Tente novamente.', 'error')
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            flash('Erro interno no servidor', 'error')

    return render_template('login.html', form=form)

@routes.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('routes.dashboard'))

    form = FirebaseRegistrationForm()

    if form.validate_on_submit():
        try:
            db = get_db()
            
            # 1. Criar usuário no Firebase Auth
            firebase_user = auth.create_user(
                email=form.email.data,
                password=form.password.data,
                display_name=form.name.data
            )
            
            # 2. Criar documento do usuário no Firestore
            user_data = {
                'nome': form.name.data,
                'email': form.email.data,
                'telefone': form.phone.data,
                'cpf': form.cpf.data,
                'tipo': 'organizador' if form.is_organizer.data else 'comum',
                'data_criacao': datetime.utcnow()
            }
            
            db.collection('usuarios').document(firebase_user.uid).set(user_data)
            
            # 3. Se for organizador, criar dados adicionais
            if form.is_organizer.data:
                organizador_data = {
                    'nome_empresa': form.company_name.data,
                    'cnpj': form.cnpj.data,
                    'endereco': form.address.data,
                    'descricao': form.company_description.data,
                    'id_usuario': firebase_user.uid
                }
                db.collection('organizadores').document(firebase_user.uid).set(organizador_data)
            
            flash('Cadastro realizado com sucesso!', 'success')
            return redirect(url_for('routes.login'))
            
        except auth.EmailAlreadyExistsError:
            flash('E-mail já cadastrado', 'error')
        except FirebaseError as e:
            logger.error(f"Firebase error: {str(e)}")
            flash(f'Erro ao cadastrar: {str(e)}', 'error')
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            flash('Erro interno no servidor', 'error')

    return render_template('register.html', form=form)

@routes.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('routes.home'))

# =============================================
# Rotas Principais
# =============================================

@routes.route('/')
def home():
    try:
        db = get_db()
        eventos_ref = db.collection('eventos').order_by('data_de_saida').stream()
        
        eventos = []
        for evento in eventos_ref:
            event_data = evento.to_dict()
            event_data['id'] = evento.id
            # Busca informações do organizador
            if 'id_organizador' in event_data:
                org_ref = db.collection('organizadores').document(event_data['id_organizador'])
                org_data = org_ref.get().to_dict()
                event_data['organizador'] = org_data
            
            eventos.append(event_data)
            
        return render_template('home.html', eventos=eventos)
    except Exception as e:
        logger.error(f"Home error: {str(e)}")
        flash('Erro ao carregar eventos. Tente novamente.', 'error')
        return render_template('home.html', eventos=[])

@routes.route('/dashboard')
@login_required
def dashboard():
    db = get_db()
    
    if current_user.tipo == 'organizador':
        # Dashboard para organizador
        eventos_ref = db.collection('eventos').where('id_organizador', '==', current_user.uid).stream()
        
        eventos = []
        for evento in eventos_ref:
            event_data = evento.to_dict()
            event_data['id'] = evento.id
            eventos.append(event_data)
            
        return render_template('dashboard_organizador.html', eventos=eventos)
    else:
        # Dashboard para usuário comum
        reservas_ref = db.collection('reservas').where('id_usuario', '==', current_user.uid).stream()
        
        reservas = []
        for reserva in reservas_ref:
            reserva_data = reserva.to_dict()
            reserva_data['id'] = reserva.id
            # Busca dados do evento
            event_ref = db.collection('eventos').document(reserva_data['id_evento'])
            event_data = event_ref.get().to_dict()
            reserva_data['evento'] = event_data
            reservas.append(reserva_data)
            
        return render_template('dashboard_usuario.html', reservas=reservas)

# ... (continuar com as outras rotas adaptadas para Firestore)
@routes.route('/evento/<int:id_evento>/comentar', methods=['POST'])
@login_required
def comentar_evento(id_evento):
    form = ComentarioForm()
    
    if form.validate_on_submit():
        try:
            comentario = ComentarioEvento(
                id_evento=id_evento,
                id_usuario=current_user.id_usuario,
                texto=form.texto.data
            )
            db.session.add(comentario)
            db.session.commit()
            flash('Comentário adicionado com sucesso!', 'success')
        except Exception as e:
            db.session.rollback()
            logger.error(f"Erro ao adicionar comentário: {str(e)}")
            flash('Erro ao adicionar comentário', 'error')
    
    return redirect(url_for('routes.detalhes_evento', id_evento=id_evento))

# =============================================
# Rotas de Mensagens
# =============================================

@routes.route('/mensagens')
@login_required
def mensagens():
    # Obter todas as conversas do usuário
    conversas = db.session.query(
        Mensagem,
        Usuario
    ).join(
        Usuario,
        or_(
            Mensagem.id_remetente == Usuario.id_usuario,
            Mensagem.id_destinatario == Usuario.id_usuario
        )
    ).filter(
        or_(
            Mensagem.id_remetente == current_user.id_usuario,
            Mensagem.id_destinatario == current_user.id_usuario
        ),
        Usuario.id_usuario != current_user.id_usuario
    ).group_by(Usuario.id_usuario).all()
    
    return render_template('mensagens.html', conversas=conversas)

@routes.route('/mensagens/<int:id_usuario>', methods=['GET', 'POST'])
@login_required
def conversa(id_usuario):
    outro_usuario = Usuario.query.get_or_404(id_usuario)
    form = MensagemForm()
    
    if form.validate_on_submit():
        try:
            mensagem = Mensagem(
                id_remetente=current_user.id_usuario,
                id_destinatario=id_usuario,
                texto=form.texto.data
            )
            db.session.add(mensagem)
            db.session.commit()
            return redirect(url_for('routes.conversa', id_usuario=id_usuario))
        except Exception as e:
            db.session.rollback()
            logger.error(f"Erro ao enviar mensagem: {str(e)}")
            flash('Erro ao enviar mensagem', 'error')
    
    # Obter histórico de mensagens
    mensagens = Mensagem.query.filter(
        or_(
            (Mensagem.id_remetente == current_user.id_usuario) & (Mensagem.id_destinatario == id_usuario),
            (Mensagem.id_remetente == id_usuario) & (Mensagem.id_destinatario == current_user.id_usuario)
        )
    ).order_by(Mensagem.data_envio.asc()).all()
    
    return render_template('conversa.html', 
                         outro_usuario=outro_usuario, 
                         mensagens=mensagens, 
                         form=form)

# =============================================
# Rotas de Perfil
# =============================================

@routes.route('/perfil', methods=['GET', 'POST'])
@login_required
def perfil():
    form = PerfilForm(obj=current_user)
    senha_form = SenhaForm()
    org_form = OrganizadorForm()

    if current_user.tipo == 'organizador':
        organizador = Organizador.query.filter_by(id_usuario=current_user.id_usuario).first()
        if organizador and request.method == 'GET':
            org_form = OrganizadorForm(obj=organizador)
    else:
        organizador = None

    reservas = Reserva.query.filter_by(id_usuario=current_user.id_usuario)\
        .options(db.joinedload(Reserva.evento))\
        .order_by(Reserva.data_de_reserva.desc())\
        .all()

    stats = {
        'total_eventos': 0,
        'total_reservas': 0,
        'faturamento_total': 0
    }

    if organizador:
        stats['total_eventos'] = Evento.query.filter_by(id_organizador=organizador.id_organizador).count()
        
        eventos_ids = [e.id_evento for e in Evento.query.filter_by(id_organizador=organizador.id_organizador).all()]
        stats['total_reservas'] = Reserva.query.filter(Reserva.id_evento.in_(eventos_ids)).count()
        
        faturamento = db.session.query(
            db.func.sum(Evento.preco)
        ).join(Reserva).filter(
            Reserva.id_evento.in_(eventos_ids),
            Reserva.status == 'confirmado'
        ).scalar()
        
        stats['faturamento_total'] = faturamento if faturamento else 0

    if form.validate_on_submit():
        try:
            form.populate_obj(current_user)
            db.session.commit()
            flash('Perfil atualizado com sucesso!', 'success')
            return redirect(url_for('routes.perfil'))
        except Exception as e:
            db.session.rollback()
            logger.error(f"Perfil update error: {str(e)}")
            flash(f'Erro ao atualizar perfil: {str(e)}', 'error')

    return render_template(
        'perfil.html',
        form=form,
        senha_form=senha_form,
        org_form=org_form,
        reservas=reservas,
        organizador=organizador,
        **stats
    )

# =============================================
# Rotas de Eventos (Organizador)
# =============================================

@routes.route('/evento/novo', methods=['GET', 'POST'])
@login_required
def novo_evento():
    if current_user.tipo != 'organizador':
        flash('Apenas organizadores podem criar eventos', 'error')
        return redirect(url_for('routes.dashboard'))

    organizador = Organizador.query.filter_by(id_usuario=current_user.id_usuario).first()
    if not organizador:
        flash('Complete seu perfil de organizador primeiro', 'error')
        return redirect(url_for('routes.perfil'))

    form = EventoForm()

    if form.validate_on_submit():
        try:
            evento = Evento(
                nome=form.nome.data,
                descricao=form.descricao.data,
                local=form.local.data,
                data_de_saida=form.data_de_saida.data,
                data_de_retorno=form.data_de_retorno.data,
                preco=form.preco.data,
                vagas=form.vagas.data,
                id_organizador=organizador.id_organizador
            )
            db.session.add(evento)
            db.session.commit()
            flash('Evento criado com sucesso!', 'success')
            return redirect(url_for('routes.dashboard'))
        except Exception as e:
            db.session.rollback()
            logger.error(f"Erro ao criar evento: {str(e)}")
            flash('Erro ao criar evento', 'error')

    return render_template('novo_evento.html', form=form)

# =============================================
# Rotas de Reservas
# =============================================

@routes.route('/evento/<int:id_evento>/reservar', methods=['POST'])
@login_required
def reservar_evento(id_evento):
    evento = Evento.query.get_or_404(id_evento)
    
    try:
        # Verificar se já existe reserva
        reserva_existente = Reserva.query.filter_by(
            id_evento=id_evento,
            id_usuario=current_user.id_usuario
        ).first()
        
        if reserva_existente:
            flash('Você já possui uma reserva para este evento', 'warning')
            return redirect(url_for('routes.detalhes_evento', id_evento=id_evento))
        
        # Criar nova reserva
        reserva = Reserva(
            id_evento=id_evento,
            id_usuario=current_user.id_usuario,
            data_de_reserva=datetime.utcnow(),
            status='pendente'
        )
        
        db.session.add(reserva)
        db.session.commit()
        flash('Reserva realizada com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao reservar evento: {str(e)}")
        flash('Erro ao realizar reserva', 'error')
    
    return redirect(url_for('routes.detalhes_evento', id_evento=id_evento))

# =============================================
# Rotas de Favoritos
# =============================================

@routes.route('/evento/<int:id_evento>/favoritar', methods=['POST'])
@login_required
def favoritar_evento(id_evento):
    evento = Evento.query.get_or_404(id_evento)
    
    try:
        # Verificar se já é favorito
        favorito_existente = Favorito.query.filter_by(
            id_evento=id_evento,
            id_usuario=current_user.id_usuario
        ).first()
        
        if favorito_existente:
            db.session.delete(favorito_existente)
            db.session.commit()
            flash('Evento removido dos favoritos', 'success')
        else:
            # Adicionar aos favoritos
            favorito = Favorito(
                id_evento=id_evento,
                id_usuario=current_user.id_usuario
            )
            db.session.add(favorito)
            db.session.commit()
            flash('Evento adicionado aos favoritos!', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao favoritar evento: {str(e)}")
        flash('Erro ao favoritar evento', 'error')
    
    return redirect(url_for('routes.detalhes_evento', id_evento=id_evento))


# =============================================
# Rotas de Eventos
# =============================================

@routes.route('/evento/<evento_id>')
def detalhes_evento(evento_id):
    try:
        db = get_db()
        evento_ref = db.collection('eventos').document(evento_id)
        evento = evento_ref.get().to_dict()
        
        if not evento:
            flash('Evento não encontrado', 'error')
            return redirect(url_for('routes.home'))
        
        evento['id'] = evento_id
        
        # Busca organizador
        org_ref = db.collection('organizadores').document(evento['id_organizador'])
        evento['organizador'] = org_ref.get().to_dict()
        
        # Busca comentários
        comentarios_ref = db.collection('comentarios').where('id_evento', '==', evento_id).stream()
        comentarios = []
        for comentario in comentarios_ref:
            comentario_data = comentario.to_dict()
            comentario_data['id'] = comentario.id
            # Busca usuário que fez o comentário
            user_ref = db.collection('usuarios').document(comentario_data['id_usuario'])
            comentario_data['usuario'] = user_ref.get().to_dict()
            comentarios.append(comentario_data)
        
        form = ComentarioForm()
        return render_template('detalhes_evento.html', evento=evento, comentarios=comentarios, form=form)
    
    except Exception as e:
        logger.error(f"Detalhes evento error: {str(e)}")
        flash('Erro ao carregar evento', 'error')
        return redirect(url_for('routes.home'))

# =============================================
# API Routes
# =============================================

@routes.route('/api/eventos')
def api_eventos():
    eventos = Evento.query.all()
    return jsonify([{
        'id': e.id_evento,
        'nome': e.nome,
        'descricao': e.descricao,
        'local': e.local,
        'data': e.data_de_saida.strftime('%Y-%m-%d'),
        'preco': float(e.preco),
        'vagas': e.vagas,
        'organizador': e.organizador.nome_empresa
    } for e in eventos])

@routes.route('/api/comentarios/<int:id_evento>')
def api_comentarios(id_evento):
    comentarios = ComentarioEvento.query.filter_by(id_evento=id_evento)\
        .join(Usuario).all()
    return jsonify([{
        'id': c.id_comentario,
        'texto': c.texto,
        'data': c.data_criacao.strftime('%d/%m/%Y %H:%M'),
        'usuario': {
            'id': c.usuario.id_usuario,
            'nome': c.usuario.nome
        }
    } for c in comentarios])

@routes.route('/api/mensagens/<int:id_usuario>')
@login_required
def api_mensagens(id_usuario):
    mensagens = Mensagem.query.filter(
        or_(
            (Mensagem.id_remetente == current_user.id_usuario) & (Mensagem.id_destinatario == id_usuario),
            (Mensagem.id_remetente == id_usuario) & (Mensagem.id_destinatario == current_user.id_usuario)
        )
    ).order_by(Mensagem.data_envio.asc()).all()
    
    return jsonify([{
        'id': m.id_mensagem,
        'texto': m.texto,
        'data': m.data_envio.strftime('%d/%m/%Y %H:%M'),
        'remetente': m.id_remetente == current_user.id_usuario,
        'lida': m.lida
    } for m in mensagens])

# =============================================
# Error Handlers
# =============================================

@routes.app_errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@routes.app_errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500