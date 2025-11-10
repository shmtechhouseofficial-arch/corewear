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
        updateNav({ loggedIn: true });
    } else {
        updateNav(null);
    }
    
    // Load background hero slider
    if (document.getElementById('hero-background-slider')) {
        loadHeroBackgroundProducts();
    }
    
    // Load featured products on the homepage
    if (document.getElementById('featured-product-slider')) {
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

// Helper function to wait for Firebase initialization
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseInitialized) {
            resolve();
        } else {
            setTimeout(() => waitForFirebase().then(resolve), 100);
        }
    });
}

// Load products for hero background slider
async function loadHeroBackgroundProducts() {
    const slider = document.getElementById('hero-background-slider');
    if (!slider) return;

    try {
        // Wait for Firebase to be initialized
        await waitForFirebase();
        
        const { db } = await import('./firebase-config.js');
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const querySnapshot = await getDocs(collection(db, 'products'));
        
        if (querySnapshot.empty) {
            console.log("No products found for hero slider");
            return;
        }

        // Create two sets for infinite loop effect
        const products = [];
        querySnapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            products.push(product);
        });

        // Duplicate products for seamless loop
        const allProducts = [...products, ...products];

        allProducts.forEach(product => {
            const productSlide = document.createElement('div');
            productSlide.className = 'hero-bg-slide';
            
            productSlide.innerHTML = `
                <div class="hero-bg-product-card">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
                </div>
            `;
            
            slider.appendChild(productSlide);
        });
    } catch (error) {
        console.error("Error fetching background products:", error);
    }
}

// Load all products in an attractive slider
async function loadFeaturedProducts() {
    const slider = document.getElementById('featured-product-slider');
    if (!slider) return;

    try {
        // Wait for Firebase to be initialized
        await waitForFirebase();
        
        const { db } = await import('./firebase-config.js');
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const querySnapshot = await getDocs(collection(db, 'products'));
        
        if (querySnapshot.empty) {
            slider.innerHTML = '<div class="swiper-slide"><p class="text-center text-gray-400">No products available.</p></div>';
            return;
        }

        // Clear loading message
        slider.innerHTML = '';

        querySnapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            
            const productSlide = document.createElement('div');
            productSlide.className = 'swiper-slide';
            
            productSlide.innerHTML = `
                <div class="slider-product-card">
                    <div class="relative overflow-hidden">
                        <span class="product-badge">Anime</span>
                        <img src="${product.image}" alt="${product.name}" class="w-full h-auto object-cover">
                        <div class="product-overlay"></div>
                    </div>
                    <div class="p-6 text-white">
                        <h3 class="text-2xl font-bold mb-2 truncate">${product.name}</h3>
                        <p class="text-gray-400 text-sm mb-4 line-clamp-2">${product.description || 'Premium anime-inspired apparel'}</p>
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-3xl font-black text-purple-400">PKR ${product.price.toFixed(2)}</span>
                            ${product.stock ? `<span class="text-sm text-green-400">✓ In Stock</span>` : '<span class="text-sm text-green-400">last 2 pieces</span>'}
                        </div>
                        <a href="shop.html" class="block text-center w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-full uppercase tracking-wider hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                            Shop Now
                        </a>
                    </div>
                </div>
            `;
            
            slider.appendChild(productSlide);
        });

        // Initialize Swiper after products are loaded
        initializeSwiper();
    } catch (error) {
        console.error("Error fetching products:", error);
        slider.innerHTML = '<div class="swiper-slide"><p class="text-center text-red-400">Could not load products.</p></div>';
    }
}

// Initialize Swiper Slider
function initializeSwiper() {
    if (typeof Swiper === 'undefined') {
        console.error('Swiper is not loaded');
        return;
    }

    new Swiper('.productSwiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 1,
                spaceBetween: 20
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 30
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 40
            }
        },
        effect: 'slide',
        speed: 800,
        grabCursor: true
    });
}