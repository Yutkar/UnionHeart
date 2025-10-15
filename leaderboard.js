import { db } from "./firebase-init.js";
import { collection, query, orderBy, limit, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const leaderboardBody = document.getElementById("leaderboardBody");

// Функция для отображения таблицы
function renderLeaderboard(players) {
  leaderboardBody.innerHTML = ""; // очищаем

  if (players.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="4">Нет данных</td></tr>`;
    return;
  }

  players.forEach((player, index) => {
    leaderboardBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${player.userName}</td>
        <td>${player.gameId}</td>
        <td>${player.score}</td>
      </tr>
    `;
  });
}

// Подключаем живое обновление данных из коллекции "scores"
const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(20));

onSnapshot(q, (snapshot) => {
  const players = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  renderLeaderboard(players);
});
