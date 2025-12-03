import { saveScore } from "../../scores.js";

/** * Cross-browser wrapper for function "requestAnimationFrame" */
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

/** * Basic game class constructor * @param {String} canvasSelector * @param {String} scoreSelector */
var GameEngine = function(canvasSelector, scoreSelector) {
    var cnv = document.querySelector(canvasSelector) || document.querySelector("canvas");
    var ctx = cnv.getContext("2d");
    var scr = document.querySelector(scoreSelector);
    var w = 320;
    var h = 240;

    // УДАЛЕНА ЛОГИКА ТАБЛИЦЫ ЛИДЕРОВ (localStorage)
    /*
    // Setting defualt leaderboard data
    if (typeof(Storage) !== "undefined") {
      localStorage["board.0.name"] = "John Doe";
      localStorage["board.0.score"] = 9990;
      localStorage["board.1.name"] = "Artem N";
      localStorage["board.1.score"] = 1700;
    }
    */

    var engine = {
      canvas: cnv,
      context: ctx,
      score: 0,
      objects: [],
      input: {
        mouse: {
          x: 0,
          y: 0
        },
        fire: false,
        left: false,
        right: false,
        forward: false
      }
    };

    /* Input events */
    engine.canvas.addEventListener("mousemove", function(e){
      engine.input.mouse.x = e.layerX;
      engine.input.mouse.y = e.layerY;
    });
    document.addEventListener("keydown", function(e){
      switch(e.keyCode) {
      case 32:
        engine.input.fire = true;
        break;
      // Left:
      case 37:
        engine.input.left = true;
        break;
      case 65:
        engine.input.left = true;
        break;
      // Right:
      case 39:
        engine.input.right = true;
        break;
      case 68:
        engine.input.right = true;
        break;
      // Forward:
      case 38:
        engine.input.forward = true;
        break;
      case 87:
        engine.input.forward = true;
        break;
      }
    });
    document.addEventListener("keyup", function(e){
      switch(e.keyCode) {
      case 32:
        engine.input.fire = false;
        break;
      // Left:
      case 37:
        engine.input.left = false;
        break;
      case 65:
        engine.input.left = false;
        break;
      // Right:
      case 39:
        engine.input.right = false;
        break;
      case 68:
        engine.input.right = false;
        break;
      // Forward:
      case 38:
        engine.input.forward = false;
        break;
      case 87:
        engine.input.forward = false;
        break;
      }
    });

    /* Get each object by name */
    engine.eachByName = function(name, callback) {
      var n = name || "";
      var c = callback || function(){console.exception("Callback is undefined");};

      for (var i = 0; i < this.objects.length; i++) {
        if (this.objects[i].name == n) {
          c(this.objects[i], i);
        }
      }
    };

    /* Basic engine functions */
    var Load = function() {
      engine.canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || w);
      engine.canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || h)-48;

      for (var i = 0; i < engine.objects.length; i++) {
        engine.objects[i].Start();
      }
      
      // ИНИЦИАЛИЗАЦИЯ ЦВЕТА (чтобы избежать undefined)
      if (engine.color === "") {
        ChangeGameColor(1); // Устанавливаем красный цвет при загрузке
      }
    };
    var Update = function() {
      var prevScore = engine.score;

      // Clear canvas
      // Установка фона канваса в белый
      engine.context.fillStyle = "#FFF"; 
      engine.context.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

      // Delete unused objects
      for (var i = 0; i < engine.objects.length; i++) {
        if (engine.objects[i].delete) {
          engine.objects.splice(i, 1);
        }
      }

      // Update objects
      for (var j = 0; j < engine.objects.length; j++) {
        engine.objects[j].Update();
        engine.objects[j].Draw(engine.context);
      }

      // Update score (в верхнем левом углу)
      if (scr) { // Проверяем, существует ли элемент для счета
        // Вместо innerHTML, просто выводим счет
        // scr.innerHTML = engine.score;
        // Добавляем вывод счета в верхний левый угол канваса для контроля
        engine.context.font = "20px Arial";
        engine.context.fillStyle = "#F00"; // Красный цвет текста
        engine.context.fillText("Score: " + engine.score, 10, 30);
      } else if (engine.score > prevScore) {
         // Если scr существует, обновляем его (как было в оригинале, но его расположение задается HTML/CSS)
         // Мы оставляем только scr.innerHTML = engine.score; если элемент существует
         scr.innerHTML = engine.score;
      }


      // Game loop
      window.requestAnimFrame(Update);
    };
    engine.Run = function() {
      Load();
      Update();
    };

    return engine;
};

