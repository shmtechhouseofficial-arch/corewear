import { db } from './firebase-config.js';
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Cart management
const CartManager = {
    getCart() {
        const cart = localStorage.getItem('corewear_cart');
        return cart ? JSON.parse(cart) : [];
    },

    saveCart(cart) {
        localStorage.setItem('corewear_cart', JSON.stringify(cart));
    },

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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const loadingMessage = document.getElementById('loading-message');

    // Fetch products from Firestore
    getDocs(collection(db, 'products')).then((querySnapshot) => {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (querySnapshot.empty) {
            productGrid.innerHTML = '<p>No products found.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productCard = document.createElement('div');
            productCard.className = 'bg-[#1a1a1a] rounded-lg overflow-hidden shadow-lg product-card transition-transform duration-300 cursor-pointer hover:shadow-2xl';

            productCard.innerHTML = `
                <div class="overflow-hidden">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-96 object-cover transition-transform duration-300">
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">${product.name}</h3>
                    <p class="text-lg font-bold text-white">PKR ${product.price.toFixed(2)}</p>
                    <button class="mt-4 w-full bg-white text-black font-bold py-2 px-4 rounded-full uppercase tracking-wider hover:scale-105 transition-transform view-product-btn" data-product-id="${doc.id}">View Product</button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });

        document.querySelectorAll('.view-product-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = button.dataset.productId;
                window.location.href = `product.detail.html?id=${productId}`;
            });
        });

    }).catch(error => {
        if (loadingMessage) loadingMessage.textContent = 'Failed to load products. Please try again later.';
        console.error('Error fetching products:', error);
    });
});

function placeOrder(productId, productName) {
    const orderData = {
        orderId: `reg-${Date.now()}`,
        productId: productId,
        productName: productName,
        orderDate: new Date().toISOString()
    };

    // Save the order to Firestore
    addDoc(collection(db, 'regular-orders'), orderData)
        .then((docRef) => {
            alert(`Order placed for ${productName}!`);
        })
        .catch((error) => {
            console.error("Error adding order: ", error);
            alert('There was an issue placing your order. Please try again.');
        });
}
