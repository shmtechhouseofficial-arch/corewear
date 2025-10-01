import { db, storage } from './firebase-config.js';
// Removed auth-related imports from Firebase
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    // Check sessionStorage for a more reliable admin session check
    const isAdminLoggedIn = sessionStorage.getItem('corewear_adminSession') === 'true';

    if (isAdminLoggedIn) {
        document.getElementById('auth-gate').style.display = 'none';
        document.getElementById('admin-content').classList.remove('hidden');
        initializeAdminPanel();
    } else {
        document.getElementById('auth-gate').innerHTML = '<p class="text-red-400">Access Denied. Redirecting...</p>';
        setTimeout(() => { window.location.href = 'login-signup.html'; }, 2000);
    }
});

function initializeAdminPanel() {
    // Tab switching logic remains the same
    const tabs = document.querySelectorAll('.tab-button');
    const panes = document.querySelectorAll('.tab-pane');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            panes.forEach(pane => pane.classList.add('hidden'));
            document.getElementById(tab.dataset.tab).classList.remove('hidden');
        });
    });

    // Updated Logout to clear sessionStorage
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('corewear_adminSession');
        window.location.href = 'index.html';
    });

    // Load initial data (no changes needed here)
    loadAllProducts();
    loadRegularOrders();
    loadCustomOrders();

    // Add/Edit Product Form handlers (no changes needed here)
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    document.getElementById('cancel-edit-btn').addEventListener('click', () => document.getElementById('edit-product-modal').classList.add('hidden'));
    document.getElementById('edit-product-form').addEventListener('submit', handleUpdateProduct);
}

// --- Product Management ---

async function handleAddProduct(event) {
    event.preventDefault();
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value;
    const imageFile = document.getElementById('productImageFile').files[0];

    if (!imageFile) {
        alert("Please select an image file.");
        return;
    }

    try {
        // 1. Upload image to Firebase Storage inside the 'uploads/products' folder
        const imagePath = `uploads/products/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, imagePath);
        await uploadBytes(storageRef, imageFile);
        const imageURL = await getDownloadURL(storageRef);

        // 2. Save product data to Firestore
        await addDoc(collection(db, 'products'), {
            name,
            price,
            description,
            image: imageURL,
            imagePath: imagePath, // Store path for deletion
            createdAt: serverTimestamp()
        });

        const successMsg = document.getElementById('product-success-message');
        successMsg.classList.remove('hidden');
        document.getElementById('add-product-form').reset();
        setTimeout(() => successMsg.classList.add('hidden'), 4000);

    } catch (error) {
        console.error("Error adding product: ", error);
        alert("Failed to add product.");
    }
}

function loadAllProducts() {
    const listContainer = document.getElementById('admin-products-list');
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        if (snapshot.empty) {
            listContainer.innerHTML = '<p>No products found. Add one!</p>';
            return;
        }
        listContainer.innerHTML = snapshot.docs.map(doc => {
            const product = { id: doc.id, ...doc.data() };
            return `
            <div class="admin-product-item">
                <img src="${product.image}" alt="${product.name}" class="admin-product-thumb">
                <div class="flex-grow">
                    <p class="font-bold">${product.name}</p>
                    <p class="text-sm text-gray-400">$${product.price.toFixed(2)}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                    <button class="delete-btn" data-id="${product.id}" data-path="${product.imagePath}">Delete</button>
                </div>
            </div>`;
        }).join('');

        listContainer.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id)));
        listContainer.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteProduct(e.target.dataset.id, e.target.dataset.path)));
    });
}

async function openEditModal(productId) {
    try {
        const productDoc = doc(db, 'products', productId);
        const docSnap = await getDoc(productDoc);
        if (!docSnap.exists()) return;
        const product = docSnap.data();

        document.getElementById('edit-product-id').value = productId;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('edit-product-modal').classList.remove('hidden');
    } catch (error) {
        console.error("Error fetching product for edit:", error);
    }
}

async function handleUpdateProduct(event) {
    event.preventDefault();
    const productId = document.getElementById('edit-product-id').value;
    const productDoc = doc(db, 'products', productId);
    const updatedData = {
        name: document.getElementById('editProductName').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        description: document.getElementById('editProductDescription').value,
    };

    try {
        await updateDoc(productDoc, updatedData);
        document.getElementById('edit-product-modal').classList.add('hidden');
        alert("Product updated successfully!");
    } catch (error) {
        console.error("Error updating product:", error);
        alert("Failed to update product.");
    }
}

async function deleteProduct(productId, imagePath) {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    try {
        await deleteDoc(doc(db, 'products', productId));
        if (imagePath) {
            const storageRef = ref(storage, imagePath);
            await deleteObject(storageRef);
        }
        alert("Product deleted successfully.");
    } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product.");
    }
}


// --- Order Viewing ---
function loadRegularOrders() {
    const q = query(collection(db, 'regular-orders'), orderBy('orderDate', 'desc'));
    onSnapshot(q, snapshot => {
        const container = document.getElementById('regular-orders-list');
        if (snapshot.empty) {
            container.innerHTML = '<p>No regular orders found.</p>'; return;
        }
        container.innerHTML = snapshot.docs.map(doc => {
            const order = doc.data();
            return `
            <div class="bg-[#1a1a1a] p-4 rounded-lg">
                <p><strong>Product:</strong> ${order.productName}</p>
                <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            </div>`;
        }).join('');
    });
}

function loadCustomOrders() {
    const q = query(collection(db, 'custom-orders'), orderBy('orderDate', 'desc'));
    onSnapshot(q, snapshot => {
        const container = document.getElementById('custom-orders-list');
        if (snapshot.empty) {
            container.innerHTML = '<p>No custom orders found.</p>'; return;
        }
        container.innerHTML = snapshot.docs.map(doc => {
            const order = doc.data();
            return `
            <div class="bg-[#1a1a1a] p-4 rounded-lg grid md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                    <p><strong>Customer:</strong> ${order.customerName}</p>
                    <p><strong>Address:</strong> ${order.shippingAddress}</p>
                    <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                </div>
                <div><img src="${order.designImage}" alt="Custom Design" class="rounded border-2 border-gray-600"></div>
            </div>`;
        }).join('');
    });
}

