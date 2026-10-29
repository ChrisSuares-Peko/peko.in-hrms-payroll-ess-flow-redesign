// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// PROTOTYPE-SETUP: Peko's production Firebase project values redacted for the public prototype repo.
// Peko Connect (the only user) is outside the prototype and is not mounted.
const firebaseConfig = {
    apiKey: 'REDACTED-PROTOTYPE',
    authDomain: 'REDACTED-PROTOTYPE',
    projectId: 'REDACTED-PROTOTYPE',
    storageBucket: 'REDACTED-PROTOTYPE',
    messagingSenderId: 'REDACTED-PROTOTYPE',
    appId: 'REDACTED-PROTOTYPE',
    measurementId: 'REDACTED-PROTOTYPE',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const firestore = getFirestore(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
