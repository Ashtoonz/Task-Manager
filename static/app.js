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
                tasks = ``;
                if(board.tasks.length > 0) {
                    board.tasks.forEach(task => {
                        tasks += `
                        <li>
                            <span>${task.title} (ID: ${task.id})</span>
                            <button onclick="deleteTask(${board.id}, ${task.id})">Delete</button>
                        </li>
                    `
                    });
                } else {
                    tasks = `
                        <li>
                            <span>empty</span>
                        </li>
                    `
                }

                const boardCont = document.createElement('div');
                boardCont.className = 'board';
                boardCont.innerHTML = `
                    <div class="board-header">
                        <span>${board.title} (ID: ${board.id})</span>
                        <button onclick="deleteBoard(${board.id})">Delete</button>
                    </div>
                    <ul class="task-list">
                        ${tasks}
                    </ul>
                    <form class="task-form">
                        <input type="text" id="task-title${board.id}" placeholder="New Task Title" required autocomplete="off">
                        <button type="submit">Add Task</button>
                    </form>
                `;

                taskBoard.appendChild(boardCont);

                document.querySelectorAll(".task-form").forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const title = document.getElementById(`task-title${board.id}`).value;
                    if(title) {
                        addTask(board.id, title)
                    }
                });
            });
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

// --- POST (CREATE) Board ---
function addBoard(title) {
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
        document.getElementById('board-title').value = '';
        fetchTaskBoard();
    })
    .catch(error => console.error('Error creating board:', error));
}

// --- POST (CREATE) Task ---
function addTask(board_id, title) {
    fetch(`/tasks/${board_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title, board_id: board_id})
    })
    .then(response => response.json())
    .then(data => {
        console.log('task created:', data);
        document.getElementById(`task-title${board_id}`).value = '';
        fetchTaskBoard();
    })
    .catch(error => console.error('Error creating task:', error));
}

// --- DELETE Board ---
function deleteBoard(id) {
    fetch(`/task_board/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            console.log(`Board ${id} deleted.`);
            fetchTaskBoard();
        } else {
            console.error('Failed to delete board.');
        }
    })
    .catch(error => console.error('Error deleting board:', error));
}

// --- DELETE Task ---
function deleteTask(board_id, task_id) { 
    fetch(`/tasks/${board_id}/${task_id}`, { 
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            console.log(`Task ${task_id} on Board ${board_id} deleted.`);
            fetchTaskBoard(); 
        } else {
            console.error('Failed to delete task.');
        }
    })
    .catch(error => console.error('Error deleting task:', error));
}