/** * Constructor for objects that would be rendered. * @param {Object} options */
var Polygon = function (options) {
    // ... (остальной код Polygon без изменений)
    var name = options.name || "Polygon";
    var color = options.color || "#0F0";
    var points = options.points || [{x:0, y:0},{x:10, y:10},{x:10, y:0},{x:0, y:0},{x:0, y:10},{x:10, y:10}];
    var pos = options.position || {x:0, y:0};
    var vel = options.velocity || {x:0, y:0};
    var size = options.size || {x:100, y:100};
    var base = options.base || {x:50, y:50};

    var p = {
      name: name,
      position: pos,
      velocity: vel,
      color: color,
      points: points,
      rotation: 0,
      base: base,
      size: size,
      newcnv: document.createElement("canvas"),
      delete: false
    };
    p.newctx = p.newcnv.getContext("2d");
    p.newcnv.width = p.size.x;
    p.newcnv.height = p.size.y;

    p.constructor.prototype.Start = function() {};
    p.constructor.prototype.Update = function() {};
    p.Draw = function(ctx) {
      this.newctx.clearRect(0, 0, this.newcnv.width, this.newcnv.height);
      this.newctx.save();
      this.newctx.translate(this.base.x, this.base.y);
      this.newctx.beginPath();
      this.newctx.moveTo(this.points[0].x, this.points[0].y);
      for (var i = 1; i < this.points.length; i++) {
        this.newctx.lineTo(this.points[i].x, this.points[i].y);
      }
      this.newctx.closePath();
      this.newctx.shadowBlur = 5;
      this.newctx.shadowColor = this.color;
      this.newctx.strokeStyle = this.color;
      this.newctx.stroke();
      this.newctx.restore();

      // Draw this object 8 times to simulate closed space near canvas edges.
      ctx.save();
      ctx.translate(this.position.x, this.position.y); // 0
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x - ctx.canvas.width, this.position.y); // 1
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x + ctx.canvas.width, this.position.y); // 2
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x, this.position.y - ctx.canvas.height); // 3
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x, this.position.y + ctx.canvas.height); // 4
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x - ctx.canvas.width, this.position.y - ctx.canvas.height); // 5
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x + ctx.canvas.width, this.position.y - ctx.canvas.height); // 6
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x - ctx.canvas.width, this.position.y + ctx.canvas.height); // 7
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();

      ctx.save();
      ctx.translate(this.position.x + ctx.canvas.width, this.position.y + ctx.canvas.height); // 8
      ctx.rotate(this.rotation*Math.PI/180);
      ctx.drawImage(this.newcnv,-this.base.x,-this.base.y);
      ctx.restore();
    };

    return p;
};

/** * Asteroid constructor * @param {Number} rad    Asteroid radius. */
var Asteroid = function(rad){
    var asteroid = new Polygon({
      points: asteroidVertices(Math.max(Math.floor(rad/5), 3), rad),
      color: game.color,
      name: "asteroid",
      size: {x: 210, y: 210},
      base: {x: 105, y: 105},
      velocity: {x: (Math.random()*2-1)*Math.random()*2, y: (Math.random()*2-1)*Math.random()*2},
      position: {x: Math.random()*500, y:Math.random()*1000}
    });
    // ... (остальной код Asteroid без изменений)
    asteroid.Start = function () {
      this.rotationSpeed = (Math.random()*2-1)*Math.random()*2;
      this.radius = rad;
      this.score = (80 / this.radius) * 5;
    };
    asteroid.Update = function () {
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      // Teleporting on edges
      if (this.position.x > game.canvas.width) {
        this.position.x -= game.canvas.width;
      }
      if (this.position.x < 0) {
        this.position.x += game.canvas.width;
      }
      if (this.position.y > game.canvas.height) {
        this.position.y -= game.canvas.height;
      }
      if (this.position.y < 0) {
        this.position.y += game.canvas.height;
      }

      // Set rotation
      this.rotation += this.rotationSpeed;
      if (this.rotation >= 360) {
        this.rotation -= 360;
      }
      if (this.rotation < 0) {
        this.rotation += 360;
      }
    };
    return asteroid;
};

