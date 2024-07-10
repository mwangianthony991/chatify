import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "reactchatapp-d4662.firebaseapp.com",
  projectId: "reactchatapp-d4662",
  storageBucket: "reactchatapp-d4662.appspot.com",
  messagingSenderId: "1028803133476",
  appId: "1:1028803133476:web:7d0a0cf52d646f8bb0d8b1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
