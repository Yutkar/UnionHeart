import { db, auth } from "./firebase-init.js";
import { collection, addDoc, query, where, getDocs, orderBy, limit } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// === Функция для сохранения результата ===
export async function saveScore(gameId, score) {
  if (!currentUser) {
    alert("Войдите, чтобы сохранить свой результат!");
    return;
  }

  await addDoc(collection(db, "scores"), {
    gameId,
    userId: currentUser.uid,
    userName: currentUser.displayName || "Аноним",
    score,
    timestamp: new Date(),
  });

  console.log("Результат сохранён!");
}
