from flask import Blueprint, render_template, request, redirect, url_for, session, flash
import MySQLdb
from MySQLdb.cursors import DictCursor
from functools import wraps

# Cria o Blueprint para as rotas
routes = Blueprint('routes', __name__)

# Variável global para a conexão MySQL (será configurada no init_app)
mysql = None

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

# Rotas principais
@routes.route('/')
def home():
    cursor = mysql.connection.cursor(DictCursor)
    cursor.execute("SELECT * FROM Evento ORDER BY data_de_saida LIMIT 6")
    eventos = cursor.fetchall()
    cursor.close()
    return render_template('home.html', eventos=eventos)



@routes.route('/login', methods=['GET', 'POST'])
def login():
    # Sua implementação de login aqui
    return render_template('login.html')

@routes.route('/register', methods=['POST'])
def register_ajax():
    name = request.json.get('name')
    email = request.json.get('email')
    password = request.json.get('password')
    
    hashed_password = generate_password_hash(password)
    
    try:
        cursor = mysql.connection.cursor(DictCursor)
        cursor.execute(
            'INSERT INTO Usuario (nome, email, senha, tipo) VALUES (%s, %s, %s, "usuario")',
            (name, email, hashed_password)
        )
        mysql.connection.commit()
        cursor.close()
        return jsonify({'success': True})
    except MySQLdb.IntegrityError:
        return jsonify({'success': False, 'message': 'Email já cadastrado'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@routes.route('/favoritos')
@login_required  # Este decorator causa o redirecionamento
def favoritos():
    cursor = mysql.connection.cursor(DictCursor)
    cursor.execute('''
        SELECT e.*, DATEDIFF(e.data_de_retorno, e.data_de_saida) AS duracao
        FROM Evento e
        JOIN Favoritos f ON e.id_evento = f.id_evento
        WHERE f.id_usuario = %s
        ORDER BY e.data_de_saida
    ''', (session['id_usuario'],))
    
    favoritos = cursor.fetchall()
    cursor.close()
    return render_template('favoritos.html', favoritos=favoritos)

@routes.route('/perfil')
@login_required  # Se requer autenticação
def perfil():
    cursor = mysql.connection.cursor(DictCursor)
    cursor.execute('SELECT * FROM Usuario WHERE id_usuario = %s', (session['id_usuario'],))
    usuario = cursor.fetchone()
    cursor.close()
    return render_template('perfil.html', usuario=usuario)



@routes.route('/eventos')
def eventos():
    cursor = mysql.connection.cursor(DictCursor)
    
    # Busca todos os eventos ordenados por data
    cursor.execute("""
        SELECT *, 
               DATEDIFF(data_de_retorno, data_de_saida) AS duracao
        FROM Evento 
        ORDER BY data_de_saida
    """)
    eventos = cursor.fetchall()
    cursor.close()
    
    return render_template('eventos.html', eventos=eventos)

# Inicialização do app
def init_app(app, mysql_instance):
    global mysql
    mysql = mysql_instance
    app.register_blueprint(routes)