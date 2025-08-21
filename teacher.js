// --- Firebase config and initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyAJhDnZ0G9sN8UGddnIOu0hpIdhCP7xHV8",
  authDomain: "lumina-ai-7d702.firebaseapp.com",
  databaseURL: "https://lumina-ai-7d702-default-rtdb.firebaseio.com",
  projectId: "lumina-ai-7d702",
  storageBucket: "lumina-ai-7d702.appspot.com",
  messagingSenderId: "481682375832",
  appId: "1:481682375832:web:6985bef13bbe9391b23ced",
  measurementId: "G-0TESFWWV4G"
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const db = firebase.database();

// Tab switching logic
const notesTab = document.getElementById('uploadNotesTab');
const gamesTab = document.getElementById('uploadGamesTab');
const activitiesTab = document.getElementById('uploadActivitiesTab');
const notesContent = document.getElementById('uploadNotesContent');
const gamesContent = document.getElementById('uploadGamesContent');
// If you add activities tab, add its content div here

function setActiveTab(tab) {
    notesTab.classList.remove('active');
    gamesTab.classList.remove('active');
    // activitiesTab.classList.remove('active'); // Uncomment if you add activities
    notesContent.style.display = 'none';
    gamesContent.style.display = 'none';
    // document.getElementById('uploadActivitiesContent').style.display = 'none'; // Uncomment if you add activities

    if(tab === 'notes') {
        notesTab.classList.add('active');
        notesContent.style.display = '';
    } else if(tab === 'games') {
        gamesTab.classList.add('active');
        gamesContent.style.display = '';
    } // else if(tab === 'activities') { ... }
}

notesTab.onclick = () => setActiveTab('notes');
gamesTab.onclick = () => setActiveTab('games');
// activitiesTab.onclick = () => setActiveTab('activities'); // Uncomment if you add activities

// Drag & drop logic for upload notes
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
let selectedFile = null;

// Prevent double file picker popup
fileInput.addEventListener('click', function(e) {
    e.stopPropagation();
});
const selectFileLabel = dropZone.querySelector('label');
if (selectFileLabel) {
    selectFileLabel.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.style.borderColor = '#222';
});
dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropZone.style.borderColor = '#baff80';
});
dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.style.borderColor = '#baff80';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        selectedFile = e.dataTransfer.files[0];
        fileName.textContent = selectedFile.name;
    }
});
fileInput.addEventListener('change', function(e) {
    if (fileInput.files && fileInput.files[0]) {
        selectedFile = fileInput.files[0];
        fileName.textContent = selectedFile.name;
    }
});
dropZone.addEventListener('click', function() {
    fileInput.click();
});
document.getElementById('uploadBtn').onclick = async function() {
    const year = document.getElementById('noteYear').value;
    const customFileName = document.getElementById('noteFileName').value.trim();
    if (!year) {
        alert('Please select the year for this note.');
        return;
    }
    if (!customFileName) {
        alert('Please enter a file name.');
        return;
    }
    if (!selectedFile) {
        alert('Please select a file to upload.');
        return;
    }
    showLoading();
    // Upload file to Firebase Storage
    const storageRef = storage.ref('notes/' + Date.now() + '_' + selectedFile.name);
    try {
        const snapshot = await storageRef.put(selectedFile);
        const fileUrl = await snapshot.ref.getDownloadURL();
        // Save metadata to Realtime Database
        const noteData = {
            fileName: customFileName,
            year: document.getElementById('noteYear').options[document.getElementById('noteYear').selectedIndex].text,
            fileUrl: fileUrl,
            uploadedAt: new Date().toISOString(),
            teacherName: "Anonymous", // Replace with actual teacher name if available
            starReview: 0
        };
        await db.ref('notes').push(noteData);
        // Add to recent notes (local UI)
        recentNotes.unshift({
            name: customFileName,
            year: noteData.year,
            date: new Date()
        });
        if (recentNotes.length > 5) recentNotes.pop();
        renderRecentNotes();
        alert('File "' + customFileName + '" for ' + noteData.year + ' uploaded successfully!');
        // Reset UI
        selectedFile = null;
        fileInput.value = '';
        fileName.textContent = '';
        document.getElementById('noteYear').selectedIndex = 0;
        document.getElementById('noteFileName').value = '';
    } catch (err) {
        alert('Upload failed: ' + err.message);
    } finally {
        hideLoading();
    }
};

