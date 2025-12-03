import { saveScore } from "../../scores.js";

// ======================= CARS ==========================
var car = document.getElementById("car");
car.init = function () {
  car.speed = 0.2;
  car.turn = 0;
  car.x = car.offsetLeft;
  car.y = 0;
  car.width = car.offsetWidth;
  car.height = car.offsetHeight;
  car.maxSpeed = 5;
  car.km = 0;
  car.motor = 1;
  car.crashed = false;
  car.acc = 0.025;
  car.break = 0.02;
};

car.frame = function () {
  car.motor *= -1;
  car.style.left = parseInt(car.x) + "px";
  car.style.transform = "scaleX(" + car.motor + ")";
  car.steer();
};

car.steer = function () {
  car.x += car.sx;
  road.P0.x -= car.sx / 4;
};

car.crash = function (d) {
  if (!car.crashed) {
    car.crashed = true;
    car.speed = 0.2;
    car.sx = d || 0;

    game.audio.oscillator.frequency.value = 15;

    // Save score
    saveScore("simpleracing", Math.floor(car.km));
    window.scrollBlock?.unblock();

    setTimeout(() => {
      game.audio.oscillator.frequency.value = 60;
      car.crashed = false;
      car.sx = 0;
    }, 800);
  }
};

// ======================= OPPONENT CARS ======================
var cars = document.getElementById("cars");
cars.init = function () {
  cars.n = 32;
  cars.x = 0;
  cars.speed = 1;
  cars.interval = 500;
  cars.oponents = [];
  cars.easy = 0.2;

  for (let j = 0; j < cars.n; j++) {
    cars.oponents[j] = [];
    for (let i = 0; i < 3; i++) {
      cars.oponents[j][i] = cars.create(i, j);
    }
  }

  car.st = document.createElement("style");
  document.body.appendChild(car.st);
  cars.builded = true;
};

cars.frame = function () {
  var relative = cars.speed - car.speed;

  for (let j = 0; j < cars.n; j++) {
    for (let i = 0; i < 3; i++) {
      var c = cars.oponents[j][i];
      var d = road.width * 0.42;
      var w = road.width - d - car.width;

      c.x =
        (road.P0.x - road.height - 40) * (c.y * c.y * 0.00001) +
        d / 2 +
        i * (w / 2);

      c.y += relative;

      var h = cars.n * car.height * 3;

      // collision
      if (!c.classList.contains("hidden") && c.y < car.height - 5 && c.y > 0) {
        if (car.x < 115 && i === 0) car.crash(0.1);
        if (car.x > 100 && car.x < 175 && i === 1) car.crash();
        if (car.x > 165 && i === 2) car.crash(-0.1);
      }

      if (c.y > h) {
        cars.color(c);
        c.classList.remove("hidden");
        if (Math.random() > cars.easy) c.classList.add("hidden");

        if (!c.classList.contains("hidden")) car.position++;

        c.y = 0;
      } else if (c.y < 0) {
        if (!c.classList.contains("hidden")) car.position--;
        cars.color(c);
        c.classList.remove("hidden");
        if (Math.random() > cars.easy) c.classList.add("hidden");
        c.y = h;
      }

      c.style.left = parseInt(c.x) + "px";
      c.style.bottom = parseInt(c.y) + "px";

      var o = 1 / (c.y * fog.value);
      c.style.opacity = Math.min(o, 1);
    }
  }

  car.st.innerHTML =
    "#cars .car {transform: rotateX(-56deg) scaleX(" + car.motor + ") }";
  car.style.left = parseInt(car.x) + "px";
};

cars.create = function (i, j) {
  var c = document.createElement("div");
  c.className = "car";
  cars.color(c);

  var d = road.width * 0.42;
  var w = road.width - d - car.width;
  c.x = d / 2 + i * (w / 2);
  c.y = -car.height + j * car.height * 3;

  cars.appendChild(c);

  if (Math.random() > 0.1) c.classList.add("hidden");
  return c;
};

cars.color = function (c) {
  var randomColor = Math.random() * 360;
  var randomLight = 2.5 + Math.random() * 2;
  c.style.filter =
    "hue-rotate(" + randomColor + "deg) brightness(" + randomLight + ")";
};

// ============================ ROAD ================================
var road = document.getElementById("road");
road.init = function () {
  road.ctx = road.getContext("2d");
  road.width = road.offsetWidth;
  road.height = road.offsetHeight;

  road.state = 0;
  road.P0 = { x: parseInt(road.width / 2), y: 0, xs: 0 };
  road.P1 = { x: 40, y: road.height };
  road.P2 = { x: road.width - 40, y: road.height };
  road.Pc = { x1: road.P1.x + 86, x2: road.P2.x - 86 };
};

