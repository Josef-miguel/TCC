from flask import render_template, request, redirect, url_for



def init_app(app):
    # Criando a primeira rota do site
    @app.route('/')
    # Criando função no Python
    def home():
        return render_template('home.html')
    
    @app.route('/login')
    # Criando função no Python
    def login():
        return render_template('login.html')
    
    @app.route('/evento')
    # Criando função no Python
    def evento():
        return render_template('evento.html')
    
    @app.route('/perfil')
    def perfil():
        return render_template('perfil.html')