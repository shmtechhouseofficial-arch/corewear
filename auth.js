import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-form-container');
    const signupContainer = document.getElementById('signup-form-container');
    const errorMessage = document.getElementById('error-message');

    const ADMIN_EMAIL = "admin@corewear.com";
    const ADMIN_PASSWORD = "Admin@123";

    // Toggle between Login and Signup forms

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

    // Handle Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = ''; // Clear previous errors
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Set session persistence to local
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                // --- Admin Login Logic ---
                if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                    return signInWithEmailAndPassword(auth, email, password)
                        .then(() => {
                            // Successfully signed in as admin, redirect to admin panel
                            window.location.href = 'admin.html';
                        })
                        .catch((error) => {
                            errorMessage.textContent = "Admin authentication failed.";
                            console.error("Admin login error:", error);
                        });
                }

                // --- Regular User Login Logic ---
                return signInWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        // Save user session and redirect
                        localStorage.setItem('user', JSON.stringify(userCredential.user));
                        window.location.href = 'index.html';
                    })
                    .catch((error) => {
                        handleAuthError(error);
                    });
            })
            .catch((error) => {
                console.error("Error setting persistence:", error);
                errorMessage.textContent = "An error occurred. Please try again.";
            });
    });

    // Handle Signup
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = ''; // Clear previous errors
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Save user session and redirect
                localStorage.setItem('user', JSON.stringify(userCredential.user));
                window.location.href = 'index.html';
            })
            .catch((error) => {
                handleAuthError(error);
            });
    });

    function handleAuthError(error) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage.textContent = 'Incorrect email or password.';
                break;
            case 'auth/email-already-in-use':
                errorMessage.textContent = 'This email is already registered. Please login.';
                break;
            default:
                errorMessage.textContent = 'An error occurred. Please try again.';
                console.error("Auth error:", error);
        }
    }
});
