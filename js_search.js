// js_search.js

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const clearSearchButton = document.getElementById('clear-search-button');
    const searchSuggestionsContainer = document.getElementById('search-suggestions');
    const foodItemsTab = document.getElementById('food-items-tab');
    const shopsTab = document.getElementById('shops-tab');
    const foodResultsContainer = document.getElementById('food-results');
    const shopResultsContainer = document.getElementById('shop-results');
    const emptyState = document.getElementById('empty-state');
    const emptyStateText = document.getElementById('empty-state-text');

    let currentSearchQuery = '';
    let currentTab = 'food'; // 'food' or 'shop'

    // --- Search Page Navigation ---
    searchButton.addEventListener('click', () => {
        navigateToPage('main-app-view', 'search-page-content');
        searchInput.focus();
        displaySearchResults(searchInput.value.trim()); // Initial display based on current input
    });

    // --- Search Input and Clear Button ---
    searchInput.addEventListener('input', () => {
        currentSearchQuery = searchInput.value.trim();
        clearSearchButton.style.display = currentSearchQuery ? 'block' : 'none';
        displaySearchResults(currentSearchQuery);
    });

    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchButton.style.display = 'none';
        displaySearchResults(''); // Clear results
    });

    // --- Search Suggestions & History (simplified as static tags for now) ---
    searchSuggestionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('search-tag')) {
            searchInput.value = event.target.textContent;
            currentSearchQuery = searchInput.value.trim();
            clearSearchButton.style.display = 'block';
            displaySearchResults(currentSearchQuery);
        }
    });

    // --- Filter Tabs ---
    foodItemsTab.addEventListener('click', () => {
        foodItemsTab.classList.add('active');
        shopsTab.classList.remove('active');
        foodResultsContainer.classList.add('active');
        shopResultsContainer.classList.remove('active');
        currentTab = 'food';
        displaySearchResults(currentSearchQuery);
    });

    shopsTab.addEventListener('click', () => {
        shopsTab.classList.add('active');
        foodItemsTab.classList.remove('active');
        shopResultsContainer.classList.add('active');
        foodResultsContainer.classList.remove('active');
        currentTab = 'shop';
        displaySearchResults(currentSearchQuery);
    });

    // --- Display Search Results ---
    async function displaySearchResults(query) {
        showLoader();
        foodResultsContainer.innerHTML = '';
        shopResultsContainer.innerHTML = '';
        emptyState.classList.add('hidden');

        if (!query) {
            hideLoader();
            // Optionally show popular or recent items/shops if query is empty
            return;
        }

        try {
            const user = window.currentUser;
            if (!user) {
                console.error('User not logged in, cannot search.');
                hideLoader();
                return;
            }

            const userPincode = window.userProfile?.pincode;

            // --- Search Food Items ---
            if (currentTab === 'food') {
                const { data: foodItems, error: foodError } = await supabase
                    .from('menu_items')
                    .select('*, profiles!seller_id(pincode, shop_name)') // Fetch pincode and shop_name from seller profile
                    .ilike('name', `%${query}%`)
                    .eq('is_available', true);

                if (foodError) throw foodError;

                const filteredFoodItems = foodItems.filter(item => {
                    return item.profiles && item.profiles.pincode === userPincode;
                });

                if (filteredFoodItems.length > 0) {
                    filteredFoodItems.forEach(item => {
                        const foodCard = createItemCard(item); // Re-use createItemCard from js_home.js
                        foodResultsContainer.appendChild(foodCard);
                    });
                } else {
                    emptyState.classList.remove('hidden');
                    emptyStateText.textContent = `No food items found for '${query}' in your area. Try another keyword!`;
                }
            }
            
            // --- Search Shops ---
            if (currentTab === 'shop') {
                const { data: shops, error: shopError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_type', 'Seller')
                    .ilike('shop_name', `%${query}%`);

                if (shopError) throw shopError;

                const filteredShops = shops.filter(shop => {
                    return shop.pincode === userPincode;
                });

                if (filteredShops.length > 0) {
                    filteredShops.forEach(shop => {
                        const shopCard = document.createElement('div');
                        shopCard.className = 'shop-card';
                        shopCard.innerHTML = `
                            <img src="${shop.logo_url || 'assets/placeholder-shop.png'}" alt="${shop.shop_name}" class="shop-logo">
                            <h4>${shop.shop_name}</h4>
                            <p class="rating">⭐️ ${shop.rating || 'N/A'}</p>
                            <p class="distance">${shop.distance || 'N/A'} km</p>
                        `;
                        shopCard.addEventListener('click', () => {
                            navigateToShopProfilePage(shop.id);
                        });
                        shopResultsContainer.appendChild(shopCard);
                    });
                } else {
                    emptyState.classList.remove('hidden');
                    emptyStateText.textContent = `No shops found for '${query}' in your area. Try another keyword!`;
                }
            }

        } catch (error) {
            console.error('Error fetching search results:', error.message);
            emptyState.classList.remove('hidden');
            emptyStateText.textContent = `Error searching for '${query}'. Please try again.`;
        } finally {
            hideLoader();
        }
    }

    // Function to navigate to shop profile page and load its menu
    async function navigateToShopProfilePage(shopId) {
        showLoader();
        console.log(`Navigating to shop profile page for shop ID: ${shopId}`);
        // For simplicity, we'll navigate back to home page and simulate showing menu items from that shop
        // In a real app, you would have a dedicated shop profile page (e.g., 'shop-profile.html')
        // or a modal that loads the shop's menu.

        // For now, let's just log and perhaps display an alert, then go back to home or a relevant page
        alert(`Showing menu for shop ID: ${shopId}. This would typically load a detailed shop profile.`);

        // If you want to actually display the shop's menu on the home page or a temporary view:
        // You would need to fetch menu items for this shopId and render them.
        // For demonstration, let's just go back to home for now.
        navigateToPage('main-app-view', 'home-page-content');
        loadHomePageContent(); // Reload home content

        hideLoader();
    }
});
