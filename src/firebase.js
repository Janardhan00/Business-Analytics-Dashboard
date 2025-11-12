// firebase.js

// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔹 Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoWnGVX-wTF97Mc0DUZ0Vg4HcqdNYVVZE",
  authDomain: "bussiness-analytics.firebaseapp.com",
  projectId: "bussiness-analytics",
  storageBucket: "bussiness-analytics.firebasestorage.app",
  messagingSenderId: "743279797223",
  appId: "1:743279797223:web:f493b8631adb5ac6235342",
  measurementId: "G-7R2SY877NR"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 Export both
export { db, auth };
