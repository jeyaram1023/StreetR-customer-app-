// js_likes.js (New File)

document.addEventListener('DOMContentLoaded', () => {
    const likedItemsContainer = document.getElementById('liked-items-container');
    const emptyLikesState = document.getElementById('empty-likes-state');
    const likesNavButton = document.querySelector('button[data-page="likes-page-content"]');

    // Function to load and display liked items
    async function loadLikedItems() {
        showLoader();
        likedItemsContainer.innerHTML = '';
        emptyLikesState.classList.add('hidden');

        try {
            const user = window.currentUser;
            if (!user) {
                console.error('User not logged in, cannot fetch liked items.');
                emptyLikesState.classList.remove('hidden');
                emptyLikesState.querySelector('p').textContent = 'Please log in to see your liked items.';
                return;
            }

            // Fetch liked item IDs for the current user
            const { data: likedRefs, error: likedRefError } = await supabase
                .from('likes')
                .select('item_id')
                .eq('user_id', user.id);

            if (likedRefError) throw likedRefError;

            const likedItemIds = likedRefs.map(ref => ref.item_id);

            if (likedItemIds.length === 0) {
                emptyLikesState.classList.remove('hidden');
                emptyLikesState.querySelector('p').textContent = 'You haven\'t liked any items yet!';
                hideLoader();
                return;
            }

            // Fetch details for the liked items
            const { data: likedItems, error: itemsError } = await supabase
                .from('menu_items')
                .select('*')
                .in('id', likedItemIds);

            if (itemsError) throw itemsError;

            if (likedItems.length > 0) {
                likedItems.forEach(item => {
                    likedItemsContainer.appendChild(createItemCard(item)); // Reuse item card creation from js_home.js
                });
            } else {
                emptyLikesState.classList.remove('hidden');
                emptyLikesState.querySelector('p').textContent = 'Could not find details for your liked items.';
            }

        } catch (error) {
            console.error('Error loading liked items:', error.message);
            emptyLikesState.classList.remove('hidden');
            emptyLikesState.querySelector('p').textContent = `Error loading liked items: ${error.message}`;
        } finally {
            hideLoader();
        }
    }

    // Attach event listener to the Likes button in the bottom navigation
    if (likesNavButton) {
        likesNavButton.addEventListener('click', () => {
            navigateToPage('main-app-view', 'likes-page-content');
            loadLikedItems(); // Load data when likes page is active
        });
    }

    // Initial load if likes page is the default or becomes active
    if (document.getElementById('likes-page-content').classList.contains('active')) {
        loadLikedItems();
    }
});
