// js_home.js

// Function to trigger confetti animation
function triggerConfetti(x, y) {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight }
    });
}

// Function to create a food item card (used on home and search pages)
function createItemCard(item) {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.dataset.id = item.id; // Store item ID
    itemCard.dataset.shopId = item.seller_id; // Store shop ID

    itemCard.innerHTML = `
        <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}">
        <h4>${item.name}</h4>
        <p class="price">₹${item.price ? item.price.toFixed(2) : '0.00'}</p>
        <p class="like-count">❤️ ${item.like_count || 0}</p>
        <div class="action-buttons">
            <button class="add-to-cart-button">Add to Cart</button>
            <button class="share-button">Share</button>
        </div>
    `;

    // Add to Cart button logic with confetti
    const addToCartButton = itemCard.querySelector('.add-to-cart-button');
    addToCartButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent card click from triggering
        console.log(`Adding ${item.name} to cart!`);
        triggerConfetti(event.clientX, event.clientY);
        window.addToCart(item, 1); // Add 1 quantity
        // Optionally, show a mini-cart confirmation or toast
    });

    // Share button logic
    const shareButton = itemCard.querySelector('.share-button');
    shareButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent card click from triggering
        const shareText = `Check out ${item.name} for just ₹${item.price ? item.price.toFixed(2) : '0.00'} on StreetR!`;
        if (navigator.share) {
            navigator.share({
                title: item.name,
                text: shareText,
                url: window.location.href, // Or a specific item detail URL if available
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(console.error);
        } else {
            alert(`Share this: ${shareText} - ${window.location.href}`);
        }
    });

    // Make the entire card tappable to lead to a detail page
    itemCard.addEventListener('click', () => {
        navigateToItemDetailPage(item.id);
    });

    return itemCard;
}

