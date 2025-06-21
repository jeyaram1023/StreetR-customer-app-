// js_home.js

const popularItemsContainer = document.getElementById('popular-items-container');
const allItemsContainer = document.getElementById('all-items-container');

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
                        </button>
                        <span class="like-count">${item.like_count}</span>
                    </div>
                    <button class="add-to-cart-btn" data-item-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
        container.appendChild(itemCard);
    });

    // Add event listeners
    container.querySelectorAll('.like-button').forEach(b => b.addEventListener('click', handleLikeClick));
    container.querySelectorAll('.add-to-cart-btn').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = e.currentTarget.dataset.itemId;
        const item = items.find(i => i.id === itemId);
        addToCart(item);
    }));
}

async function handleLikeClick(event) {
    event.stopPropagation();
    if (!window.currentUser) { alert("Please log in to like items."); return; }

    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    let isLiked = button.dataset.liked === 'true';
    const icon = button.querySelector('i');
    const likeCountSpan = button.nextElementSibling;
    let currentLikeCount = parseInt(likeCountSpan.textContent);

    // Optimistic UI update
    isLiked = !isLiked;
    button.classList.toggle('liked', isLiked);
    button.dataset.liked = isLiked;
    icon.className = `fa-${isLiked ? 'solid' : 'regular'} fa-heart`;
    likeCountSpan.textContent = isLiked ? currentLikeCount + 1 : currentLikeCount - 1;

    // Update local storage
    let likedItems = JSON.parse(localStorage.getItem('likedItems')) || {};
    if (isLiked) {
        likedItems[itemId] = true;
    } else {
        delete likedItems[itemId];
    }
    localStorage.setItem('likedItems', JSON.stringify(likedItems));

    try {
        if (isLiked) {
            await supabase.from('likes').insert({ user_id: window.currentUser.id, menu_item_id: itemId });
        } else {
            await supabase.from('likes').delete().match({ user_id: window.currentUser.id, menu_item_id: itemId });
        }
    } catch (error) {
        console.error("Error updating like:", error);
        // Revert UI on error
        isLiked = !isLiked;
        button.classList.toggle('liked', isLiked);
        button.dataset.liked = isLiked;
        icon.className = `fa-${isLiked ? 'solid' : 'regular'} fa-heart`;
        likeCountSpan.textContent = isLiked ? currentLikeCount + 1 : currentLikeCount - 1;
        // Revert local storage
        if (isLiked) {
            delete likedItems[itemId];
        } else {
            likedItems[itemId] = true;
        }
        localStorage.setItem('likedItems', JSON.stringify(likedItems));
    }
}
