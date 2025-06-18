from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from models.database import db, Usuario, Evento, Organizador, Reserva, Favorito
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from forms import RegistrationForm
from forms import LoginForm  # Ou o caminho correto para seu arquivo forms.py
from flask_login import UserMixin

routes = Blueprint('routes', __name__)

# Home - Lista de Eventos


@routes.route('/')
def home():
    try:
        eventos = Evento.query.options(db.joinedload(Evento.organizador))\
            .order_by(Evento.data_de_saida.asc()).all()
        return render_template('home.html', eventos=eventos)
    except Exception as e:
        flash('Erro ao carregar eventos. Tente novamente.', 'error')
        return render_template('home.html', eventos=[])

# Login


@routes.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('routes.dashboard'))

    form = LoginForm()

    if form.validate_on_submit():
        user = Usuario.query.filter_by(email=form.email.data).first()
        
        if user and check_password_hash(user.senha, form.senha.data):
            login_user(user, remember=form.lembrar.data)
            flash('Login realizado com sucesso!', 'success')
            
            next_page = request.args.get('next')
            return redirect(next_page or url_for('routes.dashboard'))
        
        flash('E-mail ou senha incorretos', 'error')
    
    return render_template('login.html', form=form)

# Logout

@routes.route('/reset-password', methods=['GET', 'POST'])
def reset_password_request():
    if current_user.is_authenticated:
        return redirect(url_for('routes.dashboard'))
    
    form = ResetPasswordRequestForm()  # Você precisará criar este formulário
    
    if form.validate_on_submit():
        user = Usuario.query.filter_by(email=form.email.data).first()
        if user:
            # Aqui você implementaria o envio do e-mail de recuperação
            send_password_reset_email(user)  # Função que você precisa implementar
            
        flash('Se o e-mail existir em nosso sistema, enviaremos instruções para redefinir sua senha', 'info')
        return redirect(url_for('routes.login'))
    
    return render_template('reset_password_request.html', form=form)


@routes.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('routes.home'))


@routes.route('/login/ajax', methods=['POST'])
def login_ajax():
    if current_user.is_authenticated:
        return jsonify({'success': True, 'redirect': url_for('routes.dashboard')})

    data = request.get_json()
    email = data.get('email', '').strip()
    senha = data.get('senha', '')

    if not email or not senha:
        return jsonify({'success': False, 'message': 'Preencha todos os campos'})

    user = Usuario.query.filter_by(email=email).first()

    if user and check_password_hash(user.senha, senha):
        login_user(user)
        return jsonify({
            'success': True,
            'redirect': url_for('routes.dashboard')
        })

    return jsonify({'success': False, 'message': 'Credenciais inválidas'})


@routes.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()

    if form.validate_on_submit():
        # Verificar se usuário já existe
        existing_user = Usuario.query.filter_by(email=form.email.data).first()
        if existing_user:
            flash('E-mail já cadastrado!', 'danger')
            return redirect(url_for('routes.register'))

        try:
            # Criar novo usuário (sem organizador ainda)
            hashed_password = generate_password_hash(form.senha.data, method='scrypt')
            new_user = Usuario(
                nome=form.nome.data,
                email=form.email.data,
                telefone=form.telefone.data,
                senha=hashed_password,
                cpf=form.cpf.data,
                tipo='organizador' if form.tipo_organizador.data else 'usuario'
            )
            
            db.session.add(new_user)
            db.session.commit()  # Commit aqui para obter o id_usuario

            # Se for organizador, criar registro na tabela organizador
            if form.tipo_organizador.data:
                new_organizador = Organizador(
                    nome_empresa=form.nome_empresa.data,
                    cnpj=form.cnpj.data,
                    endereco=form.endereco.data,
                    descricao=form.descricao.data,
                    id_usuario=new_user.id_usuario
                )
                db.session.add(new_organizador)
                db.session.commit()

            flash('Cadastro realizado com sucesso!', 'success')
            return redirect(url_for('routes.login'))

        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao cadastrar usuário: {str(e)}', 'danger')

    # Para depuração - mostre os erros do formulário
    print(form.errors) if form.errors else None
    return render_template('register.html', form=form)


