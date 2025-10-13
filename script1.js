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