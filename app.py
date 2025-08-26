import os
from flask import Flask
from flask_login import LoginManager
import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

# Inicializa o LoginManager
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    
    # Configurações básicas
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev')
    
    # Configura o LoginManager
    login_manager.init_app(app)
    login_manager.login_view = 'routes.login'

    # Configura Firebase
    initialize_firebase(app)

    # Registra blueprints
    from controllers.routes import routes as routes_blueprint
    app.register_blueprint(routes_blueprint)

    return app

def initialize_firebase(app):
    try:
        if not firebase_admin._apps:
            # Tenta carregar do arquivo serviceAccountKey.json
            cred_path = Path('serviceAccountKey.json')
            if cred_path.exists():
                cred = credentials.Certificate(str(cred_path))
            else:
                # Ou usa variáveis de ambiente
                firebase_config = {
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                }
                cred = credentials.Certificate(firebase_config)
            
            firebase_admin.initialize_app(cred)
            app.logger.info("✅ Firebase inicializado com sucesso!")
            
            # Inicializa o Firestore
            app.db = firestore.client()
    except Exception as e:
        app.logger.error(f"❌ Erro ao inicializar Firebase: {str(e)}")
        raise

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)