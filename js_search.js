// js/js_search_filter.js
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const suggestionTags = document.querySelectorAll('.suggestion-tag');
const searchTabs = document.querySelectorAll('.search-tab');
const foodResultsContainer = document.getElementById('search-results-food');
const shopsResultsContainer = document.getElementById('search-results-shops');
const searchResultsContent = document.querySelectorAll('.search-results-content');
const emptyState = document.getElementById('search-empty-state');
const searchQueryDisplay = document.getElementById('search-query-display');

let searchTimeout;

// Event Listeners
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
    searchTimeout = setTimeout(() => {
        performSearch(searchInput.value.trim());
    }, 300);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    clearResults();
});

suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
        searchInput.value = tag.textContent;
        performSearch(tag.textContent);
    });
});

searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        searchTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        searchResultsContent.forEach(content => content.classList.remove('active'));
        const targetContentId = `search-results-${tab.dataset.tab}`;
        document.getElementById(targetContentId).classList.add('active');
    });
});

function clearResults() {
    foodResultsContainer.innerHTML = '';
    shopsResultsContainer.innerHTML = '';
    emptyState.classList.add('hidden');
}

async function performSearch(query) {
    if (!query) {
        clearResults();
        return;
    }

    showLoader();
    clearResults();
    searchQueryDisplay.textContent = query;

    try {
        const pincode = window.userProfile?.pincode;
        if (!pincode) {
            emptyState.classList.remove('hidden');
            return;
        }

        // Fetch sellers in the area first
        const { data: sellers, error: sellersError } = await supabase
            .from('profiles')
            .select('id, shop_name, business_category')
            .eq('user_type', 'Seller')
            .eq('pincode', pincode);
        if (sellersError) throw sellersError;
        const sellerIds = sellers.map(s => s.id);

        if (sellerIds.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        
        // Search for food items
        const { data: foodItems, error: foodError } = await supabase
            .from('menu_items')
            .select('*')
            .in('seller_id', sellerIds)
            .ilike('name', `%${query}%`);
        if (foodError) throw foodError;
        
        renderFoodResults(foodItems);

        // Search for shops
        const filteredShops = sellers.filter(s => 
            s.shop_name.toLowerCase().includes(query.toLowerCase()) || 
            s.business_category.toLowerCase().includes(query.toLowerCase())
        );
        renderShopResults(filteredShops);
        
        if (foodItems.length === 0 && filteredShops.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

    } catch (error) {
        console.error('Search error:', error);
        emptyState.classList.remove('hidden');
    } finally {
        hideLoader();
    }
}

function renderFoodResults(items) {
    foodResultsContainer.innerHTML = '';
    if(items.length === 0) {
        foodResultsContainer.innerHTML = '<p class="no-results-small">No food items found.</p>';
        return;
    }
    const itemGrid = document.createElement('div');
    itemGrid.className = 'item-grid';
    renderItems(items, itemGrid, 'search-food'); // Using the renderer from js_home.js
    foodResultsContainer.appendChild(itemGrid);
}

function renderShopResults(shops) {
    shopsResultsContainer.innerHTML = '';
     if(shops.length === 0) {
        shopsResultsContainer.innerHTML = '<p class="no-results-small">No shops found.</p>';
        return;
    }
    const shopList = document.createElement('div');
    shopList.className = 'shop-list'; // You'd style this class for a list view
    shops.forEach(shop => {
        const shopCard = document.createElement('div');
        shopCard.className = 'shop-card';
        shopCard.dataset.shopId = shop.id;
        shopCard.innerHTML = `
            <img src="assets/shop-placeholder.png" alt="${shop.shop_name}">
            <div class="shop-card-content">
                <h4>${shop.shop_name}</h4>
                <p>Rating: 4.5 <i class="fa-solid fa-star"></i></p>
                <p>Distance: 1.2 km</p>
            </div>
        `;
        shopCard.addEventListener('click', () => showShopProfilePage(shop.id));
        shopList.appendChild(shopCard);
    });
    shopsResultsContainer.appendChild(shopList);
}
