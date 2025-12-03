// Games/Arcade/galaga.js
import { saveScore } from "../../scores.js";

/* --------- Configuration --------- */
const canvas = document.getElementById("game");
if (!canvas) throw new Error("#game canvas not found");
const ctx = canvas.getContext("2d");

// Logical canvas size (game coordinate system)
const LOGICAL_WIDTH = 400;
const LOGICAL_HEIGHT = 600;
canvas.width = LOGICAL_WIDTH;
canvas.height = LOGICAL_HEIGHT;

// Game params (medium jump = variant 2)
const GRAVITY = 0.5;
const JUMP_STRENGTH = -12;     // средний по силе прыжок
const KEY_SPEED = 4.5;
const PLATFORM_HEIGHT = 10;
const PLATFORM_MIN_VERTICAL = 60; // min vertical spacing between platforms
const PLATFORM_MAX_VERTICAL = 120; // max spacing
const PLATFORM_MIN_HORIZONTAL_GAP = 20; // min horizontal gap to avoid overlap

/* --------- State --------- */
let rafId = null;
let running = false;        // игра в loop'е
let paused = false;
let score = 0;
let gameOver = false;
let horizontalVelocity = 0;
let tiltControlEnabled = false; // оставляем для будущего
let lastTimestamp = 0;

/* DOM elements */
const msgEl = document.getElementById("gameOverMessage");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

/* --------- Player --------- */
const player = {
  width: 36,
  height: 36,
  x: LOGICAL_WIDTH / 2 - 18,
  y: LOGICAL_HEIGHT - 100,
  dx: 0,
  dy: 0,
  alive: true
};

/* --------- Platforms --------- */
let platforms = [];

/* --------- Helpers --------- */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function rectsOverlap(a, b) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x ||
           a.y + a.height <= b.y || b.y + b.height <= a.y);
}

/* --------- Platform generation (no overlap) --------- */
function generatePlatforms() {
  platforms = [];

  // Ground platform under player to prevent immediate falling
  const groundWidth = 120;
  const ground = {
    x: clamp(player.x + player.width/2 - groundWidth/2, 10, LOGICAL_WIDTH - groundWidth - 10),
    y: LOGICAL_HEIGHT - 40,
    width: groundWidth,
    height: PLATFORM_HEIGHT,
    type: "static",
    broken: false,
    dx: 0
  };
  platforms.push(ground);

  // Create ascending platforms above ground; ensure spacing and no overlap
  let cursorY = ground.y - rand(60, 90); // start above ground
  while (cursorY > -LOGICAL_HEIGHT) { // generate enough platforms (several screens)
    const w = Math.floor(rand(40, 100));
    const x = Math.floor(rand(10, LOGICAL_WIDTH - w - 10));
    const p = {
      x, y: cursorY, width: w, height: PLATFORM_HEIGHT,
      type: Math.random() < 0.15 ? "breakable" : (Math.random() < 0.25 ? "moving" : "static"),
      broken: false,
      dx: (Math.random() < 0.25) ? (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 1.6) : 0
    };

    // avoid overlaps horizontally with last few platforms
    let safe = true;
    for (const ex of platforms.slice(-6)) {
      // vertical gap must be at least min; if too close horizontally and vertically, mark unsafe
      const vy = Math.abs(ex.y - p.y);
      const hx = Math.abs((ex.x + ex.width/2) - (p.x + p.width/2));
      if (vy < PLATFORM_MIN_VERTICAL && hx < (ex.width/2 + p.width/2 + PLATFORM_MIN_HORIZONTAL_GAP)) {
        safe = false; break;
      }
    }
    if (safe) {
      platforms.push(p);
      cursorY -= rand(PLATFORM_MIN_VERTICAL, PLATFORM_MAX_VERTICAL);
    } else {
      // shift up a bit and retry
      cursorY -= rand(PLATFORM_MIN_VERTICAL * 0.4, PLATFORM_MIN_VERTICAL * 0.9);
    }
  }

  // sort platforms by y descending (top first negative y)
  platforms.sort((a,b) => a.y - b.y);
}

/* --------- Input: keyboard & touch --------- */
document.addEventListener("keydown", e => {
  if (!running || paused || tiltControlEnabled || gameOver) return;
  const key = e.key.toLowerCase();
  if (key === "a" || key === "ф" || e.code === "ArrowLeft") horizontalVelocity = -KEY_SPEED;
  if (key === "d" || key === "в" || e.code === "ArrowRight") horizontalVelocity = KEY_SPEED;
});
document.addEventListener("keyup", e => {
  if (!running || tiltControlEnabled || gameOver) return;
  const key = e.key.toLowerCase();
  if ((key === "a" || key === "ф" || e.code === "ArrowLeft") && horizontalVelocity < 0) horizontalVelocity = 0;
  if ((key === "d" || key === "в" || e.code === "ArrowRight") && horizontalVelocity > 0) horizontalVelocity = 0;
});

