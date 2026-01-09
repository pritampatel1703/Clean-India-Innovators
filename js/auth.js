const AUTH_KEY = 'clean_india_users';
const CURRENT_USER_KEY = 'clean_india_user';

// --- UTILS ---
function getUsers() {
    const users = localStorage.getItem(AUTH_KEY);
    return users ? JSON.parse(users) : [];
}

function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function getCurrentUser() {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = 'index.html';
}

// --- LOGIC ---

// 0. Aadhar & OTP Logic
let generatedOTP = null;
let isOTPVerified = false;

function sendOTP() {
    const aadharInput = document.getElementById('aadhar');
    const number = aadharInput.value.trim();

    // Strict 12-digit validation
    if (number.length !== 12 || isNaN(number)) {
        alert("Please enter a valid 12-digit Aadhar number.");
        return;
    }

    // Simulate API Call
    const btn = document.querySelector('.btn-verify');
    btn.innerText = "Sending...";
    btn.disabled = true;

    setTimeout(() => {
        generatedOTP = Math.floor(100000 + Math.random() * 900000); // 6-digit random
        alert(`Authentication Code (OTP) for Aadhar Verification:\n\n${generatedOTP}`);

        document.getElementById('otp-group').classList.remove('hidden');
        btn.innerText = "Resend OTP";
        btn.disabled = false;
    }, 1500);
}

function verifyOTP() {
    // Check if input matches generated
    const input = document.getElementById('otp').value;
    const status = document.getElementById('otp-status');
    if (parseInt(input) === generatedOTP) {
        status.style.display = 'block';
        status.innerText = "Verified ✅";
        status.style.color = "green";
        isOTPVerified = true;
        document.getElementById('otp').disabled = true;
        document.getElementById('aadhar').disabled = true;
    } else {
        status.style.display = 'block';
        status.innerText = "Incorrect OTP ❌";
        status.style.color = "red";
        isOTPVerified = false;
    }
}

// Attach listener to OTP input for auto-verify
document.addEventListener('DOMContentLoaded', () => {
    const otpInput = document.getElementById('otp');
    if (otpInput) {
        otpInput.addEventListener('input', () => {
            if (otpInput.value.length === 6) verifyOTP();
        });
    }
});

// File Preview Logic
function previewAadhar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('aadhar-preview').src = e.target.result;
            document.getElementById('aadhar-preview-container').classList.remove('hidden');
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function removeAadhar() {
    document.getElementById('aadhar-file').value = "";
    document.getElementById('aadhar-preview-container').classList.add('hidden');
    document.getElementById('aadhar-preview').src = "";
}

// 1. Signup Logic
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const aadhar = document.getElementById('aadhar').value;
    const errorMsg = document.getElementById('error-message');
    const aadharFile = document.getElementById('aadhar-file').files[0];

    // Basic Fields
    if (!name || !email || !password || !aadhar) {
        showError(errorMsg, "All fields are required.");
        return;
    }

    // Aadhar Validation
    if (!isOTPVerified) {
        showError(errorMsg, "Please verify your Aadhar number via OTP.");
        return;
    }

    if (!aadharFile) {
        showError(errorMsg, "Please upload a photo of your Aadhar card.");
        return;
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        showError(errorMsg, "User with this email already exists.");
        return;
    }

    const newUser = { name, email, password };
    saveUser(newUser);
    setCurrentUser(newUser); // Auto-login

    alert("Account created successfully!");
    window.location.href = "index.html";
}

// 2. Login Logic
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        setCurrentUser(user);
        window.location.href = "index.html"; // Or previous intent
    } else {
        showError(errorMsg, "Invalid email or password.");
    }
}

// 4. Forgot Password Logic
function verifyEmailForReset() {
    const email = document.getElementById('reset-email').value.trim().toLowerCase();
    const errorMsg = document.getElementById('error-message');
    const stepEmail = document.getElementById('step-email');
    const stepPass = document.getElementById('step-password');
    const headerP = document.querySelector('.auth-header p');

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (user) {
        // Email found
        stepEmail.classList.add('hidden');
        stepPass.classList.remove('hidden');
        errorMsg.style.display = 'none';
        headerP.innerText = `Resetting password for ${email}`;
        // Store email temporarily in session or input attribute
        document.getElementById('reset-email').setAttribute('readonly', true);
    } else {
        showError(errorMsg, "No account found with this email.");
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim().toLowerCase();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');

    if (newPass !== confirmPass) {
        showError(errorMsg, "Passwords do not match.");
        return;
    }

    if (!newPass) {
        showError(errorMsg, "Please enter a new password.");
        return;
    }

    // Update User
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex !== -1) {
        users[userIndex].password = newPass;
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));

        document.querySelector('form').style.display = 'none';
        successMsg.style.display = 'block';
        successMsg.innerHTML = `Password updated successfully! <br> <div style="margin-top:10px"><a href="login.html" style="font-weight:700; color:#16a34a">Back to Login</a></div>`;
        document.querySelector('.auth-header p').innerText = "Success";
    }
}

// Helper: Show Error
function showError(element, msg) {
    element.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
    element.style.display = 'block';
}

// 3. Auth Check (For Protected Pages)
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        // Redirect if not logged in
        window.location.href = 'login.html';
    } else {
        console.log("Logged in as:", user.name);
    }
}

// 4. Update Navigation UI
function updateNav() {
    const user = getCurrentUser();
    const navList = document.querySelector('.nav-links');

    // Find if Auth link already exists
    const existingAuth = document.querySelector('.nav-auth');
    if (existingAuth) existingAuth.remove();

    const li = document.createElement('li');
    li.className = 'nav-auth';

    if (user) {
        li.innerHTML = `
            <a href="#" onclick="logout(); return false;" style="color: #ef4444;">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
            </a>
        `;
    } else {
        li.innerHTML = `
            <a href="login.html" style="color: #077f5b; font-weight: 600;">
                <i class="fa-solid fa-user"></i> Login
            </a>
        `;
    }

    if (navList) {
        navList.appendChild(li);
    }
}

// Auto-run nav update on load (except on auth pages logic)
if (!document.body.classList.contains('auth-page')) {
    document.addEventListener('DOMContentLoaded', updateNav);
}
