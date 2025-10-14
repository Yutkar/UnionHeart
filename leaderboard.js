import { db } from "./firebase-init.js";
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const leaderboardTable = document.getElementById("leaderboardTable");

// Функция для отображения данных
function renderLeaderboard(players) {
  leaderboardTable.innerHTML = `
    <tr>
      <th>Место</th>
      <th>Игрок</th>
      <th>Очки</th>
    </tr>
  `;

  players.forEach((player, index) => {
    leaderboardTable.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${player.name}</td>
        <td>${player.score}</td>
      </tr>
    `;
  });
}

// Подключаем "живую" подписку
const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));

onSnapshot(q, (snapshot) => {
  const players = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  renderLeaderboard(players);
});
