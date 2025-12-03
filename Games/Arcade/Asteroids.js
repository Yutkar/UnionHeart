import { saveScore } from "../../scores.js";

/* ---------- requestAnimationFrame polyfill ---------- */
window.requestAnimFrame = (() =>
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  (cb => setTimeout(cb, 1000 / 60))
)();

/* ---------- GameEngine (responsive) ---------- */
function GameEngine(canvasSelector) {
  const cnv = document.querySelector(canvasSelector);
  if (!cnv) throw new Error("Canvas not found: " + canvasSelector);
  const ctx = cnv.getContext("2d");

  const engine = {
    canvas: cnv,
    ctx,
    objects: [],
    score: 0,
    color: "#F00",
    input: { fire: false, left: false, right: false, forward: false },
    rafId: null,
    running: false
  };

  // Resize handler (responsive)
  function resizeCanvas() {
    // Use clientWidth/Height for CSS-responsive canvas
    const w = Math.max(200, Math.floor(engine.canvas.clientWidth));
    const h = Math.max(200, Math.floor(engine.canvas.clientHeight));
    engine.canvas.width = w;
    engine.canvas.height = h;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Keyboard input
  document.addEventListener("keydown", e => {
    const code = e.code || e.key;
    if (code === "Space" || code === "Spacebar") engine.input.fire = true;
    if (code === "ArrowLeft" || code === "KeyA") engine.input.left = true;
    if (code === "ArrowRight" || code === "KeyD") engine.input.right = true;
    if (code === "ArrowUp" || code === "KeyW") engine.input.forward = true;
  });
  document.addEventListener("keyup", e => {
    const code = e.code || e.key;
    if (code === "Space" || code === "Spacebar") engine.input.fire = false;
    if (code === "ArrowLeft" || code === "KeyA") engine.input.left = false;
    if (code === "ArrowRight" || code === "KeyD") engine.input.right = false;
    if (code === "ArrowUp" || code === "KeyW") engine.input.forward = false;
  });

  engine.eachByName = function(name, cb) {
    for (const o of this.objects) if (o.name === name) cb(o);
  };

  engine.load = function() {
    resizeCanvas();
    for (const o of this.objects) if (typeof o.Start === "function") o.Start();
  };

  engine._tick = function() {
    // stop if not running
    if (!engine.running) return;

    // final frame if gameOver
    if (window.gameOver) {
      renderFrame(); // renders last state
      engine.running = false;
      if (engine.rafId) cancelAnimationFrame(engine.rafId);
      engine.rafId = null;
      return;
    }

    // If paused still render HUD & objects, keep RAF alive
    if (window.gamePaused) {
      renderFrame();
      engine.rafId = requestAnimFrame(engine._tick);
      return;
    }

    // Normal update + render
    // Update
    engine.objects = engine.objects.filter(o => !o.delete);
    for (const o of engine.objects) {
      if (typeof o.Update === "function") o.Update();
    }
    autoSpawnAsteroids();

    // Render
    renderFrame();

    engine.rafId = requestAnimFrame(engine._tick);
  };

  function renderFrame() {
    const ctx = engine.ctx;
    ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

    for (const o of engine.objects) {
      if (typeof o.Draw === "function") o.Draw(ctx);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + engine.score, 10, 26);
  }

  engine.run = function() {
    if (engine.running) return;
    window.gameOver = false;
    engine.running = true;
    engine.load();
    if (engine.rafId) cancelAnimationFrame(engine.rafId);
    engine.rafId = requestAnimFrame(engine._tick);
  };

  engine.stop = function() {
    engine.running = false;
    if (engine.rafId) { cancelAnimationFrame(engine.rafId); engine.rafId = null; }
  };

  return engine;
}

/* ---------- Basic drawable polygon object ---------- */
function Polygon(options = {}) {
  const p = {
    name: options.name || "Polygon",
    position: options.position ? { ...options.position } : { x: 0, y: 0 },
    velocity: options.velocity ? { ...options.velocity } : { x: 0, y: 0 },
    color: options.color || "#fff",
    points: options.points || [{ x: 0, y: 0 }],
    rotation: options.rotation || 0, // degrees, 0 = up
    size: options.size || { x: 40, y: 40 },
    base: options.base || { x: 20, y: 20 },
    delete: false,
    name: options.name || "Polygon",
    _cacheCnv: null,
    _cacheCtx: null
  };

  p._cacheCnv = document.createElement("canvas");
  p._cacheCnv.width = p.size.x;
  p._cacheCnv.height = p.size.y;
  p._cacheCtx = p._cacheCnv.getContext("2d");

  p.Start = () => {};
  p.Update = () => {};

  p.Draw = function(ctx) {
    const g = game.canvas;
    // render to temp once
    this._cacheCtx.clearRect(0, 0, this._cacheCnv.width, this._cacheCnv.height);
    this._cacheCtx.save();
    this._cacheCtx.translate(this.base.x, this.base.y);
    this._cacheCtx.beginPath();
    if (this.points && this.points.length) {
      this._cacheCtx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) this._cacheCtx.lineTo(this.points[i].x, this.points[i].y);
      this._cacheCtx.closePath();
      this._cacheCtx.strokeStyle = this.color;
      this._cacheCtx.lineWidth = 2;
      this._cacheCtx.shadowBlur = 8;
      this._cacheCtx.shadowColor = this.color;
      this._cacheCtx.stroke();
    }
    this._cacheCtx.restore();

    // Draw 9 copies for wrap-around
    for (const dx of [0, -g.width, g.width]) {
      for (const dy of [0, -g.height, g.height]) {
        ctx.save();
        ctx.translate(this.position.x + dx, this.position.y + dy);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(this._cacheCnv, -this.base.x, -this.base.y);
        ctx.restore();
      }
    }
  };

  return p;
}

