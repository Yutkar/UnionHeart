import { db } from "./firebase-init.js";

import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ----- Сохранение результата игры -----
export async function saveScore(playerName, gameName, score) {
  try {
    // Уникальный ID документа
    const docId = `${playerName}_${gameName}`;

    // Ссылка на документ ВНУТРИ коллекции scores
    const docRef = doc(db, "scores", docId);

    // Проверяем, есть ли старый результат
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const oldScore = docSnap.data().score || 0;

      // Если старый результат лучше — выходим
      if (oldScore >= score) {
        console.log("У игрока уже есть лучший результат. Не обновляю.");
        return;
      }
    }

    // Записываем новый результат
    await setDoc(docRef, {
      name: playerName,
      game: gameName,
      score: score,
      timestamp: Date.now(),
    });

    console.log("Рекорд обновлён:", score);

  } catch (error) {
    console.error("Ошибка сохранения очков:", error);
  }
}

// Делаем функцию глобальной
window.saveScore = saveScore;