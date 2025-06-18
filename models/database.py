from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()
from flask_login import UserMixin


class Usuario(db.Model, UserMixin):
    __tablename__ = 'usuario'
    
    id_usuario = db.Column(db.Integer, primary_key=True)
    # ... outros campos ...
    
    eventos_favoritos = db.relationship(
        'Evento',
        secondary='favoritos',
        back_populates='usuarios_favoritos',
        lazy='dynamic'
    )
    
    # Método obrigatório para Flask-Login
    def get_id(self):
        return str(self.id_usuario)  # Convertendo para string como recomendado

    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    telefone = db.Column(db.String(20))
    senha = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(14), nullable=False, unique=True)
    tipo = db.Column(db.String(50))  # 'comum' ou 'organizador'

    # Relacionamentos
    organizador = db.relationship('Organizador', back_populates='usuario', uselist=False)
    reservas = db.relationship('Reserva', back_populates='usuario')
    avaliacoes = db.relationship('Avaliacao', back_populates='usuario')
    mensagens = db.relationship('ChatSuporte', back_populates='usuario')
    favoritos = db.relationship('Evento', 
                          secondary='favoritos', 
                          back_populates='usuarios_favoritos')

    def is_organizador(self):
        return self.tipo == 'organizador'
    def get_id(self):
        return str(self.id_usuario)

# Organizador (extensão de Usuario)
class Organizador(db.Model):
    __tablename__ = 'organizador'

    id_organizador = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_empresa = db.Column(db.String(255), nullable=False)
    cnpj = db.Column(db.String(18), nullable=False, unique=True)
    endereco = db.Column(db.String(255), nullable=False)
    descricao = db.Column(db.Text)
    
    # Chave estrangeira para Usuario
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), unique=True)

    # Relacionamentos
    usuario = db.relationship('Usuario', back_populates='organizador')
    eventos = db.relationship('Evento', back_populates='organizador')

# Evento (Excursão)
class Evento(db.Model):
    __tablename__ = 'evento'
    
    id_evento = db.Column(db.Integer, primary_key=True)
    
    usuarios_favoritos = db.relationship(
        'Usuario',
        secondary='favoritos',
        back_populates='eventos_favoritos',
        lazy='dynamic'
    )
    
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
    
    # Chave estrangeira para Organizador
    id_organizador = db.Column(db.Integer, db.ForeignKey('organizador.id_organizador'))
    
    # Relacionamentos
    organizador = db.relationship('Organizador', back_populates='eventos')
    reservas = db.relationship('Reserva', back_populates='evento', cascade='all, delete-orphan')
    
    def vagas_disponiveis(self):
        reservas_confirmadas = sum(1 for reserva in self.reservas if reserva.status == 'confirmado')
        return self.n_vagas - reservas_confirmadas
    
    
# Favoritos (relação muitos-para-muitos entre Usuário e Evento)
class Favorito(db.Model):
    __tablename__ = 'favoritos'
    
    id_favorito = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    id_evento = db.Column(db.Integer, db.ForeignKey('evento.id_evento'), nullable=False)
    data_adicionado = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    usuario = db.relationship('Usuario', backref=db.backref('favoritos_association', lazy='dynamic'))
    evento = db.relationship('Evento', backref=db.backref('favoritos_association', lazy='dynamic'))
    
    # Restrição única para evitar favoritos duplicados
    __table_args__ = (
        db.UniqueConstraint('id_usuario', 'id_evento', name='unique_favorito'),
    )

    def __repr__(self):
        return f'<Favorito {self.id_favorito} - Usuario: {self.id_usuario}, Evento: {self.id_evento}>'    

    
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