import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAaqlMizBSn1roZMD91aVflwM7uooI1c0",
  authDomain: "askmyfaculty.firebaseapp.com",
  projectId: "askmyfaculty",
  storageBucket: "askmyfaculty.firebasestorage.app",
  messagingSenderId: "920544908014",
  appId: "1:920544908014:web:2d1f161a8dd38d12d419ff"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;