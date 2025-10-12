// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAidL-8CTSIQw-wkiV_puD-DS-dQWX5u0Q",
  authDomain: "union-heart-games.firebaseapp.com",
  projectId: "union-heart-games",
  storageBucket: "union-heart-games.firebasestorage.app",
  messagingSenderId: "56294430695",
  appId: "1:56294430695:web:962127cd9a2bc83d8dcf42",
  measurementId: "G-FZ637PG68T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);