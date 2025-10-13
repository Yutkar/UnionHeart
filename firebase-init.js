// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Конфигурация из твоего Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAidL-8CTSIQw-wkiV_puD-DS-dQWX5u0Q",
  authDomain: "union-heart-games.firebaseapp.com",
  projectId: "union-heart-games",
  storageBucket: "union-heart-games.firebasestorage.app",
  messagingSenderId: "56294430695",
  appId: "1:56294430695:web:962127cd9a2bc83d8dcf42",
  measurementId: "G-FZ637PG68T"
};

// Инициализация
const app = initializeApp(firebaseConfig);

// Экспортируем для других файлов
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
