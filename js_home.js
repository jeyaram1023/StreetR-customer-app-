// js/js_home.js

// Function to trigger confetti animation
function triggerConfetti(x, y) {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight }
    });
}

// Function to create a food item card
function createItemCard(item, isPopular = false) {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.dataset.id = item.id; // Store item ID

    itemCard.innerHTML = `
        <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}">
        <h4>${item.name}</h4>
        <p class="price">₹${item.price.toFixed(2)}</p>
        <p class="like-count">❤️ ${item.like_count || 0}</p>
        <div class="action-buttons">
            <button class="add-to-cart-button">Add to Cart</button>
            <button class="share-button">Share</button>
        </div>
    `;

    // Add to Cart button logic with confetti
    const addToCartButton = itemCard.querySelector('.add-to-cart-button');
    addToCartButton.addEventListener('click', (event) => {
        // Implement add to cart logic here
        console.log(`Adding ${item.name} to cart!`);
        triggerConfetti(event.clientX, event.clientY);
        // Assuming there's a global cart management function
        window.addToCart(item);
    });

    // Share button logic
    const shareButton = itemCard.querySelector('.share-button');
    shareButton.addEventListener('click', () => {
        const shareText = `Check out ${item.name} for just ₹${item.price.toFixed(2)} on StreetR!`;
        if (navigator.share) {
            navigator.share({
                title: item.name,
                text: shareText,
                url: window.location.href, // Or a specific item detail URL
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(console.error);
        } else {
            // Fallback for desktop or unsupported browsers (e.g., copy to clipboard)
            alert(`Share this: ${shareText} - ${window.location.href}`);
            // You could also open a new window for WhatsApp Web:
            // window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`, '_blank');
        }
    });

    // Make the entire card tappable to lead to a detail page
    itemCard.addEventListener('click', (event) => {
        // Prevent card click when clicking buttons inside it
        if (event.target.tagName === 'BUTTON') return;
        navigateToItemDetailPage(item.id);
    });

    return itemCard;
}

// Placeholder for item detail page navigation
function navigateToItemDetailPage(itemId) {
    console.log(`Navigating to item detail page for item ID: ${itemId}`);
    // In a real app, you'd load a new page or show a modal with item details
    alert(`Showing details for item ID: ${itemId}`);
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
            .select('id')
            .eq('user_type', 'Seller');

        if (sellerError) throw sellerError;

        const sellerIds = sellers.map(seller => seller.id);

        // Fetch all menu items with like counts and user's like status
        // Using the RPC function get_menu_items_with_likes
        const { data: menuItems, error: rpcError } = await supabase.rpc('get_menu_items_with_likes', {
            p_seller_ids: sellerIds,
            p_user_id: user.id
        });

        if (rpcError) throw rpcError;

        // Sort items for "Popular Items" (e.g., by like_count descending)
        const sortedItems = [...menuItems].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));

        // Display Popular Items (e.g., top 6)
        const popularItems = sortedItems.slice(0, 6);
        if (popularItems.length > 0) {
            popularItems.forEach(item => {
                popularItemsContainer.appendChild(createItemCard(item, true));
            });
        } else {
            popularItemsContainer.innerHTML = '<p>No popular items available yet.</p>';
        }

        // Display All Available Items
        if (menuItems.length > 0) {
            menuItems.forEach(item => {
                allItemsContainer.appendChild(createItemCard(item));
            });
        } else {
            allItemsContainer.innerHTML = '<p>No other items available at the moment.</p>';
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

    // Initial load if home page is active on startup (handled by js_main.js usually)
    // You might call loadHomePageContent() from js_main.js after successful login/initial app load
});


