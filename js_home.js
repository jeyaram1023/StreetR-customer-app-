// js_home.js

const popularItemsContainer = document.getElementById('popular-items-container');
const allItemsContainer = document.getElementById('all-items-container');
const itemDetailPage = document.getElementById('item-detail-page');

async function loadHomePageContent() {
    if (!window.userProfile?.pincode) {
        allItemsContainer.innerHTML = '<p>Please complete your profile to see items in your area.</p>';
        return;
    }
    showLoader();
    try {
        const { data: sellers, error: sellersError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_type', 'Seller')
            .eq('pincode', window.userProfile.pincode);
        if (sellersError) throw sellersError;

        const sellerIds = sellers.map(s => s.id);
        if (sellerIds.length === 0) {
            allItemsContainer.innerHTML = '<p>No sellers found in your area yet.</p>';
            return;
        }

        const { data: items, error: itemsError } = await supabase
            .rpc('get_menu_items_with_likes', {
                p_seller_ids: sellerIds,
                p_user_id: window.currentUser.id
            });
        if (itemsError) throw itemsError;
        
        const popularItems = [...items].sort((a, b) => b.like_count - a.like_count).slice(0, 4);

        renderItems(popularItems, popularItemsContainer, 'popular');
        renderItems(items, allItemsContainer, 'all');
    } catch (error) {
        console.error('Error loading home page:', error);
        allItemsContainer.innerHTML = '<p>Could not load items. Please try again.</p>';
    } finally {
        hideLoader();
    }
}

function renderItems(items, container, context) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
        if (context === 'all') container.innerHTML = '<p>No items to display in your area.</p>';
        return;
    }
    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.dataset.itemId = item.id;
        itemCard.innerHTML = `
            <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}">
            <div class="item-card-content">
                <h4>${item.name}</h4>
                <p>₹${item.price.toFixed(2)}</p>
                <div class="item-card-footer">
                    <div>
                        <button class="like-button ${item.is_liked_by_user ? 'liked' : ''}" data-item-id="${item.id}" data-liked="${item.is_liked_by_user}">
                            <i class="fa-${item.is_liked_by_user ? 'solid' : 'regular'} fa-heart"></i>
                            <span class="like-count">${item.like_count}</span>
                        </button>
                    </div>
                    <div>
                        <button class="share-button" data-name="${item.name}" data-item-id="${item.id}"><i class="fa-solid fa-share-alt"></i></button>
                        <button class="add-to-cart-btn" data-item-id="${item.id}"><i class="fa-solid fa-bag-shopping"></i></button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(itemCard);
    });

    // Event listeners
    container.querySelectorAll('.like-button').forEach(b => b.addEventListener('click', handleLikeClick));
    container.querySelectorAll('.add-to-cart-btn').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = e.currentTarget.dataset.itemId;
        const item = items.find(i => i.id === itemId);
        addToCart(item);
        launchConfetti();
    }));
    container.querySelectorAll('.share-button').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = e.currentTarget.dataset.name;
        const itemId = e.currentTarget.dataset.itemId;
        shareItem(name, itemId);
    }));
    container.querySelectorAll('.item-card').forEach(c => c.addEventListener('click', (e) => {
        if(e.target.closest('button')) return;
        const itemId = c.dataset.itemId;
        showItemDetailPage(itemId);
    }));
}

async function handleLikeClick(event) {
    event.stopPropagation();
    if (!window.currentUser) { alert("Please log in to like items."); return; }

    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    const isLiked = button.dataset.liked === 'true';
    const icon = button.querySelector('i');
    
    // Optimistic UI update
    button.classList.toggle('liked', !isLiked);
    button.dataset.liked = !isLiked;
    icon.className = `fa-${!isLiked ? 'solid' : 'regular'} fa-heart`;

    try {
        if (isLiked) {
            await supabase.from('likes').delete().match({ user_id: window.currentUser.id, menu_item_id: itemId });
        } else {
            await supabase.from('likes').insert({ user_id: window.currentUser.id, menu_item_id: itemId });
        }
        loadHomePageContent();
    } catch (error) {
        console.error("Error updating like:", error);
        button.classList.toggle('liked', isLiked);
        button.dataset.liked = isLiked;
        icon.className = `fa-${isLiked ? 'solid' : 'regular'} fa-heart`;
    }
}

function shareItem(itemName, itemId) {
    if (navigator.share) {
        const baseUrl = window.location.href.split('?')[0];
        const shareUrl = `${baseUrl}?itemId=${itemId}`;
        navigator.share({
            title: 'Check out this item on StreetR!',
            text: `I found this delicious ${itemName} on the StreetR app!`,
            url: shareUrl,
        }).catch(console.error);
    } else {
        alert("Sharing is not supported on your browser.");
    }
}

async function showItemDetailPage(itemId) {
    showLoader();
    try {
        const { data: item, error } = await supabase
            .from('menu_items')
            .select(`*, seller:profiles(shop_name)`)
            .eq('id', itemId)
            .single();
        if (error) throw error;

        const { data: otherItems, error: otherItemsError } = await supabase
            .from('menu_items')
            .select(`*`)
            .eq('seller_id', item.seller_id)
            .neq('id', item.id)
            .limit(5);
        if(otherItemsError) throw otherItemsError;

        itemDetailPage.innerHTML = `
            <button id="back-to-home-btn" class="floating-back-btn">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}" class="item-detail-image">
            <div class="item-detail-content">
                <h2>${item.name}</h2>
                <p class="shop-name">From: ${item.seller.shop_name}</p>
                <p class="item-price">₹${item.price.toFixed(2)}</p>
                <p class="item-description">${item.description || 'No description available.'}</p>
                <p>❤️ ${item.like_count ?? 0}</p>
                <div class="item-detail-actions">
                     <button id="detail-like-btn" class="like-button-large">
                         <i class="fa-regular fa-heart"></i> Likes 
                         <span class="like-count">${item.like_count ?? 0}</span>
                     </button>
                     <button id="detail-share-btn" class="like-button-large">
                         <i class="fa-solid fa-share-alt"></i> Share
                     </button>
                     <button id="detail-add-to-cart-btn" class="add-to-cart-large">
                         <i class="fa-solid fa-cart-plus"></i> Add to Cart
                     </button>
                </div>
                <div class="more-from-shop">
                    <h3>More from ${item.seller.shop_name}</h3>
                    <div id="more-items-container" class="item-grid"></div>
                </div>
            </div>
        `;

        renderItems(otherItems, itemDetailPage.querySelector('#more-items-container'), 'more');
        
        itemDetailPage.querySelector('#back-to-home-btn').addEventListener('click', () => {
            navigateToPage('main-app-view', 'home-page-content');
        });
        itemDetailPage.querySelector('#detail-add-to-cart-btn').addEventListener('click', () => {
            addToCart(item);
            launchConfetti();
        });
        itemDetailPage.querySelector('#detail-share-btn').addEventListener('click', () => {
            shareItem(item.name, item.id);
        });

        navigateToPage('item-detail-page');
    } catch (error) {
        console.error('Error fetching item details:', error);
        alert('Could not load item details.');
    } finally {
        hideLoader();
    }
}





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
function showLoader() {
document.getElementById('loading-modal').classList.remove('hidden');
}
function hideLoader() {
document.getElementById('loading-modal').classList.add('hidden');
}
// --- NAVIGATION ---
function navigateToPage(pageId, tabContentId = null) {
pages.forEach(page => page.classList.remove('active'));
document.getElementById(pageId)?.classList.add('active');
const isMainView = pageId === 'main-app-view';
appHeader.style.display = isMainView ? 'flex' : 'none';
bottomNav.style.display = isMainView ?
'flex' : 'none';
// Manage footer visibility for cart's sticky button
pageFooter.style.display = 'none';
pageFooter.querySelector('#cart-footer').classList.add('hidden');
if (isMainView) {
let activeTabId = tabContentId || 'home-page-content';
navItems.forEach(nav => nav.classList.remove('active'));
tabContents.forEach(tab => tab.classList.remove('active'));
document.getElementById(activeTabId)?.classList.add('active');
const activeNavButton = bottomNav.querySelector(`[data-page="${activeTabId}"]`);
if (activeNavButton) {
activeNavButton.classList.add('active');
}
handleTabChange(activeTabId);
}
}
function handleTabChange(activeTabId) {
if (activeTabId === 'cart-page-content') {
pageFooter.style.display = 'block';
pageFooter.querySelector('#cart-footer').classList.remove('hidden');
}
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
// --- AUTHENTICATION FLOW (THE FIX) ---
async function fetchProfile(userId) {
const {
data,
error
} = await supabase
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

    // MODIFIED: Check for full_name and a pincode to ensure the profile is truly complete.
    // This prevents users with partially filled profiles from getting stuck and
    // ensures the home page can load items correctly, as it depends on the pincode.
    if (profile && profile.full_name && profile.pincode) { // Profile is complete
        window.userProfile = profile;
        navigateToPage('main-app-view');
        showPopUpNotifications(); // Show popups on successful login to main app
    } else if (profile) { // Profile exists but is incomplete
        window.userProfile = profile;
        navigateToPage('profile-setup-page');
    } else { // Profile does not exist (should be rare with the trigger)
        navigateToPage('profile-setup-page');
    }
}
async function checkAuthState() {
showLoader();
const {
data: {
session
}
} = await supabase.auth.getSession();
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
navigateToPage('login-page');
}
});
// --- UI & ANIMATIONS ---
function launchConfetti() {
const container = document.getElementById('confetti-container');
for (let i = 0; i < 50; i++) {
const confetti = document.createElement('div');
confetti.className = 'confetti';
confetti.style.left = `${Math.random() * 100}vw`;
confetti.style.animation = `confetti-fall ${1 + Math.random() * 2}s linear forwards`;
confetti.style.animationDelay = `${Math.random() * 0.5}s`;
container.appendChild(confetti);
setTimeout(() => confetti.remove(), 3000);
}
}
// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
// New More Menu Elements
const moreNavButton = document.getElementById('more-nav-button');
const moreMenuPopup = document.getElementById('more-menu-popup');
const closeMoreMenuBtn = document.getElementById('close-more-menu-btn');
const moreMenuOverlay = document.querySelector('.more-menu-overlay');
// Nav item clicks
navItems.forEach(item => {
item.addEventListener('click', () => {
const targetTabId = item.getAttribute('data-page');
if (targetTabId) {
navigateToPage('main-app-view', targetTabId);
}
});
});
// Header button clicks
searchPageButton?.addEventListener('click', () => navigateToPage('search-page'));
likesPageButton?.addEventListener('click', () => {
navigateToPage('likes-page');
loadLikedItems();
});
// Generic back to home button clicks
document.querySelectorAll('.back-to-home-btn').forEach(button => {
button.addEventListener('click', () => {
navigateToPage('main-app-view', 'home-page-content');
});
});
// More Menu button click
moreNavButton?.addEventListener('click', (e) => {
e.stopPropagation();
moreMenuPopup.classList.remove('hidden');
});
// Close More Menu
const closeMoreMenu = () => {
moreMenuPopup.classList.add('hidden');
};
closeMoreMenuBtn?.addEventListener('click', closeMoreMenu);
moreMenuOverlay?.addEventListener('click', closeMoreMenu);
// Initial auth check
checkAuthState();
});
