from flask_login import UserMixin
from firebase_admin import firestore
from datetime import datetime
from werkzeug.security import generate_password_hash
import firebase_admin
from firebase_admin import auth

# Helper para acessar o Firestore
def get_db():
    return firebase_admin.firestore.client()

# Classe de usuário para o Flask-Login
class FirebaseUser(UserMixin):
    def __init__(self, uid, user_data=None):
        self.uid = uid
        self.id = uid  # Necessário para Flask-Login
        self.user_data = user_data or {}
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
        
        # Atributos básicos
        self.email = self.user_data.get('email', '')
        self.nome = self.user_data.get('nome', '')
        self.tipo = self.user_data.get('tipo', 'comum')
        self.telefone = self.user_data.get('telefone', '')
        self.cpf = self.user_data.get('cpf', '')
    
    def get_id(self):
        return self.uid
    
    @classmethod
    def get(cls, uid):
        """Busca usuário pelo UID do Firebase"""
        try:
            db = get_db()
            user_ref = db.collection('usuarios').document(uid)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                return cls(uid, user_doc.to_dict())
            return None
        except Exception as e:
            print(f"Erro ao buscar usuário: {e}")
            return None
    
    @classmethod
    def create_from_firebase(cls, firebase_user, form_data):
        """Cria um usuário no Firestore a partir de dados do Firebase"""
        try:
            db = get_db()
            
            user_data = {
                'nome': form_data.name.data,
                'email': firebase_user.email,
                'telefone': form_data.phone.data,
                'cpf': form_data.cpf.data,
                'tipo': 'organizador' if form_data.is_organizer.data else 'comum',
                'data_criacao': datetime.utcnow()
            }
            
            # Salva no Firestore
            db.collection('usuarios').document(firebase_user.uid).set(user_data)
            
            # Se for organizador, cria dados adicionais
            if form_data.is_organizer.data:
                organizador_data = {
                    'nome_empresa': form_data.company_name.data,
                    'cnpj': form_data.cnpj.data,
                    'endereco': form_data.address.data,
                    'descricao': form_data.company_description.data,
                    'id_usuario': firebase_user.uid,
                    'data_criacao': datetime.utcnow()
                }
                db.collection('organizadores').document(firebase_user.uid).set(organizador_data)
            
            return cls(firebase_user.uid, user_data)
            
        except Exception as e:
            print(f"Erro ao criar usuário: {e}")
            raise

# Classes de dados (não são modelos de banco, apenas estruturas)
class Organizador:
    def __init__(self, data):
        self.id = data.get('id')
        self.nome_empresa = data.get('nome_empresa')
        self.cnpj = data.get('cnpj')
        self.endereco = data.get('endereco')
        self.descricao = data.get('descricao')
        self.id_usuario = data.get('id_usuario')

class Evento:
    def __init__(self, data):
        self.id = data.get('id')
        self.destino = data.get('destino')
        self.descricao = data.get('descricao')
        self.data_de_saida = data.get('data_de_saida')
        self.data_de_retorno = data.get('data_de_retorno')
        self.local_saida = data.get('local_saida')
        self.n_vagas = data.get('n_vagas')
        self.preco = data.get('preco')
        self.n_favoritos = data.get('n_favoritos', 0)
        self.n_acessos = data.get('n_acessos', 0)
        self.data_criacao = data.get('data_criacao')
        self.id_organizador = data.get('id_organizador')

class Reserva:
    def __init__(self, data):
        self.id = data.get('id')
        self.status = data.get('status', 'pendente')
        self.data_de_reserva = data.get('data_de_reserva')
        self.id_usuario = data.get('id_usuario')
        self.id_evento = data.get('id_evento')

class Favorito:
    def __init__(self, data):
        self.id = data.get('id')
        self.id_usuario = data.get('id_usuario')
        self.id_evento = data.get('id_evento')
        self.data_adicionado = data.get('data_adicionado')

class ComentarioEvento:
    def __init__(self, data):
        self.id = data.get('id')
        self.id_evento = data.get('id_evento')
        self.id_usuario = data.get('id_usuario')
        self.texto = data.get('texto')
        self.data_criacao = data.get('data_criacao')

class Mensagem:
    def __init__(self, data):
        self.id = data.get('id')
        self.id_remetente = data.get('id_remetente')
        self.id_destinatario = data.get('id_destinatario')
        self.texto = data.get('texto')
        self.data_envio = data.get('data_envio')
        self.lida = data.get('lida', False)

# Funções auxiliares para operações comuns
class FirestoreHelper:
    @staticmethod
    def get_user(uid):
        """Busca usuário pelo UID"""
        return FirebaseUser.get(uid)
    
    @staticmethod
    def get_organizador(uid):
        """Busca organizador pelo UID do usuário"""
        try:
            db = get_db()
            org_ref = db.collection('organizadores').document(uid)
            org_doc = org_ref.get()
            
            if org_doc.exists:
                data = org_doc.to_dict()
                data['id'] = uid
                return Organizador(data)
            return None
        except Exception as e:
            print(f"Erro ao buscar organizador: {e}")
            return None
    
    @staticmethod
    def get_evento(evento_id):
        """Busca evento pelo ID"""
        try:
            db = get_db()
            evento_ref = db.collection('eventos').document(evento_id)
            evento_doc = evento_ref.get()
            
            if evento_doc.exists:
                data = evento_doc.to_dict()
                data['id'] = evento_id
                return Evento(data)
            return None
        except Exception as e:
            print(f"Erro ao buscar evento: {e}")
            return None
    
    @staticmethod
    def get_eventos(limit=100, order_by='data_de_saida'):
        """Busca lista de eventos"""
        try:
            db = get_db()
            eventos_ref = db.collection('eventos').order_by(order_by).limit(limit).stream()
            
            eventos = []
            for evento in eventos_ref:
                data = evento.to_dict()
                data['id'] = evento.id
                eventos.append(Evento(data))
            
            return eventos
        except Exception as e:
            print(f"Erro ao buscar eventos: {e}")
            return []
    
    @staticmethod
    def create_evento(evento_data, organizador_uid):
        """Cria um novo evento"""
        try:
            db = get_db()
            
            evento_data.update({
                'id_organizador': organizador_uid,
                'data_criacao': datetime.utcnow(),
                'n_favoritos': 0,
                'n_acessos': 0
            })
            
            # Adiciona ao Firestore
            evento_ref = db.collection('eventos').document()
            evento_ref.set(evento_data)
            
            return evento_ref.id
        except Exception as e:
            print(f"Erro ao criar evento: {e}")
            raise
    
    @staticmethod
    def create_reserva(reserva_data):
        """Cria uma nova reserva"""
        try:
            db = get_db()
            
            reserva_data.update({
                'data_de_reserva': datetime.utcnow(),
                'status': 'pendente'
            })
            
            # Adiciona ao Firestore
            reserva_ref = db.collection('reservas').document()
            reserva_ref.set(reserva_data)
            
            return reserva_ref.id
        except Exception as e:
            print(f"Erro ao criar reserva: {e}")
            raise
    
    @staticmethod
    def create_comentario(comentario_data):
        """Cria um novo comentário"""
        try:
            db = get_db()
            
            comentario_data.update({
                'data_criacao': datetime.utcnow()
            })
            
            # Adiciona ao Firestore
            comentario_ref = db.collection('comentarios').document()
            comentario_ref.set(comentario_data)
            
            return comentario_ref.id
        except Exception as e:
            print(f"Erro ao criar comentário: {e}")
            raise