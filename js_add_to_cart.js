// js_add_to_cart.js

// --- DOM ELEMENTS ---
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSummaryDiv = document.getElementById('cart-summary');
const cartEmptyView = document.getElementById('cart-empty-view');
const placeOrderButton = document.getElementById('place-order-button');
const disclaimerModal = document.getElementById('disclaimer-modal');
const disclaimerOkButton = document.getElementById('disclaimer-ok-button');

// Bill details elements
const cartSubtotalSpan = document.getElementById('cart-subtotal');
const cartPlatformFeeSpan = document.getElementById('cart-platform-fee');
const cartGstSpan = document.getElementById('cart-gst');
const cartDeliveryFeeSpan = document.getElementById('cart-delivery-fee');
const cartGrandTotalSpan = document.getElementById('cart-grand-total');

// New delivery switch and bill rows
const doorDeliverySwitch = document.getElementById('door-delivery-switch');
const gstRow = document.getElementById('gst-row');
const deliveryRow = document.getElementById('delivery-row');

// --- CONSTANTS ---
const PLATFORM_FEE = 5.00; // Platform charge of ₹5
const GST_RATE = 0.10; // 10% GST

// --- CART LOGIC ---
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

// --- BILL CALCULATION ---
function calculateDeliveryFee(subtotal) {
    if (subtotal <= 100) return 10;
    if (subtotal <= 200) return 15;
    if (subtotal <= 500) return 20;
    if (subtotal <= 1000) return 25;
    return 30;
}

function updateBillDetails() {
    const cart = getCart();
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const isDelivery = doorDeliverySwitch.checked;

    let gst = 0;
    let deliveryFee = 0;
    let grandTotal = subtotal + PLATFORM_FEE;

    // Display charges based on the switch
    if (isDelivery) {
        gst = subtotal * GST_RATE;
        deliveryFee = calculateDeliveryFee(subtotal);
        grandTotal += gst + deliveryFee;

        gstRow.classList.remove('hidden');
        deliveryRow.classList.remove('hidden');
    } else {
        gstRow.classList.add('hidden');
        deliveryRow.classList.add('hidden');
    }

    // Update the UI
    cartSubtotalSpan.textContent = ₹${subtotal.toFixed(2)};
    cartPlatformFeeSpan.textContent = ₹${PLATFORM_FEE.toFixed(2)};
    cartGstSpan.textContent = ₹${gst.toFixed(2)};
    cartDeliveryFeeSpan.textContent = ₹${deliveryFee.toFixed(2)};
    cartGrandTotalSpan.textContent = ₹${grandTotal.toFixed(2)};
}

// --- DISPLAY LOGIC ---
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

    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item-card';
        itemElement.innerHTML = `
            <img src="${item.image_url || 'assets/placeholder-food.png'}" alt="${item.name}">
            <div class="cart-item-details">
                <h5>${item.name}</h5>
                <p>Price: ₹${item.price.toFixed(2)}</p>
                <div class="cart-item-footer">
                    <div class="quantity-controls">
                        <button class="quantity-btn" data-id="${item.id}" data-change="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-change="1">+</button>
                    </div>
                    <span class="cart-item-subtotal">₹${itemSubtotal.toFixed(2)}</span>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // Add event listeners to new quantity buttons
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.dataset.id;
            const change = parseInt(btn.dataset.change);
            updateCartQuantity(itemId, change);
        });
    });

    // Initial bill calculation
    updateBillDetails();
}

// --- EVENT LISTENERS ---
// Listen for changes on the delivery switch
doorDeliverySwitch?.addEventListener('change', updateBillDetails);

// Handle the "Place Order" button click to show the disclaimer
placeOrderButton?.addEventListener('click', () => {
    disclaimerModal.classList.remove('hidden');
});

// Handle the "OK" button on the disclaimer to proceed to payment
disclaimerOkButton?.addEventListener('click', () => {
    disclaimerModal.classList.add('hidden');
    // Store delivery preference for the payment page to access
    sessionStorage.setItem('isDelivery', doorDeliverySwitch.checked);
    navigateToPage('payment-page');
});
