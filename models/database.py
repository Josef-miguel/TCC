from app import db

class Excursion(db.Model):
    __tablename__ = 'excursions'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(100), nullable=False)
    location_start = db.Column(db.String(100), nullable=False)
    location_end = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<Excursion {self.title}>'