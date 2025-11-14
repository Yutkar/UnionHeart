// scores.js
import { db, auth } from "./firebase-init.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Храним текущего авторизованного пользователя (если есть)
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Получить/создать guestId в localStorage — чтобы гости сохранялись под одним и тем же id
function getGuestId() {
  let id = localStorage.getItem("guestId");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("guestId", id);
  }
  return id;
}

/**
 * Сохраняет очки для игры. Принимает (gameName, score)
 * Сам определяет playerId/playerName (auth или guest).
 * Хранит один документ на (playerId + gameName) и обновляет только если новый рекорд больше.
 *
 * @param {string} gameName
 * @param {number} score
 */
export async function saveScore(gameName, score) {
  try {
    if (typeof gameName !== "string" || gameName.length === 0) {
      console.warn("saveScore: неверное имя игры:", gameName);
      return;
    }
    if (typeof score !== "number" || Number.isNaN(score)) {
      console.warn("saveScore: неверный score:", score);
      return;
    }

    const playerId = currentUser ? currentUser.uid : getGuestId();
    const playerName = currentUser ? (currentUser.displayName || "Игрок") : "Гость";
    const docId = `${playerId}_${gameName}`;

    const docRef = doc(db, "scores", docId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const oldScore = snap.data().score ?? 0;
      if (oldScore >= score) {
        // уже есть лучший или равный рекорд — ничего не делаем
        console.log(`saveScore: не обновляю, старый рекорд ${oldScore} >= новый ${score}`);
        return;
      }
    }

    // записываем новый лучший рекорд (merge не нужен — весь документ перезаписываем)
    await setDoc(docRef, {
      userId: playerId,
      userName: playerName,
      game: gameName,
      score: score,
      date: serverTimestamp()
    });

    console.log("saveScore: рекорд сохранён:", { playerId, playerName, gameName, score });
  } catch (err) {
    console.error("Ошибка сохранения очков:", err);
  }
}


// Делаем функцию глобальной
window.saveScore = saveScore;