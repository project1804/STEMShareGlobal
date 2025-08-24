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
const notesContent = document.getElementById('uploadNotesContent');
const gamesContent = document.getElementById('uploadGamesContent');
const achievementsContent = document.getElementById('achievementsContent');
const profileContent = document.getElementById('profileContent');

// Add profile tab navigation to sidebar links
document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('.teacher-sidebar a');
    sidebarLinks.forEach((link, index) => {
        if (index === 0) { // Teacher Profile link
            link.onclick = (e) => {
                e.preventDefault();
                setActiveTab('profile');
            };
        }
    });
    
    // Initialize profile functionality
    initializeProfile();
});

function setActiveTab(tab) {
    // Remove active from all tabs
    notesTab.classList.remove('active');
    gamesTab.classList.remove('active');
    
    // Hide all content
    notesContent.style.display = 'none';
    gamesContent.style.display = 'none';
    achievementsContent.style.display = 'none';
    if (profileContent) profileContent.style.display = 'none';

    // Show selected tab content
    if(tab === 'notes') {
        notesTab.classList.add('active');
        notesContent.style.display = 'block';
    } else if(tab === 'games') {
        gamesTab.classList.add('active');
        gamesContent.style.display = 'block';
    } else if(tab === 'achievements') {
        // Don't activate any main tab for achievements
        achievementsContent.style.display = 'block';
        trackUploads(); // Refresh achievements when showing
    } else if(tab === 'profile') {
        // Don't activate any main tab for profile
        if (profileContent) {
            profileContent.style.display = 'block';
            loadTeacherProfile(); // Load saved profile data
        }
    }
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
const gameDropZone = document.getElementById('gameFileUploadSection');
const gameFileInput = document.getElementById('gameFileInput');
const gameFileName = document.getElementById('gameFileName');
let selectedGameFile = null;

// Wait for DOM to be ready before setting up game drag & drop
function setupGameDragDrop() {
    if (!gameDropZone) return;
    
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
        gameDropZone.style.borderColor = '#4facfe';
    });
    
    gameDropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        gameDropZone.style.borderColor = '#e2e8f0';
    });
    
    gameDropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        gameDropZone.style.borderColor = '#e2e8f0';
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
}

// Setup game drag & drop when DOM is ready
setupGameDragDrop();

