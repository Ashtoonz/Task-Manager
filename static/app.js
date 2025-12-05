document.addEventListener('DOMContentLoaded', fetchTaskBoard);

const taskBoard = document.getElementById('task-board');
const boardForm = document.getElementById('board-form');

// --- GET (READ) Tasks ---
function fetchTaskBoard() {
    fetch('/task_board')
        .then(response => response.json())
        .then(data => {
            taskBoard.innerHTML = '';
            data.task_board.forEach(board => {
                const boardCont = document.createElement('div');
                boardCont.className = 'board';
                boardCont.innerHTML = `
                    <div class="board-header">
                        <span>${board.title} (ID: ${board.id})</span>
                        <button onclick="deleteBoard(${board.id})">Delete</button>
                    </div>
                    <form class="task-form">
                        <input type="text" id="task-title${board.id}" placeholder="New Task Title" required autocomplete="off">
                        <button type="submit">Add Task</button>
                    </form>

                    <ul class="task-list">
                    </ul>
                `;

                taskBoard.appendChild(boardCont);
            });

            const boardAdd = document.createElement('form');
            boardAdd.id = 'board-form';
            boardAdd.innerHTML = `
                <input type="text" id="board-title" placeholder="New Board Title" required autocomplete="off">
                <button type="submit">Add Board</button>
            `;
            boardAdd.addEventListener('submit', function(e) {
                e.preventDefault();
                const title = document.getElementById('board-title').value;
                if(title) {
                    addBoard(title);
                }
            });

            taskBoard.appendChild(boardAdd);
        })
        .catch(error => console.error('Error fetching task board:', error));
}

// --- POST (CREATE) Task ---
function addBoard(title) {
    console.log("awsaw")

    fetch('/task_board', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Board created:', data);
        document.getElementById('board-title').value = ''; // Clear input
        fetchTaskBoard(); // Refresh the list
    })
    .catch(error => console.error('Error creating board:', error));
}

// --- DELETE Task ---
function deleteBoard(id) {
    fetch(`/task_board/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) { // Check for a successful (e.g., 200) response
            console.log(`Board ${id} deleted.`);
            fetchTaskBoard(); // Refresh the list
        } else {
            console.error('Failed to delete board.');
        }
    })
    .catch(error => console.error('Error deleting board:', error));
}