/** * Bullet constructor */
var Bullet = function() {
    var bul = new Polygon({
      points: [
        {x:0, y:0},
        {x:0, y:-5}
      ],
      size: {x:10, y:15},
      base: {x:5, y:10},
      color: game.color,
      name: "bullet"
    });
    // ... (остальной код Bullet без изменений)
    bul.Start = function () {
      var posDelta = RotatePoint({x:0, y:-20}, {x:0,y:0}, ship.rotation*Math.PI/180);
      this.position = {x: ship.position.x + posDelta.x, y: ship.position.y + posDelta.y};
      this.rotation = ship.rotation;
      this.velocity = {x:posDelta.x/2, y:posDelta.y/2};
    };
    bul.Update = function () {
      // Move
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      // Check for intersection with asteroid
      var pos = this.position;
      var collision = false;
      game.eachByName("asteroid", function(node, k){
        // Check if close enough
        if (Math.sqrt( (node.position.x-pos.x)*(node.position.x-pos.x) + (node.position.y-pos.y)*(node.position.y-pos.y) ) < node.radius) {
          // Prepare vertices data
          var verts = [];
          for (var i = 0; i < node.points.length; i++) {
            var np = RotatePoint(node.points[i], {x:0,y:0}, node.rotation*Math.PI/180);
            verts.push({
              x: np.x + node.position.x,
              y: np.y + node.position.y
            });
          }
          // Checking
          if (CheckPointInPoly(pos, verts)) {
            collision = true;
            var r = node.radius/2;
            if (r > 5) {
              var ast1 = new Asteroid(node.radius/2);
              var ast2 = new Asteroid(node.radius/2);
              ast1.Start();
              ast2.Start();

              ast1.velocity = RotatePoint(node.velocity, {x:0,y:0}, 10*Math.PI/180);
              ast2.velocity = RotatePoint(node.velocity, {x:0,y:0}, 360-10*Math.PI/180);

              ast1.position = {x: node.position.x + ast1.velocity.x, y: node.position.y + ast1.velocity.y};
              ast2.position = {x: node.position.x + ast2.velocity.x, y: node.position.y + ast2.velocity.y};

              game.objects.push(ast1, ast2);
            } else {
              var burst = new Burst({position: node.position, color: game.color});
              game.objects.push(burst);
            }
            node.delete = true;
            game.score += node.score;
          }
        }
      });
      if (collision) {
        this.delete = true;
      }

      // Delete if it goes out of world bounds
      if (this.position.x < 0 || this.position.y < 0 || this.position.x > game.canvas.width || this.position.y > game.canvas.height) {
        this.delete = true;
      }
    };
    return bul;
};

/** * Burst constructor * @param {Object} options */
var Burst = function (options) {
    // ... (остальной код Burst без изменений)
    var length = options.length || 10;
    var count = options.count || 36;
    var color = options.color || "#F00";
    var name = options.name || "burst";
    var pos = options.position || {x:0,y:0};
    var speed = options.speed || 10;

    var obj = {
      delete: false,
      radius: 0,
      count: count,
      color: color,
      name: name,
      position: pos,
      length: length
    };

    obj.Start = function() {};
    obj.Update = function() {
      this.radius += speed;
      if (this.radius > game.canvas.width || this.radius > game.canvas.height) {
        this.delete = true;
      }
    };
    obj.Draw = function(ctx) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.beginPath();
      for (var i = 0; i < this.count; i++) {
        var v1 = RotatePoint({x:0, y:this.radius}, {x:0,y:0}, 2/this.count*i*Math.PI);
        var v2 = RotatePoint({x:0, y:this.radius+this.length}, {x:0,y:0}, 2/this.count*i*Math.PI);
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
      }
      ctx.closePath();
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.restore();
    };
    return obj;
};

