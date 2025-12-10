document.addEventListener('DOMContentLoaded', function() {
    fetchTaskBoard(); 

    setInterval(fetchTaskBoard, 1000); 
});

const taskBoard = document.getElementById('task-board');
const boardForm = document.getElementById('board-form');
var prevData;

// Dropdown Menu for Tasks
function showTaskDropdown(board_id, task_id) {
    document.getElementById(`task-dropdown-${board_id}-${task_id}`).classList.toggle("show");
}

// Dropdown Menu for Boards
function showBoardDropdown(board_id) {
    document.getElementById(`board-dropdown-${board_id}`).classList.toggle("show");
}

function closeDropdown(elementId) {
    const dropdown = document.getElementById(elementId);
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
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

// --- GET (READ) Task Board ---
function fetchTaskBoard() {
    fetch('/task_board')
        .then(response => response.json())
        .then(data => {
            if(taskBoard.innerHTML.trim() === '') {
                initTaskBoardContent(data);
                prevData = data;
            }
            refreshTaskBoardContent(data);

            prevData = data;
        })
        .catch(error => console.error('Error fetching task board:', error));
}

function initTaskBoardContent(data) {
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
}

function refreshTaskBoardContent(data) {
    for (let i = 0; i < taskBoard.children.length; i++) {
        const child = taskBoard.children[i];
        if (child.id) {
            if(child.id == 'board-add')
                continue;
            const board_id = child.id.split("-")[1];
            if(data.task_board.findIndex(b => b.id == board_id) == -1) {
                child.remove();
                i --;
            }
        }
    }

    data.task_board.forEach(board => {
        if(document.getElementById(`board-${board.id}`)) {
            const boardElement = document.getElementById(`board-${board.id}`);

            const arrayIndex = data.task_board.findIndex(b => b.id == board.id);
            const elementIndex = Array.prototype.indexOf.call(taskBoard.children, boardElement);
            if(arrayIndex != elementIndex) {
                const boardNextSibling = boardElement.nextSibling;
                const prevBoard = taskBoard.children[arrayIndex]

                taskBoard.insertBefore(boardElement, taskBoard.children[arrayIndex]);
                taskBoard.insertBefore(prevBoard, boardNextSibling);
            }

            boardElement.querySelector('span').innerHTML = `<b>${board.title}</b>`;

            refreshBoardTasks(boardElement, board);
            return;
        }

        const boardCont = document.createElement('div');
        boardCont.className = 'board';
        boardCont.id = `board-${board.id}`
        boardCont.innerHTML = `
            <div class="board-header" onmouseleave="closeDropdown('board-dropdown-${board.id}')">
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
            </ul>
            <form class="task-form">
                <input type="text" id="task-title${board.id}" placeholder="New Task Title" required autocomplete="off">
                <button type="submit">Add Task</button>
            </form>
        `;

        const boardIndex = data.task_board.findIndex(b => b.id == board.id);

        if(boardIndex == 0 || boardIndex == -1) {
            taskBoard.insertBefore(boardCont, taskBoard.firstChild)
        } else {
            taskBoard.insertBefore(boardCont, document.getElementById(`board-${data.task_board[boardIndex-1].id}`).nextSibling)
        }

        refreshBoardTasks(boardCont, board);

        const taskForm = boardCont.querySelector('.task-form'); 
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = boardCont.querySelector(`#task-title${board.id}`).value; 
            if(title) {
                addTask(board.id, title);
            }
        });
    });
}

function refreshBoardTasks(boardCont, board) {
    const taskList = boardCont.querySelector('.task-list');
    console.log(taskList.children.length);
    for (let i = 0; i < taskList.children.length; i++) {
        const child = taskList.children[i];
        if (child.id) {
            if(child.id == 'task-add')
                continue;
            const task_id = child.id.split("-")[2];
            if(board.tasks.findIndex(t => t.id == task_id) == -1) {
                child.remove();
                i --;
            }
        }
    }

    if(board.tasks.length > 0) {
        boardCont.querySelector('.task-placeholder')?.remove();
        board.tasks.forEach(task => {
            const taskCont = document.createElement('li');
            if(document.getElementById(`task-${board.id}-${task.id}`)) {
                const taskElement = document.getElementById(`task-${board.id}-${task.id}`);
                
                const arrayIndex = board.tasks.findIndex(t => t.id == task.id);
                const elementIndex = Array.prototype.indexOf.call(taskList.children, taskElement);
                if(arrayIndex != elementIndex) {
                    const taskNextSibling = taskElement.nextSibling;
                    const prevTask = taskList.children[arrayIndex]

                    taskList.insertBefore(taskElement, taskList.children[arrayIndex]);
                    taskList.insertBefore(prevTask, taskNextSibling);
                }

                const doneClass = task.done ? 'task-done' : '';
                taskElement.className = `task ${doneClass}`;
                taskElement.querySelector('.task-title').innerHTML = `${task.title}`;

                return;
            }

            const doneClass = task.done ? 'task-done' : '';
            taskCont.className = `task ${doneClass}`;
            taskCont.id = `task-${board.id}-${task.id}`;
            taskCont.addEventListener('mouseleave', function() {
                closeDropdown(`task-dropdown-${board.id}-${task.id}`);
            });

            taskCont.innerHTML += `
                <span>
                    <button class="mark-done-btn" onclick="toggleTaskDone(${board.id}, ${task.id})">✓</button>
                </span>
                <span class="task-title">${task.title}</span>
                <span class="task-edit appear-on-hover ">
                    <button class="task-dropdown-btn" onclick="showTaskDropdown(${board.id}, ${task.id})">≡</button>
                    <div id="task-dropdown-${board.id}-${task.id}" class="task-dropdown-content">
                        <button onclick="moveTask(${board.id}, ${task.id}, 'up')">Move Up</button>
                        <button onclick="moveTask(${board.id}, ${task.id}, 'down')">Move Down</button>
                        <button onclick="renameTask(${board.id}, ${task.id}, 'right')">Rename</button>
                    </div>
                    <button class="delete-task-btn" onclick="deleteTask(${board.id}, ${task.id})">X</button>
                </span>
            `

            const taskIndex = board.tasks.findIndex(t => t.id == task.id);

            if(taskList.children.length == 0) {
                taskList.appendChild(taskCont);
            } else if(taskIndex == 0 || taskIndex == -1) {
                taskList.insertBefore(taskCont, taskList.firstChild)
            } else {
                if(taskList.children.length > 1){
                    taskList.insertBefore(taskCont, document.getElementById(`task-${board.id}-${board.tasks[taskIndex-1].id}`).nextSibling);
                } else {
                    taskList.appendChild(taskCont);
                }
            }
        });
    } else {
        taskList.innerHTML = `
            <li class="task task-placeholder">
                <span>No tasks yet. You should add one!</span>
            </li>
        `;
    }
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
function toggleTaskDone(board_id, task_id) {
    const current_status = document.getElementById(`task-${board_id}-${task_id}`).classList.length > 1;
    const new_status = !current_status;

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

// Helper methods
function shallowEqual(objA, objB) {
    if (objA === objB) return true;
    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
            return false;
        }
    }
    return true;
}