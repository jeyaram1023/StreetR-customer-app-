// js_home.js

const popularItemsContainer = document.getElementById('popular-items-container');
const allItemsContainer = document.getElementById('all-items-container');

async function loadHomePageContent() {
    if (!window.userProfile?.pincode) {
        popularItemsContainer.innerHTML = '<p>Please complete your profile to see items in your area.</p>';
        return;
    }
    
    showLoader();
    try {
        // Fetch all menu items available in the user's pincode area
        // This requires sellers' profiles to have pincode information.
        
        // 1. Get seller IDs in the user's pincode
        const { data: sellers, error: sellersError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_type', 'Seller')
            .eq('pincode', window.userProfile.pincode);

        if (sellersError) throw sellersError;

        const sellerIds = sellers.map(s => s.id);

        if (sellerIds.length === 0) {
            popularItemsContainer.innerHTML = '<p>No sellers found in your area.</p>';
            allItemsContainer.innerHTML = '';
            return;
        }

        // 2. Fetch all menu items from those sellers, along with like counts.
        // We'll use a Supabase RPC function for efficiency here.
        // See Step 1 for the SQL to create this function.
        const { data: items, error: itemsError } = await supabase
            .rpc('get_menu_items_with_likes', {
                p_seller_ids: sellerIds,
                p_user_id: window.currentUser.id
            });

        if (itemsError) throw itemsError;

        // 3. Separate into popular and all items
        const popularItems = items.sort((a, b) => b.like_count - a.like_count).slice(0, 10); // Top 10 are popular
        const allItems = items;

        renderItems(popularItems, popularItemsContainer);
        renderItems(allItems, allItemsContainer);

    } catch (error) {
        console.error('Error loading home page:', error);
        popularItemsContainer.innerHTML = '<p>Could not load items. Please try again.</p>';
    } finally {
        hideLoader();
    }
}

function renderItems(items, container) {
    container.innerHTML = ''; // Clear previous content
    if (!items || items.length === 0) {
        container.innerHTML = '<p>No items to display.</p>';
        return;
    }

    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.innerHTML = `
            <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}">
            <h4>${item.name}</h4>
            <p>₹${item.price.toFixed(2)}</p>
            <div class="like-container">
                <button class="like-button ${item.is_liked_by_user ? 'liked' : ''}" data-item-id="${item.id}" data-liked="${item.is_liked_by_user}">
                    ❤️
                </button>
                <span class="like-count">${item.like_count}</span>
            </div>
        `;
        container.appendChild(itemCard);
    });

    // Add event listeners to the new like buttons
    container.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', handleLikeClick);
    });
}

async function handleLikeClick(event) {
    if (!window.currentUser) {
        alert("Please log in to like items.");
        return;
    }
    
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    const isLiked = button.dataset.liked === 'true';
    const likeCountSpan = button.nextElementSibling;
    let currentLikeCount = parseInt(likeCountSpan.textContent);

    // Optimistic UI update
    button.classList.toggle('liked');
    button.dataset.liked = !isLiked;
    likeCountSpan.textContent = isLiked ? currentLikeCount - 1 : currentLikeCount + 1;

    try {
        if (isLiked) {
            // Unlike the item
            const { error } = await supabase
                .from('likes')
                .delete()
                .match({ user_id: window.currentUser.id, menu_item_id: itemId });
            if (error) throw error;
        } else {
            // Like the item
            const { error } = await supabase
                .from('likes')
                .insert({ user_id: window.currentUser.id, menu_item_id: itemId });
            if (error) throw error;
        }
    } catch (error) {
        console.error("Error updating like:", error);
        // Revert UI on error
        button.classList.toggle('liked');
        button.dataset.liked = isLiked;
        likeCountSpan.textContent = currentLikeCount;
        alert("Couldn't update like status. Please try again.");
    }
}

// SQL for the RPC function to create in Supabase SQL Editor
/*
CREATE OR REPLACE FUNCTION get_menu_items_with_likes(p_seller_ids uuid[], p_user_id uuid)
RETURNS TABLE (
    id uuid,
    seller_id uuid,
    name text,
    price numeric,
    description text,
    image_url text,
    is_available boolean,
    like_count bigint,
    is_liked_by_user boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mi.id,
        mi.seller_id,
        mi.name,
        mi.price,
        mi.description,
        mi.image_url,
        mi.is_available,
        (SELECT COUNT(*) FROM public.likes l WHERE l.menu_item_id = mi.id) as like_count,
        EXISTS(SELECT 1 FROM public.likes l WHERE l.menu_item_id = mi.id AND l.user_id = p_user_id) as is_liked_by_user
    FROM
        public.menu_items mi
    WHERE
        mi.seller_id = ANY(p_seller_ids) AND mi.is_available = true;
END;
$$ LANGUAGE plpgsql;
*/