/* Helpers */
/** * Checks intersection between 2 lines * @param {Object} v1   {x: Number, y: Number} * @param {Object} v2   {x: Number, y: Number} * @param {Object} v3   {x: Number, y: Number} * @param {Object} v4   {x: Number, y: Number} */
var CheckIntersection = function (v1, v2, v3, v4) {
    var n1, n2, n3, n4;
    n1 = (v4.x - v3.x) * (v1.y - v3.y) - (v4.y - v3.y) * (v1.x - v3.x);
    n2 = (v4.x - v3.x) * (v2.y - v3.y) - (v4.y - v3.y) * (v2.x - v3.x);
    n3 = (v2.x - v1.x) * (v3.y - v1.y) - (v2.y - v1.y) * (v3.x - v1.x);
    n4 = (v2.x - v1.x) * (v4.y - v1.y) - (v2.y - v1.y) * (v4.x - v1.x);
    return (n1 * n2 < 0) && (n3 * n4 < 0);
};

/** * Checks if point is inside the polygon * @param {Object} p      {x: Number, y: Number} * @param {Array}  poly   Array of objects: {x: Number, y: Number} */
var CheckPointInPoly = function (p, poly) {
    for (var i = 0, j = poly.length-1, res = false; i < poly.length; j = i++) {
      var v1 = {x: poly[i].x, y: poly[i].y};
      var v2 = {x: poly[j].x, y: poly[j].y};
      if ( ((v1.y > p.y) != (v2.y > p.y)) && (p.x < (v2.x - v1.x)*(p.y - v1.y)/(v2.y - v1.y) + v1.x) )
        res = !res;
    }
    return res;
};

/** * Rotate point around center on certain angle * @param {Object} p        {x: Number, y: Number} * @param {Object} center   {x: Number, y: Number} * @param {Number} angle    Angle in radians */
var RotatePoint = function (p, center, angle) {
    return {
      x: ((p.x-center.x)*Math.cos(angle) - (p.y-center.y)*Math.sin(angle)) + center.x,
      y: ((p.x-center.x)*Math.sin(angle) + (p.y-center.y)*Math.cos(angle)) + center.y
    };
};

/** * Generates vertices for asteroid polygon with certain count and radius * @param  {Number} count   Number of vertices * @param  {Number} rad     Maximal radius of polygon * @return {Array}        Array of vertices: {x: Number, y: Number} */
var asteroidVertices = function (count, rad) {
    var p = [];
    for (var i = 0; i < count; i++) {
      p[i] = {
        x: (-Math.sin((360/count)*i*Math.PI/180) + Math.round(Math.random()*2-1)*Math.random()/3)*rad,
        y: (-Math.cos((360/count)*i*Math.PI/180) + Math.round(Math.random()*2-1)*Math.random()/3)*rad
      };
    }
    return p;
};

// УДАЛЕНА ЛОГИКА ТАБЛИЦЫ ЛИДЕРОВ (EngGameMessage, SaveScore, SaveName)
/** * Shows message box at the end of game * @param {String} selector * @param {Number} score */
var EngGameMessage = function (selector, score) {
    // В упрощенной версии просто показываем сообщение о конце игры
    document.querySelector(selector).innerHTML = "Игра окончена! Счет: " + score;
    // Оставляем показ элемента #g-endgame
    document.querySelector("#g-endgame").style.display = "block";
    // Сохраняем результат
    saveScore("asteroids", score);
    window.scrollBlock?.unblock();
};

/*
var SaveScore = function (score, node) {
    // УДАЛЕНО
};
var SaveName = function (node) {
    // УДАЛЕНО
};
*/

/** * Changes polygon and page color * @param {Number} color  Color code: 0 - green, 1 - red, 2 - blue. */
var ChangeGameColor = function (color) {
    var c = "#0F0";
    var page = document.querySelector("body");
    switch(color) {
      case 1:
        c = "#F00"; // КРАСНЫЙ
        page.className = "m-red"; // Предполагается, что m-red задает белый фон
        break;
      case 2:
        c = "#06F";
        page.className = "m-blue";
        break;
      default:
        c = "#0F0";
        page.className = "m-green";
    }
    for (var i = 0; i < game.objects.length; i++) {
      game.objects[i].color = c;
    }
    game.color = c;
    // УДАЛЕНИЕ СОХРАНЕНИЯ ЦВЕТА (localStorage)
    // localStorage["game.color"] = c;
};

