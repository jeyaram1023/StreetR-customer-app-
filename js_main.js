// js_main.js
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('#main-app-view .tab-content');
const appHeader = document.getElementById('app-header');
const bottomNav = document.getElementById('bottom-nav');
const letsGoButton = document.getElementById('lets-go-button');
const editDetailsButton = document.getElementById('edit-details-button');

window.currentUser = null;
window.userProfile = null;

function showLoader() {
    document.getElementById('loading-modal').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loading-modal').classList.add('hidden');
}

function navigateToPage(pageId, tabContentId = null) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    if (pageId === 'main-app-view') {
        appHeader.style.display = 'flex';
        bottomNav.style.display = 'flex';
        
        let activeTabId = tabContentId || 'home-page-content';
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        
        document.getElementById(activeTabId)?.classList.add('active');
        bottomNav.querySelector(`[data-page="${activeTabId}"]`)?.classList.add('active');

        handleTabChange(activeTabId);

    } else {
        appHeader.style.display = 'none';
        bottomNav.style.display = 'none';
    }
}

function handleTabChange(activeTabId) {
    // Logic to run when a tab becomes active
    switch (activeTabId) {
        case 'home-page-content':
            loadHomePageContent();
            break;
        case 'orders-page-content':
            // loadOrders();
            break;
        case 'map-page-content':
            initializeMap();
            break;
        case 'profile-page-content':
            // displayUserProfile();
            break;
        case 'cart-page-content':
             displayCartItems();
            break;
    }
}

// Navigation Click Handlers
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetTabId = item.getAttribute('data-page');
        navigateToPage('main-app-view', targetTabId);
    });
});

letsGoButton?.addEventListener('click', () => {
    navigateToPage('main-app-view', 'home-page-content');
});

editDetailsButton?.addEventListener('click', () => {
    populateProfileForEditing(window.userProfile);
    navigateToPage('profile-setup-page');
});

// Main App Initialization
async function checkAuthState() {
    showLoader();
    const user = await getCurrentUser();
    if (user) {
        window.currentUser = user;
        const profile = await fetchProfile(user.id);
        
        if (profile && profile.full_name) { // Check if profile is complete
            window.userProfile = profile;
            navigateToPage('main-app-view');
            // Show pop-up notifications on home page load
            showPopUpNotifications();
        } else {
            // Profile exists but is incomplete or new user
            navigateToPage('profile-setup-page');
        }
    } else {
        navigateToPage('login-page');
    }
    hideLoader();
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        window.currentUser = session.user;
        checkAuthState(); // Re-check state to fetch profile and navigate
    } else if (event === 'SIGNED_OUT') {
        window.currentUser = null;
        window.userProfile = null;
        localStorage.clear();
        navigateToPage('login-page');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});