/* ---------- Helpers ---------- */
// rotation degrees -> forward unit vector (0 deg = up)
function forwardFromRotation(deg) {
  const r = deg * Math.PI / 180;
  return { x: Math.sin(r), y: -Math.cos(r) };
}

function distance(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/* ---------- Asteroid ---------- */
function Asteroid(rad) {
  const a = new Polygon({
    points: asteroidVertices(8, rad),
    color: game.color,
    name: "asteroid",
    size: { x: rad * 2 + 40, y: rad * 2 + 40 },
    base: { x: rad + 20, y: rad + 20 }
  });

  a.Start = function() {
    this.radius = rad;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 2.5;
    this.velocity = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
    // place somewhere (may be overwritten by caller)
    if (!this.position || (this.position.x === 0 && this.position.y === 0)) {
      this.position = { x: Math.random() * game.canvas.width, y: Math.random() * game.canvas.height };
    }
    this.score = Math.max(5, Math.floor((100 / rad) * 10));
  };

  a.Update = function() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.rotation += this.rotationSpeed;

    // wrap
    if (this.position.x < 0) this.position.x += game.canvas.width;
    if (this.position.x > game.canvas.width) this.position.x -= game.canvas.width;
    if (this.position.y < 0) this.position.y += game.canvas.height;
    if (this.position.y > game.canvas.height) this.position.y -= game.canvas.height;
  };

  return a;
}

/* ---------- Bullet ---------- */
function Bullet() {
  const b = new Polygon({
    points: [{ x: 0, y: 0 }, { x: 0, y: -6 }],
    color: game.color,
    name: "bullet",
    size: { x: 8, y: 14 },
    base: { x: 4, y: 10 }
  });

  b.life = 2000; // ms
  b._born = Date.now();

  b.Start = function() {
    const f = forwardFromRotation(ship.rotation);
    this.position = { x: ship.position.x + f.x * 24, y: ship.position.y + f.y * 24 };
    this.velocity = { x: f.x * 8, y: f.y * 8 };
  };

  b.Update = function() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // check collision with asteroids
    game.eachByName("asteroid", ast => {
      if (distance(this.position, ast.position) < (ast.radius || 20)) {
        ast.delete = true;
        this.delete = true;
        game.score += ast.score || 10;
      }
    });

    // delete after time or out of bounds
    if (Date.now() - this._born > this.life) this.delete = true;
    if (this.position.x < -50 || this.position.x > game.canvas.width + 50 ||
        this.position.y < -50 || this.position.y > game.canvas.height + 50) this.delete = true;
  };

  return b;
}

