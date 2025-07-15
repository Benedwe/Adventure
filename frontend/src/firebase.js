// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAW49L-dMaDBBdgqDwfsXtZSLLXtdLG_g8",
  authDomain: "math-adventure-ac322.firebaseapp.com",
  projectId: "math-adventure-ac322",
  storageBucket: "math-adventure-ac322.firebasestorage.app",
  messagingSenderId: "277440899776",
  appId: "1:277440899776:web:bd03fd85a38fbdb9b71b25",
  measurementId: "G-QD7QC8PWW4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);