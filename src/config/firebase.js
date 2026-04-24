import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC0ROz4tvDU9sg60cfcXV6mCo3vPjGLfPg",
  authDomain: "barbers-9b523.firebaseapp.com",
  databaseURL: "https://barbers-9b523-default-rtdb.firebaseio.com",
  projectId: "barbers-9b523",
  storageBucket: "barbers-9b523.firebasestorage.app",
  messagingSenderId: "159892947114",
  appId: "1:159892947114:web:62ed9f82bbed0f873290d3",
  measurementId: "G-H8B352LM1Y"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
