// js_order.js

const ordersListContainer = document.getElementById('orders-list');

// MODIFIED: Event delegation for OTP form submission
ordersListContainer.addEventListener('submit', function(event) {
    if (event.target.classList.contains('otp-form')) {
        handleOtpSubmission(event);
    }
});


async function loadOrders() {
    if (!window.currentUser) {
        ordersListContainer.innerHTML = '<p>Please log in to see your orders.</p>';
        return;
    }

    showLoader();
    ordersListContainer.innerHTML = ''; 

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (orders.length === 0) {
            // ... (empty state HTML remains the same)
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';

            const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            
            const itemsHtml = order.order_details.map(item => `
                <div class="order-item-detail">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');

            // === NEW: OTP Form HTML logic ===
            let otpBlockHtml = '';
            // Show OTP block only for active (paid) orders
            if (order.status === 'paid' && order.delivery_otp) {
                otpBlockHtml = `
                    <div class="order-card-footer">
                        <p><strong>Delivery OTP: ${order.delivery_otp}</strong></p>
                        <form class="otp-form" data-order-id="${order.id}" data-correct-otp="${order.delivery_otp}">
                            <input type="number" class="otp-input" placeholder="Enter OTP to Confirm Delivery" required>
                            <button type="submit" class="button-outline">Confirm</button>
                        </form>
                    </div>
                `;
            }

            orderCard.innerHTML = `
                <div class="order-card-header">
                    <h5>Order ID: ...${order.id.slice(-8)}</h5>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-card-body">
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Total Amount:</strong> ₹${order.total_amount.toFixed(2)}</p>
                    <hr>
                    <h6>Items:</h6>
                    ${itemsHtml}
                </div>
                ${otpBlockHtml}
            `;
            ordersListContainer.appendChild(orderCard);
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        ordersListContainer.innerHTML = '<p class="message error">Could not load your orders. Please try again later.</p>';
    } finally {
        hideLoader();
    }
}


// === NEW: Function to handle OTP submission ===
async function handleOtpSubmission(event) {
    event.preventDefault();
    showLoader();

    const form = event.target;
    const orderId = form.dataset.orderId;
    const correctOtp = form.dataset.correctOtp;
    const userInputOtp = form.querySelector('.otp-input').value;

    if (userInputOtp === correctOtp) {
        // OTP is correct, update the order status to 'delivered'
        const { error } = await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', orderId);

        if (error) {
            alert('Error updating order status: ' + error.message);
        } else {
            alert('Order successfully marked as delivered!');
            loadOrders(); // Refresh the orders list to reflect the change
        }
    } else {
        // OTP is incorrect
        alert('Incorrect OTP. Please try again.');
    }
    
    hideLoader();
}
