from flask import Flask
from database import configure_database, create_tables
from controllers.routes import init_app as init_routes
import os

def create_app():
    app = Flask(__name__, template_folder='views')
    
    # Configurações básicas
    app.secret_key = os.getenv('SECRET_KEY', 'sua_chave_secreta_aqui')
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    
    # Configura o banco de dados
    mysql = configure_database(app)
    
    # Inicializa as rotas
    init_routes(app, mysql)
    
    # Cria tabelas se não existirem
    with app.app_context():
        create_tables(mysql)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)