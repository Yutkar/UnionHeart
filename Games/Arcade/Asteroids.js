import { saveScore } from "../../scores.js";

/* ----------  REQUEST ANIMATION FRAME ---------- */
window.requestAnimFrame = (() =>
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    (cb => setTimeout(cb, 1000 / 60))
)();

/* ----------  GAME ENGINE  ---------- */
var GameEngine = function(canvasSelector) {

    var cnv = document.querySelector(canvasSelector);
    if (!cnv) throw new Error("Canvas not found: " + canvasSelector);
    var ctx = cnv.getContext("2d");

    let engine = {
        canvas: cnv,
        context: ctx,
        score: 0,
        objects: [],
        color: "#F00",
        input: {
            fire: false,
            left: false,
            right: false,
            forward: false
        },
        _running: false,
        _tick: null,
        _rafId: null
    };

    /* Input */
    document.addEventListener("keydown", e => {
        if (e.code === "Space") engine.input.fire = true;
        if (e.code === "ArrowLeft" || e.code === "KeyA") engine.input.left = true;
        if (e.code === "ArrowRight" || e.code === "KeyD") engine.input.right = true;
        if (e.code === "ArrowUp" || e.code === "KeyW") engine.input.forward = true;
    });

    document.addEventListener("keyup", e => {
        if (e.code === "Space") engine.input.fire = false;
        if (e.code === "ArrowLeft" || e.code === "KeyA") engine.input.left = false;
        if (e.code === "ArrowRight" || e.code === "KeyD") engine.input.right = false;
        if (e.code === "ArrowUp" || e.code === "KeyW") engine.input.forward = false;
    });

    engine.eachByName = function(name, callback) {
        for (let obj of this.objects)
            if (obj.name === name) callback(obj);
    };

    engine.Load = function() {
        this.canvas.width = Math.floor(this.canvas.clientWidth);
        this.canvas.height = Math.floor(this.canvas.clientHeight);

        for (let o of this.objects) if (typeof o.Start === "function") o.Start();
    };

    // single tick function
    engine._tick = function(time) {
        // safety binding
        const self = engine;

        // If game is flagged as over -> render final frame and stop the loop
        if (window.gameOver) {
            // final render
            let ctx = self.context;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);

            self.objects = self.objects.filter(o => !o.delete);
            for (let obj of self.objects) {
                if (typeof obj.Draw === "function") obj.Draw(ctx);
            }

            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.fillText("Score: " + self.score, 10, 30);

            self._running = false;
            if (self._rafId) { cancelAnimationFrame(self._rafId); self._rafId = null; }
            return;
        }

        // If paused -> render paused frame but keep loop running
        if (window.gamePaused) {
            let ctx = self.context;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);

            for (let obj of self.objects) {
                if (typeof obj.Draw === "function") obj.Draw(ctx);
            }

            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.fillText("Score: " + self.score, 10, 30);

            self._rafId = requestAnimationFrame(self._tick);
            return;
        }

        // Normal update + render
        let ctx = self.context;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);

        // remove deleted objects
        self.objects = self.objects.filter(o => !o.delete);

        // Update & Draw
        for (let obj of self.objects) {
            if (typeof obj.Update === "function") obj.Update();
            if (typeof obj.Draw === "function") obj.Draw(ctx);
        }

        // HUD
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + self.score, 10, 30);

        self._rafId = requestAnimationFrame(self._tick);
    };

    engine.Run = function() {
        if (this._running) return;
        this.Load();
        window.gameOver = false;
        this._running = true;
        this._rafId = requestAnimationFrame(this._tick);
    };

    engine.Stop = function() {
        this._running = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    };

    return engine;
};

