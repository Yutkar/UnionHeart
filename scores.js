import { db, auth } from "./firebase-init.js";
import { addDoc, collection, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/**
 * Сохраняет результат игры в Firestore
 * @param {string} gameName - название игры ("Snake", "Flappy", "Tetris")
 * @param {number} score - количество очков
 */
export async function saveScore(gameName, score) {
  const user = auth.currentUser;

  if (!user) {
    console.warn("Игрок не авторизован — результат не записан.");
    return;
  }

  if (typeof score !== "number" || score < 0) {
    console.warn("Некорректный счёт:", score);
    return;
  }

  const scoreData = {
    userId: user.uid,
    userName: user.displayName || "Игрок",
    game: gameName,
    score: score,
    date: serverTimestamp()
  };

  console.log("Попытка сохранить очки:", scoreData);

  try {
    await addDoc(collection(db, "scores"), scoreData);
    console.log("Результат успешно сохранён:", scoreData);
  } catch (error) {
    console.error("Ошибка при записи результата:", error);
  }
}
