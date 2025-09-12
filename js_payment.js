
// js_payment.js

document.addEventListener('DOMContentLoaded', () => {
    const placeOrderButton = document.getElementById('place-order-button');

    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', handlePlaceOrder);
    }
});

async function handlePlaceOrder() {
    showLoader();
    try {
        const cart = getCart();
        if (cart.length === 0) {
            alert("Your cart is empty.");
            hideLoader();
            return;
        }

        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const gst = 18;
        const deliveryFee = calculateDeliveryFee(subtotal);
        const platformFee = 20;
        const totalAmount = subtotal + gst + deliveryFee + platformFee;

        // 1. Generate the order_token from your backend
        const { order_token } = await generateCashfreeToken(totalAmount, cart);

        // 2. Show the Cashfree Drop-in UI
        triggerCashfreeCheckout(order_token, {
            totalAmount,
            platformFee,
            gst,
            deliveryFee,
            cart
        });

    } catch (error) {
        console.error("Error placing order:", error);
        alert(`Error: ${error.message}`);
    } finally {
        hideLoader();
    }
}

async function generateCashfreeToken(totalAmount, cart) {
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
        body: JSON.stringify({ total_amount: totalAmount, cart: cart }),
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

async function handlePaymentSuccess(order, orderData) {
    showLoader();
    try {
        const { cart, totalAmount, platformFee, gst, deliveryFee } = orderData;
        const sellerId = cart.length > 0 ? cart[0].seller_id : null;
        if (!sellerId) {
            throw new Error("Seller information is missing from the cart.");
        }

        const sellerAmount = totalAmount - platformFee - gst - deliveryFee;
        const companyProfit = platformFee + gst;

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
            order_details: cart
        }]);

        if (error) {
            throw error;
        }

        alert("Payment successful! Your order has been placed.");
        localStorage.removeItem('streetrCart'); // Clear the cart
        navigateToPage('main-app-view', 'orders-page-content');

    } catch (error) {
        console.error("Error saving order:", error);
        alert(`An error occurred while saving your order: ${error.message}`);
    } finally {
        hideLoader();
    }
}

// Utility function from your existing code
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