/* ---------- utils ---------- */
function asteroidVertices(count, rad) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 2 * Math.PI / count;
    const rr = rad * (0.8 + Math.random() * 0.4);
    pts.push({ x: Math.cos(angle) * rr, y: Math.sin(angle) * rr });
  }
  return pts;
}

/* ---------- Global game instance & state flags ---------- */
const game = new GameEngine("#game");
window.gamePaused = false;
window.gameRunning = false;
window.gameOver = false;

/* ---------- Ship creation & logic ---------- */
let ship = null;
function createShip() {
  ship = new Polygon({
    points: [{ x: 0, y: -20 }, { x: 12, y: 12 }, { x: -12, y: 12 }],
    color: "#FFD66B",
    name: "ship",
    size: { x: 48, y: 48 },
    base: { x: 24, y: 24 }
  });

  ship.Start = function() {
    this.position = { x: game.canvas.width / 2, y: game.canvas.height / 2 };
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0; // degrees, 0 => up
    this.rotationSpeed = 4.8; // degrees per tick
    this.accel = 0.22; // acceleration per tick when forward
    this.lastShot = 0;
  };

  ship.Update = function() {
    if (!gameRunning || gamePaused || window.gameOver) return;

    // rotation
    if (game.input.left) this.rotation -= this.rotationSpeed;
    if (game.input.right) this.rotation += this.rotationSpeed;

    // keep rotation normalized
    if (this.rotation >= 360) this.rotation -= 360;
    if (this.rotation < 0) this.rotation += 360;

    // forward thrust
    if (game.input.forward) {
      const f = forwardFromRotation(this.rotation);
      this.velocity.x += f.x * this.accel;
      this.velocity.y += f.y * this.accel;
    }

    // fire
    if (game.input.fire && Date.now() - this.lastShot > 180) {
      const bullet = new Bullet();
      if (typeof bullet.Start === "function") bullet.Start();
      game.objects.push(bullet);
      this.lastShot = Date.now();
    }

    // integrate position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // small damping
    this.velocity.x *= 0.995;
    this.velocity.y *= 0.995;

    // wrap
    if (this.position.x < 0) this.position.x += game.canvas.width;
    if (this.position.x > game.canvas.width) this.position.x -= game.canvas.width;
    if (this.position.y < 0) this.position.y += game.canvas.height;
    if (this.position.y > game.canvas.height) this.position.y -= game.canvas.height;

    // collision with asteroids
    game.eachByName("asteroid", ast => {
      if (distance(this.position, ast.position) < (ast.radius + 12)) {
        // die
        this.delete = true;
        gameRunning = false;
        window.gameOver = true;
        window.gamePaused = true;

        // show message safely
        const el = document.querySelector("#gameOverMessage");
        if (el) {
          el.style.display = "block";
          el.textContent = "Игра окончена! Ваш счёт: " + game.score;
        } else {
          console.warn("gameOverMessage element not found");
        }

        // save score
        try { saveScore("asteroids", game.score); } catch (err) { console.error("saveScore failed:", err); }
      }
    });
  };

  return ship;
}

/* ---------- Spawn asteroids (ensuring not too close to ship) ---------- */
function spawnAsteroids(count = 4) {
  const margin = 80;
  for (let i = 0; i < count; i++) {
    const rad = 40 + Math.floor(Math.random() * 40);
    const a = new Asteroid(rad);
    // place away from ship center
    let pos;
    let attempts = 0;
    do {
      pos = { x: Math.random() * game.canvas.width, y: Math.random() * game.canvas.height };
      attempts++;
    } while (ship && distance(pos, ship.position) < (rad + margin) && attempts < 40);
    a.position = pos;
    if (typeof a.Start === "function") a.Start();
    game.objects.push(a);
  }
}

/* ---------- AUTO-SPAWN ASTEROIDS OVER TIME ---------- */
let nextAsteroidTime = Date.now() + 7; // first spawn after 7 sec

