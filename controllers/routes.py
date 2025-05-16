from flask import render_template
from app import app
from app.models.excursion import Excursion

@app.route('/')
def home():
    excursions = Excursion.query.all()
    return render_template('home.html', excursions=excursions)