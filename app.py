from flask import Flask
from flask_mysqldb import MySQL
from controllers.routes import init_app
from database import configure_database, create_tables
import pymysql

# Cria a aplicação Flask
app = Flask(__name__, template_folder='views')

# Configurações básicas
app.secret_key = 'sua_chave_secreta_aqui'  # Substitua por uma chave segura
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Nome do banco de dados
DB_NAME = 'TCC'

# Configura o banco de dados
mysql = configure_database(app)

# Inicializa as rotas
init_app(app, mysql)  # ✅ Correto (função definida em routes.py)(app, mysql)

if __name__ == '__main__':
    # Cria o banco de dados se não existir
    try:
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
            print("✅ Banco de dados criado com sucesso!")
            
    except Exception as error:
        print(f"❌ Erro ao criar o banco: {error}")
    finally:
        connection.close()
    
    # Cria as tabelas
    with app.app_context():
        create_tables(mysql)
    
    print(app.url_map)
    # Inicia o servidor
    app.run(host='localhost', port=5000, debug=True)