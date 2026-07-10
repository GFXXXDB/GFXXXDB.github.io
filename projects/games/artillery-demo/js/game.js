import { chooseAiShot } from "./ai.js";
import { createProjectile, distance, isProjectileOut, updateProjectile } from "./physics.js";
import { addAi, autoFillAi, canStartRoom, createInitialSlots, getFilledSlots, removeAi, resetReady, setAiLevel, TEAMS, toggleReady } from "./room.js";
import { createTerrain, destroyTerrain, MAPS, terrainY } from "./terrain.js";

export class ArtilleryGame {
    constructor(ui, renderer) {
        this.ui = ui;
        this.renderer = renderer;
        this.world = {
            width: 1280,
            height: 720,
            gravity: 260,
            wind: 0,
            terrain: []
        };
        this.controls = { angle: 45, power: 62 };
        this.state = {
            screen: "GAME_MENU",
            selectedMap: MAPS[0],
            slots: createInitialSlots(),
            aiSerial: 1,
            fighters: [],
            currentTeam: TEAMS.BLUE,
            teamCursor: { blue: -1, red: -1 },
            activeFighter: null,
            projectile: null,
            trail: [],
            blast: null,
            turnTime: 0,
            message: "GAME MENU",
            stats: {
                playerDamage: 0,
                playerKills: 0,
                playerShots: 0,
                playerHits: 0
            }
        };
    }

    boot() {
        this.ui.renderMaps();
        this.ui.renderRoom();
        this.setScreen("GAME_MENU");
    }

    setRenderer(renderer) {
        this.renderer = renderer;
    }

    setScreen(screen) {
        this.state.screen = screen;
        this.ui.setScreen(screen);
        this.ui.renderHud();
        this.ui.renderControls();
    }

    goBack() {
        if (this.state.screen === "GAME_MENU") {
            window.location.href = "../../../index.html";
            return;
        }
        if (this.state.screen === "BATTLE" || this.state.screen === "RESULT") {
            this.returnRoom();
            return;
        }
        this.setScreen("GAME_MENU");
    }

    createRoom() {
        this.state.slots = createInitialSlots();
        this.state.aiSerial = 1;
        this.ui.renderRoom();
        this.setScreen("ROOM");
    }

    quickStart() {
        this.createRoom();
        this.state.aiSerial = autoFillAi(this.state.slots, this.state.aiSerial);
        this.state.slots.forEach(slot => {
            if (slot.type !== "empty") slot.ready = true;
        });
        this.ui.renderRoom();
        this.startBattle();
    }

    selectMap(mapId) {
        this.state.selectedMap = MAPS.find(map => map.id === mapId) ?? MAPS[0];
        this.ui.renderMaps();
        this.ui.renderRoom();
        this.setScreen("ROOM");
    }

    addAi(slotId) {
        this.state.aiSerial = addAi(this.state.slots, slotId, this.state.aiSerial);
        this.ui.renderRoom();
    }

    removeAi(slotId) {
        removeAi(this.state.slots, slotId);
        this.ui.renderRoom();
    }

    toggleReady(slotId) {
        toggleReady(this.state.slots, slotId);
        this.ui.renderRoom();
        this.setScreen("READY");
    }

    setAiLevel(slotId, level) {
        setAiLevel(this.state.slots, slotId, level);
        this.ui.renderRoom();
    }

    autoFillAi() {
        this.state.aiSerial = autoFillAi(this.state.slots, this.state.aiSerial);
        this.ui.renderRoom();
    }

    canStart() {
        return canStartRoom(this.state.slots);
    }

    startBattle() {
        if (!this.canStart()) return;
        this.world.terrain = createTerrain(this.world.width, this.world.height, this.state.selectedMap);
        this.state.fighters = this.createFighters();
        this.state.fighters.forEach(fighter => this.placeOnGround(fighter));
        this.state.currentTeam = TEAMS.BLUE;
        this.state.teamCursor = { blue: -1, red: -1 };
        this.state.projectile = null;
        this.state.trail = [];
        this.state.blast = null;
        this.state.stats = { playerDamage: 0, playerKills: 0, playerShots: 0, playerHits: 0 };
        this.randomizeWind();
        this.setScreen("BATTLE");
        this.nextTurn(TEAMS.BLUE);
    }

