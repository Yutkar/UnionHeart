import { db, auth } from "./firebase-init.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// === Основные элементы ===
const ratingSection = document.querySelector(".rating-section");
const stars = ratingSection.querySelectorAll(".stars span");
const avgRatingEl = document.getElementById("avgRating");
const userRatingEl = document.getElementById("userRating");
const gameId = ratingSection.dataset.gameId; // исправлено
let currentUser = null;

// === Подсветка звёзд ===
function updateStars(rating) {
  stars.forEach((star, i) => {
    star.style.color = i < rating ? "#ffc107" : "#ccc";
  });
}

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

// === Загрузка личной оценки ===
async function loadUserRating() {
  if (!currentUser) return;
  const docRef = doc(db, "ratings", `${gameId}_${currentUser.uid}`);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const rating = docSnap.data().rating;
    userRatingEl.textContent = `Ваша оценка: ${rating} ⭐`;
    updateStars(rating);
  } else {
    userRatingEl.textContent = `Ваша оценка: —`;
    updateStars(0);
  }
}

// === Проверка входа ===
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    ratingSection.innerHTML = "<p>Войдите, чтобы оценить игру ⭐</p>";
  } else {
    loadAverageRating();
    loadUserRating();
  }
});

// === Сохранение рейтинга ===
stars.forEach((star, index) => {
  star.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Пожалуйста, войдите, чтобы поставить оценку.");
      return;
    }

    const rating = index + 1; // исправлено
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
    updateStars(rating);
    loadAverageRating();
  });
});
