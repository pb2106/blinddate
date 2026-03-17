import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAXpAu5d6pO6lPPjtDARrAElQANZWSreMo",
    authDomain: "blinddate-bfbf9.firebaseapp.com",
    projectId: "blinddate-bfbf9",
    storageBucket: "blinddate-bfbf9.firebasestorage.app",
    messagingSenderId: "627386668174",
    appId: "1:627386668174:web:59dfb5cc19165912a265df",
    measurementId: "G-PW6D26RD4M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
