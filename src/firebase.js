import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCAaqlMizBSn1roZMD91aVflwM7uooI1c0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "askmyfaculty.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "askmyfaculty",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "askmyfaculty.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "920544908014",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:920544908014:web:2d1f161a8dd38d12d419ff"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
