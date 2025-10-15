import { db, auth } from "./firebase-init.js";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const leaderboardBody = document.getElementById("leaderboardBody");
const gameSelect = document.getElementById("gameSelect"); // выпадающий список

// Функция для отображения таблицы
function renderLeaderboard(players) {
  leaderboardBody.innerHTML = "";
  if(players.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="3">Нет результатов</td></tr>`;
    return;
  }
  players.forEach((player, index) => {
    leaderboardBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${player.name}</td>
        <td>${player.score}</td>
      </tr>
    `;
  });
}

// Загрузка рейтинга по выбранной игре
function loadLeaderboard(gameName) {
  const q = query(
    collection(db, "leaderboard"),
    where("gameName", "==", gameName),
    orderBy("score", "desc"),
    limit(10)
  );

  onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => doc.data());
    renderLeaderboard(players);
  });
}

// Обновляем таблицу при выборе игры
gameSelect.addEventListener("change", (e) => {
  loadLeaderboard(e.target.value);
});

// Загружаем рейтинг при открытии страницы (по умолчанию — змейка)
loadLeaderboard("snake");

// Функция для сохранения результата игры
async function saveScore(gameName, score) {
  const user = auth.currentUser;
  if (!user) {
    alert("Нужно авторизоваться, чтобы сохранить результат!");
    return;
  }

  try {
    await addDoc(collection(db, "leaderboard"), {
      userId: user.uid,
      name: user.displayName || "Аноним",
      score: score,
      gameName: gameName,
      timestamp: serverTimestamp(),
    });
    console.log("Результат сохранён!");
  } catch (e) {
    console.error("Ошибка при сохранении:", e);
  }
}

// Делаем функцию глобальной, чтобы её могла вызвать игра
window.saveScore = saveScore;