// Function to navigate to item detail page and load its content
async function navigateToItemDetailPage(itemId) {
    showLoader();
    navigateToPage('main-app-view', 'item-detail-page'); // Navigate to the detail page container

    const itemImage = document.getElementById('detail-item-image');
    const itemName = document.getElementById('detail-item-name');
    const shopNameText = document.getElementById('detail-shop-name-text');
    const itemPrice = document.getElementById('detail-item-price');
    const itemDescription = document.getElementById('detail-item-description');
    const detailLikeCount = document.getElementById('detail-like-count');
    const detailLikeButton = document.getElementById('detail-like-button');
    const detailShareButton = document.getElementById('detail-share-button');
    const detailAddToCartButton = document.getElementById('detail-add-to-cart-button');
    const sameShopMenuContainer = document.getElementById('same-shop-menu-container');

    try {
        const { data: item, error: itemError } = await supabase
            .from('menu_items')
            .select('*, profiles!seller_id(shop_name), likes(user_id)') // Fetch item, shop name, and likes
            .eq('id', itemId)
            .single();

        if (itemError) throw itemError;

        // Fetch total like count for the item
        const { count: likeCount, error: countError } = await supabase
            .from('likes')
            .select('*', { count: 'exact' })
            .eq('item_id', itemId);

        if (countError) throw countError;

        // Check if current user has liked this item
        const hasLiked = item.likes.some(like => like.user_id === window.currentUser.id);

        itemImage.src = item.image_url || 'assets/placeholder-food.png';
        itemName.textContent = item.name;
        shopNameText.textContent = item.profiles.shop_name || 'Unknown Shop';
        itemPrice.textContent = item.price ? item.price.toFixed(2) : '0.00';
        itemDescription.textContent = item.description || 'No description available.';
        detailLikeCount.textContent = likeCount;

        if (hasLiked) {
            detailLikeButton.classList.add('liked'); // Add a class for styling liked state
        } else {
            detailLikeButton.classList.remove('liked');
        }

        // Like button functionality
        detailLikeButton.onclick = async () => {
            if (!window.currentUser) return;
            const likeAction = hasLiked ? 'unlike' : 'like';

            if (likeAction === 'like') {
                const { error: insertError } = await supabase
                    .from('likes')
                    .insert([{ item_id: item.id, user_id: window.currentUser.id }]);
                if (insertError) console.error('Error liking item:', insertError.message);
            } else {
                const { error: deleteError } = await supabase
                    .from('likes')
                    .delete()
                    .eq('item_id', item.id)
                    .eq('user_id', window.currentUser.id);
                if (deleteError) console.error('Error unliking item:', deleteError.message);
            }
            // Reload the item detail page to reflect new like count and status
            navigateToItemDetailPage(itemId);
            // Also update likes page if it's open
            if (document.getElementById('likes-page-content').classList.contains('active')) {
                loadLikedItems();
            }
        };

        // Share button functionality on detail page
        detailShareButton.onclick = () => {
            const shareText = `Check out ${item.name} from ${item.profiles.shop_name} for just ₹${item.price.toFixed(2)} on StreetR!`;
            if (navigator.share) {
                navigator.share({
                    title: item.name,
                    text: shareText,
                    url: window.location.href, // Or a specific item detail URL
                }).then(() => {
                    console.log('Thanks for sharing!');
                }).catch(console.error);
            } else {
                alert(`Share this: ${shareText} - ${window.location.href}`);
            }
        };

        // Add to Cart button functionality on detail page
        detailAddToCartButton.onclick = (event) => {
            triggerConfetti(event.clientX, event.clientY);
            window.addToCart(item, 1);
            alert(`${item.name} added to cart!`);
        };

        // Load "More from this Shop"
        sameShopMenuContainer.innerHTML = '';
        const { data: shopItems, error: shopItemsError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('seller_id', item.seller_id)
            .eq('is_available', true)
            .neq('id', item.id) // Exclude the current item
            .limit(4); // Limit to a few items

        if (shopItemsError) throw shopItemsError;

        if (shopItems.length > 0) {
            shopItems.forEach(shopItem => {
                sameShopMenuContainer.appendChild(createItemCard(shopItem));
            });
        } else {
            sameShopMenuContainer.innerHTML = '<p>No other items available from this shop.</p>';
        }

    } catch (error) {
        console.error('Error loading item detail page:', error.message);
        itemName.textContent = 'Item Not Found';
        shopNameText.textContent = '';
        itemPrice.textContent = '';
        itemDescription.textContent = 'Could not load item details.';
        sameShopMenuContainer.innerHTML = '<p>Failed to load related items.</p>';
    } finally {
        hideLoader();
    }
}


async function loadHomePageContent() {
    showLoader();
    const popularItemsContainer = document.getElementById('popular-items-container');
    const allItemsContainer = document.getElementById('all-items-container');

    popularItemsContainer.innerHTML = '';
    allItemsContainer.innerHTML = '';

    try {
        const user = window.currentUser;
        if (!user) {
            console.error('User not logged in, cannot fetch items.');
            hideLoader();
            return;
        }

        // Fetch seller IDs (you might want to cache this or get from a more specific query)
        const { data: sellers, error: sellerError } = await supabase
            .from('profiles')
            .select('id, pincode')
            .eq('user_type', 'Seller');

        if (sellerError) throw sellerError;

        const userPincode = window.userProfile?.pincode;
        const localSellerIds = sellers
            .filter(seller => seller.pincode === userPincode)
            .map(seller => seller.id);

        if (localSellerIds.length === 0) {
            popularItemsContainer.innerHTML = '<p>No local shops found based on your pincode.</p>';
            allItemsContainer.innerHTML = '<p>No local items available.</p>';
            hideLoader();
            return;
        }

        // Fetch all menu items from local sellers with like counts and user's like status
        const { data: menuItems, error: rpcError } = await supabase.rpc('get_menu_items_with_likes', {
            p_seller_ids: localSellerIds,
            p_user_id: user.id
        });

        if (rpcError) throw rpcError;

        // Sort items for "Popular Items" (e.g., by like_count descending)
        const sortedItems = [...menuItems].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));

        // Display Popular Items (e.g., top 6)
        const popularItems = sortedItems.slice(0, 6);
        if (popularItems.length > 0) {
            popularItems.forEach(item => {
                popularItemsContainer.appendChild(createItemCard(item));
            });
        } else {
            popularItemsContainer.innerHTML = '<p>No popular items available yet from local shops.</p>';
        }

        // Display All Available Items
        if (menuItems.length > 0) {
            menuItems.forEach(item => {
                allItemsContainer.appendChild(createItemCard(item));
            });
        } else {
            allItemsContainer.innerHTML = '<p>No other items available from local shops at the moment.</p>';
        }

    } catch (error) {
        console.error('Error loading home page content:', error.message);
        popularItemsContainer.innerHTML = '<p>Failed to load popular items.</p>';
        allItemsContainer.innerHTML = '<p>Failed to load all items.</p>';
    } finally {
        hideLoader();
    }
}

// Attach event listener to the Home button in the bottom navigation
document.addEventListener('DOMContentLoaded', () => {
    const homeButton = document.querySelector('button[data-page="home-page-content"]');
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            navigateToPage('main-app-view', 'home-page-content');
            loadHomePageContent(); // Reload content when home is active
        });
    }
});
