from flask_wtf import FlaskForm
from wtforms import (StringField, PasswordField, BooleanField, TextAreaField, 
                     SubmitField, DateField, DecimalField, IntegerField, SelectField)
from wtforms.validators import (DataRequired, Email, EqualTo, Length, 
                               Regexp, NumberRange, ValidationError, Optional)
from datetime import datetime
from models.database import Usuario
import re

class FirebaseLoginForm(FlaskForm):
    email = StringField('E-mail', validators=[
        DataRequired(message='O e-mail é obrigatório'),
        Email(message='Por favor, insira um e-mail válido')
    ])
    password = PasswordField('Senha', validators=[
        DataRequired(message='A senha é obrigatória'),
        Length(min=6, message='A senha deve ter pelo menos 6 caracteres')
    ])
    remember = BooleanField('Lembrar-me')

class FirebaseRegistrationForm(FlaskForm):
    name = StringField('Nome Completo', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Telefone')
    cpf = StringField('CPF', validators=[DataRequired()])
    password = PasswordField('Senha', validators=[
        DataRequired(),
        Length(min=6, message='A senha deve ter pelo menos 6 caracteres')
    ])
    confirm_password = PasswordField('Confirmar Senha', validators=[
        DataRequired(),
        EqualTo('password', message='As senhas devem ser iguais')
    ])
    is_organizer = BooleanField('Sou organizador de eventos')
    
    # Campos específicos para organizador
    company_name = StringField('Nome da Empresa')
    cnpj = StringField('CNPJ')
    address = StringField('Endereço')
    company_description = TextAreaField('Descrição da Empresa')

    def validate_cpf(self, field):
        cpf = re.sub(r'[^0-9]', '', field.data)
        if len(cpf) != 11:
            raise ValidationError('CPF deve conter 11 dígitos')
        
    def validate_cnpj(self, field):
        if self.is_organizer.data and not field.data:
            raise ValidationError('CNPJ é obrigatório para organizadores')
        if field.data:
            cnpj = re.sub(r'[^0-9]', '', field.data)
            if len(cnpj) != 14:
                raise ValidationError('CNPJ deve conter 14 dígitos')

class PerfilForm(FlaskForm):
    nome = StringField('Nome Completo', validators=[DataRequired()])
    email = StringField('E-mail', validators=[DataRequired(), Email()])
    telefone = StringField('Telefone')
    cpf = StringField('CPF')  # Readonly após cadastro
    submit = SubmitField('Salvar Alterações')

class SenhaForm(FlaskForm):
    senha_atual = PasswordField('Senha Atual', validators=[DataRequired()])
    nova_senha = PasswordField('Nova Senha', validators=[DataRequired(), Length(min=6)])
    confirmar_senha = PasswordField('Confirmar Nova Senha', validators=[
        DataRequired(),
        EqualTo('nova_senha', message='As senhas devem ser iguais')
    ])
    submit = SubmitField('Alterar Senha')

class OrganizadorForm(FlaskForm):
    nome_empresa = StringField('Nome da Empresa', validators=[DataRequired()])
    cnpj = StringField('CNPJ', validators=[DataRequired()])
    endereco = StringField('Endereço', validators=[DataRequired()])
    descricao = TextAreaField('Descrição')
    submit = SubmitField('Atualizar Informações')

class EventoForm(FlaskForm):
    nome = StringField('Nome do Evento', validators=[DataRequired()])
    destino = StringField('Destino', validators=[DataRequired()])
    descricao = TextAreaField('Descrição')
    local_saida = StringField('Local de Saída', validators=[DataRequired()])
    data_de_saida = DateField('Data de Saída', format='%Y-%m-%d', validators=[DataRequired()])
    data_de_retorno = DateField('Data de Retorno', format='%Y-%m-%d', validators=[DataRequired()])
    preco = DecimalField('Preço', places=2, validators=[DataRequired(), NumberRange(min=0.01)])
    n_vagas = IntegerField('Número de Vagas', validators=[DataRequired(), NumberRange(min=1)])
    submit = SubmitField('Criar Evento')

    def validate_data_de_retorno(self, field):
        if field.data < self.data_de_saida.data:
            raise ValidationError('A data de retorno deve ser após a data de saída')

class ComentarioForm(FlaskForm):
    texto = TextAreaField('Comentário', validators=[
        DataRequired(),
        Length(min=5, max=500, message='O comentário deve ter entre 5 e 500 caracteres')
    ])
    submit = SubmitField('Enviar Comentário')

class MensagemForm(FlaskForm):
    texto = TextAreaField('Mensagem', validators=[
        DataRequired(),
        Length(min=1, max=1000, message='A mensagem deve ter entre 1 e 1000 caracteres')
    ])
    submit = SubmitField('Enviar Mensagem')

class ReservaForm(FlaskForm):
    quantidade = IntegerField('Quantidade', validators=[
        DataRequired(),
        NumberRange(min=1, message='Deve reservar pelo menos 1 vaga')
    ])
    submit = SubmitField('Reservar')

class PagamentoForm(FlaskForm):
    metodo_pagamento = SelectField('Método de Pagamento', choices=[
        ('credito', 'Cartão de Crédito'),
        ('debito', 'Cartão de Débito'),
        ('pix', 'PIX'),
        ('boleto', 'Boleto Bancário')
    ], validators=[DataRequired()])
    submit = SubmitField('Pagar')

class AvaliacaoForm(FlaskForm):
    nota = SelectField('Nota', choices=[
        (1, '1 - Péssimo'),
        (2, '2 - Ruim'),
        (3, '3 - Regular'),
        (4, '4 - Bom'),
        (5, '5 - Excelente')
    ], validators=[DataRequired()], coerce=int)
    comentario = TextAreaField('Comentário (Opcional)', validators=[
        Optional(),
        Length(max=500, message='O comentário não pode ter mais que 500 caracteres')
    ])
    submit = SubmitField('Enviar Avaliação')

class SuporteForm(FlaskForm):
    mensagem = TextAreaField('Mensagem', validators=[
        DataRequired(),
        Length(min=10, max=1000, message='A mensagem deve ter entre 10 e 1000 caracteres')
    ])
    submit = SubmitField('Enviar Mensagem')

class FiltroEventosForm(FlaskForm):
    destino = StringField('Destino')
    data_inicio = DateField('Data de Início', format='%Y-%m-%d', validators=[Optional()])
    data_fim = DateField('Data de Fim', format='%Y-%m-%d', validators=[Optional()])
    preco_min = DecimalField('Preço Mínimo', places=2, validators=[Optional(), NumberRange(min=0)])
    preco_max = DecimalField('Preço Máximo', places=2, validators=[Optional(), NumberRange(min=0)])
    submit = SubmitField('Filtrar')

    def validate_data_fim(self, field):
        if self.data_inicio.data and field.data and field.data < self.data_inicio.data:
            raise ValidationError('A data final deve ser após a data inicial')