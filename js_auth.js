// js_auth.js

async function handleLogin() {
    const email = loginEmailInput.value.trim(); [span_0](start_span)//[span_0](end_span)
    if (!email) {
        loginMessage.textContent = 'Please enter your email.'; [span_1](start_span)//[span_1](end_span)
        loginMessage.className = 'message error';
        return;
    }
    [span_2](start_span)if (!termsCheckbox.checked) { //[span_2](end_span)
        loginMessage.textContent = 'You must accept the Terms & Conditions.'; [span_3](start_span)//[span_3](end_span)
        loginMessage.className = 'message error';
        return;
    }
    showLoader();
    loginMessage.textContent = 'Sending magic link...'; [span_4](start_span)//[span_4](end_span)
    loginMessage.className = 'message';
    loginButton.disabled = true; [span_5](start_span)//[span_5](end_span)

    try {
        // *** FIX: Use the exact and full URL to your index.html file ***
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                [span_6](start_span)emailRedirectTo: "https://jeyaram1023.github.io/StreetR-customer-app-/index.html" // This is the required change[span_6](end_span)
            },
        });

        if (error) throw error; [span_7](start_span)//[span_7](end_span)
        loginMessage.textContent = 'Login link sent! Please check your email to sign in.'; [span_8](start_span)//[span_8](end_span)
    } catch (error) {
        console.error('Login error:', error);
        loginMessage.textContent = `Error: ${error.message}`;
        loginMessage.className = 'message error';
    } finally {
        loginButton.disabled = false;
        hideLoader(); [span_9](start_span)//[span_9](end_span)
    }
}
