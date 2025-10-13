import { db, auth } from "./firebase-init.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// === Основные элементы ===
const stars = document.querySelectorAll(".stars span");
const avgRatingEl = document.getElementById("avgRating");
const userRatingEl = document.getElementById("userRating");
const gameId = document.body.getAttribute("data-game-id"); // из HTML
let currentUser = null;

// === Проверяем вход ===
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    document.querySelector(".rating-section").innerHTML =
      "<p>Войдите, чтобы оценить игру ⭐</p>";
  } else {
    loadAverageRating();
  }
});

// === Сохранение рейтинга ===
stars.forEach((star, index) => {
  star.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Пожалуйста, войдите, чтобы поставить оценку.");
      return;
    }

    const rating = 5 - index;
    const userId = currentUser.uid;
    const userName = currentUser.displayName || "Аноним";

    await setDoc(doc(db, "ratings", `${gameId}_${userId}`), {
      gameId,
      userId,
      userName,
      rating,
      timestamp: new Date(),
    });

    userRatingEl.textContent = `Ваша оценка: ${rating} ⭐`;
    loadAverageRating();
  });
});

// === Подсчёт среднего рейтинга ===
async function loadAverageRating() {
  const q = query(collection(db, "ratings"), where("gameId", "==", gameId));
  const snapshot = await getDocs(q);

  let total = 0;
  let count = 0;

  snapshot.forEach((doc) => {
    total += doc.data().rating;
    count++;
  });

  const avg = count > 0 ? (total / count).toFixed(1) : "—";
  avgRatingEl.textContent = `Средняя оценка: ${avg} (${count})`;
}
