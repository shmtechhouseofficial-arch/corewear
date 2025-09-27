import { db, storage } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
            designFile = file; // Store the file object
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle form submission
    customOrderForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!designFile) {
            alert('Please upload a design image.');
            return;
        }

        const customerName = document.getElementById('customerName').value;
        const shippingAddress = document.getElementById('shippingAddress').value;

        // 1. Upload image to Firebase Storage
        const filePath = `uploads/${Date.now()}_${designFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, designFile);

        uploadTask.on('state_changed',
            (snapshot) => { /* Can be used for upload progress */ },
            (error) => { console.error("Upload failed:", error); alert("Image upload failed."); },
            async () => {
                // 2. Get image URL after upload
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // 3. Save order data to Firestore
                const customOrderData = {
                    orderId: `custom-${Date.now()}`,
                    customerName,
                    shippingAddress,
                    designImage: downloadURL, // Store the public URL
                    imagePath: filePath, // Store the path for reference
                    orderDate: new Date().toISOString()
                };

                try {
                    await addDoc(collection(db, 'custom-orders'), customOrderData);
                    successMessage.classList.remove('hidden');
                    customOrderForm.reset();
                    imagePreview.src = ''; // Clear preview
                    designFile = null;
                    setTimeout(() => successMessage.classList.add('hidden'), 5000);
                } catch (error) {
                    console.error("Error saving custom order: ", error);
                    alert("Failed to place custom order.");
                }
            }
        );
    });
});