// Helper for formatting date
function formatDate(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Recent uploads arrays
let recentNotes = [];
let recentGames = [];

function renderRecentNotes() {
    const list = document.getElementById('recentNotesList');
    list.innerHTML = recentNotes.length === 0
        ? '<div style="color:#888;">No uploads yet.</div>'
        : recentNotes.map(n =>
            `<div style="background:#f8f8f8; border-radius:8px; padding:12px 18px; box-shadow:0 1px 2px #0001; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <b>${n.name}</b><br>
                    <span style="font-size:0.97em; color:#555;">${n.year} &middot; ${formatDate(n.date)}</span>
                </div>
            </div>`
        ).join('');
}

// Drag & drop logic for upload games
const gameDropZone = gamesContent.querySelector('div[style*="dashed #3ec6ff"]');
const gameFileInput = document.getElementById('gameFileInput');
const gameFileName = document.getElementById('gameFileName');
let selectedGameFile = null;

// Prevent double file picker popup for upload games
gameFileInput.addEventListener('click', function(e) {
    e.stopPropagation();
});
const selectGameFileLabel = gameDropZone.querySelector('label');
if (selectGameFileLabel) {
    selectGameFileLabel.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

gameDropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    gameDropZone.style.borderColor = '#222';
});
gameDropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    gameDropZone.style.borderColor = '#3ec6ff';
});
gameDropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    gameDropZone.style.borderColor = '#3ec6ff';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        selectedGameFile = e.dataTransfer.files[0];
        gameFileName.textContent = selectedGameFile.name;
    }
});
gameFileInput.addEventListener('change', function(e) {
    if (gameFileInput.files && gameFileInput.files[0]) {
        selectedGameFile = gameFileInput.files[0];
        gameFileName.textContent = selectedGameFile.name;
    }
});
gameDropZone.addEventListener('click', function() {
    gameFileInput.click();
});
document.getElementById('uploadGameBtn').onclick = async function() {
    // Get selected STEM category
    const catInputs = document.querySelectorAll('input[name="stemCategory"]');
    let selectedCategory = '';
    catInputs.forEach(input => { if(input.checked) selectedCategory = input.value; });

    // Get game name
    const gameNameInput = document.getElementById('gameName');
    const gameName = gameNameInput ? gameNameInput.value.trim() : '';

    if (!selectedGameFile) {
        alert('Please select a game file to upload.');
        return;
    }
    if (!gameName) {
        alert('Please enter a game name.');
        return;
    }
    const gameType = document.getElementById('gameType');
    if (!gameType.value) {
        alert('Please select the type of game.');
        return;
    }
    if (!selectedCategory) {
        alert('Please select a STEM category.');
        return;
    }
    showLoading();
    // Upload file to Firebase Storage
    const storageRef = storage.ref('games/' + Date.now() + '_' + selectedGameFile.name);
    try {
        const snapshot = await storageRef.put(selectedGameFile);
        const fileUrl = await snapshot.ref.getDownloadURL();
        // Save metadata to Realtime Database
        const gameData = {
            gameName: gameName,
            fileName: selectedGameFile.name,
            type: gameType.options[gameType.selectedIndex].text,
            category: selectedCategory,
            fileUrl: fileUrl,
            uploadedAt: new Date().toISOString(),
            teacherName: "Anonymous",
            reviewCount: 0 // Add review count
        };
        await db.ref('games').push(gameData);
        // Add to recent games (local UI)
        recentGames.unshift({
            gameName: gameName,
            name: selectedGameFile.name,
            type: gameData.type,
            category: selectedCategory,
            fileUrl: fileUrl,
            reviewCount: 0,
            date: new Date()
        });
        if (recentGames.length > 5) recentGames.pop();
        renderRecentGames();
        alert('Game "' + gameName + '" (' + selectedGameFile.name + ', ' + gameData.type + ', ' + selectedCategory + ') uploaded successfully!');
        // Reset UI
        selectedGameFile = null;
        gameFileInput.value = '';
        gameFileName.textContent = '';
        gameType.selectedIndex = 0;
        catInputs.forEach(input => input.checked = false);
        if (gameNameInput) gameNameInput.value = '';
        // Remove highlight from all category labels
        categoryLabels.forEach(l => l.classList.remove('selected'));
    } catch (err) {
        alert('Upload failed: ' + err.message);
    } finally {
        hideLoading();
    }
};

// STEM category selection highlight logic
const categoryLabels = document.querySelectorAll('.stem-category-label');
categoryLabels.forEach(label => {
    label.addEventListener('click', function(e) {
        // If clicking the span, trigger the radio input
        const radio = label.querySelector('input[type="radio"]');
        if (e.target.tagName === 'SPAN') {
            radio.checked = true;
        }
        // Remove highlight from all, add to selected
        categoryLabels.forEach(l => l.classList.remove('selected'));
        if (radio.checked) label.classList.add('selected');
    });
});

// Fetch recent uploads from Firebase on page load
async function fetchRecentNotes() {
    const snap = await db.ref('notes').orderByChild('uploadedAt').limitToLast(5).once('value');
    const arr = [];
    snap.forEach(child => {
        const n = child.val();
        arr.unshift({
            name: n.fileName,
            year: n.year,
            date: new Date(n.uploadedAt)
        });
    });
    recentNotes = arr;
    renderRecentNotes();
}
async function fetchRecentGames() {
    const snap = await db.ref('games').orderByChild('uploadedAt').limitToLast(5).once('value');
    const arr = [];
    snap.forEach(child => {
        const g = child.val();
        arr.unshift({
            gameName: g.gameName || "",
            name: g.fileName,
            type: g.type,
            category: g.category,
            fileUrl: g.fileUrl,
            reviewCount: g.reviewCount || 0,
            date: new Date(g.uploadedAt)
        });
    });
    recentGames = arr;
    renderRecentGames();
}

function renderRecentGames() {
    const list = document.getElementById('recentGamesList');
    list.innerHTML = recentGames.length === 0
        ? '<div style="color:#888;">No uploads yet.</div>'
        : recentGames.map(g =>
            `<div style="background:#f8f8f8; border-radius:8px; padding:12px 18px; box-shadow:0 1px 2px #0001; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <b>${g.gameName ? g.gameName : g.name}</b><br>
                    <span style="font-size:0.97em; color:#555;">
                        ${g.type} &middot; ${g.category} &middot; ${g.name} &middot; Reviews: ${g.reviewCount !== undefined ? g.reviewCount : 0} &middot; ${formatDate(g.date)}
                    </span>
                </div>
            </div>`
        ).join('');
}

// Initialize lists on page load
fetchRecentNotes();
fetchRecentGames();

// Loading overlay functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
