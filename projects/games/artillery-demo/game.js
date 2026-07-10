(() => {
    const $ = id => document.getElementById(id);

    const screens = {
        menu: $("menuScreen"),
        map: $("mapScreen"),
        room: $("roomScreen"),
        battle: $("battleScreen"),
        result: $("resultScreen")
    };

    const canvas = $("gameCanvas");
    const ctx = canvas.getContext("2d");
    const angleInput = $("angleInput");
    const powerInput = $("powerInput");
    const angleValue = $("angleValue");
    const powerValue = $("powerValue");
    const fireButton = $("fireButton");
    const turnText = $("turnText");
    const windText = $("windText");

    const maps = [
        { id: "plain", name: "地图1：碎石平原", preview: "", seed: 0.012, valley: 42, base: 405 },
        { id: "valley", name: "地图2：中央低谷", preview: "valley", seed: 0.016, valley: 78, base: 394 },
        { id: "ridge", name: "地图3：高地脊线", preview: "ridge", seed: 0.01, valley: 24, base: 382 }
    ];

    const world = {
        width: canvas.width,
        height: canvas.height,
        gravity: 240,
        wind: 0,
        terrain: []
    };

    const explosion = {
        radius: 68,
        maxDamage: 42,
        minDamage: 8
    };

    const state = {
        selectedMap: maps[0],
        slots: [],
        fighters: [],
        currentTeam: "blue",
        teamCursor: { blue: -1, red: -1 },
        activeFighter: null,
        projectile: null,
        trail: [],
        blast: null,
        message: "创建房间开始游戏。",
        gameOver: false,
        lastTime: 0,
        stats: {
            playerDamage: 0,
            playerKills: 0
        }
    };

    function showScreen(name) {
        Object.values(screens).forEach(screen => screen.classList.add("hidden"));
        screens[name].classList.remove("hidden");
    }

    function createDefaultSlots() {
        state.slots = [
            { id: 1, team: "blue", name: "Player", type: "player", ready: false },
            { id: 2, team: "blue", name: "", type: "empty", ready: false },
            { id: 3, team: "red", name: "", type: "empty", ready: false },
            { id: 4, team: "red", name: "", type: "empty", ready: false },
            { id: 5, team: "red", name: "", type: "empty", ready: false }
        ];
    }

    function renderMaps() {
        $("mapList").innerHTML = maps.map(map => `
            <button class="map-card ${map.id === state.selectedMap.id ? "selected" : ""}" data-map="${map.id}" type="button">
                <div class="map-preview"><div class="preview-ground ${map.preview}"></div></div>
                <h3>${map.name}</h3>
                <p>简单地形预览，适合测试炮弹轨迹和地形破坏。</p>
            </button>
        `).join("");

        document.querySelectorAll("[data-map]").forEach(button => {
            button.addEventListener("click", () => {
                state.selectedMap = maps.find(map => map.id === button.dataset.map);
                createDefaultSlots();
                renderRoom();
                showScreen("room");
            });
        });
    }

    function renderRoom() {
        $("roomNameText").textContent = "Artillery Room";
        $("selectedMapText").textContent = `地图：${state.selectedMap.name}`;

        renderTeam("blue", $("blueTeamList"));
        renderTeam("red", $("redTeamList"));

        const filled = state.slots.filter(slot => slot.type !== "empty");
        const emptyCount = state.slots.length - filled.length;
        const allReady = filled.length > 0 && filled.every(slot => slot.ready);
        const hasBlue = filled.some(slot => slot.team === "blue");
        const hasRed = filled.some(slot => slot.team === "red");

        $("roomHintText").textContent = emptyCount > 0
            ? `还有 ${emptyCount} 个空位，可自动填充 AI。`
            : allReady ? "所有位置已准备，可以开始游戏。" : "还有角色未准备。";

        $("startGameButton").disabled = emptyCount > 0 || !allReady || !hasBlue || !hasRed;
    }

    function renderTeam(team, container) {
        container.innerHTML = state.slots
            .filter(slot => slot.team === team)
            .map(slot => {
                if (slot.type === "empty") {
                    return `
                        <div class="slot-card">
                            <div><strong>空位置</strong><small>${team === "blue" ? "蓝方" : "红方"}</small></div>
                            <button type="button" data-add-ai="${slot.id}">添加AI</button>
                        </div>
                    `;
                }

                const typeText = slot.type === "player" ? "玩家" : "AI";
                const action = slot.type === "ai"
                    ? `<button type="button" class="ghost" data-remove-ai="${slot.id}">移除</button>`
                    : "";

                return `
                    <div class="slot-card">
                        <div><strong>${slot.name}</strong><small>${typeText} / ${slot.ready ? "已准备" : "准备中"}</small></div>
                        ${action}
                    </div>
                `;
            })
            .join("");

        container.querySelectorAll("[data-add-ai]").forEach(button => {
            button.addEventListener("click", () => addAi(Number(button.dataset.addAi)));
        });

        container.querySelectorAll("[data-remove-ai]").forEach(button => {
            button.addEventListener("click", () => removeAi(Number(button.dataset.removeAi)));
        });
    }

    function addAi(slotId) {
        const slot = state.slots.find(item => item.id === slotId);
        if (!slot || slot.type !== "empty") return;
        slot.type = "ai";
        slot.name = `AI-${String(slot.id).padStart(2, "0")}`;
        slot.ready = true;
        renderRoom();
    }

    function removeAi(slotId) {
        const slot = state.slots.find(item => item.id === slotId);
        if (!slot || slot.type !== "ai") return;
        slot.type = "empty";
        slot.name = "";
        slot.ready = false;
        renderRoom();
    }

    function autoFillAi() {
        state.slots.forEach(slot => {
            if (slot.type === "empty") {
                slot.type = "ai";
                slot.name = `AI-${String(slot.id).padStart(2, "0")}`;
                slot.ready = true;
            }
        });
        renderRoom();
    }

    function setPlayerReady() {
        const playerSlot = state.slots.find(slot => slot.type === "player");
        playerSlot.ready = true;
        renderRoom();
    }

    function baseTerrainY(x) {
        const map = state.selectedMap;
        const rolling = Math.sin(x * map.seed) * 20 + Math.sin(x * 0.027) * 9;
        const valley = Math.exp(-Math.pow((x - 480) / 210, 2)) * map.valley;
        return map.base + rolling + valley;
    }

    function initializeTerrain() {
        world.terrain = [];
        for (let x = 0; x <= world.width; x += 1) {
            world.terrain[x] = baseTerrainY(x);
        }
    }

    function terrainY(x) {
        return world.terrain[Math.max(0, Math.min(world.width, Math.round(x)))] ?? world.height;
    }

    function createFighter(slot, index, teamIndex) {
        const isBlue = slot.team === "blue";
        const x = isBlue ? 110 + teamIndex * 58 : world.width - 110 - teamIndex * 58;
        return {
            id: slot.id,
            name: slot.name,
            type: slot.type,
            team: slot.team,
            x,
            y: 0,
            vy: 0,
            hp: 100,
            maxHp: 100,
            color: isBlue ? "#72ddff" : "#f87171",
            facing: isBlue ? 1 : -1,
            bodyRadius: 20,
            groundOffset: 24,
            totalDamage: 0,
            kills: 0,
            index
        };
    }

    function startBattle() {
        initializeTerrain();
        const teamCounts = { blue: 0, red: 0 };
        state.fighters = state.slots
            .filter(slot => slot.type !== "empty")
            .map((slot, index) => createFighter(slot, index, teamCounts[slot.team]++));

        state.fighters.forEach(placeOnGround);
        state.currentTeam = "blue";
        state.teamCursor = { blue: -1, red: -1 };
        state.projectile = null;
        state.trail = [];
        state.blast = null;
        state.gameOver = false;
        state.stats = { playerDamage: 0, playerKills: 0 };
        randomizeWind();
        showScreen("battle");
        nextTurn("blue");
    }

    function placeOnGround(fighter) {
        fighter.y = terrainY(fighter.x) - fighter.groundOffset;
        fighter.vy = 0;
    }

    function updateFighterPhysics(fighter, dt) {
        if (fighter.hp <= 0) return;
        const groundY = terrainY(fighter.x) - fighter.groundOffset;
        if (fighter.y < groundY) {
            fighter.vy += world.gravity * dt;
            fighter.y = Math.min(groundY, fighter.y + fighter.vy * dt);
        } else {
            fighter.y = groundY;
            fighter.vy = 0;
        }
    }

    function aliveTeam(team) {
        return state.fighters.filter(fighter => fighter.team === team && fighter.hp > 0);
    }

    function getWinner() {
        const blueAlive = aliveTeam("blue").length > 0;
        const redAlive = aliveTeam("red").length > 0;
        if (blueAlive && redAlive) return null;
        return blueAlive ? "blue" : "red";
    }

    function nextTurn(team) {
        const winner = getWinner();
        if (winner) {
            finishBattle(winner);
            return;
        }

        const alive = aliveTeam(team);
        if (alive.length === 0) {
            nextTurn(team === "blue" ? "red" : "blue");
            return;
        }

        state.currentTeam = team;
        state.teamCursor[team] = (state.teamCursor[team] + 1) % alive.length;
        state.activeFighter = alive[state.teamCursor[team]];
        state.message = `${state.activeFighter.name} 行动。`;
        syncBattleUi();

        if (state.activeFighter.type === "ai") {
            setTimeout(aiFire, 650);
        }
    }

    function randomizeWind() {
        world.wind = Math.round((Math.random() * 2 - 1) * 36);
        windText.textContent = `风向 ${world.wind > 0 ? "→" : world.wind < 0 ? "←" : ""} ${Math.abs(world.wind)}`;
    }

    function syncBattleUi() {
        angleValue.textContent = `${angleInput.value}°`;
        powerValue.textContent = powerInput.value;
        const blueHp = aliveTeam("blue").reduce((sum, fighter) => sum + fighter.hp, 0);
        const redHp = aliveTeam("red").reduce((sum, fighter) => sum + fighter.hp, 0);
        $("blueTeamHpText").textContent = `${blueHp} HP`;
        $("redTeamHpText").textContent = `${redHp} HP`;
        turnText.textContent = state.projectile ? "炮弹飞行中" : `${state.activeFighter?.name ?? "-"} 回合`;
        fireButton.disabled = !state.activeFighter || state.activeFighter.type !== "player" || !!state.projectile || state.gameOver;
    }

    function fireShot(shooter, angleDegrees, power) {
        const radians = angleDegrees * Math.PI / 180;
        const speed = power * 4.6;
        state.projectile = {
            x: shooter.x + shooter.facing * 30,
            y: shooter.y - 22,
            vx: Math.cos(radians) * speed * shooter.facing,
            vy: -Math.sin(radians) * speed,
            flightTime: 0,
            shooter,
            radius: 6
        };
        state.trail = [];
        state.message = `${shooter.name} 发射！`;
        syncBattleUi();
    }

    function playerFire() {
        fireShot(state.activeFighter, Number(angleInput.value), Number(powerInput.value));
    }

    function aiFire() {
        if (state.gameOver || !state.activeFighter || state.activeFighter.type !== "ai" || state.projectile) return;
        const shooter = state.activeFighter;
        const targets = aliveTeam(shooter.team === "blue" ? "red" : "blue");
        const target = targets[Math.floor(Math.random() * targets.length)];
        const distance = Math.abs(target.x - shooter.x);
        const windCorrection = world.wind * 0.25 * shooter.facing;
        const heightCorrection = (shooter.y - target.y) * 0.04;
        const angle = 36 + Math.random() * 14;
        const power = Math.min(95, Math.max(42, distance / 12.2 + windCorrection + heightCorrection + (Math.random() * 12 - 6)));
        fireShot(shooter, angle, power);
    }

    function distanceToFighter(x, y, fighter) {
        return Math.hypot(fighter.x - x, fighter.y - 6 - y);
    }

    function projectileHitFighter(projectile) {
        return state.fighters.find(fighter => (
            fighter.hp > 0 &&
            fighter.id !== projectile.shooter.id &&
            distanceToFighter(projectile.x, projectile.y, fighter) <= fighter.bodyRadius + projectile.radius
        ));
    }

    function destroyTerrain(x, y, radius) {
        for (let tx = Math.max(0, Math.floor(x - radius)); tx <= Math.min(world.width, Math.ceil(x + radius)); tx += 1) {
            const dx = tx - x;
            const bottom = y + Math.sqrt(Math.max(0, radius * radius - dx * dx));
            if (bottom > terrainY(tx)) {
                world.terrain[tx] = Math.min(world.height, bottom);
            }
        }
    }

    function explodeAt(x, y, shooter) {
        const damaged = [];
        state.fighters.forEach(fighter => {
            if (fighter.hp <= 0) return;
            const distance = distanceToFighter(x, y, fighter);
            if (distance > explosion.radius) return;
            const oldHp = fighter.hp;
            const falloff = 1 - distance / explosion.radius;
            const damage = Math.max(explosion.minDamage, Math.round(explosion.maxDamage * falloff));
            fighter.hp = Math.max(0, fighter.hp - damage);
            shooter.totalDamage += oldHp - fighter.hp;
            if (shooter.type === "player") state.stats.playerDamage += oldHp - fighter.hp;
            if (oldHp > 0 && fighter.hp <= 0) {
                shooter.kills += 1;
                if (shooter.type === "player") state.stats.playerKills += 1;
            }
            damaged.push(`${fighter.name}-${oldHp - fighter.hp}`);
        });

        destroyTerrain(x, y, explosion.radius);
        state.blast = { x, y, radius: explosion.radius, ttl: 0.28 };
        state.message = damaged.length ? `爆炸伤害：${damaged.join("，")}` : "爆炸未命中单位。";
        endAction();
    }

    function endAction() {
        state.projectile = null;
        state.trail = [];
        randomizeWind();
        syncBattleUi();

        const winner = getWinner();
        if (winner) {
            finishBattle(winner);
            return;
        }

        setTimeout(() => nextTurn(state.currentTeam === "blue" ? "red" : "blue"), 600);
    }

    function updateProjectile(dt) {
        const projectile = state.projectile;
        if (!projectile) return;
        projectile.flightTime += dt;
        projectile.vx += world.wind * dt;
        projectile.vy += world.gravity * dt;
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        state.trail.push({ x: projectile.x, y: projectile.y });
        if (state.trail.length > 48) state.trail.shift();

        if (projectileHitFighter(projectile)) {
            explodeAt(projectile.x, projectile.y, projectile.shooter);
            return;
        }

        const inWorld = projectile.x >= 0 && projectile.x <= world.width;
        if (inWorld && projectile.y + projectile.radius >= terrainY(projectile.x)) {
            explodeAt(projectile.x, terrainY(projectile.x), projectile.shooter);
            return;
        }

        if (projectile.x < -60 || projectile.x > world.width + 60 || projectile.y > world.height + 80 || projectile.flightTime > 8) {
            state.message = "炮弹飞出战场。";
            endAction();
        }
    }

    function finishBattle(winner) {
        state.gameOver = true;
        state.projectile = null;
        const playerWon = winner === "blue";
        $("resultTitle").textContent = playerWon ? "胜利" : "失败";
        const remainingHp = aliveTeam(winner).reduce((sum, fighter) => sum + fighter.hp, 0);
        $("resultStats").innerHTML = `
            <div class="stat-card"><small>总伤害</small><strong>${state.stats.playerDamage}</strong></div>
            <div class="stat-card"><small>击杀数</small><strong>${state.stats.playerKills}</strong></div>
            <div class="stat-card"><small>胜方剩余HP</small><strong>${remainingHp}</strong></div>
        `;
        showScreen("result");
    }

    function replay() {
        state.slots.forEach(slot => {
            if (slot.type !== "empty") slot.ready = slot.type === "ai";
        });
        const playerSlot = state.slots.find(slot => slot.type === "player");
        if (playerSlot) playerSlot.ready = false;
        renderRoom();
        showScreen("room");
    }

    function drawSky() {
        const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
        gradient.addColorStop(0, "#081122");
        gradient.addColorStop(1, "#050914");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, world.width, world.height);
        ctx.strokeStyle = "rgba(56, 201, 255, 0.08)";
        for (let x = 0; x < world.width; x += 48) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, world.height);
            ctx.stroke();
        }
    }

    function drawTerrain() {
        ctx.beginPath();
        ctx.moveTo(0, world.height);
        for (let x = 0; x <= world.width; x += 2) ctx.lineTo(x, terrainY(x));
        ctx.lineTo(world.width, world.height);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 350, 0, world.height);
        gradient.addColorStop(0, "#164e63");
        gradient.addColorStop(1, "#0f172a");
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(114, 221, 255, 0.48)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawFighter(fighter) {
        if (fighter.hp <= 0) return;
        ctx.save();
        ctx.translate(fighter.x, fighter.y);
        ctx.fillStyle = fighter.color;
        ctx.beginPath();
        ctx.arc(0, 0, fighter.bodyRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-13, 12, 26, 18);
        ctx.strokeStyle = fighter.color;
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(10 * fighter.facing, -4);
        ctx.lineTo(34 * fighter.facing, -18);
        ctx.stroke();
        ctx.fillStyle = "#eaf2ff";
        ctx.font = "900 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${fighter.name} ${fighter.hp}`, 0, -32);
        if (fighter === state.activeFighter) {
            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 27, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawProjectile() {
        if (!state.projectile) return;
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
        ctx.arc(state.projectile.x, state.projectile.y, state.projectile.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBlast(dt) {
        if (!state.blast) return;
        state.blast.ttl -= dt;
        if (state.blast.ttl <= 0) {
            state.blast = null;
            return;
        }
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(state.blast.x, state.blast.y, state.blast.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawAim() {
        if (!state.activeFighter || state.activeFighter.type !== "player" || state.projectile || state.gameOver) return;
        const angle = Number(angleInput.value) * Math.PI / 180;
        const length = 34 + Number(powerInput.value) * 0.55;
        ctx.strokeStyle = "rgba(114, 221, 255, 0.72)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(state.activeFighter.x, state.activeFighter.y - 22);
        ctx.lineTo(
            state.activeFighter.x + Math.cos(angle) * length * state.activeFighter.facing,
            state.activeFighter.y - 22 - Math.sin(angle) * length
        );
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawMessage() {
        ctx.fillStyle = "rgba(3, 7, 18, 0.72)";
        ctx.fillRect(24, 22, 560, 42);
        ctx.strokeStyle = "rgba(56, 201, 255, 0.32)";
        ctx.strokeRect(24, 22, 560, 42);
        ctx.fillStyle = "#dbeafe";
        ctx.font = "900 16px Arial";
        ctx.fillText(state.message, 42, 49);
    }

    function frame(time) {
        const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
        state.lastTime = time;
        if (!screens.battle.classList.contains("hidden")) {
            state.fighters.forEach(fighter => updateFighterPhysics(fighter, dt));
            updateProjectile(dt);
            syncBattleUi();
            drawSky();
            drawTerrain();
            drawAim();
            state.fighters.forEach(drawFighter);
            drawProjectile();
            drawBlast(dt);
            drawMessage();
        }
        requestAnimationFrame(frame);
    }

    $("createRoomButton").addEventListener("click", () => {
        renderMaps();
        showScreen("map");
    });
    $("autoFillButton").addEventListener("click", autoFillAi);
    $("readyButton").addEventListener("click", setPlayerReady);
    $("startGameButton").addEventListener("click", startBattle);
    $("backToRoomButton").addEventListener("click", () => {
        renderRoom();
        showScreen("room");
    });
    $("playAgainButton").addEventListener("click", replay);
    $("returnRoomButton").addEventListener("click", replay);
    angleInput.addEventListener("input", syncBattleUi);
    powerInput.addEventListener("input", syncBattleUi);
    fireButton.addEventListener("click", playerFire);

    createDefaultSlots();
    renderMaps();
    renderRoom();
    showScreen("menu");
    requestAnimationFrame(frame);
})();
