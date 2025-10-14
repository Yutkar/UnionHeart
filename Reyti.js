import { db, auth } from "./firebase-init.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

let currentUser = null;

// === Отслеживаем авторизацию ===
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// === Сохранение результата игры ===
export async function saveScore(gameId, score) {
  if (!currentUser) {
    alert("Войдите, чтобы сохранить свой результат!");
    return;
  }

  const userId = currentUser.uid;
  const userName = currentUser.displayName || "Аноним";
  const docRef = doc(db, "scores", `${gameId}_${userId}`);

  try {
    const oldData = await getDoc(docRef);
    const bestScore = oldData.exists()
      ? Math.max(oldData.data().score, score)
      : score;

    await setDoc(docRef, {
      gameId,
      userId,
      userName,
      score: bestScore,
      lastScore: score,
      timestamp: new Date(),
    });

    console.log(`✅ Результат сохранён: ${bestScore}`);
  } catch (error) {
    console.error("Ошибка при сохранении результата:", error);
  }
}