// Unified game upload handler
document.getElementById('uploadGameBtn').onclick = async function() {
    const name = document.getElementById('gameName').value.trim();
    const type = document.getElementById('gameType').value;
    const link = document.getElementById('gameLink').value.trim();
    const categoryInput = document.querySelector('input[name="stemCategory"]:checked');
    const category = categoryInput ? categoryInput.value : null;
    const file = selectedGameFile;

    // Validation
    if (!name) {
        alert('Please enter a game name.');
        return;
    }
    if (!type) {
        alert('Please select the type of game.');
        return;
    }
    if (!category) {
        alert('Please select a STEM category.');
        return;
    }
    if (!link && !file) {
        alert('Please provide either a game link or upload a file.');
        return;
    }

    showLoading();
    
    try {
        let gameData = {
            gameName: name,
            type: type,
            category: category,
            uploadedAt: new Date().toISOString(),
            teacherName: "Anonymous",
            reviewCount: 0
        };

        // If link provided, use link instead of file
        if (link) {
            gameData.link = link;
            
            await db.ref('games').push(gameData);
            
            // Add to recent games (local UI)
            recentGames.unshift({
                gameName: name,
                name: 'Online Game Link',
                type: type,
                category: category,
                link: link,
                reviewCount: 0,
                date: new Date()
            });
            
            alert('Game link uploaded successfully!');
        } else {
            // Upload file to Firebase Storage
            const storageRef = storage.ref('games/' + Date.now() + '_' + file.name);
            const snapshot = await storageRef.put(file);
            const fileUrl = await snapshot.ref.getDownloadURL();
            
            gameData.fileName = file.name;
            gameData.fileUrl = fileUrl;
            
            await db.ref('games').push(gameData);
            
            // Add to recent games (local UI)
            recentGames.unshift({
                gameName: name,
                name: file.name,
                type: type,
                category: category,
                fileUrl: fileUrl,
                reviewCount: 0,
                date: new Date()
            });
            
            alert('Game file uploaded successfully!');
        }
        
        if (recentGames.length > 5) recentGames.pop();
        renderRecentGames();
        
        // Reset UI
        selectedGameFile = null;
        document.getElementById('gameName').value = '';
        document.getElementById('gameType').selectedIndex = 0;
        document.getElementById('gameLink').value = '';
        gameFileInput.value = '';
        gameFileName.textContent = '';
        document.querySelectorAll('input[name="stemCategory"]').forEach(input => input.checked = false);
        
    } catch (err) {
        console.error(err);
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


// ------------------- ACHIEVEMENTS -------------------
function updateAchievements(totalUploads) {
  // Use correct selector for achievement cards
  document.querySelectorAll(".achievement-card").forEach(el => el.classList.remove("earned"));
  if (totalUploads >= 1) document.getElementById("ach1").classList.add("earned");
  if (totalUploads >= 5) document.getElementById("ach5").classList.add("earned");
  if (totalUploads >= 10) document.getElementById("ach10").classList.add("earned");
  if (totalUploads >= 20) document.getElementById("ach20").classList.add("earned");
}

// Count uploads from DB
function trackUploads() {
  db.ref("notes").once("value", snapshot => {
    const notes = snapshot.val() || {};
    const notesCount = Object.keys(notes).length;

    db.ref("games").once("value", snapshot2 => {
      const games = snapshot2.val() || {};
      const gamesCount = Object.keys(games).length;

      const total = notesCount + gamesCount;
      updateAchievements(total);
    });
  });
}

// Show achievements when tab clicked - use the unified tab system
document.getElementById("viewAchievementsTab").addEventListener("click", () => {
  setActiveTab('achievements');
});

// ------------------- TEACHER PROFILE -------------------

// Teacher profile data structure
let teacherProfile = {
    avatar: '👤',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@school.edu',
    school: 'SMK Kapit',
    subject: 'Mathematics',
    experience: '6-10 years',
    bio: 'Passionate mathematics educator with over 8 years of experience in making complex concepts accessible and engaging for students. I believe in hands-on learning and integrating technology to enhance the educational experience.',
    phone: '+60 12-345-6789',
    office: 'Room 301, Mathematics Department',
    notifications: {
        email: true,
        uploads: true,
        reports: false
    }
};

// Initialize profile functionality
function initializeProfile() {
    // Avatar selection functionality
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const currentAvatar = document.getElementById('currentAvatar');
    const previewAvatar = document.getElementById('previewAvatar');
    
    if (avatarOptions && currentAvatar && previewAvatar) {
        avatarOptions.forEach(option => {
            option.addEventListener('click', function() {
                const selectedAvatar = this.dataset.avatar;
                
                // Update visual feedback
                avatarOptions.forEach(opt => opt.style.borderColor = 'var(--border)');
                this.style.borderColor = '#667eea';
                this.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                
                // Update display avatars
                currentAvatar.textContent = selectedAvatar;
                previewAvatar.textContent = selectedAvatar;
                
                // Update profile data
                teacherProfile.avatar = selectedAvatar;
                
                updateProfilePreview();
            });
        });
    }
    
    // Form input listeners for live preview updates
    const formInputs = [
        { id: 'teacherName', key: 'name' },
        { id: 'teacherEmail', key: 'email' },
        { id: 'schoolName', key: 'school' },
        { id: 'subjectSpecialty', key: 'subject' },
        { id: 'teachingExperience', key: 'experience' },
        { id: 'teacherBio', key: 'bio' },
        { id: 'phoneNumber', key: 'phone' },
        { id: 'officeLocation', key: 'office' }
    ];
    
    formInputs.forEach(input => {
        const element = document.getElementById(input.id);
        if (element) {
            element.addEventListener('input', function() {
                teacherProfile[input.key] = this.value;
                updateProfilePreview();
            });
        }
    });
    
    // Notification checkboxes
    const notifications = [
        { id: 'emailNotifications', key: 'email' },
        { id: 'uploadNotifications', key: 'uploads' },
        { id: 'weeklyReports', key: 'reports' }
    ];
    
    notifications.forEach(notif => {
        const element = document.getElementById(notif.id);
        if (element) {
            element.addEventListener('change', function() {
                teacherProfile.notifications[notif.key] = this.checked;
            });
        }
    });
    
    // Save profile button
    const saveButton = document.getElementById('saveProfileBtn');
    if (saveButton) {
        saveButton.addEventListener('click', saveTeacherProfile);
    }
    
    // Load saved profile on initialization
    loadTeacherProfile();
}

// Update the profile preview section
function updateProfilePreview() {
    const previewName = document.getElementById('previewName');
    const previewSchool = document.getElementById('previewSchool');
    const previewSubject = document.getElementById('previewSubject');
    const previewBio = document.getElementById('previewBio');
    
    if (previewName) previewName.textContent = teacherProfile.name;
    if (previewSchool) previewSchool.textContent = teacherProfile.school;
    if (previewSubject) previewSubject.textContent = `${teacherProfile.subject} • ${teacherProfile.experience} experience`;
    if (previewBio) previewBio.textContent = teacherProfile.bio;
}

// Save teacher profile to localStorage
function saveTeacherProfile() {
    try {
        localStorage.setItem('teacherProfile', JSON.stringify(teacherProfile));
        
        // Show success message
        showProfileSaveSuccess();
        
        console.log('Teacher profile saved successfully:', teacherProfile);
    } catch (error) {
        console.error('Error saving teacher profile:', error);
        alert('Failed to save profile. Please try again.');
    }
}

// Load teacher profile from localStorage
function loadTeacherProfile() {
    try {
        const savedProfile = localStorage.getItem('teacherProfile');
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            teacherProfile = { ...teacherProfile, ...parsed };
            
            // Update form fields
            updateFormFields();
            updateProfilePreview();
            
            console.log('Teacher profile loaded successfully:', teacherProfile);
        }
    } catch (error) {
        console.error('Error loading teacher profile:', error);
    }
}

// Update form fields with loaded data
function updateFormFields() {
    const fields = [
        { id: 'teacherName', value: teacherProfile.name },
        { id: 'teacherEmail', value: teacherProfile.email },
        { id: 'schoolName', value: teacherProfile.school },
        { id: 'subjectSpecialty', value: teacherProfile.subject },
        { id: 'teachingExperience', value: teacherProfile.experience },
        { id: 'teacherBio', value: teacherProfile.bio },
        { id: 'phoneNumber', value: teacherProfile.phone },
        { id: 'officeLocation', value: teacherProfile.office }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element && field.value) {
            element.value = field.value;
        }
    });
    
    // Update checkboxes
    const emailNotif = document.getElementById('emailNotifications');
    const uploadNotif = document.getElementById('uploadNotifications');
    const weeklyReports = document.getElementById('weeklyReports');
    
    if (emailNotif) emailNotif.checked = teacherProfile.notifications.email;
    if (uploadNotif) uploadNotif.checked = teacherProfile.notifications.uploads;
    if (weeklyReports) weeklyReports.checked = teacherProfile.notifications.reports;
    
    // Update avatars
    const currentAvatar = document.getElementById('currentAvatar');
    const previewAvatar = document.getElementById('previewAvatar');
    
    if (currentAvatar) currentAvatar.textContent = teacherProfile.avatar;
    if (previewAvatar) previewAvatar.textContent = teacherProfile.avatar;
    
    // Highlight selected avatar option
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        if (option.dataset.avatar === teacherProfile.avatar) {
            option.style.borderColor = '#667eea';
            option.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        } else {
            option.style.borderColor = 'var(--border)';
            option.style.backgroundColor = '#f8fafc';
        }
    });
}

// Show success message when profile is saved
function showProfileSaveSuccess() {
    // Create a temporary success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);
        z-index: 10000;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    successMsg.innerHTML = `
        <span>✅</span> Profile saved successfully!
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(successMsg);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successMsg.remove();
        style.remove();
    }, 3000);
}


