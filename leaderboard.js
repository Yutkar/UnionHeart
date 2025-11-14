import { db } from "./firebase-init.js";
import { collection, query, orderBy, limit, where, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const leaderboardBody = document.getElementById("leaderboardBody");
const gameSelect = document.getElementById("gameSelect");

function renderLeaderboard(players) {
  if (!players || players.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="3">Нет данных</td></tr>`;
    return;
  }

  leaderboardBody.innerHTML = players
    .map((player, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${player.userName || "—"}</td>
        <td>${player.score || 0}</td>
      </tr>
    `)
    .join("");
}

let unsubscribe = null;

function loadLeaderboard(gameName) {
  if (unsubscribe) unsubscribe();

  const q = query(
    collection(db, "scores"),
    where("game", "==", gameName),   // <-- фильтр по игре
    orderBy("score", "desc"),
    limit(20)
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => doc.data());
    renderLeaderboard(players);
  });
}

gameSelect.addEventListener("change", () => {
  loadLeaderboard(gameSelect.value);
});

// Загружаем таблицу для первой игры при старте
loadLeaderboard(gameSelect.value);
