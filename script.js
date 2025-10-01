document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Check for user and admin sessions on page load
    const localUser = localStorage.getItem('corewear_currentUser');
    const isAdmin = sessionStorage.getItem('corewear_adminSession') === 'true';

    if (localUser || isAdmin) {
        updateNav({ loggedIn: true }); // A session exists
    } else {
        updateNav(null); // No session
    }
    
    // Load featured products on the homepage
    if (document.getElementById('featured-product-grid')) {
        loadFeaturedProducts();
    }
});

function updateNav(session) {
    const desktopNav = document.getElementById('desktop-nav-links');
    const mobileNav = document.getElementById('mobile-menu');

    if (!desktopNav || !mobileNav) return;

    // Clear existing auth links
    desktopNav.querySelectorAll('.auth-link').forEach(link => link.remove());
    mobileNav.querySelectorAll('.auth-link').forEach(link => link.remove());

    let desktopLinks, mobileLinks;

    if (session) { 
        desktopLinks = `<button id="logout-btn" class="auth-link nav-link font-medium cursor-pointer">Logout</button>`;
        mobileLinks = `<button id="mobile-logout-btn" class="auth-link block w-full py-2 text-center font-medium cursor-pointer">Logout</button>`;
    } else {
        desktopLinks = `<a href="login-signup.html" class="auth-link nav-link font-bold">Login/Signup</a>`;
        mobileLinks = `<a href="login-signup.html" class="auth-link block py-2 text-center font-bold">Login/Signup</a>`;
    }
    
    desktopNav.insertAdjacentHTML('beforeend', desktopLinks);
    mobileNav.insertAdjacentHTML('beforeend', mobileLinks);

    // Add event listeners for new logout buttons
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('mobile-logout-btn')?.addEventListener('click', logout);
}

function logout() {
    // Clear both user and admin sessions from storage
    localStorage.removeItem('corewear_currentUser');
    sessionStorage.removeItem('corewear_adminSession');
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// This function still needs Firebase for Firestore access, but not for auth.
function loadFeaturedProducts() {
    const grid = document.getElementById('featured-product-grid');
    if (!grid || typeof firebase === 'undefined') return;

    const db = firebase.firestore();
    db.collection('products').where("isFeatured", "==", true).limit(4).get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                grid.innerHTML = '<p class="text-center col-span-full text-gray-400">No featured products.</p>';
                return;
            }
            grid.innerHTML = '';
            querySnapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                const productCard = document.createElement('div');
                productCard.className = 'bg-[#1a1a1a] rounded-lg overflow-hidden shadow-lg product-card transition-transform duration-300 hover:-translate-y-2';
                productCard.innerHTML = `
                    <div class="overflow-hidden">
                       <a href="shop.html"><img src="${product.image}" alt="${product.name}" class="w-full h-auto object-cover transition-transform duration-500 aspect-[4/5]"></a>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-semibold mb-2 truncate text-white">${product.name}</h3>
                        <p class="text-lg font-bold text-white">$${product.price.toFixed(2)}</p>
                        <a href="shop.html" class="mt-4 block text-center w-full bg-white text-black font-bold py-2 px-4 rounded-full uppercase tracking-wider hover:scale-105 transition-transform">View Shop</a>
                    </div>
                `;
                grid.appendChild(productCard);
            });
        })
        .catch(error => {
            console.error("Error fetching featured products:", error);
            grid.innerHTML = '<p class="text-center col-span-full text-red-400">Could not load products.</p>';
        });
}

