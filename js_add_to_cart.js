// js_add_to_cart.js
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSummaryDiv = document.getElementById('cart-summary');
const cartTotalPriceSpan = document.getElementById('cart-total-price');
const orderNowButton = document.getElementById('order-now-button');

function getCart() {
    return JSON.parse(localStorage.getItem('streetrCart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('streetrCart', JSON.stringify(cart));
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
    alert(`${item.name} added to cart!`);
    displayCartItems(); // Refresh cart view
}

function updateCartQuantity(itemId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(cartItem => cartItem.id === itemId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); // Remove item if quantity is 0 or less
        }
    }

    saveCart(cart);
    displayCartItems();
}

function displayCartItems() {
    const cart = getCart();
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartSummaryDiv.classList.add('hidden');
        return;
    }

    let totalPrice = 0;
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <p>${item.name} - ₹${item.price.toFixed(2)}</p>
            <div class="quantity-controls">
                <button onclick="updateCartQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
        totalPrice += item.price * item.quantity;
    });

    cartTotalPriceSpan.textContent = `₹${totalPrice.toFixed(2)}`;
    cartSummaryDiv.classList.remove('hidden');
}

orderNowButton?.addEventListener('click', () => {
    // In a real app, this would call the payment gateway function
    // For now, we will directly create the order
    createOrder();
});
