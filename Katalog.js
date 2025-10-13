// === Активные категории (на главной) ===
const catButtons = document.querySelectorAll(".category-button");
catButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    catButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    // сюда можно добавить фильтрацию каталога
  });
});


// === Поиск ===
const searchInput = document.getElementById("searchInput");
const games = document.querySelectorAll(".game-card");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    let anyVisible = false;

    games.forEach(card => {
      const title = card.querySelector("h3").innerText.toLowerCase();
      if (!query || title.includes(query)) {
        card.style.display = "";
        anyVisible = true;
      } else {
        card.style.display = "none";
      }
    });

    let noRes = document.querySelector(".no-results");
    if (!anyVisible) {
      if (!noRes) {
        noRes = document.createElement("div");
        noRes.className = "no-results";
        noRes.textContent = "Ничего не найдено";
        noRes.style.textAlign = "center";
        noRes.style.marginTop = "15px";
        noRes.style.color = "#446874";
        document.querySelector(".catalog").appendChild(noRes);
      }
    } else {
      if (noRes) noRes.remove();
    }
  });
}


// === Сортировка по жанрам ===
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".search-bar button");
  const cards = document.querySelectorAll(".game-card");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      // --- визуально выделяем активную кнопку ---
      buttons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // --- фильтрация карточек ---
      const genre = button.getAttribute("data-genre");
      cards.forEach(card => {
        if (genre === "all" || card.getAttribute("data-genre") === genre) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
});
