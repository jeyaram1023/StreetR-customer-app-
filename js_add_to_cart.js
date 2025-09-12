// js_add_to_cart.js
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSummaryDiv = document.getElementById('cart-summary');
const cartEmptyView = document.getElementById('cart-empty-view');
const placeOrderButton = document.getElementById('place-order-button');

// Bill details spans
const cartSubtotalSpan = document.getElementById('cart-subtotal');
const cartGstSpan = document.getElementById('cart-gst');
const cartPlatformFeeSpan = document.getElementById('cart-platform-fee');
const cartDeliveryFeeSpan = document.getElementById('cart-delivery-fee');
const cartGrandTotalSpan = document.getElementById('cart-grand-total');
const deliveryFeeRow = document.getElementById('delivery-fee-row');

// MODIFIED: New element selectors
const rahulSwitch = document.getElementById('rahul-switch');
const disclaimerModal = document.getElementById('disclaimer-modal');
const disclaimerAcceptBtn = document.getElementById('disclaimer-accept-btn');
const disclaimerCancelBtn = document.getElementById('disclaimer-cancel-btn');


function getCart() {
    return JSON.parse(localStorage.getItem('streetrCart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('streetrCart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
}

function addToCart(item) {
    let cart = getCart();
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    alert(${item.name} added to cart!);
    displayCartItems();
}

function updateCartQuantity(itemId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(cartItem => cartItem.id === itemId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    saveCart(cart);
    displayCartItems();
}

function calculateDeliveryFee(subtotal) {
    if (subtotal <= 100) return 10;
    if (subtotal <= 200) return 15;
    if (subtotal <= 500) return 20;
    if (subtotal <= 1000) return 25;
    return 30;
}

// MODIFIED: displayCartItems function is heavily updated for new logic
function displayCartItems() {
    const cart = getCart();
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartSummaryDiv.classList.add('hidden');
        cartEmptyView.classList.remove('hidden');
        return;
    }

    cartSummaryDiv.classList.remove('hidden');
    cartEmptyView.classList.add('hidden');
    
    let subtotal = 0;
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item-card';
        // ... (itemElement.innerHTML remains the same as your original file)
        cartItemsContainer.appendChild(itemElement);
    });

    // Update bill details based on Rahul Switch
    const gst = subtotal * 0.10;
    const platformFee = 20; // As per requirement
    let deliveryFee = 0;

    if (rahulSwitch.checked) {
        deliveryFee = calculateDeliveryFee(subtotal);
        deliveryFeeRow.style.display = 'flex'; // Show delivery fee row
    } else {
        deliveryFeeRow.style.display = 'none'; // Hide delivery fee row
    }

    const grandTotal = subtotal + gst + platformFee + deliveryFee;
    
    cartSubtotalSpan.textContent = ₹${subtotal.toFixed(2)};
    cartGstSpan.textContent = ₹${gst.toFixed(2)};
    cartPlatformFeeSpan.textContent = ₹${platformFee.toFixed(2)};
    cartDeliveryFeeSpan.textContent = ₹${deliveryFee.toFixed(2)};
    cartGrandTotalSpan.textContent = ₹${grandTotal.toFixed(2)};

    // Add event listeners to new quantity buttons
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.dataset.id;
            const change = parseInt(btn.dataset.change);
            updateCartQuantity(itemId, change);
        });
    });
}

// MODIFIED: Event listener for Place Order button now shows the disclaimer
placeOrderButton?.addEventListener('click', () => {
    disclaimerModal.classList.remove('hidden');
});

// MODIFIED: New event listeners for the disclaimer popup and Rahul switch
disclaimerAcceptBtn?.addEventListener('click', () => {
    disclaimerModal.classList.add('hidden');
    navigateToPage('payment-page');
});

disclaimerCancelBtn?.addEventListener('click', () => {
    disclaimerModal.classList.add('hidden');
});

rahulSwitch?.addEventListener('change', () => {
    displayCartItems(); // Recalculate bill when switch is toggled
});

// Ensure the cart is displayed correctly when the page loads
if (document.getElementById('cart-page-content')) {
    displayCartItems();
}
