// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbVaxU__hw2JArtq9BTaPqyjskP_ybPnY",
  authDomain: "jsg-tcc.firebaseapp.com",
  projectId: "jsg-tcc",
  storageBucket: "jsg-tcc.firebasestorage.app",
  messagingSenderId: "658782512097",
  appId: "1:658782512097:web:55b0728c26a4fa9e16a8a0",
  measurementId: "G-W9QE4LFFN3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore em RN/Expo: forçar long polling e evitar fetch streams para estabilidade de rede
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

const auth = getAuth(app);

export {db , auth};