/* Touch controls: tap left/right to move while touching; release stops */
let activeTouchId = null;
canvas.addEventListener("touchstart", e => {
  if (!running || paused || tiltControlEnabled || gameOver) return;
  const t = e.changedTouches[0];
  activeTouchId = t.identifier;
  const rect = canvas.getBoundingClientRect();
  const tx = t.clientX - rect.left;
  horizontalVelocity = tx < LOGICAL_WIDTH/2 ? -KEY_SPEED : KEY_SPEED;
}, { passive: true });

canvas.addEventListener("touchmove", e => {
  if (!running || paused || tiltControlEnabled || gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId) || e.changedTouches[0];
  if (!touch) return;
  const tx = touch.clientX - rect.left;
  horizontalVelocity = tx < LOGICAL_WIDTH/2 ? -KEY_SPEED : KEY_SPEED;
}, { passive: true });

canvas.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  if (!t) return;
  if (t.identifier === activeTouchId) {
    horizontalVelocity = 0;
    activeTouchId = null;
  }
}, { passive: true });

/* --------- Update functions --------- */
function updatePlayer(dt) {
  if (gameOver || !running || paused) return;

  // apply horizontal control
  player.dx = horizontalVelocity;

  // gravity
  player.dy += GRAVITY;
  player.x += player.dx;
  player.y += player.dy;

  // horizontal bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > LOGICAL_WIDTH) player.x = LOGICAL_WIDTH - player.width;

  // platform collisions: only when falling (dy > 0), check landing
  if (player.dy > 0) {
    for (const p of platforms) {
      if (p.broken) continue;
      // check collision: player's bottom crosses platform top in this frame
      const willOverlapHorizontally = (player.x + player.width > p.x) && (player.x < p.x + p.width);
      const prevBottom = player.y - player.dy + player.height;
      const currBottom = player.y + player.height;
      if (willOverlapHorizontally &&
          prevBottom <= p.y && // was above or touching last frame
          currBottom >= p.y) { // now below or touching -> landed
        // Land
        player.y = p.y - player.height;
        player.dy = JUMP_STRENGTH; // instant bounce/jump
        score += 1; // small reward per platform reached
        if (p.type === "breakable") p.broken = true;
        break;
      }
    }
  }

  // moving platforms update
  for (const p of platforms) {
    if (p.dx) {
      p.x += p.dx;
      if (p.x < 5) { p.x = 5; p.dx *= -1; }
      if (p.x + p.width > LOGICAL_WIDTH - 5) { p.x = LOGICAL_WIDTH - 5 - p.width; p.dx *= -1; }
    }
  }

  // If player falls below bottom -> game over
  if (player.y > LOGICAL_HEIGHT) {
    endGame();
  }
}

function updatePlatforms(dt) {
  if (!running || paused || gameOver) return;

  // If player goes above half-screen, move world down (scroll up)
  if (player.y < LOGICAL_HEIGHT / 2) {
    const shift = Math.floor((LOGICAL_HEIGHT / 2) - player.y);
    player.y = LOGICAL_HEIGHT / 2;
    // move platforms down by shift
    for (const p of platforms) p.y += shift;
    // When platforms go below screen, recycle them to top with new properties (no overlaps)
    for (const p of platforms) {
      if (p.y > LOGICAL_HEIGHT) {
        // respawn at top with spacing that avoids overlap
        let tries = 0;
        let placed = false;
        while (!placed && tries++ < 50) {
          const newW = Math.floor(rand(40, 100));
          const newX = Math.floor(rand(10, LOGICAL_WIDTH - newW - 10));
          const newY = Math.floor(rand(-LOGICAL_HEIGHT, -20));
          const candidate = { x: newX, y: newY, width: newW, height: PLATFORM_HEIGHT };
          // check overlap with other platforms near newY
          let ok = true;
          for (const other of platforms) {
            if (other === p) continue;
            const vy = Math.abs(other.y - candidate.y);
            const hx = Math.abs((other.x + other.width/2) - (candidate.x + candidate.width/2));
            if (vy < PLATFORM_MIN_VERTICAL && hx < (other.width/2 + candidate.width/2 + PLATFORM_MIN_HORIZONTAL_GAP)) {
              ok = false; break;
            }
          }
          if (ok) {
            p.x = candidate.x; p.y = candidate.y; p.width = candidate.width;
            p.type = Math.random() < 0.15 ? "breakable" : (Math.random() < 0.25 ? "moving" : "static");
            p.dx = p.type === "moving" ? (Math.random() < 0.5 ? -1 : 1) * rand(0.6, 1.6) : 0;
            p.broken = false;
            placed = true;
          }
        }
        if (!placed) {
          // fallback simple reposition
          p.x = Math.floor(rand(10, LOGICAL_WIDTH - p.width - 10));
          p.y = Math.floor(rand(-LOGICAL_HEIGHT, -20));
          p.broken = false;
        }
      }
    }
    // reward for scrolling
    score += Math.max(0, Math.floor(shift * 0.05));
  }
}

