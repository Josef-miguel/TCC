from flask import Flask, session, g
from flask_login import LoginManager
# from models.database import db, Usuario
from controllers import routes
import firebase_admin
from firebase_admin import credentials, initialize_app, firestore

app = Flask(__name__, template_folder='views')
app.secret_key = "chave_secrots"

# um erro aqui. é preciso pegar o storagebucket e inicializar o app
cred = credentials.Certificate("./config/firebaseConfig.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'jsg-tcc.appspot.com'
})


# database do firestore pego
db = firestore.client()
routes.init_app(app)

@app.before_request
def load_logged_in_user():
    user_uid = session.get("user_uid")
    if user_uid is None:
        g.user = None
    else:
        user_ref = db.collection("usuarios").document(user_uid).get()
        g.user = user_ref.to_dict() if user_ref.exists else None

# Rodando o servidor
if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True)