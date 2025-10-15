import { db, auth } from "./firebase-init.js";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const reviewForm = document.getElementById("reviewForm");
const reviewText = document.getElementById("reviewText");
const reviewsList = document.getElementById("reviewsList");
const loginNotice = document.getElementById("loginNotice");

// Скрываем форму для неавторизованных
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    reviewForm.style.display = "none";
    loginNotice.style.display = "block";
  } else {
    reviewForm.style.display = "block";
    loginNotice.style.display = "none";
  }
});

// Отправка отзыва
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const text = reviewText.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "reviews"), {
      userId: currentUser.uid,
      userName: currentUser.displayName || "Аноним",
      text,
      timestamp: serverTimestamp()
    });
    reviewText.value = "";
  } catch (error) {
    console.error("Ошибка при добавлении отзыва:", error);
  }
});

// Отображение отзывов в реальном времени
const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
  reviewsList.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.classList.add("review-item");
    div.innerHTML = `
      <div class="author">${data.userName}</div>
      <p>${data.text}</p>
    `;
    reviewsList.appendChild(div);
  });
});