function autoSpawnAsteroids() {
    if (!gameRunning || gamePaused || window.gameOver) return;

    const now = Date.now();
    if (now >= nextAsteroidTime) {

        // spawn ONE asteroid but far from ship
        const rad = 35 + Math.floor(Math.random() * 30);
        const a = new Asteroid(rad);

        // choose safe spawn
        let pos, attempts = 0;
        const safeDist = 120;
        do {
            pos = {
                x: Math.random() * game.canvas.width,
                y: Math.random() * game.canvas.height
            };
            attempts++;
        } while (ship && distance(pos, ship.position) < safeDist && attempts < 40);

        a.position = pos;
        if (typeof a.Start === "function") a.Start();
        game.objects.push(a);

        // schedule next spawn in 7–10 sec
        nextAsteroidTime = now + 7000 + Math.random() * 3000;
    }
}


/* ---------- Bootstrap / reset logic ---------- */
function bootstrapGame() {
  // stop loop if running
  try { game.stop(); } catch (e) {}
  game.objects = [];
  game.score = 0;
  window.gamePaused = false;
  window.gameRunning = false;
  window.gameOver = false;

  ship = createShip();
  if (ship && typeof ship.Start === "function") ship.Start();
  game.objects.push(ship);
  spawnAsteroids(4);

  // hide gameOver message
  const el = document.querySelector("#gameOverMessage");
  if (el) { el.style.display = "none"; el.textContent = ""; }
}
bootstrapGame();

/* ---------- Touch controls (swipe/tap) ---------- */
(function setupTouch() {
  const canvas = game.canvas;
  if (!canvas) return;

  let sx = 0, sy = 0, st = 0;
  const swipeThreshold = 28; // px
  const tapMaxDist = 12;
  const tapMaxTime = 220;
  const shortPress = 160;

  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; st = Date.now();
    // two-finger restart
    if (e.touches.length === 2) {
      window.restartGame();
    }
  }, { passive: true });

  canvas.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - sx, dy = t.clientY - sy;
    const dt = Date.now() - st;
    const dist = Math.hypot(dx, dy);

    // tap -> fire
    if (dist <= tapMaxDist && dt <= tapMaxTime) {
      game.input.fire = true;
      setTimeout(() => game.input.fire = false, 120);
      return;
    }

    // swipe
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > swipeThreshold) {
        if (dx > 0) {
          game.input.right = true;
          setTimeout(() => game.input.right = false, shortPress);
        } else {
          game.input.left = true;
          setTimeout(() => game.input.left = false, shortPress);
        }
      }
    } else {
      if (Math.abs(dy) > swipeThreshold) {
        if (dy < 0) {
          // swipe up -> forward
          game.input.forward = true;
          setTimeout(() => game.input.forward = false, shortPress + 80);
        }
      }
    }
  }, { passive: true });
})();

/* ---------- Controls: start / pause / restart ---------- */
function safeBlock() { window.scrollBlock?.block(); }
function safeUnblock() { window.scrollBlock?.unblock(); }

window.startGame = () => {
  if (!gameRunning && !window.gameOver) {
    gameRunning = true;
    gamePaused = false;
    safeBlock();
    game.run();
  } else if (!gameRunning && window.gameOver) {
    window.restartGame();
  } else if (gamePaused) {
    gamePaused = false;
    safeBlock();
  }
};

window.pauseGame = () => {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (gamePaused) safeUnblock(); else safeBlock();
};

window.restartGame = () => {
  safeUnblock();
  try { game.stop(); } catch (e) {}
  game.objects = [];
  game.score = 0;
  gameRunning = false;
  gamePaused = false;
  window.gameOver = false;

  ship = createShip();
  if (ship && typeof ship.Start === "function") ship.Start();
  game.objects.push(ship);
  spawnAsteroids(4);

  // clear inputs
  game.input.fire = false; game.input.left = false; game.input.right = false; game.input.forward = false;

  // hide message
  const el = document.querySelector("#gameOverMessage");
  if (el) { el.style.display = "none"; el.textContent = ""; }

  // start fresh
  game.run();
  gameRunning = true;
  safeBlock();
};

/* expose for debug */
window._gameEngine = game;
