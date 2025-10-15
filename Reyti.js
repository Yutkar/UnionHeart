import { db } from "./firebase-init.js";
import { collection, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const leaderboardBody = document.getElementById("leaderboardBody");
const gameSelect = document.getElementById("gameSelect"); // выпадающий список

function renderLeaderboard(players) {
  leaderboardBody.innerHTML = "";
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

// Функция загрузки рейтинга по выбранной игре
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

// Обновляем при выборе другой игры
gameSelect.addEventListener("change", (e) => {
  loadLeaderboard(e.target.value);
});

// Загружаем при открытии страницы (например, по умолчанию — змейку)
loadLeaderboard("snake");
