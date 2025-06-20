// js_auth.js
const loginEmailInput = document.getElementById('login-email');
const loginButton = document.getElementById('login-button');
const termsCheckbox = document.getElementById('terms-conditions');
const loginMessage = document.getElementById('login-message');
const logoutButton = document.getElementById('logout-button');

async function handleLogin() {
    const email = loginEmailInput.value.trim();
    if (!email) {
        loginMessage.textContent = 'Please enter your email.';
        loginMessage.className = 'message error';
        return;
    }
    if (!termsCheckbox.checked) {
        loginMessage.textContent = 'You must accept the Terms & Conditions.';
        loginMessage.className = 'message error';
        return;
    }

    showLoader();
    loginMessage.textContent = 'Sending magic link...';
    loginMessage.className = 'message';
    loginButton.disabled = true;

    try {
        // *** FIX: Use a dynamic redirect URL ***
        // This ensures the magic link works in both local development and production.
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: "https://jeyaram1023.github.io/StreetR-customer-app-/home.html", // or index.html if that’s your main page // This now correctly redirects back to the current page
            },
        });

        if (error) throw error;
        loginMessage.textContent = 'Login link sent! Please check your email to sign in.';
    } catch (error) {
        console.error('Login error:', error);
        loginMessage.textContent = `Error: ${error.message}`;
        loginMessage.className = 'message error';
    } finally {
        loginButton.disabled = false;
        hideLoader();
    }
}

async function handleLogout() {
    showLoader();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    } else {
        localStorage.clear();
        window.currentUser = null;
        window.userProfile = null;
        navigateToPage('login-page');
    }
    hideLoader();
}

async function getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error getting session:", error.message);
        return null;
    }
    return session ? session.user : null;
}

// Event Listeners
if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
}
if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}
