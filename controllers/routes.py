from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import re
from functools import wraps
import MySQLdb
from MySQLdb.cursors import DictCursor

# Cria um Blueprint para as rotas
routes = Blueprint('routes', __name__)

# Decorators
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'loggedin' not in session:
            flash('Por favor, faça login para acessar esta página', 'danger')
            return redirect(url_for('routes.login'))
        return f(*args, **kwargs)
    return decorated_function

def organizador_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'tipo' not in session or session['tipo'] != 'organizador':
            flash('Acesso restrito a organizadores', 'danger')
            return redirect(url_for('routes.home'))
        return f(*args, **kwargs)
    return decorated_function

# Rotas de autenticação
@routes.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM Usuario WHERE email = %s', (email,))
        account = cursor.fetchone()
        cursor.close()
        
        if account and check_password_hash(account['senha'], password):
            session['loggedin'] = True
            session['id_usuario'] = account['id_usuario']
            session['nome'] = account['nome']
            session['email'] = account['email']
            session['tipo'] = account['tipo']
            
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('routes.home'))
        else:
            flash('Email ou senha incorretos!', 'danger')
    
    return render_template('login.html')

@routes.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        nome = request.form['nome']
        email = request.form['email']
        telefone = request.form['telefone']
        senha = generate_password_hash(request.form['senha'])
        cpf = request.form['cpf']
        tipo = request.form['tipo']
        
        cursor = mysql.connection.cursor(DictCursor)
        cursor.execute('SELECT * FROM Usuario WHERE email = %s', (email,))
        account = cursor.fetchone()
        
        if account:
            flash('Email já cadastrado!', 'danger')
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            flash('Email inválido!', 'danger')
        elif not nome or not email or not senha or not cpf:
            flash('Por favor, preencha todos os campos!', 'danger')
        else:
            cursor.execute('''
                INSERT INTO Usuario (nome, email, telefone, senha, cpf, tipo) 
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (nome, email, telefone, senha, cpf, tipo))
            mysql.connection.commit()
            
            flash('Cadastro realizado com sucesso! Faça login.', 'success')
            return redirect(url_for('routes.login'))
        cursor.close()
    
    return render_template('register.html')

@routes.route('/logout')
def logout():
    session.clear()
    flash('Você foi desconectado com sucesso', 'info')
    return redirect(url_for('routes.home'))

# Rotas principais
@routes.route('/home')
def home():
    cursor = mysql.connection.cursor(DictCursor)
    cursor.execute("SELECT * FROM Evento ORDER BY data_de_saida LIMIT 6")
    eventos = cursor.fetchall()
    cursor.close()
    return render_template('home.html', eventos=eventos)

@routes.route('/favoritos')
@login_required
def favoritos():
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    
    cursor.execute('''
        SELECT e.*, 
               DATEDIFF(e.data_de_retorno, e.data_de_saida) AS duracao,
               CONCAT('/static/images/eventos/', e.id_evento, '.jpg') AS imagem_url
        FROM Evento e
        JOIN Favoritos f ON e.id_evento = f.id_evento
        WHERE f.id_usuario = %s
        ORDER BY e.data_de_saida
    ''', (session['id_usuario'],))
    
    favoritos = cursor.fetchall()
    cursor.close()
    
    return render_template('favoritos.html', favoritos=favoritos if favoritos else None)

@routes.route('/favoritos/remover/<int:evento_id>', methods=['POST'])
@login_required
def remover_favorito(evento_id):
    cursor = mysql.connection.cursor()
    
    try:
        cursor.execute('''
            DELETE FROM Favoritos 
            WHERE id_usuario = %s AND id_evento = %s
        ''', (session['id_usuario'], evento_id))
        
        mysql.connection.commit()
        return jsonify({'success': True})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'error': str(e)})
    finally:
        cursor.close()

# Rotas de perfil
@routes.route('/perfil')
@login_required
def perfil():
    cursor = mysql.connection.cursor(DictCursor)
    
    cursor.execute('SELECT * FROM Usuario WHERE id_usuario = %s', (session['id_usuario'],))
    usuario = cursor.fetchone()
    
    cursor.execute('''
        SELECT r.*, e.destino, e.data_de_saida, e.preco, e.id_evento
        FROM Reserva r
        JOIN Evento e ON r.id_evento = e.id_evento
        WHERE r.id_usuario = %s
        ORDER BY r.data_de_reserva DESC
        LIMIT 3
    ''', (session['id_usuario'],))
    reservas = cursor.fetchall()
    
    cursor.close()
    return render_template('perfil.html', usuario=usuario, reservas=reservas)

# Rotas de eventos
@routes.route('/eventos')
def eventos():
    cursor = mysql.connection.cursor(DictCursor)
    
    search = request.args.get('search', '')
    if search:
        cursor.execute('''
            SELECT * FROM Evento 
            WHERE destino LIKE %s OR descricao LIKE %s
            ORDER BY data_de_saida
        ''', (f'%{search}%', f'%{search}%'))
    else:
        cursor.execute('SELECT * FROM Evento ORDER BY data_de_saida')
    
    eventos = cursor.fetchall()
    cursor.close()
    return render_template('eventos.html', eventos=eventos, search=search)

@routes.route('/evento/<int:evento_id>')
def evento_detalhes(evento_id):
    cursor = mysql.connection.cursor(DictCursor)
    
    # Atualiza contador de acessos
    cursor.execute('''
        UPDATE Evento 
        SET n_acessos = IFNULL(n_acessos, 0) + 1 
        WHERE id_evento = %s
    ''', (evento_id,))
    mysql.connection.commit()
    
    cursor.execute('''
        SELECT e.*, o.nome_empresa, o.descricao AS descricao_organizador
        FROM Evento e
        LEFT JOIN Organizador o ON e.idOrganizador = o.id_organizador
        WHERE e.id_evento = %s
    ''', (evento_id,))
    evento = cursor.fetchone()
    
    cursor.execute('''
        SELECT a.*, u.nome
        FROM Avaliacao a
        JOIN Usuario u ON a.id_usuario = u.id_usuario
        WHERE a.id_evento = %s
        ORDER BY a.data_avaliacao DESC
        LIMIT 5
    ''', (evento_id,))
    avaliacoes = cursor.fetchall()
    
    cursor.close()
    return render_template('evento_detalhes.html', evento=evento, avaliacoes=avaliacoes)

# Inicialização (será chamada pelo app.py)
def init_app(app, mysql_instance):
    global mysql
    mysql = mysql_instance
    app.register_blueprint(routes)