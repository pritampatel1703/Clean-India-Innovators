// Community Page Logic (Firebase Integration)

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAtMleszEYeiRzuJh57X8skd6ljIc8z9nE",
    authDomain: "clean-india-innovators.firebaseapp.com",
    projectId: "clean-india-innovators",
    databaseURL: "https://clean-india-innovators-default-rtdb.firebaseio.com/",
    storageBucket: "clean-india-innovators.firebasestorage.app",
    messagingSenderId: "361243630458",
    appId: "1:361243630458:web:42f290b9c132958f3594c3",
    measurementId: "G-MGVWCG893X"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State
let posts = [];

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const postInput = document.getElementById('post-input');
const postBtn = document.getElementById('post-btn');

// Initialize
function init() {
    listenForPosts();
    setupEventListeners();
}

// Listen for Posts (Realtime)
function listenForPosts() {
    const postsRef = db.ref('posts');

    // 'value' event triggers once initially, and then every time data changes
    postsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert object of objects to array
            posts = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            // Sort by time (newest first)
            // Note: Since we use timestamp ID, we can sort by that or a 'createdAt' field
            // Here we reverse the array if pushed in chronological order, 
            // OR sort by timestamp if we added that. Push IDs are chronological.
            posts.reverse();
        } else {
            posts = [];
        }
        renderFeed();
        renderLeaderboard(); // Update sidebar
    });
}

// Render Leaderboard (Top Contributors)
function renderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;

    // 1. Count Posts per User
    const userCounts = {};
    posts.forEach(post => {
        // Use name as ID for now
        const name = post.user.name || "Anonymous";
        userCounts[name] = (userCounts[name] || 0) + 1;
    });

    // 2. Convert to Array and Sort
    const sortedUsers = Object.keys(userCounts).map(name => ({
        name: name,
        count: userCounts[name]
    })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5

    // 3. Render
    if (sortedUsers.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:10px;">No active contributors yet.</p>';
        return;
    }

    leaderboardList.innerHTML = sortedUsers.map((user, index) => {
        let rankClass = '';
        if (index === 0) rankClass = 'top-1';
        if (index === 1) rankClass = 'top-2';
        if (index === 2) rankClass = 'top-3';

        // Simulated "Points" (Posts * 50) for fun
        const points = user.count * 50;

        return `
            <div class="leaderboard-item">
                <div class="leaderboard-user">
                    <span class="rank ${rankClass}">${index + 1}</span>
                    <span>${user.name}</span>
                </div>
                <span class="points">${points} pts</span>
            </div>
        `;
    }).join('');
}

