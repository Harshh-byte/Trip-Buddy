import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuXK4Vlr0_Yah2sfe0VZri4T0c5ebJOEQ",
  authDomain: "trip-buddy-db.firebaseapp.com",
  projectId: "trip-buddy-db",
  storageBucket: "trip-buddy-db.firebasestorage.app",
  messagingSenderId: "330114513823",
  appId: "1:330114513823:web:0a89d3d9142a9b82d8dbaa",
  measurementId: "G-VWCG9TTK4M",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
