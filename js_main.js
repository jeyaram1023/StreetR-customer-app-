// js/js_main.js (Modifications)
// This file orchestrates page navigation and initial loads.

// Assumed global functions (ensure these are defined in js_supabase.js or similar)
// function showLoader() { document.getElementById('loading-modal').classList.remove('hidden'); }
// function hideLoader() { document.getElementById('loading-modal').classList.add('hidden'); }
// async function getCurrentUser() { /* ... */ }
// async function fetchProfile(userId) { /* ... */ }

// Global navigation function (centralized for smooth transitions)
window.navigateToPage = function(mainViewId, targetContentId) {
    const mainAppView = document.getElementById(mainViewId);
    if (!mainAppView) return;

    const currentActiveContent = mainAppView.querySelector('.tab-content.active');
    const targetContent = document.getElementById(targetContentId);

    if (!targetContent || currentActiveContent === targetContent) {
        return; // Already on the target page or target not found
    }

    if (currentActiveContent) {
        currentActiveContent.classList.remove('active');
        // Optional: add exit animation class
        currentActiveContent.classList.add('exiting');
        // Give time for animation then remove
        setTimeout(() => {
            currentActiveContent.classList.remove('exiting');
            currentActiveContent.style.display = 'none'; // Ensure it's truly hidden
        }, 300); // Match CSS transition duration
    }

    // Set new page as active and add entrance animation
    targetContent.classList.add('active');
    targetContent.style.display = 'flex'; // Ensure it's visible for animation
    targetContent.classList.add('entering');
    setTimeout(() => {
        targetContent.classList.remove('entering');
    }, 10); // Small delay to trigger animation

    // Update active state for nav items
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const correspondingNavItem = document.querySelector(`.bottom-nav .nav-item[data-page="${targetContentId}"]`);
    if (correspondingNavItem) {
        correspondingNavItem.classList.add('active');
    }

    // Specific loaders/handlers for pages that need data
    if (targetContentId === 'home-page-content') {
        if (typeof loadHomePageContent === 'function') loadHomePageContent();
    } else if (targetContentId === 'cart-page-content') {
        if (typeof updateCartDisplay === 'function') updateCartDisplay();
    } else if (targetContentId === 'profile-page-content') {
        if (typeof loadProfileData === 'function') loadProfileData();
    } else if (targetContentId === 'likes-page-content') {
        if (typeof loadLikedItems === 'function') loadLikedItems();
    } else if (targetContentId === 'payment-page') {
         if (typeof loadPaymentPage === 'function') loadPaymentPage();
    }
    // Search page displaySearchResults is triggered by search input/button
};


document.addEventListener('DOMContentLoaded', async () => {
    // Initial setup
    const user = await getCurrentUser(); // Assumed to be from js_auth.js or js_supabase.js
    window.currentUser = user;

    if (user) {
        const profile = await fetchProfile(user.id); // Assumed to be from js_profiles.js
        window.userProfile = profile; // Make user profile globally accessible

        if (profile) {
            navigateToPage('main-app-view', 'home-page-content');
            // loadHomePageContent() is called by navigateToPage now
            document.getElementById('app-header').style.display = 'flex';
            document.getElementById('bottom-nav').style.display = 'flex';
        } else {
            navigateToPage('profile-setup-page');
        }
    } else {
        navigateToPage('login-page');
    }

    // --- Tab Navigation for bottom nav ---
    document.querySelectorAll('.bottom-nav .nav-item').forEach(button => {
        button.addEventListener('click', () => {
            const targetPageContentId = button.dataset.page;
            if (targetPageContentId) {
                navigateToPage('main-app-view', targetPageContentId);
            }
        });
    });

    // Handle initial active nav item on first load if necessary
    const initialActivePage = document.querySelector('.tab-content.active');
    if (initialActivePage) {
        const correspondingNavItem = document.querySelector(`.bottom-nav .nav-item[data-page="${initialActivePage.id}"]`);
        if (correspondingNavItem) {
            correspondingNavItem.classList.add('active');
        }
    }
});

// Utility functions (assuming these exist elsewhere or are defined here)
// Example placeholders for showLoader, hideLoader, getCurrentUser, fetchProfile
// These should ideally be in js_supabase.js or js_auth.js and made globally accessible
function showLoader() {
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) loadingModal.classList.remove('hidden');
}

function hideLoader() {
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) loadingModal.classList.add('hidden');
}

// Dummy getCurrentUser and fetchProfile for this context if not provided elsewhere
// In a real app, these would interact with Supabase auth and profiles table
window.getCurrentUser = async () => {
    // Replace with actual Supabase auth.getUser() call
    // const { data: { user } } = await supabase.auth.getUser();
    // return user;
    return { id: 'dummy_user_id', email: 'test@example.com' }; // Dummy user for testing UI
};

window.fetchProfile = async (userId) => {
    // Replace with actual Supabase profiles fetch
    // const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    // if (error) throw error;
    // return data;
    return { // Dummy profile for testing UI
        id: userId,
        customer_name: 'John Doe',
        mobile_number: '9876543210',
        street_name: '123 Main St',
        nearby_landmark: 'Near Central Park',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        user_type: 'Customer',
        shop_name: null // Not a seller
    };
};

// Dummy addToCart function if js_add_to_cart.js isn't loaded yet during initial calls
if (typeof window.addToCart !== 'function') {
    window.addToCart = (item, quantity) => {
        console.warn('addToCart function not fully loaded yet. Item:', item, 'Qty:', quantity);
        // This should be replaced by the actual logic in js_add_to_cart.js
    };
}
