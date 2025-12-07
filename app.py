import json
import os
from filelock import FileLock
from flask import Flask, jsonify, request, render_template

# Create the Flask application instance
app = Flask(__name__)

# Initialize Task Board
DATA_FILE = 'task_board_data.json'
task_board = []

# Define the lock file object
LOCK_FILE = DATA_FILE + ".lock"
file_lock = FileLock(LOCK_FILE) # <-- NEW: Instantiate the lock object

# Save and load data methods
def load_data():
    global task_board
    try:
        with file_lock:
            with open(DATA_FILE, 'r') as f:
                task_board = json.load(f)
                print(f"Loaded {len(task_board)} boards from {DATA_FILE}.")
    except FileNotFoundError:
        task_board = []
        print("No data file found. Starting with an empty board.")
    except json.JSONDecodeError:
        task_board = []
        print("Error decoding JSON file. Starting with an empty board.")
    except Exception as e:
        print(f"Error during load: {e}")


def save_data():
    try:
        with file_lock:
            with open(DATA_FILE, 'w') as f:
                json.dump(task_board, f, indent=4)
                print(f"Saved {len(task_board)} boards to {DATA_FILE}.")
    except Exception as e:
        print(f"Error saving data: {e}")

# New route to serve the main HTML file
@app.route('/')
def index():
    return render_template('index.html')

# Helper methods
def get_next_board_id():
    max_id = max(b['id'] for b in task_board) if task_board else 0
    return max_id + 1

def find_board(board_id):
    return next((b for b in task_board if b['id'] == board_id), None)

def get_next_task_id(board_id):
    board = find_board(board_id)
    if not board:
        return 1 
        
    if board['tasks']:
        max_task_id = max(t['id'] for t in board['tasks'])
        return max_task_id + 1
    return 1

## API Routes (Endpoints)

### GET /task_board (Retrieve All Boards)
@app.route('/task_board', methods=['GET'])
def get_task_board():
    return jsonify({'task_board': task_board})

### GET /task_board/<int:board_id> (Retrieve a Specific Board)
@app.route('/task_board/<int:board_id>', methods=['GET'])
def get_board(board_id):
    board = next((b for b in task_board if b['id'] == board_id), None)
    if board is None:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify({'board': board})

### POST /task_board (Create a New Board)
@app.route('/task_board', methods=['POST'])
def create_board():
    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing title'}), 400

    new_board = {
        'id': get_next_board_id(),
        'title': request.json['title'],
        'tasks': []
    }
    task_board.append(new_board)
    save_data()
    return jsonify({'board': new_board}), 201

