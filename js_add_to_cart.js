// js_add_to_cart.js (Previously js_add_to_cart.js, now handles full cart logic)

// Initialize cart from local storage or as an empty array
let cart = JSON.parse(localStorage.getItem('streetr_cart')) || [];

// Save cart to local storage
function saveCart() {
    localStorage.setItem('streetr_cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Add item to cart
window.addToCart = function(item, quantity = 1) {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({ ...item, quantity: quantity });
    }
    saveCart();
    alert(`${item.name} added to cart!`); // Simple confirmation
    // Optionally trigger a visual update of cart icon count
    updateCartIconCount();
};

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(cartItem => cartItem.id !== itemId);
    saveCart();
    updateCartIconCount();
}

// Adjust item quantity
function adjustQuantity(itemId, change) {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === itemId);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += change;
        if (cart[existingItemIndex].quantity <= 0) {
            removeFromCart(itemId);
        } else {
            saveCart();
        }
    }
    updateCartIconCount();
}

// Calculate delivery fee
function calculateDeliveryFee(subtotal) {
    if (subtotal <= 100) return 10;
    if (subtotal <= 200) return 15;
    if (subtotal <= 500) return 20;
    if (subtotal <= 1000) return 25;
    return 30;
}

// Update cart display on the Cart Page
async function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCartState = document.getElementById('empty-cart-state');
    const cartSubtotalPrice = document.getElementById('cart-subtotal-price');
    const cartGstAmount = document.getElementById('cart-gst-amount');
    const cartDeliveryFee = document.getElementById('cart-delivery-fee');
    const cartGrandTotal = document.getElementById('cart-grand-total');

    cartItemsContainer.innerHTML = ''; // Clear current display

    if (cart.length === 0) {
        emptyCartState.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    } else {
        emptyCartState.classList.add('hidden');
        cartSummary.classList.remove('hidden');
    }

    let subtotal = 0;

    for (const item of cart) {
        // Fetch shop name for the item
        let shopName = 'Unknown Shop';
        if (item.seller_id) {
            try {
                const { data: shop, error } = await supabase
                    .from('profiles')
                    .select('shop_name')
                    .eq('id', item.seller_id)
                    .single();
                if (shop) {
                    shopName = shop.shop_name;
                }
                if (error) console.error('Error fetching shop name:', error.message);
            } catch (e) {
                console.error('Error fetching shop name:', e.message);
            }
        }

        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        const cartItemCard = document.createElement('div');
        cartItemCard.className = 'cart-item-card';
        cartItemCard.innerHTML = `
            <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${shopName}</p>
                <p class="cart-item-price-unit">₹${item.price.toFixed(2)} / unit</p>
                <div class="quantity-controls">
                    <button class="decrease-qty" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase-qty" data-id="${item.id}">+</button>
                </div>
            </div>
            <span class="cart-item-subtotal">₹${itemSubtotal.toFixed(2)}</span>
        `;
        cartItemsContainer.appendChild(cartItemCard);
    }

    const gst = subtotal * 0.10; // 10% GST
    const deliveryFee = calculateDeliveryFee(subtotal);
    const grandTotal = subtotal + gst + deliveryFee;

    cartSubtotalPrice.textContent = `₹${subtotal.toFixed(2)}`;
    cartGstAmount.textContent = `₹${gst.toFixed(2)}`;
    cartDeliveryFee.textContent = `₹${deliveryFee.toFixed(2)}`;
    cartGrandTotal.textContent = `₹${grandTotal.toFixed(2)}`;

    // Attach event listeners for quantity buttons
    cartItemsContainer.querySelectorAll('.decrease-qty').forEach(button => {
        button.onclick = (event) => {
            adjustQuantity(event.target.dataset.id, -1);
            updateCartDisplay(); // Re-render cart after adjustment
        };
    });
    cartItemsContainer.querySelectorAll('.increase-qty').forEach(button => {
        button.onclick = (event) => {
            adjustQuantity(event.target.dataset.id, 1);
            updateCartDisplay(); // Re-render cart after adjustment
        };
    });
}

// Function to update the cart icon count in the header/nav (if exists)
function updateCartIconCount() {
    // You might have a span next to the cart icon to show number of items
    const cartCountElement = document.getElementById('cart-count'); // Assuming you add this ID to a span
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems > 0 ? totalItems : '';
        cartCountElement.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Event listener for Place Order button
document.addEventListener('DOMContentLoaded', () => {
    const placeOrderButton = document.getElementById('place-order-button');
    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', async (event) => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            // Trigger confetti on order attempt
            triggerConfetti(event.clientX, event.clientY);

            // Navigate to payment page
            navigateToPage('main-app-view', 'payment-page');
            // Logic to prepare payment details for payment page will go here
            // e.g., pass total amount to payment page or set a global variable
            const grandTotalText = document.getElementById('cart-grand-total').textContent;
            window.paymentAmount = parseFloat(grandTotalText.replace('₹', ''));
            console.log('Navigating to payment page with amount:', window.paymentAmount);
        });
    }

    // Load cart display when the cart page is activated
    const cartPageButton = document.querySelector('button[data-page="cart-page-content"]');
    if (cartPageButton) {
        cartPageButton.addEventListener('click', () => {
            navigateToPage('main-app-view', 'cart-page-content');
            updateCartDisplay();
        });
    }

    updateCartIconCount(); // Initial update on page load
});
