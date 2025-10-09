import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---! IMPORTANT: REPLACE WITH YOUR ACTUAL CLOUDINARY DETAILS !---
// I've used the values from your admin.js for consistency.
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dpsfb5bzz/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "p5oh8pl3";

document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('uploaded-image-preview');
    const customOrderForm = document.getElementById('custom-order-form');
    const successMessage = document.getElementById('success-message');
    let designFile = null;

    // Handle image preview
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            designFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle form submission with Cloudinary
    customOrderForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!designFile) {
            alert('Please upload a design image.');
            return;
        }

        const customerName = document.getElementById('customerName').value;
        const shippingAddress = document.getElementById('shippingAddress').value;

        // 1. Upload image to Cloudinary
        const formData = new FormData();
        formData.append('file', designFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error.message || 'Cloudinary upload failed');

            const downloadURL = data.secure_url;
            const cloudinaryPublicId = data.public_id;
            
            // 2. Save order data to Firestore with Cloudinary URL
            const customOrderData = {
                orderId: `custom-${Date.now()}`,
                customerName,
                shippingAddress,
                designImage: downloadURL,
                cloudinaryPublicId: cloudinaryPublicId,
                orderDate: new Date().toISOString()
            };

            await addDoc(collection(db, 'custom-orders'), customOrderData);
            successMessage.classList.remove('hidden');
            customOrderForm.reset();
            imagePreview.src = '';
            designFile = null;
            setTimeout(() => successMessage.classList.add('hidden'), 5000);

        } catch (error) {
            console.error("Error processing custom order: ", error);
            alert(`Failed to place custom order: ${error.message}`);
        }
    });
});
