document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-form-container');
    const signupContainer = document.getElementById('signup-form-container');
    const errorMessage = document.getElementById('error-message');

    // Admin credentials
    const ADMIN_EMAIL = "admin@corewear.com";
    const ADMIN_PASSWORD = "corewear.admin";

    // --- FORM TOGGLING ---
    showSignupBtn.addEventListener('click', () => {
        loginContainer.classList.add('hidden');
        signupContainer.classList.remove('hidden');
        errorMessage.textContent = '';
    });

    showLoginBtn.addEventListener('click', () => {
        signupContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        errorMessage.textContent = '';
    });

    // --- LOGIN HANDLER ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // 1. Check for Admin Login
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Use sessionStorage for admin to ensure the session is reliable across redirects.
            sessionStorage.setItem('corewear_adminSession', 'true'); 
            localStorage.removeItem('corewear_currentUser'); // Ensure no user session conflicts
            window.location.href = 'admin.html';
            return; // Stop further execution
        }

        // 2. Handle Regular User Login (using Local Storage)
        const users = JSON.parse(localStorage.getItem('corewear_users')) || [];
        const foundUser = users.find(user => user.email === email && user.password === password);

        if (foundUser) {
            localStorage.setItem('corewear_currentUser', email); // Set current user session
            sessionStorage.removeItem('corewear_adminSession'); // Ensure no admin session conflicts
            window.location.href = 'index.html'; // Redirect to homepage
        } else {
            errorMessage.textContent = 'Incorrect email or password.';
        }
    });

    // --- SIGNUP HANDLER ---
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        // Handle Regular User Signup (using Local Storage)
        const users = JSON.parse(localStorage.getItem('corewear_users')) || [];
        const userExists = users.some(user => user.email === email);

        if (userExists) {
            errorMessage.textContent = 'This email is already registered. Please login.';
            return;
        }

        // Add new user to the local storage array
        users.push({ email, password });
        localStorage.setItem('corewear_users', JSON.stringify(users));

        // Automatically "log in" the new user
        localStorage.setItem('corewear_currentUser', email);
        window.location.href = 'index.html'; // Redirect to homepage
    });
});