/**********************************************************************************/
/* Создание игры */
var game = new GameEngine("#g-game", "#g-score");
game.color = "";
ChangeGameColor(1);

/* Флаги управления */
let gameRunning = false;
let gamePaused = false;

/* Исправленный Load() — больше НЕ растягивает canvas */
game.Load = function () {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    for (let obj of this.objects) obj.Start();

    if (!this.color) ChangeGameColor(1);
};

/* Исправленный Update() — уважает паузу */
game.Update = function () {

    if (gamePaused) {
        requestAnimFrame(() => this.Update());
        return;
    }

    let ctx = this.context;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // удаляем ненужные объекты
    this.objects = this.objects.filter(o => !o.delete);

    // обновление
    for (let obj of this.objects) {
        obj.Update();
        obj.Draw(ctx);
    }

    // отображение очков
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + this.score, 10, 30);

    requestAnimFrame(() => this.Update());
};

/* Правильный запуск игры */
game.Run = function () {
    this.Load();
    this.Update();
};

/* Корабль */
var ship = new Polygon({
    points: [
      {x: 0, y: 0},
      {x: 10, y: 10},
      {x: 0, y: -20},
      {x: -10, y: 10}
    ],
    color: game.color,
    name: "ship",
    size: {x: 30, y: 45},
    base: {x: 15, y: 25}
});

ship.Start = function () {
    this.position = {x: game.canvas.width / 2, y: game.canvas.height / 2};
    this.rotationSpeed = 7;
    this.speed = 0.2;
    this.inertia = 0;
    this.inertiaMax = 0.99;
    this.shootDate = 0;
};

ship.Update = function () {

    if (!gameRunning || gamePaused) return;

    // поворот
    if (game.input.left) this.rotation -= this.rotationSpeed;
    if (game.input.right) this.rotation += this.rotationSpeed;

    this.rotation = (this.rotation + 360) % 360;

    // движение вперед
    if (game.input.forward) {
        this.velocity.x -= Math.sin(-this.rotation * Math.PI/180) * this.speed;
        this.velocity.y -= Math.cos(-this.rotation * Math.PI/180) * this.speed;
        this.inertia = this.inertiaMax;
    }

    // стрельба
    if (game.input.fire && Date.now() - this.shootDate > 250) {
        let b = new Bullet();
        b.Start();
        game.objects.push(b);
        this.shootDate = Date.now();
    }

    // движение + инерция
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.x *= this.inertia;
    this.velocity.y *= this.inertia;

    // телепорт
    if (this.position.x < 0) this.position.x += game.canvas.width;
    if (this.position.x > game.canvas.width) this.position.x -= game.canvas.width;
    if (this.position.y < 0) this.position.y += game.canvas.height;
    if (this.position.y > game.canvas.height) this.position.y -= game.canvas.height;

    // проверка столкновения с астероидами
    let collided = false;
    game.eachByName("asteroid", (ast) => {
        let dx = ast.position.x - this.position.x;
        let dy = ast.position.y - this.position.y;
        if (Math.sqrt(dx*dx + dy*dy) < ast.radius + 10) {
            collided = true;
        }
    });

    if (collided) {
        this.delete = true;
        gameRunning = false;
        gamePaused = true;

        EngGameMessage("#g-leaderboard", game.score);
        safeUnblock();
    }
};

game.objects.push(ship);

/* Стартовые астероиды */
for (let i = 0; i < 4; i++) {
    let a = new Asteroid(80);
    a.Start();
    game.objects.push(a);
}

/* Управление игрой */
function safeBlock(){ window.scrollBlock?.block(); }
function safeUnblock(){ window.scrollBlock?.unblock(); }

/* START */
window.startGame = () => {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        safeBlock();
        game.Run();
    } else if (gamePaused) {
        gamePaused = false;
        safeBlock();
    }
};

/* PAUSE */
window.pauseGame = () => {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (gamePaused) safeUnblock();
    else safeBlock();
};

/* RESTART */
window.restartGame = () => {
    safeUnblock();
    location.reload();
};
