(function () {
  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const ui = {
    score: document.getElementById("score"),
    level: document.getElementById("level"),
    lives: document.getElementById("lives"),
    high: document.getElementById("high-score")
  };

  const startBtn = document.getElementById("start-game");
  const leftBtn = document.getElementById("move-left");
  const rightBtn = document.getElementById("move-right");
  const shootBtn = document.getElementById("shoot");

  const highKey = "kieran_exe_high_score";
  let highScore = Number(localStorage.getItem(highKey) || 0);
  ui.high.textContent = String(highScore);

  const keys = { left: false, right: false };

  class DeployGame {
    constructor() {
      this.reset();
    }

    reset() {
      this.running = false;
      this.score = 0;
      this.level = 1;
      this.lives = 1;
      this.last = 0;
      this.enemyTimer = 0;
      this.enemyGap = 980;
      this.powerTimer = 0;
      this.shotCooldown = 0;
      this.flash = 0;
      this.spawnShield = 2.2;
      this.invuln = 0;
      this.player = { x: canvas.width / 2 - 22, y: canvas.height - 48, w: 44, h: 24, speed: 360, color: "#00f0ff", rapid: 0 };
      this.shots = [];
      this.bugs = [];
      this.powerups = [];
      this.boss = null;
      this.updateUI();
      this.drawIntro();
    }

    updateUI() {
      ui.score.textContent = String(this.score);
      ui.level.textContent = String(this.level);
      ui.lives.textContent = String(this.lives);
      ui.high.textContent = String(highScore);
    }

    start() {
      this.reset();
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    loop(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
      this.level = Math.max(1, 1 + Math.floor(this.score / 300));
      this.enemyGap = Math.max(320, 980 - this.level * 38);
      this.enemyTimer += dt * 1000;
      this.powerTimer += dt * 1000;
      this.shotCooldown -= dt;
      this.flash = Math.max(0, this.flash - dt * 2);
      this.spawnShield = Math.max(0, this.spawnShield - dt);
      this.invuln = Math.max(0, this.invuln - dt);
      if (this.player.rapid > 0) this.player.rapid -= dt;

      if (keys.left) this.player.x -= this.player.speed * dt;
      if (keys.right) this.player.x += this.player.speed * dt;
      this.player.x = Math.max(0, Math.min(canvas.width - this.player.w, this.player.x));

      if (this.enemyTimer >= this.enemyGap) {
        this.enemyTimer = 0;
        this.spawnBug();
      }

      if (this.powerTimer > 9000) {
        this.powerTimer = 0;
        this.spawnPowerup();
      }

      if (!this.boss && this.score > 0 && this.score % 1000 < 14) {
        this.spawnBoss();
      }

      this.updateShots(dt);
      this.updateBugs(dt);
      this.updatePowerups(dt);

      if (this.lives <= 0) {
        this.gameOver();
      }

      this.updateUI();
    }

    spawnBug() {
      const tier = Math.random() < Math.min(0.55, this.level * 0.045) ? 2 : 1;
      this.bugs.push({
        x: Math.random() * (canvas.width - 34),
        y: -30,
        w: 30,
        h: 22,
        hp: tier,
        speed: 52 + this.level * 12 + Math.random() * 28,
        wave: Math.random() * Math.PI * 2
      });
    }

    spawnBoss() {
      this.boss = {
        x: canvas.width / 2 - 120,
        y: 32,
        w: 240,
        h: 56,
        hp: 26 + this.level * 4,
        dir: 1,
        speed: 75 + this.level * 7
      };
    }

    spawnPowerup() {
      const types = ["aws", "docker", "lambda"];
      const type = types[Math.floor(Math.random() * types.length)];
      this.powerups.push({ x: Math.random() * (canvas.width - 28), y: -24, w: 24, h: 24, speed: 95, type });
    }

    shoot() {
      const cooldown = this.player.rapid > 0 ? 0.08 : 0.22;
      if (this.shotCooldown > 0 || !this.running) return;
      this.shotCooldown = cooldown;
      this.shots.push({ x: this.player.x + this.player.w / 2 - 2, y: this.player.y - 8, w: 4, h: 10, speed: 470 });
    }

    updateShots(dt) {
      for (const s of this.shots) s.y -= s.speed * dt;
      this.shots = this.shots.filter((s) => s.y + s.h > 0);
    }

    updateBugs(dt) {
      for (const bug of this.bugs) {
        if (bug.dead) continue;
        bug.y += bug.speed * dt;
        bug.x += Math.sin(bug.wave + bug.y * 0.03) * 24 * dt;

        for (const shot of this.shots) {
          if (hit(shot, bug)) {
            shot.y = -100;
            bug.hp -= 1;
            if (bug.hp <= 0) {
              bug.dead = true;
              this.score += 50;
              break;
            }
          }
        }

        if (bug.dead) continue;

        if (hit(bug, this.player)) {
          bug.y = canvas.height + 100;
          this.damagePlayer();
        }
      }

      this.bugs = this.bugs.filter((b) => !b.dead && b.y < canvas.height + 70);

      if (this.boss) {
        this.boss.x += this.boss.dir * this.boss.speed * dt;
        if (this.boss.x < 10 || this.boss.x + this.boss.w > canvas.width - 10) this.boss.dir *= -1;

        for (const shot of this.shots) {
          if (hit(shot, this.boss)) {
            shot.y = -100;
            this.boss.hp -= 1;
            if (this.boss.hp <= 0) {
              this.score += 350;
              this.boss = null;
              this.flash = 1;
              break;
            }
          }
        }
      }
    }

    updatePowerups(dt) {
      for (const p of this.powerups) {
        p.y += p.speed * dt;
        if (hit(p, this.player)) {
          p.y = canvas.height + 100;
          this.applyPower(p.type);
        }
      }

      this.powerups = this.powerups.filter((p) => p.y < canvas.height + 30);
    }

    applyPower(type) {
      if (type === "aws") this.score += 125;
      if (type === "docker") this.player.rapid = 8;
      if (type === "lambda") this.lives = Math.min(5, this.lives + 1);
    }

    damagePlayer() {
      this.lives = 0;
      this.flash = 0.8;
      this.invuln = 1.1;
      this.gameOver();
    }

    drawBackdrop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#141a33");
      grad.addColorStop(1, "#06080f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(0,240,255,0.08)";
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255, 70, 70, ${this.flash * 0.18})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    drawPlayer() {
      if (this.spawnShield > 0 || this.invuln > 0) {
        ctx.fillStyle = Math.floor(performance.now() / 100) % 2 ? "#9efaff" : "#00f0ff";
      } else {
        ctx.fillStyle = this.player.rapid > 0 ? "#00ff41" : this.player.color;
      }
      ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
      ctx.fillStyle = "#0f152a";
      ctx.fillRect(this.player.x + this.player.w / 2 - 4, this.player.y - 10, 8, 12);
    }

    drawBugs() {
      for (const b of this.bugs) {
        ctx.fillStyle = b.hp > 1 ? "#ff4cc9" : "#f5768f";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "#121523";
        ctx.fillRect(b.x + 6, b.y + 6, 5, 5);
        ctx.fillRect(b.x + b.w - 11, b.y + 6, 5, 5);
      }

      if (this.boss) {
        ctx.fillStyle = "#b829dd";
        ctx.fillRect(this.boss.x, this.boss.y, this.boss.w, this.boss.h);
        ctx.fillStyle = "#11162b";
        ctx.fillRect(this.boss.x + 16, this.boss.y + 16, this.boss.w - 32, 24);

        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.boss.x, this.boss.y - 10, this.boss.w, 7);
        ctx.fillStyle = "#00f0ff";
        const pct = Math.max(0, this.boss.hp / (26 + this.level * 4));
        ctx.fillRect(this.boss.x, this.boss.y - 10, this.boss.w * pct, 7);
      }
    }

    drawShots() {
      ctx.fillStyle = "#00f0ff";
      for (const s of this.shots) ctx.fillRect(s.x, s.y, s.w, s.h);
    }

    drawPowerups() {
      for (const p of this.powerups) {
        ctx.fillStyle = p.type === "aws" ? "#7ec8ff" : p.type === "docker" ? "#5ad4ff" : "#ffe277";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#05070d";
        const t = p.type === "aws" ? "☁" : p.type === "docker" ? "🐳" : "⚡";
        ctx.font = "16px JetBrains Mono";
        ctx.fillText(t, p.x + 4, p.y + 17);
      }
    }

    drawHUD() {
      ctx.fillStyle = "rgba(0,0,0,0.26)";
      ctx.fillRect(12, 12, 290, 30);
      ctx.fillStyle = "#8ce8f2";
      ctx.font = "14px JetBrains Mono";
      ctx.fillText(`Deployments: ${this.shots.length} | Bugs: ${this.bugs.length}`, 20, 32);

      if (this.player.rapid > 0) {
        ctx.fillStyle = "#00ff41";
        ctx.fillText(`Rapid Deploy: ${this.player.rapid.toFixed(1)}s`, 330, 32);
      }

      if (this.spawnShield > 0) {
        ctx.fillStyle = "#a7eaff";
        ctx.fillText(`Spawn Shield: ${this.spawnShield.toFixed(1)}s`, 620, 32);
      }
    }

    drawGameOver() {
      ctx.fillStyle = "rgba(4, 6, 12, 0.78)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff8cab";
      ctx.font = "bold 52px Orbitron";
      ctx.fillText("SYSTEM FAILURE", 250, 250);
      ctx.fillStyle = "#c6eff4";
      ctx.font = "22px JetBrains Mono";
      ctx.fillText("Press Start / Restart to redeploy", 255, 300);
    }

    drawIntro() {
      this.drawBackdrop();
      ctx.fillStyle = "#00f0ff";
      ctx.font = "bold 46px Orbitron";
      ctx.fillText("DEPLOYMENT DEFENDER", 190, 230);
      ctx.fillStyle = "#9ad9df";
      ctx.font = "20px JetBrains Mono";
      ctx.fillText("Stop bugs. Protect production. Collect power-ups.", 178, 280);
    }

    draw() {
      this.drawBackdrop();
      this.drawPlayer();
      this.drawShots();
      this.drawBugs();
      this.drawPowerups();
      this.drawHUD();
    }

    gameOver() {
      this.running = false;
      if (this.score > highScore) {
        highScore = this.score;
        localStorage.setItem(highKey, String(highScore));
      }
      this.updateUI();
      this.draw();
      this.drawGameOver();
    }
  }

  function hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function overlapX(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x;
  }

  const game = new DeployGame();

  window.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "a", "A"].includes(e.key)) keys.left = true;
    if (["ArrowRight", "d", "D"].includes(e.key)) keys.right = true;
    if (e.code === "Space") {
      e.preventDefault();
      game.shoot();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (["ArrowLeft", "a", "A"].includes(e.key)) keys.left = false;
    if (["ArrowRight", "d", "D"].includes(e.key)) keys.right = false;
  });

  function hold(btn, key, value) {
    if (!btn) return;
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keys[key] = value;
    }, { passive: false });
    btn.addEventListener("touchend", (e) => {
      e.preventDefault();
      keys[key] = false;
    }, { passive: false });
    btn.addEventListener("mousedown", () => (keys[key] = value));
    btn.addEventListener("mouseup", () => (keys[key] = false));
    btn.addEventListener("mouseleave", () => (keys[key] = false));
  }

  hold(leftBtn, "left", true);
  hold(rightBtn, "right", true);

  if (shootBtn) {
    const fire = () => game.shoot();
    shootBtn.addEventListener("click", fire);
    shootBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      fire();
    }, { passive: false });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => game.start());
  }
})();
