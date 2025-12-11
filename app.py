import os
from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy

# --- APP AND DB SETUP ---
app = Flask(__name__)

database_url = os.environ.get('DATABASE_URL')
if database_url:
    database_url = database_url.replace("postgres://", "postgresql://")
    
app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- DATABASE MODELS ---
class Board(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    board_order = db.Column(db.Integer, nullable=False, default=0)
    tasks = db.relationship('Task', backref='board', lazy=True, cascade="all, delete-orphan", order_by="Task.task_order")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'tasks': [task.to_dict() for task in self.tasks]
        }

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, nullable=False, default=False)
    task_order = db.Column(db.Integer, nullable=False, default=0)
    board_id = db.Column(db.Integer, db.ForeignKey('board.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'done': self.done,
        }

# --- DATABASE HOOK ---
@app.before_request
def create_tables():
    print("Checking for database tables...")
    db.create_all()
    print("Database check complete.")

# --- FLASK ROUTES (API Endpoints) ---
@app.route('/')
def index():
    return render_template('index.html')

### GET /task_board (Retrieve All Boards)
@app.route('/task_board', methods=['GET'])
def get_task_board():
    all_boards = Board.query.order_by(Board.board_order).all()
    return jsonify({'task_board': [b.to_dict() for b in all_boards]})

### POST /task_board (Create a New Board)
@app.route('/task_board', methods=['POST'])
def create_board():
    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing title'}), 400

    title = request.json['title']
    
    max_order = db.session.query(db.func.max(Board.board_order)).scalar() or 0
    new_order = max_order + 1
    
    new_board = Board(title=title, board_order=new_order)
    
    db.session.add(new_board)
    db.session.commit() 
    
    return jsonify({'board': new_board.to_dict()}), 201

### POST /tasks/<int:board_id> (Create a New Task)
@app.route('/tasks/<int:board_id>', methods=['POST'])
def create_task(board_id):
    board = Board.query.get_or_404(board_id)

    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing title'}), 400

    title = request.json['title']
    
    max_order = db.session.query(db.func.max(Task.task_order)).filter_by(board_id=board_id).scalar() or 0
    new_order = max_order + 1

    new_task = Task(title=title, board_id=board_id, task_order=new_order)
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({'task': new_task.to_dict()}), 201

### DELETE /task_board/<int:board_id> (Delete a Board)
@app.route('/task_board/<int:board_id>', methods=['DELETE'])
def delete_board(board_id):
    board = Board.query.get_or_404(board_id)
    
    db.session.delete(board)
    db.session.commit()
    
    return jsonify({'result': True})

### DELETE /tasks/<int:board_id>/<int:task_id> (Delete a Task)
@app.route('/tasks/<int:board_id>/<int:task_id>', methods=['DELETE'])
def delete_task(board_id, task_id):
    task = Task.query.filter_by(id=task_id, board_id=board_id).first_or_404()
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'result': True})

### PATCH /task_board/<int:board_id>/move (Move a Board)
@app.route('/task_board/<int:board_id>/move', methods=['PATCH'])
def move_board(board_id):
    direction = request.json.get('direction')
    current_board = Board.query.get_or_404(board_id)
    
    if direction == 'left':
        target_board = Board.query.filter(Board.board_order < current_board.board_order).order_by(Board.board_order.desc()).first()
    elif direction == 'right':
        target_board = Board.query.filter(Board.board_order > current_board.board_order).order_by(Board.board_order.asc()).first()
    else:
        return jsonify({'result': False, 'message': 'Invalid direction'}), 400

    if not target_board:
        return jsonify({'result': False, 'message': 'Move not possible'}), 200

    current_order = current_board.board_order
    current_board.board_order = target_board.board_order
    target_board.board_order = current_order
    
    db.session.commit() 
    return jsonify({'result': True}), 200

### PATCH /tasks/<int:board_id>/<int:task_id>/move (Move a Task)
@app.route('/tasks/<int:board_id>/<int:task_id>/move', methods=['PATCH'])
def move_task(board_id, task_id):
    direction = request.json.get('direction')
    current_task = Task.query.filter_by(id=task_id, board_id=board_id).first_or_404()
    
    q = Task.query.filter_by(board_id=board_id)

    if direction == 'up':
        target_task = q.filter(Task.task_order < current_task.task_order).order_by(Task.task_order.desc()).first()
    elif direction == 'down':
        target_task = q.filter(Task.task_order > current_task.task_order).order_by(Task.task_order.asc()).first()
    else:
        return jsonify({'result': False, 'message': 'Invalid direction'}), 400

    if not target_task:
        return jsonify({'result': False, 'message': 'Move not possible'}), 200

    current_order = current_task.task_order
    current_task.task_order = target_task.task_order
    target_task.task_order = current_order
    
    db.session.commit()
    return jsonify({'result': True}), 200

### PATCH /task_board/<int:board_id>/rename (Rename a Board)
@app.route('/task_board/<int:board_id>/rename', methods=['PATCH'])
def rename_board(board_id):
    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing new title in request'}), 400

    new_title = request.json['title']
    board = Board.query.get_or_404(board_id)

    board.title = new_title
    db.session.commit()
    
    return jsonify({'result': True, 'board': board.to_dict()}), 200

### PATCH /tasks/<int:board_id>/<int:task_id>/rename (Rename a Task)
@app.route('/tasks/<int:board_id>/<int:task_id>/rename', methods=['PATCH'])
def rename_task(board_id, task_id):
    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing new title in request'}), 400

    new_title = request.json['title']
    task = Task.query.filter_by(id=task_id, board_id=board_id).first_or_404()
    
    task.title = new_title
    db.session.commit()
    
    return jsonify({'result': True, 'task': task.to_dict()}), 200

### PATCH /tasks/<int:board_id>/<int:task_id>/done (Toggle Task Done Status)
@app.route('/tasks/<int:board_id>/<int:task_id>/done', methods=['PATCH'])
def toggle_task_done(board_id, task_id):
    is_done = request.json.get('done')

    if is_done is None:
        return jsonify({'error': 'Missing "done" status in request'}), 400
        
    task = Task.query.filter_by(id=task_id, board_id=board_id).first_or_404()

    task.done = is_done
    db.session.commit()
    
    return jsonify({'result': True, 'task': task.to_dict()}), 200


# --- APPLICATION STARTUP ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all() 
        
    app.run(debug=True)