/* --------- Draw --------- */
function draw() {
  // clear
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  // background
  ctx.fillStyle = "#0b243b";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  // draw semi-transparent left/right touch guides when using touch (if tilt not enabled)
  if (!tiltControlEnabled) {
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, 0, LOGICAL_WIDTH/2, LOGICAL_HEIGHT);
    ctx.fillRect(LOGICAL_WIDTH/2, 0, LOGICAL_WIDTH/2, LOGICAL_HEIGHT);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("TAP LEFT", LOGICAL_WIDTH/4, LOGICAL_HEIGHT - 100);
    ctx.fillText("TAP RIGHT", LOGICAL_WIDTH*3/4, LOGICAL_HEIGHT - 100);
  }

  // platforms
  for (const p of platforms) {
    if (p.broken) continue;
    if (p.type === "static") ctx.fillStyle = "#2ecc71";
    else if (p.type === "moving") ctx.fillStyle = "#f39c12";
    else if (p.type === "breakable") ctx.fillStyle = "#e74c3c";
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }

  // player
  ctx.fillStyle = "#3498db";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  // small eyes for style
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x + 8, player.y + 10, 4, 4);
  ctx.fillRect(player.x + player.width - 12, player.y + 10, 4, 4);

  // HUD (score)
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 10, 26);

  // paused overlay
  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "40px Arial";
    ctx.fillText("PAUSED", LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2);
  }
}

/* --------- Game loop --------- */
function loop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (running && !paused && !gameOver) {
    updatePlayer(dt);
    updatePlatforms(dt);
  }
  draw();

  rafId = requestAnimationFrame(loop);
}

/* --------- Game control / lifecycle --------- */
function startGame() {
  if (running && !gameOver) {
    // already running
    paused = false;
    return;
  }
  // reset if previously game over
  if (gameOver) {
    resetGameState();
  }
  running = true;
  paused = false;
  lastTimestamp = 0;
  // ensure platforms exist and player sits on ground
  if (!platforms.length) generatePlatforms();
  // place player on ground platform: find closest platform near bottom
  const ground = platforms.reduce((a,b) => (a.y > b.y ? a : b));
  player.x = clamp(ground.x + (ground.width - player.width)/2, 5, LOGICAL_WIDTH - player.width - 5);
  player.y = ground.y - player.height;
  player.dx = 0; player.dy = 0;
  gameOver = false;
  msgEl.style.display = "none";
  if (!rafId) rafId = requestAnimationFrame(loop);
}

function pauseGame() {
  if (!running || gameOver) return;
  paused = !paused;
  // update message under canvas
  if (paused) {
    msgEl.style.display = "block";
    msgEl.textContent = "PAUSED — нажмите «Старт» чтобы продолжить";
  } else {
    msgEl.style.display = "none";
  }
}

function endGame() {
  running = false;
  paused = false;
  gameOver = true;
  // show message under canvas (like Snake)
  msgEl.style.display = "block";
  msgEl.textContent = "Игра окончена! Ваш счёт: " + score;
  // save score to DB (wrapper)
  try { saveScore("iceClimber", score); } catch (err) { console.error("saveScore failed:", err); }
}

function resetGameState() {
  // hide message
  if (msgEl) { msgEl.style.display = "none"; msgEl.textContent = ""; }
  score = 0;
  horizontalVelocity = 0;
  player.x = LOGICAL_WIDTH / 2 - player.width/2;
  player.y = LOGICAL_HEIGHT - 100;
  player.dx = 0; player.dy = 0;
  player.alive = true;
  gameOver = false;
  paused = false;
  generatePlatforms();
}

/* --------- Button wiring --------- */
if (startBtn) startBtn.addEventListener("click", () => startGame());
if (pauseBtn) pauseBtn.addEventListener("click", () => pauseGame());
if (restartBtn) restartBtn.addEventListener("click", () => {
  resetGameState();
  startGame();
});

/* --------- Init (do NOT auto-start) --------- */
generatePlatforms();
resetGameState();
draw(); // initial frame

// expose for debug / global controls
window.startGame = startGame;
window.pauseGame = pauseGame;
window.restartGame = () => { resetGameState(); draw(); };
