from flask import Flask
from flask_login import LoginManager
from models.database import db, Usuario
from controllers.routes import routes
from flask_migrate import Migrate


from firebase_admin import credentials, initialize_app, firestore

app = Flask(__name__, template_folder='views')
app.secret_key = '3d6f45a5fc12445dbac2f59c3b6c7cb1d5725f1d8f22660'  # Chave secreta para sessão



# um erro aqui. é preciso pegar o storagebucket e inicializar o app
cred = credentials.Certificate('config/firebaseConfig.json')
initialize_app(cred)

# database do firestore pego
db = firestore.client()



# # Configurações do banco de dados
# # retirar
# DB_NAME = 'tcc'
# app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://root@localhost/{DB_NAME}'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False





# Inicializa o banco
db.init_app(app)

migrate = Migrate(app, db)

# Login manager
login_manager = LoginManager()
login_manager.login_view = 'routes.login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

# Registrando o blueprint
app.register_blueprint(routes)

# Criação do banco de dados caso não exista
import pymysql

connection = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

# try:
#     with connection.cursor() as cursor:
#         cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
#         print("Banco de dados criado ou já existente.")
# except Exception as e:
#     print(f"Erro ao criar o banco: {e}")
# finally:
#     connection.close()

# # Criação das tabelas
# with app.app_context():
#     db.create_all()

# Rodando o servidor
if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)
    