// Render Feed
function renderFeed() {
    feedContainer.innerHTML = '';

    if (posts.length === 0) {
        feedContainer.innerHTML = '<p class="no-comments" style="margin-top:20px;">No posts yet. Be the first to share!</p>';
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card fade-in';

        // Handle Likes (Local Check for UI, would need Auth for real "liked by me")
        // For this demo, we just show the count. Toggling "liked" by anonymous user is tricky.
        // We will store "liked_posts" in localStorage to remember what THIS user liked locally.
        const isLiked = localStorage.getItem(`liked_${post.id}`) === 'true';
        const likeClass = isLiked ? 'liked' : '';
        const heartIcon = isLiked ? 'fa-solid' : 'fa-regular';

        // Image HTML (Optional)
        let imageHtml = '';
        if (post.image) {
            imageHtml = `
            <div class="post-image">
                 <i class="fa-solid fa-image" style="font-size:3rem;"></i>
            </div>`;
        }

        // Process comments array
        // Firebase stores lists as objects with keys usually, need to handle that.
        let commentsArray = [];
        if (post.comments) {
            commentsArray = Object.values(post.comments);
        }

        // Comments Section HTML (Only show if UI state says so)
        // Note: 'showComments' is a local UI state, not saved in DB usually.
        // We need to preserve it across re-renders. 
        // A simple way is to check a global map or just default to closed.
        // For simplicity: We default closed, but if we just added a comment, it might stay open.
        // Let's attach the state to the DOM element ID logic or just keep it closed by default.
        // Better: We can store open states in a Set.
        const isOpen = window.openCommentSections && window.openCommentSections.has(post.id);

        let commentsHtml = '';
        if (isOpen) {
            const commentsList = commentsArray.map(c => `
                <div class="comment-item">
                    <strong>${c.user}</strong>: ${c.text}
                </div>
            `).join('');

            commentsHtml = `
                <div class="comments-section" id="comments-${post.id}">
                    <div class="comments-list">
                        ${commentsArray.length ? commentsList : '<p class="no-comments">No comments yet.</p>'}
                    </div>
                    <div class="comment-input-wrapper">
                        <input type="text" class="comment-input" placeholder="Write a comment..." id="comment-input-${post.id}">
                        <button class="btn-primary btn-sm" onclick="addComment('${post.id}')">Send</button>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="post-header">
                <div class="user-avatar">
                    <img src="${post.user.avatar}" style="border-radius:50%; width:100%; height:100%;" alt="">
                </div>
                <div class="user-info">
                    <h4>${post.user.name}</h4>
                    <span>${post.time} • ${post.location}</span>
                </div>
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            ${imageHtml}
            <div class="post-actions">
                <button class="action-btn ${likeClass}" onclick="toggleLike('${post.id}', ${post.likes})">
                    <i class="${heartIcon} fa-heart"></i> ${post.likes} Likes
                </button>
                <button class="action-btn" onclick="toggleComments('${post.id}')">
                    <i class="fa-regular fa-comment"></i> ${commentsArray.length} Comments
                </button>
                <button class="action-btn">
                    <i class="fa-solid fa-share"></i> Share
                </button>
            </div>
            ${commentsHtml}
            <button class="delete-btn" onclick="deletePost('${post.id}')" style="position:absolute; top:15px; right:15px; background:none; border:none; color:#cbd5e1; cursor:pointer;">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        feedContainer.appendChild(card);
    });
}

// Admin Delete Post - Modal Handling
let postToDeleteId = null;
const modal = document.getElementById('admin-modal');
const passwordInput = document.getElementById('admin-password-input');
const errorMsg = document.getElementById('admin-error');
const confirmBtn = document.getElementById('confirm-delete-btn');

// Open Modal
window.deletePost = function (id) {
    postToDeleteId = id;
    modal.classList.add('active');
    passwordInput.value = '';
    errorMsg.innerText = '';
    passwordInput.focus();
};

// Close Modal Logic
function closeModal() {
    modal.classList.remove('active');
    postToDeleteId = null;
}

if (modal) {
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Confirm Delete
    confirmBtn.addEventListener('click', () => {
        const password = passwordInput.value;
        if (password === "admin123") {
            if (postToDeleteId) {
                db.ref('posts/' + postToDeleteId).remove()
                    .then(() => {
                        closeModal();
                        // Optional: Show a nice toast instead of alert, but alert is fine for now
                    })
                    .catch(err => {
                        errorMsg.innerText = "Error: " + err.message;
                    });
            }
        } else {
            errorMsg.innerText = "Incorrect Password!";
            passwordInput.classList.add('shake'); // CSS animation could be added here
            setTimeout(() => passwordInput.classList.remove('shake'), 500);
        }
    });

    // Enter key support
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmBtn.click();
    });
    // Enter key support
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmBtn.click();
    });
}

// Generic Alert Handling
const alertModal = document.getElementById('alert-modal');
const alertMessage = document.getElementById('alert-message');

window.showCustomAlert = function (msg) {
    if (alertModal) {
        alertMessage.innerText = msg;
        alertModal.classList.add('active');
    } else {
        alert(msg); // Fallback
    }
};

if (alertModal) {
    document.querySelectorAll('.close-modal.type-alert, .close-modal-btn.type-alert').forEach(btn => {
        btn.addEventListener('click', () => {
            alertModal.classList.remove('active');
        });
    });
}

// Create New Post
function createPost() {
    const usernameInput = document.getElementById('username-input');
    const contentInput = document.getElementById('post-input');

    // 1. Validation
    const username = usernameInput.value.trim();
    const content = contentInput.value.trim();

    if (!username) {
        showCustomAlert("Please enter your name!");
        return;
    }

    if (!content) {
        showCustomAlert("Please write something to post!");
        return;
    }

    // Use current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTime = `${dateStr}, ${timeStr}`;

    // Push to Firebase
    const newPostRef = db.ref('posts').push();

    newPostRef.set({
        user: { name: username, avatar: "LOGO/member%20logo.png" },
        time: fullTime,
        location: "India",
        content: content,
        likes: 0,
        image: false,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log("Post submitted successfully!");
    }).catch((error) => {
        alert("Error posting: " + error.message);
        console.error("Firebase Error:", error);
    });

    postInput.value = ''; // Clear content
    // We keep the username filled in for convenience
}

// Toggle Like
window.toggleLike = function (id, currentLikes) {
    const isLiked = localStorage.getItem(`liked_${id}`) === 'true';
    const postsRef = db.ref('posts/' + id);

    // Transaction to safely increment/decrement
    postsRef.transaction((post) => {
        if (post) {
            if (isLiked) {
                // If already liked, user is unliking
                post.likes = (post.likes || 0) - 1;
            } else {
                // User is liking
                post.likes = (post.likes || 0) + 1;
            }
        }
        return post;
    }, (error, committed, snapshot) => {
        if (error) {
            console.error('Transaction failed abnormally!', error);
        } else if (committed) {
            // Toggle local state
            if (isLiked) {
                localStorage.removeItem(`liked_${id}`);
            } else {
                localStorage.setItem(`liked_${id}`, 'true');
            }
            // Trigger render to update UI color (likes count updates via listener)
            renderFeed();
        }
    });
};

// UI State for Open Comments
window.openCommentSections = new Set();

// Toggle Comments
window.toggleComments = function (id) {
    if (window.openCommentSections.has(id)) {
        window.openCommentSections.delete(id);
    } else {
        window.openCommentSections.add(id);
    }
    renderFeed();
};

// Add Comment
window.addComment = function (id) {
    const input = document.getElementById(`comment-input-${id}`);
    const text = input.value.trim();
    if (!text) return;

    const commentsRef = db.ref('posts/' + id + '/comments');
    commentsRef.push({
        user: "Generic User", // In a real app we'd have auth
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    // We don't need to manually re-render, the listener will do it.
};

// Event Listeners
function setupEventListeners() {
    postBtn.addEventListener('click', createPost);

    // Enter key to post
    postInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createPost();
        }
    });
}

// Run
document.addEventListener('DOMContentLoaded', init);
// Fallback if already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
}
