import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Cart management functions
const CartManager = {
    // Get cart from localStorage
    getCart() {
        const cart = localStorage.getItem('corewear_cart');
        return cart ? JSON.parse(cart) : [];
    },

    // Save cart to localStorage
    saveCart(cart) {
        localStorage.setItem('corewear_cart', JSON.stringify(cart));
    },

    // Add item to cart
    addItem(product) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        this.saveCart(cart);
        return cart;
    },

    // Remove item from cart
    removeItem(productId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== productId);
        this.saveCart(cart);
        return cart;
    },

    // Update item quantity
    updateQuantity(productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);

        if (item) {
            if (quantity <= 0) {
                return this.removeItem(productId);
            }
            item.quantity = quantity;
            this.saveCart(cart);
        }

        return cart;
    },

    // Clear cart
    clearCart() {
        localStorage.removeItem('corewear_cart');
        return [];
    },

    // Get cart total
    getTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // Get cart item count
    getItemCount() {
        const cart = this.getCart();
        return cart.reduce((count, item) => count + item.quantity, 0);
    }
};

// Display cart items
function displayCart() {
    const cart = CartManager.getCart();
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');
    const cartItems = document.getElementById('cart-items');

    if (cart.length === 0) {
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (cartContent) cartContent.classList.add('hidden');
        return;
    }

    if (emptyCart) emptyCart.classList.add('hidden');
    if (cartContent) cartContent.classList.remove('hidden');

    cartItems.innerHTML = cart.map(item => `
        <div class="flex gap-4 p-4 border-b border-gray-700 last:border-b-0">
            <img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
            <div class="flex-1">
                <h3 class="font-bold text-lg">${item.name}</h3>
                <p class="text-gray-400">PKR ${item.price.toFixed(2)}</p>
                <div class="flex items-center gap-3 mt-3">
                    <button class="decrease-qty px-3 py-1 bg-[#333] rounded" data-id="${item.id}">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="increase-qty px-3 py-1 bg-[#333] rounded" data-id="${item.id}">+</button>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold text-lg">PKR ${(item.price * item.quantity).toFixed(2)}</p>
                <button class="remove-item mt-4 text-red-500 hover:text-red-400 text-sm" data-id="${item.id}">Remove</button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.increase-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            const cart = CartManager.getCart();
            const item = cart.find(i => i.id === productId);
            if (item) CartManager.updateQuantity(productId, item.quantity + 1);
            displayCart();
            updateCartSummary();
        });
    });

    document.querySelectorAll('.decrease-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            const cart = CartManager.getCart();
            const item = cart.find(i => i.id === productId);
            if (item && item.quantity > 1) CartManager.updateQuantity(productId, item.quantity - 1);
            displayCart();
            updateCartSummary();
        });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            CartManager.removeItem(productId);
            displayCart();
            updateCartSummary();
        });
    });

    updateCartSummary();
}

// Update cart summary
function updateCartSummary() {
    const cart = CartManager.getCart();
    const subtotal = CartManager.getTotal();
    const shipping = subtotal > 0 ? 200 : 0; // Example: PKR 200 shipping fee
    const tax = 0; // No tax for this example
    const total = subtotal + shipping + tax;

    if (document.getElementById('subtotal')) {
        document.getElementById('subtotal').textContent = `PKR ${subtotal.toFixed(2)}`;
    }
    if (document.getElementById('shipping')) {
        document.getElementById('shipping').textContent = `PKR ${shipping.toFixed(2)}`;
    }
    if (document.getElementById('tax')) {
        document.getElementById('tax').textContent = `PKR ${tax.toFixed(2)}`;
    }
    if (document.getElementById('total')) {
        document.getElementById('total').textContent = `PKR ${total.toFixed(2)}`;
    }
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', () => {
    displayCart();
});

// Export for use in other modules
export { CartManager, displayCart, updateCartSummary };
