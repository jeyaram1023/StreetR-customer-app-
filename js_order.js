// js_order.js

const ordersListContainer = document.getElementById('orders-list');

async function loadOrders() {
    if (!window.currentUser) {
        ordersListContainer.innerHTML = '<p>Please log in to see your orders.</p>';
        return;
    }

    showLoader();
    ordersListContainer.innerHTML = ''; // Clear previous orders

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (orders.length === 0) {
            ordersListContainer.innerHTML = `
                <div class="empty-state">
                    <img src="https://uploads.onecompiler.io/42q5e2pr5/43nvveyp4/1000133809.png" alt="No Orders Illustration">
                    <p>You haven't placed any orders yet.</p>
                </div>
            `;
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

            orderCard.innerHTML = `
                <div class="order-card-header">
                    <h5>Order ID: ...${order.payment_token.slice(-8)}</h5>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-card-body">
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Total Amount:</strong> ₹${order.total_amount.toFixed(2)}</p>
                    <hr>
                    <h6>Items:</h6>
                    ${itemsHtml}
                </div>
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