/* ---------- POLYGON CLASS ---------- */
var Polygon = function(options) {
    let p = {
        name: options.name || "Polygon",
        position: options.position || {x: 0, y: 0},
        velocity: options.velocity || {x: 0, y: 0},
        color: options.color || "#F00",
        points: options.points || [{x:0,y:0}],
        rotation: options.rotation || 0,
        size: options.size || {x: 40, y: 40},
        base: options.base || {x: 20, y: 20},
        delete: false,
        newcnv: document.createElement("canvas")
    };

    p.newcnv.width = p.size.x;
    p.newcnv.height = p.size.y;
    p.newctx = p.newcnv.getContext("2d");

    p.Start = () => {};
    p.Update = () => {};

    p.Draw = function(ctx) {
        let g = game.canvas;

        // draw wrapped copies
        for (let dx of [0, -g.width, g.width]) {
            for (let dy of [0, -g.height, g.height]) {
                ctx.save();
                ctx.translate(this.position.x + dx, this.position.y + dy);
                ctx.rotate(this.rotation * Math.PI / 180);

                // draw to temp canvas first
                p.newctx.clearRect(0, 0, this.size.x, this.size.y);
                p.newctx.save();
                p.newctx.translate(this.base.x, this.base.y);

                p.newctx.beginPath();
                if (this.points && this.points.length) {
                    p.newctx.moveTo(this.points[0].x, this.points[0].y);
                    for (let i = 1; i < this.points.length; i++) p.newctx.lineTo(this.points[i].x, this.points[i].y);
                    p.newctx.closePath();
                    p.newctx.strokeStyle = this.color;
                    p.newctx.shadowColor = this.color;
                    p.newctx.shadowBlur = 7;
                    p.newctx.stroke();
                }
                p.newctx.restore();

                ctx.drawImage(p.newcnv, -this.base.x, -this.base.y);
                ctx.restore();
            }
        }
    };

    return p;
};

/* ---------- ASTEROID ---------- */
var Asteroid = function(rad) {
    let asteroid = new Polygon({
        points: asteroidVertices(7, rad),
        color: game.color,
        name: "asteroid",
        size: {x: 200, y: 200},
        base: {x: 100, y: 100},
        velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        },
        position: {x: Math.random() * game.canvas.width, y: Math.random() * game.canvas.height}
    });

    asteroid.Start = function() {
        this.radius = rad;
        this.rotationSpeed = (Math.random() - 0.5) * 4;
        this.score = Math.max(5, Math.floor(100 / rad * 20));
    };

    asteroid.Update = function() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        this.rotation += this.rotationSpeed;

        if (this.position.x < 0) this.position.x += game.canvas.width;
        if (this.position.x > game.canvas.width) this.position.x -= game.canvas.width;
        if (this.position.y < 0) this.position.y += game.canvas.height;
        if (this.position.y > game.canvas.height) this.position.y -= game.canvas.height;
    };

    return asteroid;
};

/* ---------- BULLET ---------- */
var Bullet = function() {
    let bul = new Polygon({
        points: [{x: 0, y: 0}, {x: 0, y: -5}],
        size: {x: 10, y: 20},
        base: {x: 5, y: 10},
        color: game.color,
        name: "bullet"
    });

    bul.Start = function() {
        let dx = -Math.sin(ship.rotation * Math.PI / 180);
        let dy = -Math.cos(ship.rotation * Math.PI / 180);

        this.position = {
            x: ship.position.x + dx * 20,
            y: ship.position.y + dy * 20
        };

        this.velocity = {x: dx * 5, y: dy * 5};
    };

    bul.Update = function() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        game.eachByName("asteroid", ast => {
            let dx = ast.position.x - this.position.x;
            let dy = ast.position.y - this.position.y;

            if (Math.sqrt(dx*dx + dy*dy) < (ast.radius || 20)) {
                ast.delete = true;
                this.delete = true;
                game.score += ast.score || 10;
            }
        });

        if (this.position.x < 0 || this.position.x > game.canvas.width ||
            this.position.y < 0 || this.position.y > game.canvas.height)
            this.delete = true;
    };

    return bul;
};

/* ---------- HELPERS ---------- */
function asteroidVertices(count, rad) {
    let pts = [];
    for (let i = 0; i < count; i++) {
        let angle = i * 2 * Math.PI / count;
        pts.push({
            x: Math.cos(angle) * rad,
            y: Math.sin(angle) * rad
        });
    }
    return pts;
}

/* ---------- GLOBAL GAME DATA ---------- */
/* Ensure #game canvas exists in HTML */
var game = new GameEngine("#game");
window.gamePaused = false;
window.gameRunning = false;
window.gameOver = false;