    createFighters() {
        const teamCounts = { [TEAMS.BLUE]: 0, [TEAMS.RED]: 0 };
        return getFilledSlots(this.state.slots).map((slot, index) => {
            const isBlue = slot.team === TEAMS.BLUE;
            const teamIndex = teamCounts[slot.team]++;
            return {
                id: slot.id,
                name: slot.name,
                type: slot.type,
                aiLevel: slot.aiLevel,
                team: slot.team,
                x: isBlue ? 120 + teamIndex * 68 : this.world.width - 120 - teamIndex * 68,
                y: 0,
                vy: 0,
                hp: 100,
                maxHp: 100,
                color: isBlue ? "#72ddff" : "#f87171",
                facing: isBlue ? 1 : -1,
                bodyRadius: 22,
                groundOffset: 26,
                totalDamage: 0,
                kills: 0,
                index
            };
        });
    }

    placeOnGround(fighter) {
        fighter.y = terrainY(this.world.terrain, this.world.width, fighter.x) - fighter.groundOffset;
        fighter.vy = 0;
    }

    update(dt) {
        if (this.state.screen !== "BATTLE") return;
        this.state.fighters.forEach(fighter => this.updateFighter(fighter, dt));
        this.updateTurnTimer(dt);
        this.updateProjectile(dt);
        this.updateBlast(dt);
        this.ui.renderHud();
        this.ui.renderControls();
        this.renderer.draw();
    }

    updateFighter(fighter, dt) {
        if (fighter.hp <= 0) return;
        const groundY = terrainY(this.world.terrain, this.world.width, fighter.x) - fighter.groundOffset;
        if (fighter.y < groundY) {
            fighter.vy += this.world.gravity * dt;
            fighter.y = Math.min(groundY, fighter.y + fighter.vy * dt);
        } else {
            fighter.y = groundY;
            fighter.vy = 0;
        }
    }

    updateTurnTimer(dt) {
        if (!this.state.activeFighter || this.state.projectile) return;
        this.state.turnTime = Math.max(0, this.state.turnTime - dt);
        if (this.state.turnTime <= 0) {
            this.state.message = `${this.state.activeFighter.name} 超时。`;
            this.endAction();
        }
    }

    nextTurn(team) {
        const winner = this.getWinner();
        if (winner) {
            this.finishBattle(winner);
            return;
        }
        const alive = this.aliveTeam(team);
        this.state.currentTeam = team;
        this.state.teamCursor[team] = (this.state.teamCursor[team] + 1) % alive.length;
        this.state.activeFighter = alive[this.state.teamCursor[team]];
        this.state.turnTime = 20;
        this.state.message = `${this.state.activeFighter.name} 行动。`;
        if (this.state.activeFighter.type === "ai") {
            setTimeout(() => this.aiFire(), 550);
        }
    }

    aliveTeam(team) {
        return this.state.fighters.filter(fighter => fighter.team === team && fighter.hp > 0);
    }

    getWinner() {
        const blueAlive = this.aliveTeam(TEAMS.BLUE).length > 0;
        const redAlive = this.aliveTeam(TEAMS.RED).length > 0;
        if (blueAlive && redAlive) return null;
        return blueAlive ? TEAMS.BLUE : TEAMS.RED;
    }

    randomizeWind() {
        this.world.wind = Math.round((Math.random() * 2 - 1) * 40);
    }

    getTurnText() {
        if (this.state.screen !== "BATTLE") return this.state.screen;
        if (this.state.projectile) return "炮弹飞行中";
        const name = this.state.activeFighter?.name ?? "-";
        return `${name} / ${Math.ceil(this.state.turnTime)}s / 风 ${this.world.wind}`;
    }

    canPlayerFire() {
        return this.state.screen === "BATTLE" &&
            this.state.activeFighter?.type === "player" &&
            !this.state.projectile &&
            this.state.turnTime > 0;
    }

    playerFire() {
        if (!this.canPlayerFire()) return;
        this.state.stats.playerShots += 1;
        this.fire(this.state.activeFighter, this.controls.angle, this.controls.power);
    }

