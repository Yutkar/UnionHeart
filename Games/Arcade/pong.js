const ROUNDS = [5, 5, 5, 4, 4, 4, 3, 3, 3, 1];
const ROUND_COLOURS = [
  "#2C3E50", // Midnight Blue (Start/Default)
  "#1ABC9C", // Turquoise
  "#2ECC71", // Emerald
  "#3498DB", // Peter River
  "#9B59B6", // Amethyst
  "#F39C12", // Orange
  "#D35400", // Pumpkin
  "#C0392B", // Pomegranate
  "#2980B9", // Belize Hole
  "#27AE60", // Nephritis
  "#8E44AD", // Wisteria
  "#E67E22", // Carrot
  "#E74C3C"  // Alizarin
];
const COLOURS = {
  DEFAULT: "#2C3E50",
  WHITE: "#FFFFFF"
};
const DIRECTION = {
  IDLE: "IDLE",
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT"
};
class Paddle {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 100;
    this.score = 0;
    this.speed = 5;
    this.move = DIRECTION.IDLE;
  }

  addScore() {
    this.score += 1;
  }

  getScore() {
    return this.score;
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  draw(context) {
    context.fillStyle = COLOURS.WHITE;

    context.fillRect(this.x, this.y, this.width, this.height);
  }
}class PaddleBot extends Paddle {
  SPEED_INCREMENT = 0.2;

  constructor(parameters) {
    super(parameters);
  }

  levelUp() {
    this.score = 0;
    this.speed += this.SPEED_INCREMENT;
  }

  handleUpMovement(target) {
    if (this.y > target.y - this.height / 2) {
      if (target.moveX === DIRECTION.RIGHT) {
        this.y -= this.speed;
      } else {
        this.y -= this.speed / 4;
      }
    }
  }

  handleDownMovement(target) {
    if (this.y < target.y - this.height / 2) {
      if (target.moveX === DIRECTION.RIGHT) {
        this.y += this.speed;
      } else {
        this.y += this.speed / 4;
      }
    }
  }

  handleWallCollision(canvas) {
    if (this.y >= canvas.height - this.height) {
      this.y = canvas.height - this.height;
    } else if (this.y <= 0) {
      this.y = 0;
    }
  }

  update(canvas, target) {
    this.handleUpMovement(target);
    this.handleDownMovement(target);
    this.handleWallCollision(canvas);
  }
}class Player extends Paddle {
  SPEED_INCREMENT = 0.3;

  constructor(parameters) {
    super(parameters);
    this.speed = 7;
  }

  levelUp() {
    this.score = 0;
    this.speed += this.SPEED_INCREMENT;
  }

  handleMovement() {
    if (this.move === DIRECTION.UP) {
      this.y -= this.speed;
    } else if (this.move === DIRECTION.DOWN) {
      this.y += this.speed;
    }
  }

  handleWallCollision(canvas) {
    if (this.y <= 0) {
      this.y = 0;
    } else if (this.y >= canvas.height - this.height) {
      this.y = canvas.height - this.height;
    }
  }

  update(canvas) {
    this.handleMovement();
    this.handleWallCollision(canvas);
  }
}class Ball {
  BALL_SIZE = 20;
  BALL_SPEED = 9;
  BALL_SPEED_LEVEL_INCREMENT = 0.2;

  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;
    this.width = this.BALL_SIZE;
    this.height = this.BALL_SIZE;
    this.speedX = this.BALL_SPEED;
    this.speedY = this.BALL_SPEED * (2 / 3);
    this.moveX = DIRECTION.IDLE;
    this.moveY = DIRECTION.IDLE;
  }

  reset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.moveX = DIRECTION.IDLE;
    this.moveY = DIRECTION.IDLE;
  }

  levelUp() {
    this.speedX += this.BALL_SPEED_LEVEL_INCREMENT;
    this.speedY += this.BALL_SPEED_LEVEL_INCREMENT;
  }

  isOutOfLeftBounds() {
    return this.x < 0;
  }

  isOutOfRightBounds(canvas) {
    return this.x >= canvas.width - this.width;
  }

  handlePaddleCollision(paddle) {
    if (this.moveX === DIRECTION.LEFT) {
      this.x = paddle.getX() + this.width;
      this.moveX = DIRECTION.RIGHT;
    } else {
      this.x = paddle.getX() - this.width;
      this.moveX = DIRECTION.LEFT;
    }

    beep1.play();
  }

  handleWallCollision(canvas) {
    if (this.y <= 0) {
      this.moveY = DIRECTION.DOWN;
    } else if (this.y >= canvas.height - this.height) {
      this.moveY = DIRECTION.UP;
    }
  }

  handleVerticalMovement() {
    if (this.moveY === DIRECTION.UP) {
      this.y -= this.speedY;
    } else if (this.moveY === DIRECTION.DOWN) {
      this.y += this.speedY;
    }
  }

  handleHorizontalMovement() {
    if (this.moveX === DIRECTION.LEFT) {
      this.x -= this.speedX;
    } else if (this.moveX === DIRECTION.RIGHT) {
      this.x += this.speedX;
    }
  }

  getRandomDirection() {
    const directions = [DIRECTION.UP, DIRECTION.DOWN];
    const index = Math.round(Math.random());

    return directions[index];
  }

  handleServe(server, direction) {
    this.moveX = direction;
    this.moveY = this.getRandomDirection();
    this.y = server.y + server.height / 2;
    this.x =
      server.x + (direction === DIRECTION.LEFT ? -server.width : server.width);
  }

  update(canvas) {
    this.handleVerticalMovement();
    this.handleHorizontalMovement();
    this.handleWallCollision(canvas);
  }

  draw(context) {
    context.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }
}class Game {
  SCREEN_WIDTH = 1800;
  SCREEN_HEIGHT = 1100;
  TURN_DELAY_MS = 1000;
  MENU_DELAY_MS = 1000;
  WALL_OFFSET = 150;

  constructor() {
    this.canvas = document.querySelector("canvas");
    this.context = this.canvas.getContext("2d", {
      alpha: false
    });

    this.canvas.width = this.SCREEN_WIDTH;
    this.canvas.height = this.SCREEN_HEIGHT;

    this.canvas.style.width = `${this.canvas.width / 2}px`;
    this.canvas.style.height = `${this.canvas.height / 2}px`;

    this.initialize();
    this.listen(); // Оставляем только для управления игроком (w, s)
  }

  initialize() {
    this.availableColours = ROUND_COLOURS;

    this.playerA = new Player({
      x: this.WALL_OFFSET,
      y: this.canvas.height / 2
    });

    this.playerB = new PaddleBot({
      x: this.canvas.width - this.WALL_OFFSET,
      y: this.canvas.height / 2
    });

    this.ball = new Ball({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    });

    this.round = 0;
    this.running = false;
    this.gameOver = false;
    this.paused = false;
    this.playerTurn = this.playerB;
    this.timer = performance.now();
    this.colour = COLOURS.DEFAULT;

    // ИЗМЕНЕНО: Показываем экран ожидания старта
    this.showMenuScreen("Ready to Start");
  }
  
  // *** ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ ВНЕШНЕГО УПРАВЛЕНИЯ ***
  startGame() {
    if (!this.running || this.paused) {
      this.running = true;
      this.paused = false;
      window.requestAnimationFrame(this.loop.bind(this));
    }
  }

  pauseGame() {
    if (this.running && !this.gameOver) {
      this.showMenuScreen("Paused");
      this.paused = true;
    }
  }

  resetGame() {
    this.initialize();
  }
  // ************************************************

  showMenuScreen(text, callback) {
    const RECTANGLE_WIDTH = 700;
    const RECTANGLE_HEIGHT = 100;
    const MENU_TIMEOUT_MS = 3000;

    this.draw();

    this.context.font = "50px Courier New";
    this.context.fillStyle = this.colour;

    this.context.fillRect(
      this.canvas.width / 2 - RECTANGLE_WIDTH / 2,
      this.canvas.height / 2 - RECTANGLE_HEIGHT / 2,
      RECTANGLE_WIDTH,
      RECTANGLE_HEIGHT
    );

    this.context.fillStyle = COLOURS.WHITE;
    this.context.textAlign = "center";

    this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

    if (callback) {
      setTimeout(callback.bind(this), MENU_TIMEOUT_MS);
    }
  }

  hasCollision(ball, player) {
    return (
      ball.x < player.x + player.width &&
      ball.x + ball.width > player.x &&
      ball.y < player.y + player.height &&
      ball.y + ball.height > player.y
    );
  }

  levelUp() {
    this.round += 1;
    this.playerA.levelUp();
    this.playerB.levelUp();
    this.ball.levelUp();
    this.colour = this.getRandomColour();

    beep3.play();
  }

  hasWonRound(object) {
    return object.getScore() >= ROUNDS[this.round];
  }

  hasNextRound() {
    return ROUNDS[this.round + 1];
  }

  getServeDirection() {
    return this.playerTurn === this.playerA ? DIRECTION.RIGHT : DIRECTION.LEFT;
  }

  update() {
    this.ball.update(this.canvas);
    this.playerB.update(this.canvas, this.ball);
    this.playerA.update(this.canvas);

    if (this.ball.isOutOfLeftBounds()) {
      this.resetTurn(this.playerB, this.playerA);
    } else if (this.ball.isOutOfRightBounds(this.canvas)) {
      this.resetTurn(this.playerA, this.playerB);
    }

    if (this.isTurnDelayOver() && this.playerTurn) {
      const direction = this.getServeDirection();
      this.ball.handleServe(this.playerTurn, direction);
      this.playerTurn = null;
    }

    if (this.hasCollision(this.ball, this.playerA)) {
      this.ball.handlePaddleCollision(this.playerA);
    }

    if (this.hasCollision(this.ball, this.playerB)) {
      this.ball.handlePaddleCollision(this.playerB);
    }

    if (this.hasWonRound(this.playerA)) {
      if (!this.hasNextRound()) {
        this.gameOver = true;
        this.running = false; // Остановка
        const showMenuScreen = this.showMenuScreen.bind(
          this,
          "Winner!",
          this.resetGame
        );
        setTimeout(showMenuScreen, this.MENU_DELAY_MS);
      } else {
        this.levelUp();
      }
    } else if (this.hasWonRound(this.playerB)) {
      this.gameOver = true;
      this.running = false; // Остановка
      const showMenuScreen = this.showMenuScreen.bind(
        this,
        "Game Over!",
        this.resetGame
      );
      setTimeout(showMenuScreen, this.MENU_DELAY_MS);
    }
  }

  drawCourtNet() {
    this.context.beginPath();
    this.context.setLineDash([2, 15]);
    this.context.moveTo(
      this.canvas.width / 2,
      this.canvas.height - this.WALL_OFFSET
    );
    this.context.lineTo(this.canvas.width / 2, this.WALL_OFFSET);
    this.context.lineWidth = 10;
    this.context.strokeStyle = COLOURS.WHITE;
    this.context.stroke();
  }

  drawPlayerScores() {
    const SCORE_X_PADDING = 300;
    const SCORE_Y_PADDING = 200;

    this.context.font = "100px Courier New";
    this.context.textAlign = "center";
    this.context.fillStyle = COLOURS.WHITE;

    this.context.fillText(
      this.playerA.getScore().toString(),
      this.canvas.width / 2 - SCORE_X_PADDING,
      SCORE_Y_PADDING
    );

    this.context.fillText(
      this.playerB.getScore().toString(),
      this.canvas.width / 2 + SCORE_X_PADDING,
      SCORE_Y_PADDING
    );
  }

  drawRoundCount() {
    const ROUND_Y_PADDING = 45;

    this.context.font = "25px Courier New";
    this.context.fillStyle = COLOURS.WHITE;

    this.context.fillText(
      `ROUND ${this.round + 1} OF ${ROUNDS.length}`,
      this.canvas.width / 2,
      ROUND_Y_PADDING
    );
  }

  drawRoundScore() {
    const GOAL_Y_PADDING = 100;

    this.context.font = "30px Courier New";
    this.context.fillStyle = COLOURS.WHITE;

    this.context.fillText(
      `${ROUNDS[this.round]} TO WIN`,
      this.canvas.width / 2,
      GOAL_Y_PADDING
    );
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = this.colour;

    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.playerA.draw(this.context);
    this.playerB.draw(this.context);

    if (this.isTurnDelayOver()) {
      this.ball.draw(this.context);
    }

    this.drawCourtNet();
    this.drawPlayerScores();
    this.drawRoundCount();
    this.drawRoundScore();
  }

  loop() {
    if (this.paused) {
      return;
    }

    this.update();
    this.draw();

    if (!this.gameOver) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  togglePause() {
    if (this.paused) {
      this.startGame();
    } else {
      this.pauseGame();
    }
  }

  listen() {
    document.addEventListener("keydown", ({ key }) => {
      // ЛОГИКА АВТОМАТИЧЕСКОГО ЗАПУСКА УДАЛЕНА

      if (key === "w" || key === "ArrowUp") {
        this.playerA.move = DIRECTION.UP;
      }

      if (key === "s" || key === "ArrowDown") {
        this.playerA.move = DIRECTION.DOWN;
      }

      if (key === "Escape") {
        this.togglePause();
      }
    });

    document.addEventListener("keyup", () => {
      this.playerA.move = DIRECTION.IDLE;
    });
  }

  resetTurn(winner, loser) {
    this.ball.reset();
    this.playerTurn = loser;
    this.timer = performance.now();

    winner.addScore();
    beep2.play();
  }

  isTurnDelayOver() {
    return performance.now() - this.timer >= this.TURN_DELAY_MS;
  }

  getRandomColour() {
    const index = Math.floor(Math.random() * this.availableColours.length);
    const colour = this.availableColours[index];

    this.availableColours.splice(index, 1);

    return colour;
  }
}
const game = new Game();