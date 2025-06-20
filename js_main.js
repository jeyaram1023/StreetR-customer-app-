// js/js_main.js
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('#main-app-view .tab-content');
const appHeader = document.getElementById('app-header');
const bottomNav = document.getElementById('bottom-nav');
const pageFooter = document.getElementById('page-footer');

// New page buttons
const searchPageButton = document.getElementById('search-page-button');
const likesPageButton = document.getElementById('likes-page-button');

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

    const isMainView = pageId === 'main-app-view';
    appHeader.style.display = isMainView ? 'flex' : 'none';
    bottomNav.style.display = isMainView ? 'flex' : 'none';
    
    // Manage footer visibility (for cart's sticky button)
    pageFooter.style.display = 'none';
    pageFooter.querySelector('#cart-footer').classList.add('hidden');

    if (isMainView) {
        let activeTabId = tabContentId || 'home-page-content';
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        
        document.getElementById(activeTabId)?.classList.add('active');
        bottomNav.querySelector(`[data-page="${activeTabId}"]`)?.classList.add('active');
        
        handleTabChange(activeTabId);
    }
}

function handleTabChange(activeTabId) {
    // Show/hide sticky footer for cart page
    if (activeTabId === 'cart-page-content') {
        pageFooter.style.display = 'block';
        pageFooter.querySelector('#cart-footer').classList.remove('hidden');
    }

    // Logic to run when a tab becomes active
    switch (activeTabId) {
        case 'home-page-content':
            loadHomePageContent();
            break;
        case 'orders-page-content':
            loadOrders();
            break;
        case 'map-page-content':
            initializeMap();
            break;
        case 'profile-page-content':
            displayUserProfile();
            break;
        case 'cart-page-content':
            displayCartItems();
            break;
    }
}

// Fire a confetti animation
function launchConfetti() {
    const container = document.getElementById('confetti-container');
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animation = `confetti-fall ${1 + Math.random() * 2}s linear forwards`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Navigation Click Handlers
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetTabId = item.getAttribute('data-page');
        navigateToPage('main-app-view', targetTabId);
    });
});

searchPageButton?.addEventListener('click', () => navigateToPage('search-page'));
likesPageButton?.addEventListener('click', () => {
    navigateToPage('likes-page');
    loadLikedItems();
});

// Main App Initialization
async function checkAuthState() {
    showLoader();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
        window.currentUser = user;
        const profile = await fetchProfile(user.id);
        if (profile && profile.full_name) {
            window.userProfile = profile;
            navigateToPage('main-app-view');
            showPopUpNotifications();
        } else {
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
        checkAuthState(); 
    } else if (event === 'SIGNED_OUT') {
        window.currentUser = null;
        window.userProfile = null;
        localStorage.clear();
        navigateToPage('login-page');
    }
});

document.addEventListener('DOMContentLoaded', checkAuthState);
