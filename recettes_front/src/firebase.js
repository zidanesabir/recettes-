// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBiuSfWKUwbrvpVgX3bz7_VqrKOrvSmCUY",
  authDomain: "recettescloud-7aa05.firebaseapp.com",
  projectId: "recettescloud-7aa05",
  storageBucket: "recettescloud-7aa05.firebasestorage.app",
  messagingSenderId: "270040372044",
  appId: "1:270040372044:web:b63a6877104d2d26def5e9",
  measurementId: "G-XLJ8M70B04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);