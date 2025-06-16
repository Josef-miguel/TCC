from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, TextAreaField
from flask_wtf import FlaskForm
from wtforms.validators import DataRequired, Email, EqualTo, Length, Regexp


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