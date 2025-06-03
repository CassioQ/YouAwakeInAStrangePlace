// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app"; // Changed import
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User, // Changed to type import
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

import {
  FB_API_KEY,
  FB_AUTH_DOMAIN,
  FB_PROJECT_ID,
  FB_STORAGE_BUCKET,
  FB_MESSAGING_SENDER_ID,
  FB_APP_ID,
  FB_MEASUREMENT_ID,
  FB_DATABASE_URL,
} from "@env";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: FB_API_KEY,
  authDomain: FB_AUTH_DOMAIN,
  projectId: FB_PROJECT_ID,
  storageBucket: FB_STORAGE_BUCKET,
  messagingSenderId: FB_MESSAGING_SENDER_ID,
  appId: FB_APP_ID,
  measurementId: FB_MEASUREMENT_ID,
  databaseURL: FB_DATABASE_URL,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const functionsInstance = getFunctions(app); // Specify region if necessary e.g. getFunctions(app, "us-central1")

// Export auth providers and functions
export {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User, // Export as type
};

// Exemplo de como preparar uma função callable
export const callCreateGameSession = httpsCallable(
  functionsInstance,
  "createGameSession"
);
export const callJoinGameSession = httpsCallable(
  functionsInstance,
  "joinGameSession"
);
export const callProcessPlayerAction = httpsCallable(
  functionsInstance,
  "processPlayerAction"
);
// Adicione outras funções callable conforme necessário
