from werkzeug.security import generate_password_hash
import os

def configure_database(app):
    # Configurações do MySQL
    app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
    app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
    app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
    app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'TCC')
    app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
    
    from flask_mysqldb import MySQL
    return MySQL(app)

def create_tables(mysql):
    conn = mysql.connection
    cursor = conn.cursor()
    
    try:
        # Cria tabela de favoritos se não existir
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Favoritos (
            id_favorito INT AUTO_INCREMENT PRIMARY KEY,
            id_usuario INT,
            id_evento INT,
            data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
            FOREIGN KEY (id_evento) REFERENCES Evento(id_evento),
            UNIQUE KEY (id_usuario, id_evento)
        )''')
        
        # Cria usuário admin se não existir
        cursor.execute("SELECT * FROM Usuario WHERE email = 'admin@setjustgo.com'")
        if not cursor.fetchone():
            hashed_password = generate_password_hash('admin123')
            cursor.execute('''
                INSERT INTO Usuario (nome, email, senha, cpf, tipo)
                VALUES (%s, %s, %s, %s, %s)
            ''', ('Administrador', 'admin@setjustgo.com', hashed_password, '000.000.000-00', 'admin'))
        
        conn.commit()
        print("✅ Tabelas verificadas/criadas com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        conn.rollback()
    finally:
        cursor.close()