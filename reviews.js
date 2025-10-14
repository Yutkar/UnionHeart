import { db } from "./firebase-init.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const reviewsContainer = document.getElementById("reviews");

function renderReviews(reviews) {
  reviewsContainer.innerHTML = "";
  reviews.forEach(review => {
    const div = document.createElement("div");
    div.classList.add("review");
    div.innerHTML = `
      <p><strong>${review.username}</strong></p>
      <p>⭐ ${review.rating}</p>
      <p>${review.text}</p>
    `;
    reviewsContainer.appendChild(div);
  });
}

const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
  const reviews = snapshot.docs.map(doc => doc.data());
  renderReviews(reviews);
});