    aiFire() {
        const shooter = this.state.activeFighter;
        if (!shooter || shooter.type !== "ai" || this.state.projectile || this.state.screen !== "BATTLE") return;
        const targets = this.aliveTeam(shooter.team === TEAMS.BLUE ? TEAMS.RED : TEAMS.BLUE);
        const shot = chooseAiShot(shooter, targets, this.world.wind);
        this.fire(shooter, shot.angle, shot.power);
    }

    fire(shooter, angle, power) {
        this.state.projectile = createProjectile(shooter, angle, power);
        this.state.trail = [];
        this.state.message = `${shooter.name} 发射！`;
    }

    updateProjectile(dt) {
        const projectile = this.state.projectile;
        if (!projectile) return;
        updateProjectile(projectile, dt, this.world);
        this.state.trail.push({ x: projectile.x, y: projectile.y });
        if (this.state.trail.length > 54) this.state.trail.shift();
        const hit = this.findProjectileHit(projectile);
        if (hit) {
            this.explode(projectile.x, projectile.y, projectile.shooterId);
            return;
        }
        const inWorld = projectile.x >= 0 && projectile.x <= this.world.width;
        if (inWorld && projectile.y + projectile.radius >= terrainY(this.world.terrain, this.world.width, projectile.x)) {
            this.explode(projectile.x, terrainY(this.world.terrain, this.world.width, projectile.x), projectile.shooterId);
            return;
        }
        if (isProjectileOut(projectile, this.world)) {
            this.state.message = "炮弹飞出战场。";
            this.endAction();
        }
    }

    findProjectileHit(projectile) {
        return this.state.fighters.find(fighter => (
            fighter.hp > 0 &&
            fighter.id !== projectile.shooterId &&
            distance(projectile.x, projectile.y, fighter.x, fighter.y - 6) <= fighter.bodyRadius + projectile.radius
        ));
    }

    explode(x, y, shooterId) {
        const shooter = this.state.fighters.find(fighter => fighter.id === shooterId);
        let didHit = false;
        this.state.fighters.forEach(fighter => {
            if (fighter.hp <= 0) return;
            const d = distance(x, y, fighter.x, fighter.y - 6);
            if (d > 76) return;
            const oldHp = fighter.hp;
            const damage = Math.max(8, Math.round(48 * (1 - d / 76)));
            fighter.hp = Math.max(0, fighter.hp - damage);
            const actual = oldHp - fighter.hp;
            shooter.totalDamage += actual;
            if (shooter.type === "player" && fighter.team !== shooter.team) {
                this.state.stats.playerDamage += actual;
                didHit = true;
            }
            if (oldHp > 0 && fighter.hp <= 0) {
                shooter.kills += 1;
                if (shooter.type === "player" && fighter.team !== shooter.team) this.state.stats.playerKills += 1;
            }
        });
        if (didHit) this.state.stats.playerHits += 1;
        destroyTerrain(this.world.terrain, this.world.width, this.world.height, x, y, 76);
        this.state.blast = { x, y, radius: 76, ttl: 0.28 };
        this.state.message = didHit ? "命中目标。" : "爆炸未命中敌方。";
        this.endAction();
    }

    endAction() {
        this.state.projectile = null;
        this.state.trail = [];
        this.randomizeWind();
        const winner = this.getWinner();
        if (winner) {
            this.finishBattle(winner);
            return;
        }
        setTimeout(() => this.nextTurn(this.state.currentTeam === TEAMS.BLUE ? TEAMS.RED : TEAMS.BLUE), 500);
    }

    updateBlast(dt) {
        if (!this.state.blast) return;
        this.state.blast.ttl -= dt;
        if (this.state.blast.ttl <= 0) this.state.blast = null;
    }

    finishBattle(winner) {
        this.state.projectile = null;
        this.state.screen = "RESULT";
        this.ui.renderResult(winner);
        this.setScreen("RESULT");
    }

    rematch() {
        resetReady(this.state.slots);
        this.ui.renderRoom();
        this.setScreen("READY");
    }

    returnRoom() {
        this.state.projectile = null;
        this.ui.renderRoom();
        this.setScreen("ROOM");
    }
}
