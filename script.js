document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button');
    const sections = document.querySelectorAll('.section');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const calculatorButton = document.getElementById('calculatorButton');
    const calculatorModal = document.getElementById('calculatorModal');
    const closeCalculatorBtn = document.getElementById('closeCalculatorBtn');

    // --- Utility Functions ---
    // Function to generate a unique ID
    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Function to reload all data and re-render UI components
    function reloadAllData() {
        // Reload individual data sets
        allNotes = JSON.parse(localStorage.getItem('allNotes')) || [];
        todos = JSON.parse(localStorage.getItem('todos')) || [];
        homeworks = JSON.parse(localStorage.getItem('homeworks')) || [];
        links = JSON.parse(localStorage.getItem('links')) || [];
        pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];
        activeNoteId = localStorage.getItem('activeNoteId');

        // Re-render UI components
        renderNotesList();
        // If there's an active note, load it, otherwise set default editor content
        if (activeNoteId) {
            loadNoteIntoEditor(activeNoteId);
        } else if (allNotes.length > 0) {
            loadNoteIntoEditor(allNotes[0].id); // Load the first note if no active note
        } else {
            editor.setContents([{ insert: 'Welcome to your Study Hub Notes! Click "New Note" to get started.' }]);
            currentNoteTitleDisplay.textContent = 'Not Loaded';
        }

        renderPdfs();
        renderTodos();
        loadTimetable(); // Make sure timetable is re-rendered correctly
        renderHomeworks();
        renderLinks();
        loadDarkModePreference(); // Re-apply dark mode preference
        alert('All data reloaded!');
    }


    // --- Dark Mode Functionality ---
    function loadDarkModePreference() {
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode'); // Ensure it's off if disabled
        }
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    loadDarkModePreference(); // Load preference on start

    // --- Navigation Functionality ---
    function showSection(targetId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');

        navButtons.forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`.nav-button[data-target="${targetId}"]`).classList.add('active');
    }

    // Set initial active section (Notes)
    showSection('notesSection');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            showSection(targetId);
        });
    });


    // --- Calculator Functionality ---
    // Ensure modal is hidden on load
    calculatorModal.style.display = 'none';

    calculatorButton.addEventListener('click', () => {
        calculatorModal.style.display = 'flex'; // Use flex to center the modal
    });

    closeCalculatorBtn.addEventListener('click', () => {
        calculatorModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == calculatorModal) {
            calculatorModal.style.display = 'none';
        }
    });

    const calcDisplay = document.getElementById('calcDisplay');
    const calcButtons = document.querySelector('.calculator-buttons');
    let currentInput = '0';
    let operator = null;
    let firstOperand = null;
    let waitingForSecondOperand = false;

    function updateDisplay() {
        calcDisplay.value = currentInput;
    }

    function inputDigit(digit) {
        if (waitingForSecondOperand) {
            currentInput = digit;
            waitingForSecondOperand = false;
        } else {
            currentInput = currentInput === '0' ? digit : currentInput + digit;
        }
        updateDisplay();
    }

    function inputDecimal(dot) {
        if (waitingForSecondOperand) { // If starting a new number after an operator, always start with '0.'
            currentInput = '0.';
            waitingForSecondOperand = false;
        } else if (!currentInput.includes(dot)) {
            currentInput += dot;
        }
        updateDisplay();
    }

    function handleOperator(nextOperator) {
        const inputValue = parseFloat(currentInput);

        if (operator && waitingForSecondOperand) {
            operator = nextOperator;
            return;
        }

        if (firstOperand === null) {
            firstOperand = inputValue;
        } else if (operator) {
            const result = operate(firstOperand, inputValue, operator);
            currentInput = String(result);
            firstOperand = result;
        }

        waitingForSecondOperand = true;
        operator = nextOperator;
        updateDisplay();
    }

    function operate(num1, num2, op) {
        if (op === '+') return num1 + num2;
        if (op === '-') return num1 - num2;
        if (op === '*') return num1 * num2;
        if (op === '/') {
            if (num2 === 0) {
                alert("Cannot divide by zero!");
                return 'Error'; // Return a string to indicate error
            }
            return num1 / num2;
        }
        if (op === '%') return (num1 / 100) * num2; // percentage of a number
        return num2; // Default case
    }

    function resetCalculator() {
        currentInput = '0';
        operator = null;
        firstOperand = null;
        waitingForSecondOperand = false;
        updateDisplay();
    }

    function backspace() {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '' || currentInput === '-') { // If only '-' left or empty
            currentInput = '0';
        }
        updateDisplay();
    }

    calcButtons.addEventListener('click', (event) => {
        const { target } = event;
        if (!target.matches('button')) {
            return;
        }

        if (target.classList.contains('number')) {
            inputDigit(target.dataset.value);
            return;
        }

        if (target.dataset.value === '.') {
            inputDecimal(target.dataset.value);
            return;
        }

        if (target.classList.contains('operator')) {
            handleOperator(target.dataset.value);
            return;
        }

        if (target.dataset.action === 'equals') {
            if (operator && firstOperand !== null) { // Only calculate if there's an active operation
                const result = operate(firstOperand, parseFloat(currentInput), operator);
                currentInput = String(result);
                firstOperand = null; // Reset firstOperand after equals
                operator = null; // Clear operator
                waitingForSecondOperand = false; // Allow new calculation to start
                updateDisplay();
            }
            return;
        }

        if (target.dataset.action === 'clear') {
            resetCalculator();
            return;
        }

        if (target.dataset.action === 'backspace') {
            backspace();
            return;
        }
    });

    // Initialize calculator display
    updateDisplay();

    // --- Notes Section Functionality (Quill.js & LocalStorage for multiple notes) ---
    const editor = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Start writing your notes here...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'align': [] }],
                ['clean']
            ]
        }
    });

    const createNewNoteBtn = document.getElementById('createNewNoteBtn');
    const saveCurrentNoteBtn = document.getElementById('saveCurrentNoteBtn');
    const notesListElement = document.getElementById('notesList');
    const currentNoteTitleDisplay = document.getElementById('currentNoteTitleDisplay');

    let allNotes = JSON.parse(localStorage.getItem('allNotes')) || [];
    let activeNoteId = localStorage.getItem('activeNoteId'); // Track which note is currently open

    // Render the list of notes
    function renderNotesList() {
        notesListElement.innerHTML = ''; // Clear existing list
        if (allNotes.length === 0) {
            notesListElement.innerHTML = '<p class="placeholder-text">No notes yet. Click \'New Note\' to create one!</p>';
            return;
        }

        allNotes.forEach(note => {
            const li = document.createElement('li');
            li.className = `note-item ${note.id === activeNoteId ? 'active-note' : ''}`;
            li.dataset.noteId = note.id;
            li.innerHTML = `
                <span class="note-title">${note.title}</span>
                <div class="note-actions">
                    <button class="load-note-btn action-btn small-btn" data-note-id="${note.id}" title="Load Note"><i class="fas fa-folder-open"></i></button>
                    <button class="delete-note-btn action-btn small-btn delete-btn" data-note-id="${note.id}" title="Delete Note"><i class="fas fa-trash"></i></button>
                </div>
            `;
            notesListElement.appendChild(li);
        });
    }

    // Load a specific note into the editor
    function loadNoteIntoEditor(noteId) {
        const noteToLoad = allNotes.find(note => note.id === noteId);
        if (noteToLoad) {
            // Save the current note before loading a new one if there was an active note
            if (activeNoteId && activeNoteId !== noteId) {
                const currentNote = allNotes.find(note => note.id === activeNoteId);
                if (currentNote) {
                    currentNote.content = JSON.stringify(editor.getContents());
                    localStorage.setItem('allNotes', JSON.stringify(allNotes)); // Persist changes
                }
            }

            editor.setContents(JSON.parse(noteToLoad.content));
            currentNoteTitleDisplay.textContent = noteToLoad.title;
            activeNoteId = noteId;
            localStorage.setItem('activeNoteId', activeNoteId); // Save active note ID
            renderNotesList(); // Update active class
            // alert(`Note "${noteToLoad.title}" loaded!`); // Visual confirmation - commented for less popups
        } else {
            // If note not found (e.g., deleted), clear editor
            editor.setContents([{ insert: 'Note not found. Create a new one.' }]);
            currentNoteTitleDisplay.textContent = 'Not Loaded'; // Reset display
            activeNoteId = null;
            localStorage.removeItem('activeNoteId');
            renderNotesList();
        }
    }

    // Handle creating a new note
    createNewNoteBtn.addEventListener('click', () => {
        const noteTitle = prompt("Enter a title for your new note:");
        if (noteTitle && noteTitle.trim() !== "") {
            // Save the current note first if one is active
            if (activeNoteId) {
                const currentNote = allNotes.find(note => note.id === activeNoteId);
                if (currentNote) {
                    currentNote.content = JSON.stringify(editor.getContents());
                    localStorage.setItem('allNotes', JSON.stringify(allNotes)); // Save changes to allNotes
                }
            }

            const newNote = {
                id: generateUniqueId(),
                title: noteTitle.trim(),
                content: JSON.stringify([{ insert: 'Start writing your new note here...' }]),
                createdAt: new Date().toISOString()
            };
            allNotes.push(newNote);
            localStorage.setItem('allNotes', JSON.stringify(allNotes));
            loadNoteIntoEditor(newNote.id); // Load the new note
            alert(`New note "${newNote.title}" created!`);
        } else {
            alert("Note title cannot be empty!");
        }
    });

    // Handle saving the current note
    saveCurrentNoteBtn.addEventListener('click', () => {
        if (activeNoteId) {
            const noteToSave = allNotes.find(note => note.id === activeNoteId);
            if (noteToSave) {
                noteToSave.content = JSON.stringify(editor.getContents());
                localStorage.setItem('allNotes', JSON.stringify(allNotes));
                alert(`Note "${noteToSave.title}" saved!`);
            }
        } else {
            alert("No note selected. Create a new note first!");
        }
    });

    // Handle loading and deleting notes from the list
    notesListElement.addEventListener('click', (event) => {
        const target = event.target;
        // Use closest to ensure click on icon inside button also works
        const loadBtn = target.closest('.load-note-btn');
        const deleteBtn = target.closest('.delete-note-btn');

        if (loadBtn) {
            const noteId = loadBtn.dataset.noteId;
            loadNoteIntoEditor(noteId); // Load the clicked note
        } else if (deleteBtn) {
            const noteId = deleteBtn.dataset.noteId;
            const noteTitleToDelete = allNotes.find(note => note.id === noteId)?.title || "this note";

            if (confirm(`Are you sure you want to delete "${noteTitleToDelete}"?`)) {
                allNotes = allNotes.filter(note => note.id !== noteId);
                localStorage.setItem('allNotes', JSON.stringify(allNotes));
                renderNotesList();
                if (activeNoteId === noteId) {
                    // If the deleted note was active, clear editor and reset activeNoteId
                    editor.setContents([{ insert: 'Note deleted. Create or load another note.' }]);
                    currentNoteTitleDisplay.textContent = 'Not Loaded'; // Reset display
                    activeNoteId = null;
                    localStorage.removeItem('activeNoteId');
                }
                alert('Note deleted.');
            }
        }
    });

    // Initial load of notes list and active note
    renderNotesList();
    if (activeNoteId) {
        loadNoteIntoEditor(activeNoteId);
    } else if (allNotes.length > 0) {
        // If no activeNoteId but there are notes, load the first one
        loadNoteIntoEditor(allNotes[0].id);
    } else {
        // If no notes at all, set a default message and title
        editor.setContents([{ insert: 'Welcome to your Study Hub Notes! Click "New Note" to get started.' }]);
        currentNoteTitleDisplay.textContent = 'Not Loaded';
    }


    // --- PDF Notes (Base64 in Local Storage - for demonstration, limits apply) ---
    const pdfUploadInput = document.getElementById('pdfUploadInput');
    const uploadPdfBtn = document.getElementById('uploadPdfBtn');
    const pdfList = document.getElementById('pdfList');

    let pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];

    function renderPdfs() {
        pdfList.innerHTML = '';
        if (pdfs.length === 0) {
            pdfList.innerHTML = '<p class="placeholder-text">No PDFs uploaded yet.</p>';
            return;
        }
        pdfs.forEach((pdf, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${pdf.name}</span>
                <div class="pdf-actions">
                    <button class="view-pdf-btn action-btn small-btn" data-index="${index}"><i class="fas fa-eye"></i> View</button>
                    <button class="delete-pdf-btn action-btn small-btn delete-btn" data-index="${index}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            pdfList.appendChild(li);
        });
    }

    uploadPdfBtn.addEventListener('click', () => {
        const file = pdfUploadInput.files[0];
        if (file && file.type === 'application/pdf') {
            if (file.size > 5 * 1024 * 1024) { // Warning for files > 5MB
                alert('Warning: This PDF is very large. Storing large files in local storage may cause performance issues or exceed limits. For persistent storage, a backend server is recommended.');
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Pdf = e.target.result;
                pdfs.push({ name: file.name, data: base64Pdf });
                localStorage.setItem('pdfs', JSON.stringify(pdfs));
                renderPdfs();
                pdfUploadInput.value = ''; // Clear file input
                alert('PDF uploaded (to local storage)!');
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a PDF file.');
        }
    });

    pdfList.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-pdf-btn') || event.target.closest('.view-pdf-btn')) {
            const index = event.target.dataset.index || event.target.closest('.view-pdf-btn').dataset.index;
            const pdfData = pdfs[index].data;
            const newWindow = window.open();
            newWindow.document.write(`<iframe src="${pdfData}" style="width:100%; height:100vh;" frameborder="0"></iframe>`);
            newWindow.document.close();
        } else if (event.target.classList.contains('delete-pdf-btn') || event.target.closest('.delete-pdf-btn')) {
            const index = event.target.dataset.index || event.target.closest('.delete-pdf-btn').dataset.index;
            if (confirm(`Are you sure you want to delete "${pdfs[index].name}"?`)) {
                pdfs.splice(index, 1);
                localStorage.setItem('pdfs', JSON.stringify(pdfs));
                renderPdfs();
                alert('PDF deleted.');
            }
        }
    });

    renderPdfs(); // Render PDFs on page load

    // --- To-Do List Functionality (Local Storage) ---
    const todoInput = document.getElementById('todoInput');
    const addTodoItemBtn = document.getElementById('addTodoItemBtn');
    const todoList = document.getElementById('todoList');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    function renderTodos() {
        todoList.innerHTML = '';
        if (todos.length === 0) {
            todoList.innerHTML = '<p class="placeholder-text">No tasks yet! Add one to get started.</p>';
            return;
        }
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            li.innerHTML = `
                <span class="todo-text">${todo.text}</span>
                <div class="todo-actions">
                    <button class="complete-todo-btn action-btn small-btn" data-index="${index}"><i class="fas fa-check"></i></button>
                    <button class="delete-todo-btn action-btn small-btn delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            todoList.appendChild(li);
        });
    }

    addTodoItemBtn.addEventListener('click', () => {
        const taskText = todoInput.value.trim();
        if (taskText) {
            todos.push({ text: taskText, completed: false });
            localStorage.setItem('todos', JSON.stringify(todos));
            todoInput.value = '';
            renderTodos();
        }
    });

    todoList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-todo-btn') || event.target.closest('.delete-todo-btn')) {
            const index = event.target.dataset.index || event.target.closest('.delete-todo-btn').dataset.index;
            todos.splice(index, 1);
            localStorage.setItem('todos', JSON.stringify(todos));
            renderTodos();
        } else if (event.target.classList.contains('complete-todo-btn') || event.target.closest('.complete-todo-btn')) {
            const index = event.target.dataset.index || event.target.closest('.complete-todo-btn').dataset.index;
            todos[index].completed = !todos[index].completed;
            localStorage.setItem('todos', JSON.stringify(todos));
            renderTodos();
        }
    });

    renderTodos(); // Render todos on page load

    // Default timetable structure (if no data in local storage)

const defaultTimetableRows = [

{ time: '9:00 AM', classes: ['', '', '', '', ''] },

{ time: '10:00 AM', classes: ['', '', '', '', ''] },

{ time: '11:00 AM', classes: ['', '', '', '', ''] },

{ time: '12:00 PM', classes: ['', '', '', '', ''] },

{ time: '1:00 PM', classes: ['', '', '', '', ''] },

{ time: '2:00 PM', classes: ['', '', '', '', ''] },

{ time: '3:00 PM', classes: ['', '', '', '', ''] },

];



// Render timetable from data

function renderTimetable(data) {

timetableTableBody.innerHTML = ''; // Clear existing rows

data.forEach(rowData => {

const tr = document.createElement('tr');

tr.innerHTML = `<td>${rowData.time}</td>` +

rowData.classes.map(cls => `<td contenteditable="true" data-placeholder="Add class">${cls}</td>`).join('');

timetableTableBody.appendChild(tr);

});

}



// Load timetable data

function loadTimetable() {

const savedTimetable = localStorage.getItem('timetable');

if (savedTimetable) {

renderTimetable(JSON.parse(savedTimetable));

} else {

renderTimetable(defaultTimetableRows); // Load default if nothing saved

}

}



// Save timetable data

saveTimetableBtn.addEventListener('click', () => {

const timetableData = [];

timetableTableBody.querySelectorAll('tr').forEach(row => {

const timeCell = row.querySelector('td:first-child');

const classCells = Array.from(row.querySelectorAll('td[contenteditable="true"]'));

timetableData.push({

time: timeCell.textContent.trim(),

classes: classCells.map(cell => cell.textContent.trim())

});

});

localStorage.setItem('timetable', JSON.stringify(timetableData));

alert('Timetable saved to local storage!');

});



loadTimetable(); // Load timetable on page load


    // --- Homework Section Functionality (Local Storage) ---
    const homeworkInput = document.getElementById('homeworkInput');
    const homeworkDueDate = document.getElementById('homeworkDueDate');
    const addHomeworkItemBtn = document.getElementById('addHomeworkItemBtn');
    const homeworkList = document.getElementById('homeworkList');

    let homeworks = JSON.parse(localStorage.getItem('homeworks')) || [];

    function renderHomeworks() {
        homeworkList.innerHTML = '';
        if (homeworks.length === 0) {
            homeworkList.innerHTML = '<p class="placeholder-text">No homework assigned yet! Add one to get started.</p>';
            return;
        }
        homeworks.forEach((hw, index) => {
            const li = document.createElement('li');
            li.className = hw.completed ? 'completed' : '';
            li.innerHTML = `
                <span class="homework-text">${hw.text} (Due: ${hw.dueDate})</span>
                <div class="homework-actions">
                    <button class="complete-homework-btn action-btn small-btn" data-index="${index}"><i class="fas fa-check"></i></button>
                    <button class="delete-homework-btn action-btn small-btn delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            homeworkList.appendChild(li);
        });
    }

    addHomeworkItemBtn.addEventListener('click', () => {
        const hwText = homeworkInput.value.trim();
        const hwDue = homeworkDueDate.value;
        if (hwText && hwDue) {
            homeworks.push({ text: hwText, dueDate: hwDue, completed: false });
            localStorage.setItem('homeworks', JSON.stringify(homeworks));
            homeworkInput.value = '';
            homeworkDueDate.value = '';
            renderHomeworks();
        } else {
            alert('Please enter both homework description and due date.');
        }
    });

    homeworkList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-homework-btn') || event.target.closest('.delete-homework-btn')) {
            const index = event.target.dataset.index || event.target.closest('.delete-homework-btn').dataset.index;
            homeworks.splice(index, 1);
            localStorage.setItem('homeworks', JSON.stringify(homeworks));
            renderHomeworks();
        } else if (event.target.classList.contains('complete-homework-btn') || event.target.closest('.complete-homework-btn')) {
            const index = event.target.dataset.index || event.target.closest('.complete-homework-btn').dataset.index;
            homeworks[index].completed = !homeworks[index].completed;
            localStorage.setItem('homeworks', JSON.stringify(homeworks));
            renderHomeworks();
        }
    });

    renderHomeworks(); // Render homeworks on page load

    // --- Links Section Functionality (Local Storage) ---
    const linkNameInput = document.getElementById('linkNameInput');
    const linkUrlInput = document.getElementById('linkUrlInput');
    const addLinkItemBtn = document.getElementById('addLinkItemBtn');
    const linksList = document.getElementById('linksList');

    let links = JSON.parse(localStorage.getItem('links')) || [];

    function renderLinks() {
        linksList.innerHTML = '';
        if (links.length === 0) {
            linksList.innerHTML = '<p class="placeholder-text">No links yet! Add one to get started.</p>';
            return;
        }
        links.forEach((link, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="${link.url}" target="_blank">${link.name}</a>
                <button class="delete-link-btn action-btn small-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            linksList.appendChild(li);
        });
    }

    addLinkItemBtn.addEventListener('click', () => {
        const linkName = linkNameInput.value.trim();
        const linkUrl = linkUrlInput.value.trim();
        if (linkName && linkUrl) {
            try {
                new URL(linkUrl); // Validate URL
                links.push({ name: linkName, url: linkUrl });
                localStorage.setItem('links', JSON.stringify(links));
                linkNameInput.value = '';
                linkUrlInput.value = '';
                renderLinks();
            } catch (e) {
                alert('Please enter a valid URL.');
            }
        } else {
            alert('Please enter both link name and URL.');
        }
    });

    linksList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-link-btn') || event.target.closest('.delete-link-btn')) {
            const index = event.target.dataset.index || event.target.closest('.delete-link-btn').dataset.index;
            links.splice(index, 1);
            localStorage.setItem('links', JSON.stringify(links));
            renderLinks();
        }
    });

    renderLinks(); // Render links on page load

    // --- Backup and Restore Functionality ---
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    const importDataBtn = document.getElementById('importDataBtn');

    exportDataBtn.addEventListener('click', () => {
        const allAppData = {
            allNotes: JSON.parse(localStorage.getItem('allNotes')),
            activeNoteId: localStorage.getItem('activeNoteId'),
            todos: JSON.parse(localStorage.getItem('todos')),
            timetable: JSON.parse(localStorage.getItem('timetable')),
            homeworks: JSON.parse(localStorage.getItem('homeworks')),
            links: JSON.parse(localStorage.getItem('links')),
            pdfs: JSON.parse(localStorage.getItem('pdfs')),
            darkMode: localStorage.getItem('darkMode')
        };

        const dataStr = JSON.stringify(allAppData, null, 2); // Pretty print JSON
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');
    });

    importDataBtn.addEventListener('click', () => {
        const file = importFileInput.files[0];
        if (!file) {
            alert('Please select a JSON backup file to import.');
            return;
        }

        if (file.type !== 'application/json') {
            alert('Invalid file type. Please select a JSON file.');
            return;
        }

        if (!confirm('Importing data will OVERWRITE all your current Study Hub data. Are you sure you want to proceed?')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Basic validation to ensure it's a valid backup structure
                if (importedData && typeof importedData === 'object' &&
                    importedData.allNotes !== undefined &&
                    importedData.todos !== undefined &&
                    importedData.timetable !== undefined) {

                    localStorage.setItem('allNotes', JSON.stringify(importedData.allNotes));
                    if (importedData.activeNoteId !== undefined) {
                        localStorage.setItem('activeNoteId', importedData.activeNoteId);
                    } else {
                        localStorage.removeItem('activeNoteId');
                    }
                    localStorage.setItem('todos', JSON.stringify(importedData.todos));
                    localStorage.setItem('timetable', JSON.stringify(importedData.timetable));
                    localStorage.setItem('homeworks', JSON.stringify(importedData.homeworks));
                    localStorage.setItem('links', JSON.stringify(importedData.links));
                    localStorage.setItem('pdfs', JSON.stringify(importedData.pdfs));
                    if (importedData.darkMode !== undefined) {
                        localStorage.setItem('darkMode', importedData.darkMode);
                    } else {
                         localStorage.removeItem('darkMode'); // Clear if not in backup
                    }

                    reloadAllData(); // Re-initialize all UI components with new data
                    alert('Data imported successfully!');

                } else {
                    alert('Invalid backup file format. Please select a valid Study Hub backup JSON.');
                }
            } catch (error) {
                console.error('Error parsing or importing data:', error);
                alert('An error occurred during data import. Please check the file format.');
            }
        };
        reader.readAsText(file);
    });

});