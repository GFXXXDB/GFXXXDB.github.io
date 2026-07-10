(() => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const angleInput = document.getElementById("angleInput");
    const powerInput = document.getElementById("powerInput");
    const angleValue = document.getElementById("angleValue");
    const powerValue = document.getElementById("powerValue");
    const fireButton = document.getElementById("fireButton");
    const resetButton = document.getElementById("resetButton");
    const turnText = document.getElementById("turnText");
    const windText = document.getElementById("windText");
    const playerHpText = document.getElementById("playerHpText");
    const enemyHpText = document.getElementById("enemyHpText");
    const playerHpBar = document.getElementById("playerHpBar");
    const enemyHpBar = document.getElementById("enemyHpBar");

    const world = {
        width: canvas.width,
        height: canvas.height,
        gravity: 220,
        wind: 0
    };

    const player = {
        name: "玩家",
        x: 112,
        hp: 100,
        color: "#72ddff",
        facing: 1
    };

    const enemy = {
        name: "敌人",
        x: 842,
        hp: 100,
        color: "#facc15",
        facing: -1
    };

    const state = {
        turn: "player",
        projectile: null,
        trail: [],
        message: "调整角度和力度，发射第一炮。",
        gameOver: false,
        lastTime: 0
    };

    function terrainY(x) {
        const rolling = Math.sin(x * 0.012) * 20 + Math.sin(x * 0.027) * 9;
        const valley = Math.exp(-Math.pow((x - 480) / 210, 2)) * 58;
        return 406 + rolling + valley;
    }

    function updateFighterPositions() {
        player.y = terrainY(player.x) - 24;
        enemy.y = terrainY(enemy.x) - 24;
    }

    function randomizeWind() {
        world.wind = Math.round((Math.random() * 2 - 1) * 36);
        windText.textContent = `风向 ${world.wind > 0 ? "→" : world.wind < 0 ? "←" : ""} ${Math.abs(world.wind)}`;
    }

    function resetGame() {
        player.hp = 100;
        enemy.hp = 100;
        state.turn = "player";
        state.projectile = null;
        state.trail = [];
        state.message = "调整角度和力度，发射第一炮。";
        state.gameOver = false;
        randomizeWind();
        syncUi();
    }

    function syncUi() {
        angleValue.textContent = `${angleInput.value}°`;
        powerValue.textContent = powerInput.value;

        playerHpText.textContent = `${Math.max(0, player.hp)} HP`;
        enemyHpText.textContent = `${Math.max(0, enemy.hp)} HP`;
        playerHpBar.style.width = `${Math.max(0, player.hp)}%`;
        enemyHpBar.style.width = `${Math.max(0, enemy.hp)}%`;

        if (state.gameOver) {
            turnText.textContent = player.hp > 0 ? "玩家胜利" : "敌人胜利";
        } else if (state.projectile) {
            turnText.textContent = "炮弹飞行中";
        } else {
            turnText.textContent = state.turn === "player" ? "玩家回合" : "敌人回合";
        }

        fireButton.disabled = state.turn !== "player" || !!state.projectile || state.gameOver;
    }

    function fireShot(shooter, target, angleDegrees, power) {
        const direction = shooter.facing;
        const radians = angleDegrees * Math.PI / 180;
        const speed = power * 4.6;

        state.projectile = {
            x: shooter.x + direction * 28,
            y: shooter.y - 22,
            vx: Math.cos(radians) * speed * direction,
            vy: -Math.sin(radians) * speed,
            shooter,
            target,
            radius: 6
        };

        state.trail = [];
        state.message = `${shooter.name}发射！`;
        syncUi();
    }

    function playerFire() {
        fireShot(player, enemy, Number(angleInput.value), Number(powerInput.value));
    }

    function enemyFire() {
        if (state.gameOver) {
            return;
        }

        state.turn = "enemy";
        syncUi();

        window.setTimeout(() => {
            const distance = enemy.x - player.x;
            const windCorrection = world.wind * 0.26;
            const angle = 37 + Math.random() * 12;
            const power = Math.min(92, Math.max(48, distance / 12.2 - windCorrection + (Math.random() * 12 - 6)));

            fireShot(enemy, player, angle, power);
        }, 650);
    }

    function endTurn() {
        state.projectile = null;
        state.trail = [];
        randomizeWind();

        if (player.hp <= 0 || enemy.hp <= 0) {
            state.gameOver = true;
            state.message = player.hp > 0 ? "命中目标，玩家胜利。" : "玩家被击败，敌人胜利。";
            syncUi();
            return;
        }

        if (state.turn === "player") {
            state.turn = "enemy";
            state.message = "敌人正在计算弹道。";
            syncUi();
            enemyFire();
        } else {
            state.turn = "player";
            state.message = "玩家回合。";
            syncUi();
        }
    }

    function applyDamage(target, projectile) {
        const dx = target.x - projectile.x;
        const dy = (target.y - 14) - projectile.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 36) {
            return false;
        }

        const damage = Math.max(18, Math.round(38 - distance * 0.45));
        target.hp = Math.max(0, target.hp - damage);
        state.message = `${projectile.shooter.name}命中，造成 ${damage} 点伤害。`;
        syncUi();
        return true;
    }

    function updateProjectile(deltaSeconds) {
        const projectile = state.projectile;

        if (!projectile) {
            return;
        }

        projectile.vx += world.wind * deltaSeconds;
        projectile.vy += world.gravity * deltaSeconds;
        projectile.x += projectile.vx * deltaSeconds;
        projectile.y += projectile.vy * deltaSeconds;

        state.trail.push({ x: projectile.x, y: projectile.y });

        if (state.trail.length > 42) {
            state.trail.shift();
        }

        if (applyDamage(projectile.target, projectile)) {
            endTurn();
            return;
        }

        const hitTerrain = projectile.y >= terrainY(projectile.x);
        const outOfBounds =
            projectile.x < -40 ||
            projectile.x > world.width + 40 ||
            projectile.y > world.height + 60;

        if (hitTerrain || outOfBounds) {
            state.message = hitTerrain ? "炮弹击中地形。" : "炮弹飞出战场。";
            endTurn();
        }
    }

    function drawSky() {
        const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
        gradient.addColorStop(0, "#081122");
        gradient.addColorStop(1, "#050914");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, world.width, world.height);

        ctx.strokeStyle = "rgba(56, 201, 255, 0.08)";
        ctx.lineWidth = 1;

        for (let x = 0; x < world.width; x += 48) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, world.height);
            ctx.stroke();
        }

        for (let y = 0; y < world.height; y += 48) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(world.width, y);
            ctx.stroke();
        }
    }

    function drawTerrain() {
        ctx.beginPath();
        ctx.moveTo(0, world.height);

        for (let x = 0; x <= world.width; x += 4) {
            ctx.lineTo(x, terrainY(x));
        }

        ctx.lineTo(world.width, world.height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 350, 0, world.height);
        gradient.addColorStop(0, "#164e63");
        gradient.addColorStop(1, "#0f172a");
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = "rgba(114, 221, 255, 0.48)";
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x <= world.width; x += 4) {
            const y = terrainY(x);
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }

    function drawFighter(fighter) {
        ctx.save();
        ctx.translate(fighter.x, fighter.y);

        ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
        ctx.beginPath();
        ctx.ellipse(0, 28, 34, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = fighter.color;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-14, 12, 28, 18);

        ctx.strokeStyle = fighter.color;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(10 * fighter.facing, -4);
        ctx.lineTo(36 * fighter.facing, -18);
        ctx.stroke();

        ctx.fillStyle = "#eaf2ff";
        ctx.font = "900 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(fighter.name, 0, -34);

        ctx.restore();
    }

    function drawProjectile() {
        const projectile = state.projectile;

        if (!projectile) {
            return;
        }

        state.trail.forEach((point, index) => {
            ctx.globalAlpha = index / state.trail.length;
            ctx.fillStyle = "#72ddff";
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawAimGuide() {
        if (state.turn !== "player" || state.projectile || state.gameOver) {
            return;
        }

        const angle = Number(angleInput.value) * Math.PI / 180;
        const power = Number(powerInput.value);
        const length = 34 + power * 0.55;

        ctx.strokeStyle = "rgba(114, 221, 255, 0.72)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - 22);
        ctx.lineTo(player.x + Math.cos(angle) * length, player.y - 22 - Math.sin(angle) * length);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawMessage() {
        ctx.fillStyle = "rgba(3, 7, 18, 0.72)";
        ctx.fillRect(24, 22, 420, 42);
        ctx.strokeStyle = "rgba(56, 201, 255, 0.32)";
        ctx.strokeRect(24, 22, 420, 42);

        ctx.fillStyle = "#dbeafe";
        ctx.font = "900 16px Arial";
        ctx.fillText(state.message, 42, 49);
    }

    function draw() {
        updateFighterPositions();
        drawSky();
        drawTerrain();
        drawAimGuide();
        drawFighter(player);
        drawFighter(enemy);
        drawProjectile();
        drawMessage();
    }

    function frame(time) {
        const deltaSeconds = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
        state.lastTime = time;

        updateProjectile(deltaSeconds);
        draw();
        requestAnimationFrame(frame);
    }

    angleInput.addEventListener("input", syncUi);
    powerInput.addEventListener("input", syncUi);
    fireButton.addEventListener("click", playerFire);
    resetButton.addEventListener("click", resetGame);

    updateFighterPositions();
    resetGame();
    requestAnimationFrame(frame);
})();
