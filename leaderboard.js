import { db } from "./firebase-init.js";
import { collection, query, where, orderBy, limit, getDocs } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const leaderboardBody = document.getElementById("leaderboardBody");
const gameId = document.body.dataset.gameId || "snake"; // можно брать из атрибута

async function loadLeaderboard() {
  const q = query(
    collection(db, "scores"),
    where("gameId", "==", gameId),
    orderBy("score", "desc"),
    limit(10)
  );

  const snapshot = await getDocs(q);

  leaderboardBody.innerHTML = "";
  let rank = 1;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${rank}</td>
      <td>${data.userName}</td>
      <td>${data.score}</td>
    `;
    leaderboardBody.appendChild(row);
    rank++;
  });

  if (rank === 1) {
    leaderboardBody.innerHTML = "<tr><td colspan='3'>Пока нет результатов 😔</td></tr>";
  }
}

loadLeaderboard();