@routes.route('/register/ajax', methods=['POST'])
def register_ajax():
    form = RegistrationForm()

    if form.validate_on_submit():
        # Sua lógica de registro aqui (igual à rota normal)
        # ...

        return jsonify({
            'success': True,
            'message': 'Cadastro realizado com sucesso!',
            'redirect': url_for('routes.login')
        })

    # Se houver erros de validação
    errors = {field.name: field.errors for field in form if field.errors}
    return jsonify({
        'success': False,
        'message': 'Por favor, corrija os erros no formulário',
        'errors': errors
    }), 400

# Dashboard


@routes.route('/dashboard')
@login_required
def dashboard():
    if current_user.tipo == 'organizador':
        organizador = Organizador.query.filter_by(id_usuario=current_user.id_usuario).first()
        if not organizador:
            flash('Complete seu perfil de organizador primeiro', 'error')
            return redirect(url_for('routes.perfil'))
            
        eventos = Evento.query.filter_by(id_organizador=organizador.id_organizador)\
            .order_by(Evento.data_de_saida.desc()).all()
        return render_template('dashboard_organizador.html', eventos=eventos)
    
    # Usuário comum
    reservas = Reserva.query.filter_by(id_usuario=current_user.id_usuario)\
        .options(db.joinedload(Reserva.evento)).all()
    return render_template('dashboard_usuario.html', reservas=reservas)

# Lista de Eventos


@routes.route('/eventos')
def eventos():
    try:
        eventos = Evento.query.options(db.joinedload(Evento.organizador))\
            .order_by(Evento.data_de_saida.asc()).all()
        return render_template('eventos.html', eventos=eventos)
    except Exception as e:
        flash('Erro ao carregar lista de eventos', 'error')
        return render_template('eventos.html', eventos=[])

# Criar Novo Evento




@routes.route('/eventos/novo', methods=['GET', 'POST'])
@login_required
def nova_excursao():
    if current_user.tipo != 'organizador':
        flash('Acesso restrito a organizadores', 'error')
        return redirect(url_for('routes.dashboard'))

    organizador = Organizador.query.filter_by(id_usuario=current_user.id_usuario).first()
    if not organizador:
        flash('Complete seu perfil de organizador primeiro', 'error')
        return redirect(url_for('routes.perfil'))

    # Crie uma classe de formulário para eventos (adicione isso no seu forms.py)
    form = EventoForm()  # Você precisará criar esta classe

    if form.validate_on_submit():
        try:
            evento = Evento(
                destino=form.destino.data,
                descricao=form.descricao.data,
                local_saida=form.local_saida.data,
                data_de_saida=form.data_de_saida.data,
                data_de_retorno=form.data_de_retorno.data,
                preco=form.preco.data,
                n_vagas=form.n_vagas.data,
                id_organizador=organizador.id_organizador
            )

            db.session.add(evento)
            db.session.commit()
            flash('Evento criado com sucesso!', 'success')
            return redirect(url_for('routes.dashboard'))

        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao criar evento: {str(e)}', 'error')

    # Passe o form para o template
    return render_template('novo_evento.html', form=form)

# Detalhes do Evento


@routes.route('/eventos/<int:id>')
def detalhes_evento(id):
    try:
        evento = Evento.query.options(
            db.joinedload(Evento.organizador)).get_or_404(id)
        evento.n_acessos += 1
        db.session.commit()
        return render_template('detalhes_evento.html', evento=evento)
    except Exception as e:
        flash('Erro ao carregar detalhes do evento', 'error')
        return redirect(url_for('routes.home'))

# Editar Evento


