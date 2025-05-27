import os
from flask_mysqldb import MySQL
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

def configure_database(app):
    # Carrega variáveis do .env
    load_dotenv()
    
    # Configurações do MySQL
    app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
    app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
    app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
    app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'TCC')
    app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
    
    mysql = MySQL(app)
    return mysql

def create_tables(mysql):
    conn = mysql.connection
    cursor = conn.cursor()
    
    try:
        # Tabela FAVORITOS (adicionei esta tabela que estava faltando)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Favoritos (
            id_favorito INT AUTO_INCREMENT PRIMARY KEY,
            id_usuario INT,
            id_evento INT,
            data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
            FOREIGN KEY (id_evento) REFERENCES Evento(id_evento),
            UNIQUE KEY (id_usuario, id_evento)
        ''')
        
        # Criar usuário admin inicial se não existir
        cursor.execute("SELECT * FROM Usuario WHERE email = 'admin@setjustgo.com'")
        if not cursor.fetchone():
            hashed_password = generate_password_hash('admin123')
            cursor.execute('''
                INSERT INTO Usuario (nome, email, senha, cpf, tipo)
                VALUES (%s, %s, %s, %s, %s)
            ''', ('Administrador', 'admin@setjustgo.com', hashed_password, '000.000.000-00', 'admin'))
        
        conn.commit()
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
        conn.rollback()
    finally:
        cursor.close()