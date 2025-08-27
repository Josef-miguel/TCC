from flask import Flask, json
from flask_login import LoginManager
# from models.database import db, Usuario
from controllers import routes
import firebase_admin
from firebase_admin import credentials, initialize_app, firestore

app = Flask(__name__, template_folder='views')


# um erro aqui. é preciso pegar o storagebucket e inicializar o app
cred = credentials.Certificate("./config/firebaseConfig.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'jsg-tcc.appspot.com'
})


# database do firestore pego
db = firestore.client()
routes.init_app(app)

# Rodando o servidor
if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True)