@routes.route('/eventos/<int:id>/editar', methods=['GET', 'POST'])
@login_required
def editar_evento(id):
    evento = Evento.query.get_or_404(id)
    organizador = Organizador.query.filter_by(id_usuario=current_user.id_usuario).first()

    # Verificar permissão
    if not organizador or evento.id_organizador != organizador.id_organizador:
        flash('Você não tem permissão para editar este evento', 'error')
        return redirect(url_for('routes.dashboard'))

    if request.method == 'POST':
        try:
            # Validações
            required_fields = ['destino', 'local_saida', 'data_de_saida',
                             'data_de_retorno', 'preco', 'n_vagas']
            if any(not request.form.get(field) for field in required_fields):
                flash('Preencha todos os campos obrigatórios', 'error')
                return redirect(url_for('routes.editar_evento', id=id))

            data_saida = datetime.strptime(request.form['data_de_saida'], '%Y-%m-%d')
            data_retorno = datetime.strptime(request.form['data_de_retorno'], '%Y-%m-%d')
            
            if data_retorno <= data_saida:
                flash('Data de retorno deve ser após a data de saída', 'error')
                return redirect(url_for('routes.editar_evento', id=id))

            # Atualizar evento
            evento.destino = request.form['destino']
            evento.descricao = request.form.get('descricao', '')
            evento.local_saida = request.form['local_saida']
            evento.data_de_saida = data_saida
            evento.data_de_retorno = data_retorno
            evento.preco = float(request.form['preco'])
            
            # Não permitir reduzir vagas abaixo do número de reservas confirmadas
            novas_vagas = int(request.form['n_vagas'])
            reservas_confirmadas = sum(1 for r in evento.reservas if r.status == 'confirmado')
            
            if novas_vagas < reservas_confirmadas:
                flash(f'Não é possível ter menos vagas ({novas_vagas}) que reservas confirmadas ({reservas_confirmadas})', 'error')
                return redirect(url_for('routes.editar_evento', id=id))
                
            evento.n_vagas = novas_vagas

            db.session.commit()
            flash('Evento atualizado com sucesso!', 'success')
            return redirect(url_for('routes.detalhes_evento', id=evento.id_evento))

        except ValueError:
            db.session.rollback()
            flash('Valores inválidos nos campos numéricos ou datas', 'error')
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar evento: {str(e)}', 'error')

    # Formatar datas para o input type="date"
    evento.data_de_saida_str = evento.data_de_saida.strftime('%Y-%m-%d')
    evento.data_de_retorno_str = evento.data_de_retorno.strftime('%Y-%m-%d')
    
    return render_template('editar_evento.html', evento=evento)
# Excluir Evento


@routes.route('/eventos/<int:id>/excluir', methods=['POST'])
@login_required
def excluir_evento(id):
    evento = Evento.query.get_or_404(id)
    organizador = Organizador.query.filter_by(id_usuario=current_user.id_usuario).first()

    # Verificar permissão
    if not organizador or evento.id_organizador != organizador.id_organizador:
        flash('Você não tem permissão para excluir este evento', 'error')
        return redirect(url_for('routes.dashboard'))

    try:
        db.session.delete(evento)
        db.session.commit()
        flash('Evento excluído com sucesso!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Erro ao excluir evento: {str(e)}', 'error')

    return redirect(url_for('routes.dashboard'))

# Perfil do Usuário


@routes.route('/perfil')
@login_required
def perfil():
    try:
        if current_user.tipo == 'organizador':
            organizador = Organizador.query.filter_by(
                id_usuario=current_user.id_usuario).first()
            return render_template('perfil.html', usuario=current_user, organizador=organizador)
        return render_template('perfil.html', usuario=current_user)
    except Exception as e:
        flash('Erro ao carregar perfil', 'error')
        return redirect(url_for('routes.dashboard'))

# Favoritos


@routes.route('/favoritos')
@login_required
def favoritos():
    try:
        favoritos = Favorito.query.filter_by(id_usuario=current_user.id_usuario)\
            .options(db.joinedload(Favorito.evento)).all()
        return render_template('favoritos.html', favoritos=favoritos)
    except Exception as e:
        flash('Erro ao carregar favoritos', 'error')
        return redirect(url_for('routes.dashboard'))