// js/js_search.js (New file)

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const searchPageContent = document.getElementById('search-page-content');
    const searchInput = document.getElementById('search-input');
    const clearSearchButton = document.getElementById('clear-search-button');
    const searchSuggestionsContainer = document.getElementById('search-suggestions');
    const foodItemsTab = document.getElementById('food-items-tab');
    const shopsTab = document.getElementById('shops-tab');
    const foodResultsContainer = document.getElementById('food-results');
    const shopResultsContainer = document.getElementById('shop-results');
    const emptyState = document.getElementById('empty-state');
    const emptyStateText = document.getElementById('empty-state-text');
    const qrScannerButton = document.getElementById('qr-scanner-button');

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

            // --- Search Food Items ---
            if (currentTab === 'food') {
                const { data: foodItems, error: foodError } = await supabase
                    .from('menu_items')
                    .select('*, profiles!seller_id(pincode)') // Fetch pincode from seller profile
                    .ilike('name', `%${query}%`)
                    .eq('is_available', true);

                if (foodError) throw foodError;

                const filteredFoodItems = foodItems.filter(item => {
                    // Assuming user's pincode is in window.userProfile.pincode
                    return item.profiles && item.profiles.pincode === window.userProfile?.pincode;
                });

                if (filteredFoodItems.length > 0) {
                    filteredFoodItems.forEach(item => {
                        const foodCard = createItemCard(item); // Re-use createItemCard from js_home.js
                        foodResultsContainer.appendChild(foodCard);
                    });
                } else {
                    emptyState.classList.remove('hidden');
                    emptyStateText.textContent = `No food items found for '${query}'. Try another keyword!`;
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
                    // Filter shops by user's pincode
                    return shop.pincode === window.userProfile?.pincode;
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
                    emptyStateText.textContent = `No shops found for '${query}'. Try another keyword!`;
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

    // Placeholder for shop profile page navigation
    function navigateToShopProfilePage(shopId) {
        console.log(`Navigating to shop profile page for shop ID: ${shopId}`);
        // In a real app, you'd load a new page or show a modal with shop details and menu
        alert(`Showing menu for shop ID: ${shopId}`);
        // Example: window.location.href = `seller-menu.html?sellerId=${shopId}`;
    }

    // --- QR Scanner Button ---
    qrScannerButton.addEventListener('click', () => {
        // Implement QR scanner functionality
        // This typically requires a library like html5-qrcode or a native app integration
        alert('QR Scanner functionality would be implemented here to open camera and scan.');
        console.log('Attempting to open QR scanner...');
        // Example: You'd integrate a QR scanning library and handle the scanned result
        // if (window.confirm('Simulate QR scan?')) {
        //     const dummySellerId = 'YOUR_SAMPLE_SELLER_ID_FROM_QR'; // Replace with actual scanned ID
        //     navigateToShopProfilePage(dummySellerId);
        // }
    });

    // Ensure the search page is hidden by default if not the initial active page
    // This will be handled by js_main.js
});


// js/js_main.js (Modifications)
// This file needs to orchestrate page navigation and initial loads.

// (Keep existing functions like navigateToPage, showLoader, hideLoader, setupAuthListeners, etc.)

document.addEventListener('DOMContentLoaded', async () => {
    // Initial setup from js_main.js
    const user = await getCurrentUser();
    window.currentUser = user;

    if (user) {
        const profile = await fetchProfile(user.id);
        window.userProfile = profile;
        if (profile) {
            navigateToPage('main-app-view', 'home-page-content');
            loadHomePageContent(); // Load home page content after successful login
            document.getElementById('app-header').style.display = 'flex';
            document.getElementById('bottom-nav').style.display = 'flex';
        } else {
            navigateToPage('profile-setup-page');
        }
    } else {
        navigateToPage('login-page');
    }

    // --- Tab Navigation for bottom nav (ensure it handles new search page) ---
    document.querySelectorAll('.bottom-nav .nav-item').forEach(button => {
        button.addEventListener('click', () => {
            const targetPageContentId = button.dataset.page;
            if (targetPageContentId) {
                navigateToPage('main-app-view', targetPageContentId);

                // Add specific loaders for pages that need data
                if (targetPageContentId === 'home-page-content') {
                    loadHomePageContent();
                }
                // Add any other page-specific loading functions here
                // For search, it's triggered by search button click, not directly bottom nav
            }

            // Update active state for nav items
            document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
                item.classList.remove('active');
            });
            button.classList.add('active');
        });
    });

    // Handle initial active nav item if needed
    const initialActivePage = document.querySelector('.tab-content.active');
    if (initialActivePage) {
        const correspondingNavItem = document.querySelector(`.bottom-nav .nav-item[data-page="${initialActivePage.id}"]`);
        if (correspondingNavItem) {
            correspondingNavItem.classList.add('active');
        }
    }
});
