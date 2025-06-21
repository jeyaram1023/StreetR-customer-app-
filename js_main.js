//js_main.js

// Global state variables
window.currentUser = null;
window.userProfile = null;
let pageHistory = [];

// DOM Element selectors
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('#main-app-view .tab-content');
const appHeader = document.getElementById('app-header');
const bottomNav = document.getElementById('bottom-nav');
const backButton = document.getElementById('back-button');
const searchPageButton = document.getElementById('search-page-button');
const likesPageButton = document.getElementById('likes-page-button');

// --- LOADER ---
function showLoader() {
    document.getElementById('loading-modal').classList.remove('hidden');
}
function hideLoader() {
    document.getElementById('loading-modal').classList.add('hidden');
}

// --- NAVIGATION ---
function navigateToPage(pageId, tabContentId = null) {
    const currentPage = document.querySelector('.page.active');
    if (currentPage && currentPage.id !== pageId) {
        pageHistory.push(currentPage.id);
    }

    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    const isMainView = pageId === 'main-app-view';
    appHeader.style.display = 'flex';
    bottomNav.style.display = isMainView ? 'flex' : 'none';
    backButton.classList.toggle('hidden', isMainView || pageHistory.length === 0);

    if (isMainView) {
        let activeTabId = tabContentId || 'home-page-content';
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));
        document.getElementById(activeTabId)?.classList.add('active');
        bottomNav.querySelector(`[data-page="${activeTabId}"]`)?.classList.add('active');
        handleTabChange(activeTabId);
    }
}

function goBack() {
    const previousPageId = pageHistory.pop();
    if (previousPageId) {
        navigateToPage(previousPageId);
    } else {
        navigateToPage('main-app-view');
    }
}

function handleTabChange(activeTabId) {
    switch (activeTabId) {
        case 'home-page-content': loadHomePageContent(); break;
        case 'orders-page-content': loadOrders(); break;
        case 'map-page-content': initializeMap(); break;
        case 'profile-page-content': displayUserProfile(); break;
        case 'cart-page-content': displayCartItems(); break;
    }
}

// --- AUTHENTICATION FLOW (THE FIX) ---
async function fetchProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
        console.error("Error fetching profile:", error);
        return null;
    }
    return data;
}

async function handleUserSession(session) {
    window.currentUser = session.user;
    const profile = await fetchProfile(session.user.id);
    if (profile && profile.full_name) { // Profile is complete
        window.userProfile = profile;
        navigateToPage('main-app-view');
        showPopUpNotifications();
    } else if (profile) { // Profile exists but is incomplete
        window.userProfile = profile;
        navigateToPage('profile-setup-page');
    } else { // Profile does not exist (should be rare with the trigger)
        navigateToPage('profile-setup-page');
    }
}

async function checkAuthState() {
    showLoader();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await handleUserSession(session);
    } else {
        navigateToPage('login-page');
    }
    hideLoader();
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        handleUserSession(session);
    } else if (event === 'SIGNED_OUT') {
        window.currentUser = null;
        window.userProfile = null;
        localStorage.clear(); // Clear all data on logout
        pageHistory = [];
        navigateToPage('login-page');
    }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav item clicks
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTabId = item.getAttribute('data-page');
            navigateToPage('main-app-view', targetTabId);
        });
    });

    // Header button clicks
    backButton.addEventListener('click', goBack);
    searchPageButton?.addEventListener('click', () => navigateToPage('search-page'));
    likesPageButton?.addEventListener('click', () => {
        navigateToPage('likes-page');
        loadLikedItems();
    });

    // Initial auth check
    checkAuthState();
});
