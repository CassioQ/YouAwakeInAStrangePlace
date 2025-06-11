// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import type { FirebaseApp } from "firebase/app"; // This type import can remain from modular

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

let app: firebase.app.App;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); // if already initialized, use that one
}

export const auth: firebase.auth.Auth = firebase.auth(app); // Pass app instance for multi-app safety
export const db: firebase.firestore.Firestore = firebase.firestore(app); // Pass app instance
const functionsInstance: firebase.functions.Functions = firebase.functions(app); // Pass app instance

// Export auth providers and functions (compat style)
export const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
export const FacebookAuthProvider = firebase.auth.FacebookAuthProvider;

// Wrapped methods to ensure 'this' context for auth if imported and called directly.
export const signInWithPopup = (
  provider: firebase.auth.AuthProvider
): Promise<firebase.auth.UserCredential> => {
  return auth.signInWithPopup(provider);
};

export const signInWithCredential = (
  credential: firebase.auth.AuthCredential
): Promise<firebase.auth.UserCredential> => {
  return auth.signInWithCredential(credential);
};

export const createUserWithEmailAndPassword = (
  email: string,
  pass: string
): Promise<firebase.auth.UserCredential> => {
  return auth.createUserWithEmailAndPassword(email, pass);
};

export const signInWithEmailAndPassword = (
  email: string,
  pass: string
): Promise<firebase.auth.UserCredential> => {
  return auth.signInWithEmailAndPassword(email, pass);
};

export const signOut = (): Promise<void> => {
  return auth.signOut();
};

export const onAuthStateChanged = (
  callback: (user: firebase.User | null) => void
): firebase.Unsubscribe => {
  return auth.onAuthStateChanged(callback);
};

// updateProfile is a method on the User object in compat mode.
// This export provides a helper and is correctly used.
export const updateProfile = (
  user: firebase.User,
  profile: { displayName?: string | null; photoURL?: string | null }
): Promise<void> => {
  return user.updateProfile(profile);
};

export type User = firebase.User; // User type from compat

// Callable functions (compat style using the specific instance)
export const callCreateGameSession =
  functionsInstance.httpsCallable("createGameSession");
export const callJoinGameSession =
  functionsInstance.httpsCallable("joinGameSession");
export const callProcessPlayerAction = functionsInstance.httpsCallable(
  "processPlayerAction"
);
// Adicione outras funções callable conforme necessário
