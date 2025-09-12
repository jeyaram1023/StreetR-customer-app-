// js_payment.js

document.addEventListener('DOMContentLoaded', () => {
    // This script's functions will be called by the navigation logic
    // when the payment page becomes active.
});

// Call this function when navigating to the payment page
async function initializePaymentPage() {
    showLoader();
    try {
        const cart = getCart();
        if (cart.length === 0) {
            alert("Your cart is empty. Redirecting to home.");
            navigateToPage('main-app-view', 'home-page-content');
            return;
        }

        // Get delivery preference from sessionStorage
        const isDelivery = sessionStorage.getItem('isDelivery') === 'true';

        // 1. Generate the order_token from your backend
        const { order_token } = await generateCashfreeToken(cart, isDelivery);

        // 2. Show the Cashfree Drop-in UI
        triggerCashfreeCheckout(order_token, { cart, isDelivery });

    } catch (error) {
        console.error("Error initiating payment:", error);
        alert(`Error: ${error.message}`);
        navigateToPage('main-app-view', 'cart-page-content');
    } finally {
        hideLoader();
    }
}

async function generateCashfreeToken(cart, isDelivery) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        throw new Error("User not authenticated.");
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-cashfree-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ cart: cart, is_delivery: isDelivery }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate Cashfree token.');
    }
    return await response.json();
}

function triggerCashfreeCheckout(orderToken, orderData) {
    const cashfree = new Cashfree({
        mode: "sandbox" // Use "production" for live payments
    });

    cashfree.drop(document.getElementById("payment-page"), {
        orderToken: orderToken,
        onSuccess: (data) => handlePaymentSuccess(data.order, orderData),
        onFailure: (data) => {
            console.error("Payment failed:", data.order);
            alert(`Payment Failed: ${data.order.errorText}`);
        },
    });
}

// Generates a 6-digit alphanumeric OTP
function generateOTP() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otp;
}

async function handlePaymentSuccess(order, orderData) {
    showLoader();
    try {
        const { cart, isDelivery } = orderData;
        const sellerId = cart.length > 0 ? cart[0].seller_id : null;
        if (!sellerId) {
            throw new Error("Seller information is missing from the cart.");
        }

        // Re-calculate final amounts for database storage
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const platformFee = 5.00;
        const gst = isDelivery ? subtotal * 0.10 : 0;
        const deliveryFee = isDelivery ? calculateDeliveryFee(subtotal) : 0;
        const totalAmount = subtotal + platformFee + gst + deliveryFee;

        const sellerAmount = subtotal; 
        const companyProfit = platformFee + gst; 

        const newOTP = generateOTP(); 

        // 3. Store order data in Supabase
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
            otp: newOTP 
        }]);

        if (error) {
            throw error;
        }

        alert("Payment successful! Your order has been placed.");
        localStorage.removeItem('streetrCart'); 
        sessionStorage.removeItem('isDelivery'); 
        navigateToPage('main-app-view', 'orders-page-content');

    } catch (error) {
        console.error("Error saving order:", error);
        alert(`An error occurred while saving your order: ${error.message}`);
    } finally {
        hideLoader();
    }
}

// Utility functions
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
