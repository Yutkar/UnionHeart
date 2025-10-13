import { app } from "./firebase-init.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

const reviewForm = document.getElementById("reviewForm");
const reviewText = document.getElementById("reviewText");
const reviewsList = document.getElementById("reviewsList");
const loginNotice = document.getElementById("loginNotice");

// === Загрузка отзывов ===
async function loadReviews() {
  reviewsList.innerHTML = "<p>Загрузка отзывов...</p>";

  const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    reviewsList.innerHTML = "<p>Пока нет отзывов 😔</p>";
    return;
  }

  reviewsList.innerHTML = "";
  snapshot.forEach(doc => {
    const r = doc.data();
    const div = document.createElement("div");
    div.classList.add("review");
    div.innerHTML = `
      <p>${r.text}</p>
      <span>👤 ${r.userName || "Аноним"} | ${r.createdAt?.toDate().toLocaleString() || ""}</span>
    `;
    reviewsList.appendChild(div);
  });
}

// === Добавление отзыва ===
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("Вы должны войти в аккаунт, чтобы оставить отзыв!");
    return;
  }

  const text = reviewText.value.trim();
  if (!text) return;

  await addDoc(collection(db, "reviews"), {
    text,
    userName: user.displayName || "Без имени",
    userId: user.uid,
    createdAt: serverTimestamp()
  });

  reviewText.value = "";
  loadReviews();
});

// === Проверка авторизации ===
onAuthStateChanged(auth, (user) => {
  if (user) {
    reviewForm.style.display = "flex";
    loginNotice.style.display = "none";
  } else {
    reviewForm.style.display = "none";
    loginNotice.style.display = "block";
  }
});

// === При загрузке страницы ===
loadReviews();