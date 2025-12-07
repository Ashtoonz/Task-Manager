document.addEventListener('DOMContentLoaded', function() {
    fetchTaskBoard(); 
    startPolling(); 
});

const taskBoard = document.getElementById('task-board');
const boardForm = document.getElementById('board-form');
let fetchInterval = null;

// --- POLLING CONTROL FUNCTIONS ---

function startPolling() {
    if (!fetchInterval) {
        fetchInterval = setInterval(fetchTaskBoard, 1000); 
        console.log("Polling started.");
    }
}

function stopPolling() {
    if (fetchInterval) {
        clearInterval(fetchInterval);
        fetchInterval = null;
        console.log("Polling stopped.");
    }
}

function attachPollingListeners() {
    // Attach event listeners to ALL text inputs (board forms, task forms, etc.)
    document.querySelectorAll('input[type="text"]').forEach(input => {
        // When the input gains focus (user clicks in), stop polling
        input.addEventListener('focus', stopPolling);
        // When the input loses focus (user clicks away), restart polling
        input.addEventListener('blur', startPolling);
    });
}

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
    const focusedElement = document.activeElement;
    const focusedElementId = focusedElement.id;
    let focusedElementValue = null;

    if (focusedElement && focusedElement.matches('input[type="text"]')) {
        focusedElementValue = focusedElement.value;
    }

    const openDropdownIds = [];
    document.querySelectorAll('.task-dropdown-content.show, .board-dropdown-content.show').forEach(dropdown => {
        openDropdownIds.push(dropdown.id);
    });

    fetch('/task_board')
        .then(response => response.json())
        .then(data => {
            taskBoard.innerHTML = '';
            data.task_board.forEach(board => {
                tasks = ``;
                if(board.tasks.length > 0) {
                    board.tasks.forEach(task => {
                        const doneClass = task.done ? 'task-done' : '';

                        tasks += `
                            <li class="task ${doneClass}" onmouseleave="closeDropdown('task-dropdown-${board.id}-${task.id}')">
                                <span>
                                    <button class="mark-done-btn" onclick="toggleTaskDone(${board.id}, ${task.id}, ${task.done})">✓</button>
                                </span>
                                <span>${task.title}</span>
                                <span class="task-edit appear-on-hover ">
                                    <button class="task-dropdown-btn" onclick="showTaskDropdown(${board.id}, ${task.id})">≡</button>
                                    <div id="task-dropdown-${board.id}-${task.id}" class="task-dropdown-content">
                                        <button onclick="moveTask(${board.id}, ${task.id}, 'up')">Move Up</button>
                                        <button onclick="moveTask(${board.id}, ${task.id}, 'down')">Move Down</button>
                                        <button onclick="renameTask(${board.id}, ${task.id}, 'right')">Rename</button>
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
                                <button onclick="moveBoard(${board.id}, 'left')">Move Left</button>
                                <button onclick="moveBoard(${board.id}, 'right')">Move Right</button>
                                <button onclick="renameBoard(${board.id}, 'right')">Rename</button>
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
                
                const taskForm = boardCont.querySelector('.task-form'); 
                taskForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const title = boardCont.querySelector(`#task-title${board.id}`).value; 
                    if(title) {
                        addTask(board.id, title);
                    }
                });

                taskBoard.appendChild(boardCont);
            });

            const boardAdd = document.createElement('div');
            boardAdd.id = 'board-add';
            boardAdd.innerHTML = `
                <form id="board-form">
                    <input type="text" id="board-title" placeholder="New Board Title" required autocomplete="off">
                    <button type="submit">Add Board</button>
                </form>
            `;
            taskBoard.appendChild(boardAdd);
            
            document.getElementById('board-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const title = document.getElementById('board-title').value;
                if(title) {
                    addBoard(title);
                }
            });


            if (focusedElementId && focusedElementValue !== null) {
                const newFocusedElement = document.getElementById(focusedElementId);
                if (newFocusedElement) {
                    newFocusedElement.value = focusedElementValue;
                    newFocusedElement.focus();
                }
            }

            openDropdownIds.forEach(id => {
                const newDropdown = document.getElementById(id);
                if (newDropdown) {
                    newDropdown.classList.add('show'); 
                }
            });

            attachPollingListeners();
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

// --- PATCH (MOVE) Board Left or Right ---
function moveBoard(board_id, direction) {
    fetch(`/task_board/${board_id}/move`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction: direction })
    })
    .then(response => {
        if (response.ok) {
            console.log(`Board ${board_id} moved ${direction}.`);
            fetchTaskBoard(); 
        } else {
            console.error(`Failed to move board ${direction}.`);
        }
    })
    .catch(error => console.error('Error moving board:', error));
}

// --- PATCH (MOVE) Task Up or Down ---
function moveTask(board_id, task_id, direction) {
    fetch(`/tasks/${board_id}/${task_id}/move`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction: direction })
    })
    .then(response => {
        if (response.ok) {
            console.log(`Task ${task_id} moved ${direction}.`);
            fetchTaskBoard(); 
        } else {
            console.error(`Failed to move task ${direction}.`);
        }
    })
    .catch(error => console.error('Error moving task:', error));
}

// --- PATCH (UPDATE) Board Title ---
function renameBoard(board_id) {
    const new_title = prompt("Enter the new title for this board:");
    
    if (!new_title) {
        return; 
    }

    fetch(`/task_board/${board_id}/rename`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: new_title })
    })
    .then(response => {
        if (response.ok) {
            console.log(`Board ${board_id} renamed to "${new_title}".`);
            fetchTaskBoard();
        } else {
            console.error('Failed to rename board.');
        }
    })
    .catch(error => console.error('Error renaming board:', error));
}

// --- PATCH (UPDATE) Task Title ---
function renameTask(board_id, task_id) {
    const new_title = prompt("Enter the new title for this task:");
    
    if (!new_title) {
        return; 
    }

    fetch(`/tasks/${board_id}/${task_id}/rename`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: new_title })
    })
    .then(response => {
        if (response.ok) {
            console.log(`Task ${task_id} renamed to "${new_title}".`);
            fetchTaskBoard(); 
        } else {
            console.error('Failed to rename task.');
        }
    })
    .catch(error => console.error('Error renaming task:', error));
}

// --- PATCH (UPDATE) Task Done Status ---
function toggleTaskDone(board_id, task_id, current_status) {
    const new_status = !current_status; // Toggle the status

    fetch(`/tasks/${board_id}/${task_id}/done`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ done: new_status })
    })
    .then(response => {
        if (response.ok) {
            console.log(`Task ${task_id} done status toggled to ${new_status}.`);
            fetchTaskBoard(); 
        } else {
            console.error('Failed to toggle task done status.');
        }
    })
    .catch(error => console.error('Error toggling task done status:', error));
}