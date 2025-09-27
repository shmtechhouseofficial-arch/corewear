import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// IMPORTANT: Replace with your actual Firebase project configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBg4wjq4f7Sj2afoSO3xzPqurM5TvZy_Nc",
  authDomain: "corewear-3abad.firebaseapp.com",
  projectId: "corewear-3abad",
  storageBucket: "corewear-3abad.firebasestorage.app",
  messagingSenderId: "343396186261",
  appId: "1:343396186261:web:b1a49b889ee734758dc39c",
  measurementId: "G-QFB9JG06BN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
