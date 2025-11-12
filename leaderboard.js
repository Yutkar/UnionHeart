// leaderboard.js
import { db } from "./firebase-init.js";
import { collection, query, orderBy, limit, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Элемент tbody таблицы
const leaderboardBody = document.getElementById("leaderboardBody");

// Функция для отображения таблицы
function renderLeaderboard(players) {
  if (!players || players.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="4">Нет данных</td></tr>`;
    return;
  }

  // Собираем HTML строк
  let html = "";
  players.forEach((player, index) => {
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${player.userName || "—"}</td>
        <td>${player.score ?? 0}</td>
      </tr>
    `;
  });

  leaderboardBody.innerHTML = html;
}

// Запрос к коллекции "scores" в Firebase
const q = query(
  collection(db, "scores"),
  orderBy("score", "desc"), // сортировка по убыванию
  limit(20) // показываем топ 20
);

// Живое обновление таблицы при изменении данных
onSnapshot(q, (snapshot) => {
  const players = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  renderLeaderboard(players);
});
