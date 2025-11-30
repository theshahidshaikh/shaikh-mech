import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAel0McAZxVprw3QmXdSkwykv9zbfP77ew",
  authDomain: "shaikhmech-4c3ef.firebaseapp.com",
  projectId: "shaikhmech-4c3ef",
  storageBucket: "shaikhmech-4c3ef.firebasestorage.app",
  messagingSenderId: "667983483618",
  appId: "1:667983483618:web:9a1fe7aa4f4aa7f677c4bb",
  measurementId: "G-TK80CHYXRH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore
// Using standard getFirestore() is faster and prevents synchronization locks
// caused by multi-tab persistence on mobile devices.
export const db = getFirestore(app);