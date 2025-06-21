
//  js_main.js

// Global state variables
window.currentUser = null;
window.userProfile = null;

// DOM Element selectors
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('#main-app-view .tab-content');
const appHeader = document.getElementById('app-header');
const bottomNav = document.getElementById('bottom-nav');
const pageFooter = document.getElementById('page-footer');
const searchPageButton = document.getElementById('search-page-button');
const likesPageButton = document.getElementById('likes-page-button');

// --- LOADER ---
function showLoader() { document.getElementById('loading-modal').classList.remove('hidden'); }
function hideLoader() { document.getElementById('loading-modal').classList.add('hidden'); }

// --- NAVIGATION ---
function navigateToPage(pageId, tabContentId = null) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    const isMainView = pageId === 'main-app-view';
    appHeader.style.display = isMainView ? 'flex' : 'none';
    bottomNav.style.display = isMainView ? 'flex' : 'none';
    
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
    if (activeTabId === 'cart-page-content') {
        pageFooter.style.display = 'block';
        pageFooter.querySelector('#cart-footer').classList.remove('hidden');
    }

    switch (activeTabId) {
        case 'home-page-content': loadHomePageContent(); break;
        case 'orders-page-content': loadOrders(); break;
        case 'map-page-content': initializeMap(); break;
        case 'profile-page-content': displayUserProfile(); break;
        case 'cart-page-content': displayCartItems(); break;
    }
}

// --- AUTHENTICATION FLOW ---
async function fetchProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
        return null;
    }
    return data;
}

async function handleUserSession(session) {
    window.currentUser = session.user;
    const profile = await fetchProfile(session.user.id);

    if (profile && profile.full_name) {
        window.userProfile = profile;
        navigateToPage('main-app-view');
    } else if (profile) {
        window.userProfile = profile;
        navigateToPage('profile-setup-page');
    } else {
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
        localStorage.clear();
        navigateToPage('login-page');
    }
});

// --- EVENT LISTENERS & INITIALIZATION ---
function setupNavigationListeners() {
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

    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            navigateToPage('main-app-view', 'home-page-content');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupNavigationListeners();
    checkAuthState();
});