/* ---------- PLAYER SHIP ---------- */
var ship = null;
function createShip() {
    ship = new Polygon({
        points: [
            {x: 0, y: -20},
            {x: 10, y: 10},
            {x: -10, y: 10}
        ],
        color: "#F00",
        name: "ship",
        size: {x: 40, y: 40},
        base: {x: 20, y: 20}
    });

    ship.Start = function() {
        this.position = {x: game.canvas.width / 2, y: game.canvas.height / 2};
        this.velocity = {x: 0, y: 0};
        this.rotation = 0;
        this.rotationSpeed = 5;
        this.speed = 0.15;
        this.lastShot = 0;
    };

    ship.Update = function() {

        if (!gameRunning || gamePaused || window.gameOver) return;

        if (game.input.left) this.rotation -= this.rotationSpeed;
        if (game.input.right) this.rotation += this.rotationSpeed;

        if (game.input.forward) {
            this.velocity.x -= Math.sin(this.rotation * Math.PI / 180) * this.speed;
            this.velocity.y -= Math.cos(this.rotation * Math.PI / 180) * this.speed;
        }

        if (game.input.fire && Date.now() - this.lastShot > 250) {
            let b = new Bullet();
            if (typeof b.Start === "function") b.Start();
            game.objects.push(b);
            this.lastShot = Date.now();
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.x < 0) this.position.x += game.canvas.width;
        if (this.position.x > game.canvas.width) this.position.x -= game.canvas.width;
        if (this.position.y < 0) this.position.y += game.canvas.height;
        if (this.position.y > game.canvas.height) this.position.y -= game.canvas.height;

        // collision
        game.eachByName("asteroid", ast => {
            let dx = ast.position.x - this.position.x;
            let dy = ast.position.y - this.position.y;

            if (Math.sqrt(dx*dx + dy*dy) < (ast.radius + 10)) {
                this.delete = true;
                gamePaused = true;
                gameRunning = false;
                window.gameOver = true;

                // safe DOM access
                const msgEl = document.querySelector("#gameOverMessage");
                if (msgEl) {
                    msgEl.style.display = "block";
                    msgEl.textContent = "Игра окончена! Ваш счёт: " + game.score;
                } else {
                    console.warn("#gameOverMessage element not found in DOM");
                }

                // save score (firebase wrapper provided)
                try {
                    saveScore("asteroids", game.score);
                } catch (err) {
                    console.error("saveScore failed:", err);
                }

                // stop the engine loop (engine._tick will detect gameOver and stop)
            }
        });
    };

    return ship;
}

/* ---------- INITIAL ASTEROIDS ---------- */
function spawnAsteroids(count = 4) {
    for (let i = 0; i < count; i++) {
        let a = new Asteroid(70 - Math.floor(Math.random()*20));
        if (typeof a.Start === "function") a.Start();
        // place asteroids not overlapping ship center
        a.position = {x: Math.random() * game.canvas.width, y: Math.random() * game.canvas.height};
        game.objects.push(a);
    }
}

/* ---------- BOOTSTRAP / START STATE ---------- */
function bootstrapGame() {
    game.objects = [];
    game.score = 0;
    window.gamePaused = false;
    window.gameRunning = false;
    window.gameOver = false;

    createShip();
    if (typeof ship.Start === "function") ship.Start();
    game.objects.push(ship);

    spawnAsteroids(4);
}
bootstrapGame();

/* ---------- BUTTON HANDLERS ---------- */
function safeBlock(){ window.scrollBlock?.block(); }
function safeUnblock(){ window.scrollBlock?.unblock(); }

window.startGame = () => {
    if (!gameRunning && !window.gameOver) {
        gameRunning = true;
        gamePaused = false;
        safeBlock();
        game.Run();
    } else if (!gameRunning && window.gameOver) {
        // If game was over, restart before start
        window.restartGame();
    } else if (gamePaused) {
        gamePaused = false;
        safeBlock();
    }
};

window.pauseGame = () => {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (gamePaused) safeUnblock();
    else safeBlock();
};

window.restartGame = () => {
    safeUnblock();

    // hide message if exists
    const msgEl = document.querySelector("#gameOverMessage");
    if (msgEl) { msgEl.style.display = "none"; msgEl.textContent = ""; }

    // stop engine loop if running
    try { game.Stop(); } catch(e){}

    // reset flags and game state
    game.objects = [];
    game.score = 0;
    gameRunning = false;
    gamePaused = false;
    window.gameOver = false;

    // recreate ship and asteroids
    createShip();
    if (typeof ship.Start === "function") ship.Start();
    game.objects.push(ship);
    spawnAsteroids(4);

    // start loop
    game.Run();
    gameRunning = true;
    safeBlock();
};

/* ---------- expose for debugging ---------- */
window._gameEngine = game;
