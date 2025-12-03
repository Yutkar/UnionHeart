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
        }
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
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        for (let o of this.objects) o.Start();
    };

    engine.Update = function() {
        if (window.gamePaused) return requestAnimFrame(() => this.Update());

        let ctx = this.context;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.objects = this.objects.filter(o => !o.delete);

        for (let obj of this.objects) {
            obj.Update();
            obj.Draw(ctx);
        }

        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + this.score, 10, 30);

        requestAnimFrame(() => this.Update());
    };

    engine.Run = function() {
        this.Load();
        this.Update();
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
        points: options.points,
        rotation: 0,
        size: options.size,
        base: options.base,
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

        for (let dx of [0, -g.width, g.width]) {
            for (let dy of [0, -g.height, g.height]) {
                ctx.save();
                ctx.translate(this.position.x + dx, this.position.y + dy);
                ctx.rotate(this.rotation * Math.PI / 180);

                p.newctx.clearRect(0, 0, this.size.x, this.size.y);
                p.newctx.save();
                p.newctx.translate(this.base.x, this.base.y);

                p.newctx.beginPath();
                p.newctx.moveTo(this.points[0].x, this.points[0].y);
                for (let i = 1; i < this.points.length; i++)
                    p.newctx.lineTo(this.points[i].x, this.points[i].y);

                p.newctx.closePath();
                p.newctx.strokeStyle = this.color;
                p.newctx.shadowColor = this.color;
                p.newctx.shadowBlur = 7;
                p.newctx.stroke();
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
        position: {x: Math.random() * game.canvas.width, y: 0}
    });

    asteroid.Start = function() {
        this.radius = rad;
        this.rotationSpeed = (Math.random() - 0.5) * 4;
        this.score = Math.floor(100 / rad * 20);
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

            if (Math.sqrt(dx*dx + dy*dy) < ast.radius) {
                ast.delete = true;
                this.delete = true;
                game.score += ast.score;
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
var game = new GameEngine("#game");
window.gamePaused = false;
window.gameRunning = false;

/* ---------- PLAYER SHIP ---------- */
var ship = new Polygon({
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

    if (!gameRunning || gamePaused) return;

    if (game.input.left) this.rotation -= this.rotationSpeed;
    if (game.input.right) this.rotation += this.rotationSpeed;

    if (game.input.forward) {
        this.velocity.x -= Math.sin(this.rotation * Math.PI / 180) * this.speed;
        this.velocity.y -= Math.cos(this.rotation * Math.PI / 180) * this.speed;
    }

    if (game.input.fire && Date.now() - this.lastShot > 250) {
        let b = new Bullet();
        b.Start();
        game.objects.push(b);
        this.lastShot = Date.now();
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.position.x < 0) this.position.x += game.canvas.width;
    if (this.position.x > game.canvas.width) this.position.x -= game.canvas.width;
    if (this.position.y < 0) this.position.y += game.canvas.height;
    if (this.position.y > game.canvas.height) this.position.y -= game.canvas.height;

    game.eachByName("asteroid", ast => {
        let dx = ast.position.x - this.position.x;
        let dy = ast.position.y - this.position.y;

        if (Math.sqrt(dx*dx + dy*dy) < ast.radius + 10) {
            this.delete = true;
            gamePaused = true;
            gameRunning = false;

            saveScore("asteroids", game.score);

            document.querySelector("#gameOverMessage").style.display = "block";
            document.querySelector("#gameOverMessage").textContent =
                "Игра окончена! Ваш счёт: " + game.score;
        }
    });
};

game.objects.push(ship);

/* ---------- INITIAL ASTEROIDS ---------- */
function spawnAsteroids() {
    for (let i = 0; i < 4; i++) {
        let a = new Asteroid(70);
        a.Start();
        game.objects.push(a);
    }
}
spawnAsteroids();

/* ---------- BUTTON HANDLERS ---------- */
window.startGame = () => {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        game.Run();
    }
};

window.pauseGame = () => {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
};

window.restartGame = () => {

    document.querySelector("#gameOverMessage").style.display = "none";

    game.objects = [];
    game.score = 0;

    gameRunning = true;
    gamePaused = false;

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
    ship.Start();
    game.objects.push(ship);

    spawnAsteroids();
};

