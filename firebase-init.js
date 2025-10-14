// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAidL-8CTSIQw-wkiV_puD-DS-dQWX5u0Q",
  authDomain: "union-heart-games.firebaseapp.com",
  projectId: "union-heart-games",
  storageBucket: "union-heart-games.appspot.com",
  messagingSenderId: "56294430695",
  appId: "1:56294430695:web:962127cd9a2bc83d8dcf42",
  measurementId: "G-FZ637PG68T"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
