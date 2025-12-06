document.addEventListener('DOMContentLoaded', fetchTaskBoard);

const taskBoard = document.getElementById('task-board');
const boardForm = document.getElementById('board-form');

// Dropdown Menu for Tasks
function showTaskDropdown(board_id, task_id) {
    document.getElementById(`task-dropdown-${board_id}-${task_id}`).classList.toggle("show");
}

// Dropdown Menu for Boards
function showBoardDropdown(board_id) {
    document.getElementById(`board-dropdown-${board_id}`).classList.toggle("show");
}

// Close Dropdown Menus When Screen is Clicked
window.onclick = function(event) {
    if (!event.target.matches('.task-dropdown-btn')) {
        var dropdowns = document.getElementsByClassName("task-dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
    if (!event.target.matches('.board-dropdown-btn')) {
        var dropdowns = document.getElementsByClassName("board-dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function closeDropdown(elementId) {
    const dropdown = document.getElementById(elementId);
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
}

// --- GET (READ) Task Board ---
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
                            <li class="task" onmouseleave="closeDropdown('task-dropdown-${board.id}-${task.id}')">
                                <span>
                                <button class="mark-done-btn">✓</button>
                                </span>
                                <span>${task.title}</span>
                                <span class="task-edit appear-on-hover ">
                                    <button class="task-dropdown-btn" onclick="showTaskDropdown(${board.id}, ${task.id})">≡</button>
                                    <div id="task-dropdown-${board.id}-${task.id}" class="task-dropdown-content">
                                        <button>Move Up</button>
                                        <button>Move Down</button>
                                        <button>Rename</button>
                                    </div>
                                    <button class="delete-task-btn" onclick="deleteTask(${board.id}, ${task.id})">X</button>
                                </span>
                            </li>
                        `
                    });
                } else {
                    tasks = `
                        <li class="task">
                            <span>No tasks yet. You should add one!</span>
                        </li>
                    `
                }

                const boardCont = document.createElement('div');
                boardCont.className = 'board';
                boardCont.innerHTML = `
                    <div class="board-header">
                        <span><b>${board.title}</b></span>
                        <span class="board-edit appear-on-hover ">
                            <button class="board-dropdown-btn" onclick="showBoardDropdown(${board.id})">≡</button>
                            <div id="board-dropdown-${board.id}" class="board-dropdown-content">
                                <button>Move Left</button>
                                <button>Move Right</button>
                                <button>Rename</button>
                            </div>
                            <button class="delete-board-btn" onclick="deleteBoard(${board.id})">X</button>
                        </span>
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