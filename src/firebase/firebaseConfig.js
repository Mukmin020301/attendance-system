// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyAODRLauN47461ML08L1JEdjhi8CwoSad0",
    authDomain: "attendance-system-aa961.firebaseapp.com",
    projectId: "attendance-system-aa961",
    storageBucket: "attendance-system-aa961.firebasestorage.app",
    messagingSenderId: "315781968466",
    appId: "1:315781968466:web:f5b59fe1d622d4aca0e58b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
