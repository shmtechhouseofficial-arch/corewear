import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CartManager } from './cart.js';

document.addEventListener('DOMContentLoaded', () => {
    // Load cart summary on checkout page
    displayCheckoutSummary();

    // Handle payment method toggle
    const codRadio = document.getElementById('cod');
    const easypaisaRadio = document.getElementById('easypaisa');
    const easypaisaDetails = document.getElementById('easypaisa-details');
    const easypaisaInput = document.getElementById('easypaisaNumber');

    if (codRadio && easypaisaRadio && easypaisaDetails) {
        codRadio.addEventListener('change', () => {
            easypaisaDetails.classList.add('hidden');
            easypaisaInput.removeAttribute('required');
        });

        easypaisaRadio.addEventListener('change', () => {
            easypaisaDetails.classList.remove('hidden');
            easypaisaInput.setAttribute('required', 'required');
        });
    }

    // Handle form submission
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
});

function displayCheckoutSummary() {
    const cart = CartManager.getCart();
    const orderItemsContainer = document.getElementById('order-items');

    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    // Display items
    if (orderItemsContainer) {
        orderItemsContainer.innerHTML = cart.map(item => `
            <div class="flex justify-between text-sm">
                <span>${item.name} x${item.quantity}</span>
                <span>PKR ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
    }

    // Calculate totals
    const subtotal = CartManager.getTotal();
    const shipping = subtotal > 0 ? 200 : 0;
    const tax = 0;
    const total = subtotal + shipping + tax;

    if (document.getElementById('checkout-subtotal')) {
        document.getElementById('checkout-subtotal').textContent = `PKR ${subtotal.toFixed(2)}`;
    }
    if (document.getElementById('checkout-shipping')) {
        document.getElementById('checkout-shipping').textContent = `PKR ${shipping.toFixed(2)}`;
    }
    if (document.getElementById('checkout-tax')) {
        document.getElementById('checkout-tax').textContent = `PKR ${tax.toFixed(2)}`;
    }
    if (document.getElementById('checkout-total')) {
        document.getElementById('checkout-total').textContent = `PKR ${total.toFixed(2)}`;
    }
}

async function handleCheckout(e) {
    e.preventDefault();

    const cart = CartManager.getCart();
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Get form data
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const postalCode = document.getElementById('postalCode').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const easypaisaNumber = document.getElementById('easypaisaNumber').value || '';
    const termsAccepted = document.getElementById('terms').checked;

    if (!termsAccepted) {
        alert('Please accept the terms and conditions');
        return;
    }

    // Calculate totals
    const subtotal = CartManager.getTotal();
    const shipping = subtotal > 0 ? 200 : 0;
    const tax = 0;
    const total = subtotal + shipping + tax;

    // Prepare order data
    const orderData = {
        orderId: `ORD-${Date.now()}`,
        customerInfo: {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            postalCode
        },
        items: cart,
        totals: {
            subtotal,
            shipping,
            tax,
            total
        },
        paymentMethod,
        easypaisaNumber: paymentMethod === 'easypaisa' ? easypaisaNumber : null,
        orderStatus: 'pending',
        orderDate: new Date().toISOString(),
        createdAt: new Date()
    };

    try {
        // Save order to Firestore
        const docRef = await addDoc(collection(db, 'orders'), orderData);

        // Clear cart
        CartManager.clearCart();

        // Show success message
        alert(`Order placed successfully! Order ID: ${orderData.orderId}`);

        // Redirect to success page or home
        if (orderData.paymentMethod === 'easypaisa') {
            alert(`Please complete your payment via Easypaisa to ${orderData.easypaisaNumber}. Your order will be confirmed once payment is received.`);
        } else {
            alert('Your order will be delivered via COD. Our team will contact you shortly.');
        }

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order. Please try again.');
    }
}
