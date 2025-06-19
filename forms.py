from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, TextAreaField, SubmitField
from flask_wtf import FlaskForm
from wtforms.validators import DataRequired, Email, EqualTo, Length, Regexp
from flask_login import UserMixin
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, DateField, DecimalField, IntegerField, SubmitField
from wtforms.validators import DataRequired, NumberRange, ValidationError
from datetime import datetime
from models.database import Usuario

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
    destino = StringField('Destino', validators=[DataRequired()])
    descricao = TextAreaField('Descrição')
    local_saida = StringField('Local de Saída', validators=[DataRequired()])
    data_de_saida = DateField('Data de Saída', format='%Y-%m-%d', validators=[DataRequired()])
    data_de_retorno = DateField('Data de Retorno', format='%Y-%m-%d', validators=[DataRequired()])
    preco = DecimalField('Preço', places=2, validators=[DataRequired(), NumberRange(min=0.01)])
    n_vagas = IntegerField('Número de Vagas', validators=[DataRequired(), NumberRange(min=1)])
    submit = SubmitField('Criar Evento')

class LoginForm(FlaskForm):
    email = StringField('E-mail', validators=[
        DataRequired(message='O e-mail é obrigatório'),
        Email(message='Por favor, insira um e-mail válido')
    ])
    senha = PasswordField('Senha', validators=[
        DataRequired(message='A senha é obrigatória'),
        Length(min=6, message='A senha deve ter pelo menos 6 caracteres')
    ])
    lembrar = BooleanField('Lembrar-me')


class RegistrationForm(FlaskForm):
    nome = StringField('Nome Completo', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    telefone = StringField('Telefone')
    cpf = StringField('CPF', validators=[DataRequired()])
    senha = PasswordField('Senha', validators=[
        DataRequired(),
        Length(min=6, message='A senha deve ter pelo menos 6 caracteres')
    ])
    confirmar_senha = PasswordField('Confirmar Senha', validators=[
        DataRequired(),
        EqualTo('senha', message='As senhas devem ser iguais')
    ])
    tipo_organizador = BooleanField('Sou organizador de eventos')
    
    # Campos específicos para organizador
    nome_empresa = StringField('Nome da Empresa')
    cnpj = StringField('CNPJ')
    endereco = StringField('Endereço')
    descricao = TextAreaField('Descrição da Empresa')
    
#class ResetPasswordRequestForm(FlaskForm):
    #email = StringField('E-mail', validators=[DataRequired(), Email()])
    #submit = SubmitField('Solicitar Redefinição de Senha')