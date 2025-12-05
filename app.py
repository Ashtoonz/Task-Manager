from flask import Flask, jsonify, request, render_template

# Create the Flask application instance
app = Flask(__name__)

# A simple list to simulate a database for our To-Do items
task_board = [
    {
        'id': 0,
        'title': "testBoard0",
        'tasks': [
            {'id': 0, 'title': "testTask0", 'done': False},
            {'id': 0, 'title': "testTask1", 'done': False},
        ]
    },
    {
        'id': 1,
        'title': "testBoard1",
        'tasks': [
            {'id': 0, 'title': "testTask0", 'done': False},
            {'id': 0, 'title': "testTask1", 'done': False},
            {'id': 0, 'title': "testTask2", 'done': False},
        ]
    }
]

# New route to serve the main HTML file
@app.route('/')
def index():
    return render_template('index.html')

# Helper methods
def get_next_board_id():
    # Looks at all board IDs to find the maximum, ensuring unique IDs
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
    
    return jsonify({'task': new_task}), 201

### DELETE /task_board/<int:board_id> (Delete a Board)
@app.route('/task_board/<int:board_id>', methods=['DELETE'])
def delete_board(board_id):
    global task_board
    task_board = [b for b in task_board if b['id'] != board_id]
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
        return jsonify({'result': True})
        
    return jsonify({'error': 'Task not found in board'}), 404

# Run the application
if __name__ == '__main__':
    app.run(debug=True)