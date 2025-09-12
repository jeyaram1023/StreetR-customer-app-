const popularItemsContainer = document.getElementById('popular-items-container');
const allItemsContainer = document.getElementById('all-items-container');
const itemDetailPage = document.getElementById('item-detail-page');

// This variable holds all items to ensure buttons work correctly.
let allFetchedItems = [];

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
            hideLoader();
            return;
        }

        const { data: items, error: itemsError } = await supabase
            .rpc('get_menu_items_with_likes', {
                p_seller_ids: sellerIds,
                p_user_id: window.currentUser.id
            });
        if (itemsError) throw itemsError;
        
        // Store all fetched items in our globally accessible variable.
        allFetchedItems = items;
        
        const popularItems = [...allFetchedItems].sort((a, b) => b.like_count - a.like_count).slice(0, 4);
        renderItems(popularItems, popularItemsContainer, 'popular');
        renderItems(allFetchedItems, allItemsContainer, 'all');

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

        // The fix: Search for the item in the complete 'allFetchedItems' list.
        const item = allFetchedItems.find(i => i.id == itemId);

        if (item) {
            addToCart(item);
            launchConfetti();
        } else {
            console.error('Could not find item with ID:', itemId);
            alert('An error occurred. Could not add item to cart.');
        }
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
    if (!window.currentUser) { 
        alert("Please log in to like items."); 
        return; 
    }
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    const isLiked = button.dataset.liked === 'true';
    const icon = button.querySelector('i');
    
    button.classList.toggle('liked', !isLiked);
    button.dataset.liked = !isLiked;
    icon.className = fa-${!isLiked ? 'solid' : 'regular'} fa-heart;

    try {
        if (isLiked) {
            await supabase.from('likes').delete().match({ user_id: window.currentUser.id, menu_item_id: itemId });
        } else {
            await supabase.from('likes').insert({ user_id: window.currentUser.id, menu_item_id: itemId });
        }
        // Refresh the counts without a full page reload for a better UX
        const { data: { count } } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('menu_item_id', itemId);
        button.querySelector('.like-count').textContent = count;

    } catch (error) {
        console.error("Error updating like:", error);
        button.classList.toggle('liked', isLiked);
        button.dataset.liked = isLiked;
        icon.className = fa-${isLiked ? 'solid' : 'regular'} fa-heart;
    }
}

function shareItem(itemName, itemId) {
    if (navigator.share) {
        const baseUrl = window.location.href.split('?')[0];
        const shareUrl = ${baseUrl}?itemId=${itemId};
        navigator.share({
            title: 'Check out this item on StreetR!',
            text: I found this delicious ${itemName} on the StreetR app!,
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
            .select(*, seller:profiles(shop_name))
            .eq('id', itemId)
            .single();
        if (error) throw error;

        const { data: otherItems, error: otherItemsError } = await supabase
            .from('menu_items')
            .select(*)
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
                <div class="item-detail-actions">
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
        
        navigateToPage('item-detail-page');
    } catch (error) {
        console.error('Error fetching item details:', error);
        alert('Could not load item details.');
    } finally {
        hideLoader();
    }
}
