import { db } from "./firebase-init.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function saveScore(playerName, gameName, score) {
  try {
    const docId = `${playerName}_${gameName}`; // уникальный документ
    const docRef = doc(db, "scores", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const oldScore = docSnap.data().score || 0;

      // Если новый счет хуже — ничего не делаем
      if (oldScore >= score) {
        console.log("У игрока уже есть лучший результат. Не обновляю.");
        return;
      }
    }

    // Обновляем только если результат лучше
    await setDoc(docRef, {
      name: playerName,
      game: gameName,
      score: score,
      timestamp: Date.now(),
    }, { merge: true });

    console.log("Рекорд обновлен:", score);

  } catch (error) {
    console.error("Ошибка сохранения очков:", error);
  }
}




// Делаем функцию глобальной
window.saveScore = saveScore;