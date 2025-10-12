// глобальные переменные
let reviews = [];
let ratings = {};

document.addEventListener("DOMContentLoaded", () => {  


// Подсветка активного пункта меню
  const navLinks = document.querySelectorAll("nav a");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });




 // Плавный скролл для главной кнопки
  const mainBtn = document.querySelector(".main-btn");
  const catalog = document.querySelector(".catalog");
  if (mainBtn && catalog) {
    mainBtn.addEventListener("click", () => {
      catalog.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }




// Кнопки и переходы
  const openCatalogBtn = document.getElementById("openCatalog");
  if (openCatalogBtn) {
    openCatalogBtn.addEventListener("click", () => {
      window.location.href = "Katalog.html"; // переход в этой же вкладке
    });
  }




// Случайная игра
  const randomBtn = document.getElementById("randomGameBtn");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const games = ["snake.html", "tetris.html", "Arcanoid.html", "Asteroids.html", "Bomberman.html", "BubbleShooter.html", "FlappyBird.html", 
        "galaga.html", "iceClimber.html", "minesweeper.html", "PacMan.html", "shootingGallery.html", "spaceInvaders.html", "2048.html", 
        "catchFallingObjects.html", "hangman.html", "memoryGame.html", "simonSays.html", "xo.html", "frogger.html", "runnerGameAnimals.html", 
        "SimpleRacing.html" ];
      const randomIndex = Math.floor(Math.random() * games.length);
      window.location.href = games[randomIndex];
    });
  }




// Отзывы 
const form = document.getElementById("reviewForm");
  const reviewsList = document.getElementById("reviews-list");
  if (form && reviewsList) {
    reviews = JSON.parse(localStorage.getItem("reviews")) || [];

    function renderReviews() {
      reviewsList.innerHTML = "";
      reviews.forEach(r => {
        const reviewEl = document.createElement("div");
        reviewEl.classList.add("review");
        reviewEl.innerHTML = `<p>"${r.text}"</p><span>- ${r.author}</span>`;
        reviewsList.appendChild(reviewEl);
      });
    }

    renderReviews();

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const text = document.getElementById("reviewText").value.trim();
      const author = document.getElementById("reviewAuthor").value.trim();

      if (text && author) {
        const newReview = { text, author };
        reviews.push(newReview);
        localStorage.setItem("reviews", JSON.stringify(reviews));
        renderReviews();
        form.reset();
      }
    });
  }
});





//Оценки игр
document.addEventListener("DOMContentLoaded", () => {
  const ratingCards = document.querySelectorAll(".rating-card");

  ratingCards.forEach(card => {
    const stars = card.querySelectorAll(".stars span");
    const avgSpan = card.querySelector(".avg span");
    const gameName = card.querySelector("h3").innerText;

    // Загружаем сохранённые оценки
    let ratings = JSON.parse(localStorage.getItem("ratings")) || {};
    if (ratings[gameName]) {
      avgSpan.textContent = ratings[gameName];
      highlightStars(stars, ratings[gameName]);
    }

    stars.forEach(star => {
      star.addEventListener("click", () => {
        const value = parseInt(star.getAttribute("data-value"));

        // сохраняем отдельно для каждой игры
        ratings[gameName] = value;
        localStorage.setItem("ratings", JSON.stringify(ratings));

        avgSpan.textContent = value;
        highlightStars(stars, value);
      });
    });
  });

  function highlightStars(stars, value) {
    stars.forEach(star => {
      if (parseInt(star.getAttribute("data-value")) <= value) {
        star.classList.add("active");
      } else {
        star.classList.remove("active");
      }
    });
  }
});



// Сброс отзывов
function clearReviewsDev() {
  localStorage.removeItem("reviews");
  console.log("✅ Все отзывы удалены");
}

// Сброс рейтинга
function clearRatingsDev() {
  localStorage.removeItem("ratings");
  console.log("✅ Все оценки сброшены");
}
