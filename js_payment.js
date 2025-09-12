// js_payment.js

document.addEventListener('DOMContentLoaded', () => {
    const initiatePaymentButton = document.getElementById('initiate-payment-button');
    const backToCartButton = document.getElementById('back-to-cart-button');
    
    if (initiatePaymentButton) {
        initiatePaymentButton.addEventListener('click', handlePaymentInitiation);
    }
    
    if (backToCartButton) {
        backToCartButton.addEventListener('click', () => {
             navigateToPage('main-app-view', 'cart-page-content');
        });
    }
});

async function handlePaymentInitiation() {
    const initiatePaymentButton = document.getElementById('initiate-payment-button');
    const paymentMessage = document.getElementById('payment-message');
    
    initiatePaymentButton.disabled = true;
    initiatePaymentButton.textContent = 'Initializing...';
    paymentMessage.textContent = '';
    showLoader();

    try {
        const cart = getCart();
        if (cart.length === 0) {
            throw new Error("Your cart is empty. Please add items before proceeding.");
        }
        
        const isDeliveryEnabled = JSON.parse(localStorage.getItem('isRahulSwitchOn')) || false;
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const gst = subtotal * 0.10;
        const platformFee = 20;
        const deliveryFee = isDeliveryEnabled ? calculateDeliveryFee(subtotal) : 0;
        const totalAmount = subtotal + gst + platformFee + deliveryFee;

        const { order_token } = await generateCashfreeToken(totalAmount, cart);
        
        initiatePaymentButton.style.display = 'none';

        triggerCashfreeCheckout(order_token, {
            totalAmount,
            gst,
            deliveryFee,
            platformFee,
            cart
        });

    } catch (error) {
        console.error("Error initiating payment:", error);
        paymentMessage.textContent = Error: ${error.message};
        paymentMessage.className = 'message error';
        initiatePaymentButton.disabled = false;
        initiatePaymentButton.textContent = 'Proceed to Pay';
    } finally {
        hideLoader();
    }
}

async function generateCashfreeToken(totalAmount, cart) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        throw new Error("You must be logged in to place an order.");
    }

    const response = await fetch(${SUPABASE_URL}/functions/v1/create-cashfree-order, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': Bearer ${session.access_token},
        },
        body: JSON.stringify({ total_amount: totalAmount, cart: cart }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate payment session.');
    }
    return await response.json();
}

function triggerCashfreeCheckout(orderToken, orderData) {
    const cashfree = new Cashfree({
        mode: "sandbox" // Use "production" for live payments
    });
    
    cashfree.drop(document.getElementById("payment-form-container"), {
        orderToken: orderToken,
        onSuccess: (data) => handlePaymentSuccess(data.order, orderData),
        onFailure: (data) => {
            console.error("Payment failed:", data.order);
            alert(Payment Failed: ${data.order.errorText});
            const initiatePaymentButton = document.getElementById('initiate-payment-button');
            initiatePaymentButton.style.display = 'block';
            initiatePaymentButton.disabled = false;
            initiatePaymentButton.textContent = 'Try Again';
        },
    });
}

async function handlePaymentSuccess(order, orderData) {
    showLoader();
    try {
        const { cart, totalAmount, gst, deliveryFee, platformFee } = orderData;
        const sellerId = cart.length > 0 ? cart[0].seller_id : null;
        if (!sellerId) {
            throw new Error("Critical error: Seller information is missing from the cart.");
        }

        const sellerAmount = totalAmount - platformFee - gst - deliveryFee;
        const companyProfit = platformFee;
        const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

        const { error } = await supabase.from('orders').insert([{
            payment_token: order.paymentToken,
            user_id: window.currentUser.id,
            seller_id: sellerId,
            total_amount: totalAmount,
            platform_fee: platformFee,
            gst: gst,
            delivery_fee: deliveryFee,
            seller_amount: sellerAmount,
            company_profit: companyProfit,
            status: 'paid', 
            order_details: cart,
            delivery_otp: deliveryOtp
        }]);

        if (error) {
            throw error;
        }

        alert("Payment successful! Your order has been placed.");
        localStorage.removeItem('streetrCart'); 
        window.dispatchEvent(new CustomEvent('cartUpdated')); 
        navigateToPage('main-app-view', 'orders-page-content');

    } catch (error) {
        console.error("Error saving order:", error);
        alert(Your payment was successful, but we encountered an error while saving your order: ${error.message}. Please contact support.);
    } finally {
        hideLoader();
    }
}

function getCart() {
    return JSON.parse(localStorage.getItem('streetrCart')) || [];
}

function calculateDeliveryFee(subtotal) {
    if (subtotal <= 100) return 10;
    if (subtotal <= 200) return 15;
    if (subtotal <= 500) return 20;
    if (subtotal <= 1000) return 25;
    return 30;
}
