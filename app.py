from flask import Flask, jsonify, request, render_template

# Create the Flask application instance
app = Flask(__name__)

# A simple list to simulate a database for our To-Do items
task_board = []

# New route to serve the main HTML file
@app.route('/')
def index():
    return render_template('index.html')

# Helper to get the next ID
def get_next_board_id():
    return task_board[-1]['id'] + 1 if task_board else 1

## API Routes (Endpoints)

### 1. GET /task_board (Retrieve All Boards)
@app.route('/task_board', methods=['GET'])
def get_task_board():
    return jsonify({'task_board': task_board})

### 2. GET /task_board/<int:board_id> (Retrieve a Specific Board)
@app.route('/task_board/<int:board_id>', methods=['GET'])
def get_board(board_id):
    board = next((b for b in task_board if b['id'] == board_id), None)
    if board is None:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify({'board': board})

### 3. POST /task_board (Create a New Board)
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

### 4. DELETE /task_board/<int:board_id> (Delete a Task)
@app.route('/task_board/<int:board_id>', methods=['DELETE'])
def delete_task(board_id):
    global task_board
    task_board = [b for b in task_board if b['id'] != board_id]
    return jsonify({'result': True})

# Run the application
if __name__ == '__main__':
    app.run(debug=True)