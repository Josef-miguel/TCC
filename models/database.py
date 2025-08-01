from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class Usuario(db.Model, UserMixin):
    __tablename__ = 'usuario'
    
    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    telefone = db.Column(db.String(20))
    senha = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), nullable=False, unique=True)
    tipo = db.Column(db.String(50))  # 'comum' ou 'organizador'

    # Relacionamentos
    organizador = db.relationship('Organizador', back_populates='usuario', uselist=False, cascade='all, delete-orphan')
    reservas = db.relationship('Reserva', back_populates='usuario', cascade='all, delete-orphan')
    avaliacoes = db.relationship('Avaliacao', back_populates='usuario', cascade='all, delete-orphan')
    mensagens = db.relationship('ChatSuporte', back_populates='usuario', cascade='all, delete-orphan')
    
    # Relacionamento com eventos favoritos (usando a tabela Favorito)
    favoritos = db.relationship('Favorito', back_populates='usuario', cascade='all, delete-orphan')

    def get_id(self):
        return str(self.id_usuario)

    # Propriedade para acessar eventos favoritos diretamente
    @property
    def eventos_favoritos(self):
        return [favorito.evento for favorito in self.favoritos]

class Organizador(db.Model):
    __tablename__ = 'organizador'

    id_organizador = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_empresa = db.Column(db.String(255), nullable=False)
    cnpj = db.Column(db.String(18), nullable=False, unique=True)
    endereco = db.Column(db.String(255), nullable=False)
    descricao = db.Column(db.Text)
    
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), unique=True, nullable=False)

    usuario = db.relationship('Usuario', back_populates='organizador')
    eventos = db.relationship('Evento', back_populates='organizador', cascade='all, delete-orphan')

class Evento(db.Model):
    __tablename__ = 'evento'
    
    id_evento = db.Column(db.Integer, primary_key=True, autoincrement=True)
    destino = db.Column(db.String(255), nullable=False)
    descricao = db.Column(db.Text)
    data_de_saida = db.Column(db.DateTime, nullable=False)
    data_de_retorno = db.Column(db.DateTime, nullable=False)
    local_saida = db.Column(db.String(255), nullable=False)
    n_vagas = db.Column(db.Integer, nullable=False)
    preco = db.Column(db.Numeric(10, 2), nullable=False)
    n_favoritos = db.Column(db.Integer, default=0)
    n_acessos = db.Column(db.Integer, default=0)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    id_organizador = db.Column(db.Integer, db.ForeignKey('organizador.id_organizador'))
    
    organizador = db.relationship('Organizador', back_populates='eventos')
    reservas = db.relationship('Reserva', back_populates='evento', cascade='all, delete-orphan')
    
    # Relacionamento com usuários que favoritaram (usando a tabela Favorito)
    favoritos = db.relationship('Favorito', back_populates='evento', cascade='all, delete-orphan')

    # Propriedade para acessar usuários que favoritaram diretamente
    @property
    def usuarios_favoritos(self):
        return [favorito.usuario for favorito in self.favoritos]

class Favorito(db.Model):
    __tablename__ = 'favoritos'
    
    id_favorito = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    id_evento = db.Column(db.Integer, db.ForeignKey('evento.id_evento'), nullable=False)
    data_adicionado = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos diretos
    usuario = db.relationship('Usuario', back_populates='favoritos')
    evento = db.relationship('Evento', back_populates='favoritos')
    
    __table_args__ = (
        db.UniqueConstraint('id_usuario', 'id_evento', name='unique_favorito'),
    )
    
# Reserva
class Reserva(db.Model):
    __tablename__ = 'reserva'

    id_reserva = db.Column(db.Integer, primary_key=True, autoincrement=True)
    status = db.Column(db.String(50), default='pendente')  # pendente, confirmado, cancelado
    data_de_reserva = db.Column(db.DateTime, default=datetime.utcnow)

    # Chaves estrangeiras
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'))
    id_evento = db.Column(db.Integer, db.ForeignKey('evento.id_evento'))

    # Relacionamentos
    usuario = db.relationship('Usuario', back_populates='reservas')
    evento = db.relationship('Evento', back_populates='reservas')
    pagamento = db.relationship('Pagamento', back_populates='reserva', uselist=False)

# Pagamento
class Pagamento(db.Model):
    __tablename__ = 'pagamento'

    id_pagamento = db.Column(db.Integer, primary_key=True, autoincrement=True)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    metodo_pagamento = db.Column(db.String(50))
    status = db.Column(db.String(50), default='pendente')  # pendente, completo, falhou, reembolsado
    data_pagamento = db.Column(db.DateTime)
    codigo_transacao = db.Column(db.String(100))

    # Chave estrangeira
    id_reserva = db.Column(db.Integer, db.ForeignKey('reserva.id_reserva'), unique=True)

    # Relacionamento
    reserva = db.relationship('Reserva', back_populates='pagamento')

# Avaliacao
class Avaliacao(db.Model):
    __tablename__ = 'avaliacao'

    id_avaliacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nota = db.Column(db.Integer, nullable=False)
    comentario = db.Column(db.Text)
    data_avaliacao = db.Column(db.DateTime, default=datetime.utcnow)

    # Chave estrangeira
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'))
    id_evento = db.Column(db.Integer, db.ForeignKey('evento.id_evento'))

    # Relacionamentos
    usuario = db.relationship('Usuario', back_populates='avaliacoes')
    evento = db.relationship('Evento')

# Chat/Suporte
class ChatSuporte(db.Model):
    __tablename__ = 'chatsuporte'

    id_mensagem = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mensagem = db.Column(db.Text, nullable=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)
    resposta = db.Column(db.Text)
    data_resposta = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='aberto')  # aberto, respondido, fechado

    # Chave estrangeira
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'))

    # Relacionamento
    usuario = db.relationship('Usuario', back_populates='mensagens')