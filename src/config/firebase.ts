import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project configuration from the Firebase Console!
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_REPLACE_WITH_YOUR_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:0000:web:12345"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