### POST /task_board/task (Create a New Board)
@app.route('/tasks/<int:board_id>', methods=['POST'])
def create_task(board_id):
    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing title'}), 400

    board = find_board(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    new_id = get_next_task_id(board_id)

    new_task = {
        'id': new_id,
        'title': request.json['title'],
        'done': False,
    }
    
    board['tasks'].append(new_task)
    save_data()
    
    return jsonify({'task': new_task}), 201

### DELETE /task_board/<int:board_id> (Delete a Board)
@app.route('/task_board/<int:board_id>', methods=['DELETE'])
def delete_board(board_id):
    global task_board
    task_board = [b for b in task_board if b['id'] != board_id]
    save_data()
    return jsonify({'result': True})

### DELETE /task_board/<int:board_id>/<int:task_id> (Delete a Task)
@app.route('/tasks/<int:board_id>/<int:task_id>', methods=['DELETE'])
def delete_task(board_id, task_id):
    board = find_board(board_id)
    
    if not board:
        return jsonify({'error': 'Board not found'}), 404

    original_task_count = len(board['tasks'])
    board['tasks'] = [t for t in board['tasks'] if t['id'] != task_id]
    
    if len(board['tasks']) < original_task_count:
        save_data()
        return jsonify({'result': True})
        
    return jsonify({'error': 'Task not found in board'}), 404

### PATCH /task_board/<int:board_id>/move (Move a Task)
@app.route('/task_board/<int:board_id>/move', methods=['PATCH'])
def move_board(board_id):
    direction = request.json.get('direction')
    
    board_index = next((i for i, t in enumerate(task_board) if t['id'] == board_id), -1)
    
    if board_index == -1:
        return jsonify({'error': 'Task not found'}), 404

    if direction == 'left' and board_index > 0:
        task_board[board_index], task_board[board_index - 1] = task_board[board_index - 1], task_board[board_index]
        save_data()
    elif direction == 'right' and board_index < len(task_board) - 1:
        task_board[board_index], task_board[board_index + 1] = task_board[board_index + 1], task_board[board_index]
        save_data()
    else:
        return jsonify({'result': False, 'message': 'Move not possible'}), 200

    return jsonify({'result': True}), 200

### PATCH /tasks/<int:board_id>/<int:task_id>/move (Move a Task)
@app.route('/tasks/<int:board_id>/<int:task_id>/move', methods=['PATCH'])
def move_task(board_id, task_id):
    direction = request.json.get('direction')
    
    board = find_board(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
        
    tasks = board['tasks']
    task_index = next((i for i, t in enumerate(tasks) if t['id'] == task_id), -1)
    
    if task_index == -1:
        return jsonify({'error': 'Task not found'}), 404

    if direction == 'up' and task_index > 0:
        tasks[task_index], tasks[task_index - 1] = tasks[task_index - 1], tasks[task_index]
        save_data()
    elif direction == 'down' and task_index < len(tasks) - 1:
        tasks[task_index], tasks[task_index + 1] = tasks[task_index + 1], tasks[task_index]
        save_data()
    else:
        return jsonify({'result': False, 'message': 'Move not possible'}), 200

    return jsonify({'result': True}), 200

### PATCH /task_board/<int:board_id>/rename (Rename a Board)
@app.route('/task_board/<int:board_id>/rename', methods=['PATCH'])
def rename_board(board_id):
    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing new title in request'}), 400

    new_title = request.json['title']
    board = find_board(board_id)

    if not board:
        return jsonify({'error': 'Board not found'}), 404

    board['title'] = new_title
    save_data()
    return jsonify({'result': True, 'board': board}), 200

### PATCH /tasks/<int:board_id>/<int:task_id>/rename (Rename a Task)
@app.route('/tasks/<int:board_id>/<int:task_id>/rename', methods=['PATCH'])
def rename_task(board_id, task_id):
    if not request.json or 'title' not in request.json:
        return jsonify({'error': 'Missing new title in request'}), 400

    new_title = request.json['title']
    board = find_board(board_id)
    
    if not board:
        return jsonify({'error': 'Board not found'}), 404

    task = next((t for t in board['tasks'] if t['id'] == task_id), None)
    
    if task is None:
        return jsonify({'error': 'Task not found'}), 404

    task['title'] = new_title
    save_data()
    return jsonify({'result': True, 'task': task}), 200

### PATCH /tasks/<int:board_id>/<int:task_id>/done (Toggle Task Done Status)
@app.route('/tasks/<int:board_id>/<int:task_id>/done', methods=['PATCH'])
def toggle_task_done(board_id, task_id):
    is_done = request.json.get('done')

    board = find_board(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
        
    task = next((t for t in board['tasks'] if t['id'] == task_id), None)
    
    if task is None:
        return jsonify({'error': 'Task not found'}), 404

    if is_done is not None:
        task['done'] = is_done
        save_data()
        return jsonify({'result': True, 'task': task}), 200
    else:
        return jsonify({'error': 'Missing "done" status in request'}), 400

# Run the application
if __name__ == '__main__':
    load_data() 
    # The debug check prevents running the built-in Flask server when Gunicorn is used
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true': 
        app.run(debug=True)