import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDh4V3rm6-jM2OTn8XMaHOeYaoU4g8Eg60",
  authDomain: "geojournal-atlas-srija-a6b0b.firebaseapp.com",
  projectId: "geojournal-atlas-srija-a6b0b",
  storageBucket: "geojournal-atlas-srija-a6b0b.firebasestorage.app",
  messagingSenderId: "677245970214",
  appId: "1:677245970214:web:cbf7761ae9bcc7d6bb03e7",
  measurementId: "G-0B497PNBDB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