road.frame = function () {
  road.P0.x += road.P0.xs / 2;
  road.Pc.x1 -= road.P0.xs / 3;
  road.Pc.x2 -= road.P0.xs / 3;

  road.ctx.clearRect(0, 0, road.width, road.height);
  road.ctx.beginPath();

  road.ctx.moveTo(road.P1.x, road.P1.y);
  road.ctx.bezierCurveTo(
    road.Pc.x1,
    road.P1.y - road.height * 0.7,
    road.P0.x,
    road.P0.y,
    road.P0.x,
    road.P0.y
  );

  road.ctx.moveTo(road.P2.x, road.P2.y);
  road.ctx.bezierCurveTo(
    road.Pc.x2,
    road.P2.y - road.height * 0.7,
    road.P0.x,
    road.P0.y,
    road.P0.x,
    road.P0.y
  );

  road.ctx.strokeStyle = "rgba(255,255,255,0.7)";
  road.ctx.lineWidth = 2.5;
  road.ctx.setLineDash([3, 3]);
  road.ctx.stroke();
};

// ============================ MOUNTAINS ============================
var mountains = document.getElementById("mountains");
mountains.frame = function () {
  var curve = (road.P0.x - road.width / 2) / 100;
  var left = mountains.offsetLeft;

  if (left < -4.5 * road.width) left = 1.5 * road.width;
  if (left > 1.5 * road.width) left = -4.5 * road.width;

  mountains.style.left = left - curve + "px";
};

// =============================== UI =================================
var km = document.getElementById("km");
km.frame = function () {
  car.km += car.speed / 1000;
  var value = parseInt(car.km * 10).toString();
  while (value.length < km.childNodes.length) value = "0" + value;

  for (let i = 1; i < km.childNodes.length; i++) {
    km.childNodes[i].innerText = value[i - 1];
  }
};

var position = document.getElementById("position");
position.init = function () {
  cars.total = 200;
  car.position = cars.total;
};
position.frame = function () {
  var value = parseInt(car.position).toString();
  for (let i = 1; i < position.childNodes.length; i++) {
    position.childNodes[i].innerText = value[i - 1] || " ";
  }
};

// ================================ LAP =================================
var lap = document.getElementById("lap");
lap.init = function () {
  lap.value = 1;
};
lap.frame = function () {
  if (car.position <= 0) {
    lap.value++;
    car.easy += 0.5;
    car.position = 200;
  }
  lap.innerText = lap.value;
};

// ============================ KEYBOARD ===============================
var key = {
  pressed: [],
  frame() {
    if (!car.crashed) {
      car.sx = 0;

      if (
        (key.pressed["left"] || key.pressed[37] || key.pressed[65]) &&
        car.x > road.width * 0.15
      ) {
        car.sx = -2.5;
      }
      if (
        (key.pressed["right"] || key.pressed[39] || key.pressed[68]) &&
        car.x < road.width * 0.85 - car.width
      ) {
        car.sx = 2.5;
      }

      if (
        key.pressed["up"] ||
        key.pressed[32] ||
        key.pressed[38] ||
        key.pressed[87]
      ) {
        if (car.speed < car.maxSpeed) {
          car.speed += car.acc;
          game.audio.oscillator.frequency.value += car.acc * 10;
        }
      } else if (car.speed > 0.2) {
        car.speed -= car.break;
        game.audio.oscillator.frequency.value -= car.break * 10;
      }
    }
  },
};

window.addEventListener("keydown", (e) => (key.pressed[e.keyCode] = true));
window.addEventListener("keyup", (e) => (key.pressed[e.keyCode] = false));

// =============================== AUDIO ===============================
var game = document.getElementById("game");
game.audio = function () {
  if (game.audio.oscillator) game.audio.oscillator.stop();
  game.audio.context = new AudioContext();
  game.audio.volume = game.audio.context.createGain();
  game.audio.volume.gain.value = 0.1;
  game.audio.volume.connect(game.audio.context.destination);

  var o = game.audio.context.createOscillator();
  o.type = "sawtooth";
  o.frequency.value = 60;
  o.connect(game.audio.volume);
  o.start();
  game.audio.oscillator = o;
};

// =============================== FOG =================================
var fog = document.getElementById("fog");
fog.init = function () {
  fog.value = 0.02;
  fog.status = false;
};
fog.toggle = function () {
  fog.classList.toggle("hidden");
  fog.status = !fog.status;
  fog.value = fog.status ? 0.1 : 0.02;
};

// ========================== GAME LOOP ================================
let gameRunning = false;
let gamePaused = false;

function loop() {
  if (!gameRunning || gamePaused) return;

  key.frame();
  car.frame();
  cars.frame();
  road.frame();
  mountains.frame();
  km.frame();
  position.frame();
  lap.frame();

  requestAnimationFrame(loop);
}

// ======================= GAME INIT ===================================
game.init = function () {
  car.init();
  cars.init();
  road.init();
  position.init();
  lap.init();
  fog.init();
};

// Initialize game
game.init();

// ======================= EXPORTED CONTROLS ===========================
window.startGame = () => {
  if (!gameRunning) {
    gameRunning = true;
    gamePaused = false;
    safeBlock();
    game.audio();
    loop();
  } else if (gamePaused) {
    gamePaused = false;
    safeBlock();
    loop();
  }
};

window.pauseGame = () => {
  if (!gameRunning) return;

  gamePaused = !gamePaused;

  if (gamePaused) {
    safeUnblock();
  } else {
    safeBlock();
    loop();
  }
};

window.restartGame = () => {
  safeUnblock();
  location.reload();
};

// Scroll helpers
function safeBlock() {
  window.scrollBlock?.block();
}
function safeUnblock() {
  window.scrollBlock?.unblock();
}
