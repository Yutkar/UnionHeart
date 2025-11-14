import { db, auth } from "./firebase-init.js";
import { collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Текущий пользователь
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

/**
 * Сохраняет очки игры в Firebase
 * @param {string} gameName - название игры
 * @param {number} score - количество очков
 */
export async function saveScore(gameName, score) {
  try {
    // Если пользователь авторизован, берём его имя и UID
    const userId = currentUser ? currentUser.uid : "guest";
    const userName = currentUser ? currentUser.displayName || "Игрок" : "Гость";

    await addDoc(collection(db, "scores"), {
      userId,
      userName,
      game: gameName,
      score,
      date: serverTimestamp()
    });

    console.log("Результат сохранён:", gameName, score, "от", userName);
  } catch (error) {
    console.error("Ошибка записи результата:", error);
  }
}


// Делаем функцию глобальной
window.saveScore = saveScore;