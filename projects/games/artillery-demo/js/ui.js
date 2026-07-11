import { AI_LEVELS, TEAMS } from "./room.js";
import { MAPS } from "./terrain.js";

export function createUI(game) {
    const $ = id => document.getElementById(id);
    const dom = {
        screens: {
            GAME_MENU: $("menuScreen"),
            MAP_SELECT: $("mapScreen"),
            ROOM: $("roomScreen"),
            READY: $("roomScreen"),
            BATTLE: null,
            RESULT: $("resultScreen"),
            SETTINGS: $("settingsScreen")
        },
        canvas: $("gameCanvas"),
        blueHud: $("blueHud"),
        redHud: $("redHud"),
        blueRoster: $("blueRoster"),
        redRoster: $("redRoster"),
        turnHud: $("turnHud"),
        footerHint: $("footerHint"),
        battleControls: $("battleControls"),
        angleInput: $("angleInput"),
        powerInput: $("powerInput"),
        angleValue: $("angleValue"),
        powerValue: $("powerValue"),
        fireButton: $("fireButton"),
        mapList: $("mapList"),
        selectedMapText: $("selectedMapText"),
        roomHint: $("roomHint"),
        blueSlots: $("blueSlots"),
        redSlots: $("redSlots"),
        resultTitle: $("resultTitle"),
        resultStats: $("resultStats"),
        systemMenuPanel: $("systemMenuPanel")
    };

    function bind() {
        $("quickStartButton").addEventListener("click", () => game.createRoom());
        $("createRoomButton").addEventListener("click", () => game.createRoom());
        $("settingsButton").addEventListener("click", () => game.setScreen("SETTINGS"));
        $("settingsBackButton").addEventListener("click", () => game.setScreen("GAME_MENU"));
        $("menuToggleButton").addEventListener("click", () => toggleSystemMenu());
        $("menuSettingsButton").addEventListener("click", () => {
            closeSystemMenu();
            game.setScreen("SETTINGS");
        });
        $("menuRestartButton").addEventListener("click", () => {
            closeSystemMenu();
            game.restartBattle();
        });
        $("menuReturnRoomButton").addEventListener("click", () => {
            closeSystemMenu();
            game.returnRoom();
        });
        $("menuExitButton").addEventListener("click", () => {
            closeSystemMenu();
            window.location.href = "../../../index.html";
        });
        $("changeMapButton").addEventListener("click", () => game.setScreen("MAP_SELECT"));
        $("autoFillButton").addEventListener("click", () => game.autoFillAi());
        $("startBattleButton").addEventListener("click", () => game.startBattle());
        $("fireButton").addEventListener("click", () => game.playerFire());
        $("rematchButton").addEventListener("click", () => game.rematch());
        $("returnRoomButton").addEventListener("click", () => game.returnRoom());

        dom.angleInput.addEventListener("input", () => {
            game.controls.angle = Number(dom.angleInput.value);
            renderControls();
        });
        dom.powerInput.addEventListener("input", () => {
            game.controls.power = Number(dom.powerInput.value);
            renderControls();
        });
    }

    function toggleSystemMenu() {
        dom.systemMenuPanel.classList.toggle("hidden");
    }

    function closeSystemMenu() {
        dom.systemMenuPanel.classList.add("hidden");
    }

    function setScreen(screen) {
        closeSystemMenu();
        Object.values(dom.screens).filter(Boolean).forEach(element => element.classList.add("hidden"));
        if (screen === "BATTLE") {
            Object.values(dom.screens).filter(Boolean).forEach(element => element.classList.add("hidden"));
        } else {
            dom.screens[screen].classList.remove("hidden");
        }

        dom.battleControls.classList.toggle("hidden", screen !== "BATTLE");
        dom.footerHint.classList.toggle("hidden", screen === "BATTLE");
        dom.footerHint.textContent = screen;
        dom.blueRoster.classList.toggle("hidden", screen !== "BATTLE");
        dom.redRoster.classList.toggle("hidden", screen !== "BATTLE");
    }

    function renderMaps() {
        dom.mapList.innerHTML = MAPS.map(map => `
            <button class="map-card ${map.id === game.state.selectedMap.id ? "selected" : ""}" data-map="${map.id}" type="button">
                <div class="map-preview"><div class="preview-ground ${map.preview}"></div></div>
                <h3>${map.name}</h3>
                <p>固定逻辑地图，支持地形破坏和碰撞。</p>
            </button>
        `).join("");

        dom.mapList.querySelectorAll("[data-map]").forEach(button => {
            button.addEventListener("click", () => game.selectMap(button.dataset.map));
        });
    }

    function renderRoom() {
        dom.selectedMapText.textContent = `地图：${game.state.selectedMap.name}`;
        renderSlots(TEAMS.BLUE, dom.blueSlots);
        renderSlots(TEAMS.RED, dom.redSlots);
        dom.roomHint.textContent = game.canStart()
            ? "所有角色已准备，可以开始战斗。"
            : "至少蓝红双方各一名角色，所有角色准备后才能开始。";
        document.getElementById("startBattleButton").disabled = !game.canStart();
    }

    function renderSlots(team, container) {
        const teamSlots = game.state.slots.filter(slot => slot.team === team);
        const filledSlots = teamSlots.filter(slot => slot.type !== "empty");
        const canAddAi = filledSlots.length < 5;

        const slotMarkup = filledSlots
            .map(slot => {
                const levelSelect = slot.type === "ai"
                    ? `<select data-ai-level="${slot.id}">${AI_LEVELS.map(level => `<option value="${level.id}" ${level.id === slot.aiLevel ? "selected" : ""}>${level.name}</option>`).join("")}</select>`
                    : "";
                const removeButton = slot.type === "ai" ? `<button class="ghost" type="button" data-remove-ai="${slot.id}">删除</button>` : "";

                return `
                    <div class="slot-card">
                        <div><strong>${slot.label} ${slot.name}</strong><small>${slot.type === "player" ? "玩家" : "AI"} / ${slot.ready ? "已准备" : "未准备"}</small></div>
                        ${levelSelect}
                        <button type="button" data-ready="${slot.id}">${slot.ready ? "取消准备" : "准备"}</button>
                        ${removeButton}
                    </div>
                `;
            }).join("");

        const addMarkup = canAddAi
            ? `<div class="slot-card add-card"><button type="button" data-add-team="${team}">+ 添加AI</button></div>`
            : "";

        container.innerHTML = slotMarkup + addMarkup;

        container.querySelectorAll("[data-add-team]").forEach(button => button.addEventListener("click", () => game.addAiToTeam(button.dataset.addTeam)));
        container.querySelectorAll("[data-remove-ai]").forEach(button => button.addEventListener("click", () => game.removeAi(button.dataset.removeAi)));
        container.querySelectorAll("[data-ready]").forEach(button => button.addEventListener("click", () => game.toggleReady(button.dataset.ready)));
        container.querySelectorAll("[data-ai-level]").forEach(select => select.addEventListener("change", () => game.setAiLevel(select.dataset.aiLevel, select.value)));
    }

    function renderHud() {
        dom.blueHud.innerHTML = renderHudTeam(TEAMS.BLUE);
        dom.redHud.innerHTML = renderHudTeam(TEAMS.RED);
        dom.blueRoster.innerHTML = renderRoster(TEAMS.BLUE);
        dom.redRoster.innerHTML = renderRoster(TEAMS.RED);
        const info = game.getBattleInfo();
        dom.turnHud.innerHTML = `
            <strong>${info.title}</strong>
            <span>${info.subtitle}</span>
            <small>${info.meta}</small>
        `;
    }

    function renderHudTeam(team) {
        if (game.state.screen !== "BATTLE" && game.state.screen !== "RESULT") return "";
        return game.state.fighters
            .filter(fighter => fighter.team === team)
            .map(fighter => renderUnitCard(fighter, "hud-unit"))
            .join("");
    }

    function renderRoster(team) {
        if (game.state.screen !== "BATTLE") return "";
        const fighters = game.state.fighters.filter(fighter => fighter.team === team);
        if (fighters.length === 0) return "";

        return `
            <div class="roster-title">${team === TEAMS.BLUE ? "蓝队" : "红队"}</div>
            ${fighters.map(fighter => renderUnitCard(fighter, "roster-card")).join("")}
        `;
    }

    function renderUnitCard(fighter, className) {
        const hpRate = Math.max(0, Math.round(fighter.hp / fighter.maxHp * 100));
        const active = game.state.activeFighter?.id === fighter.id ? " active" : "";
        const dead = fighter.hp <= 0 ? " dead" : "";
        const status = fighter.hp <= 0 ? "已阵亡" : (active ? "行动中" : "待命");
        return `
            <div class="${className}${active}${dead}">
                <strong>${fighter.name}</strong>
                <span>HP ${fighter.hp}/${fighter.maxHp}</span>
                <small>${status}</small>
                <div class="hp-bar"><i style="width:${hpRate}%"></i></div>
            </div>
        `;
    }

    function renderControls() {
        dom.angleValue.textContent = `${game.controls.angle}°`;
        dom.powerValue.textContent = game.controls.power;
        dom.fireButton.disabled = !game.canPlayerFire();
    }

    function renderResult(winner) {
        dom.resultTitle.textContent = winner === TEAMS.BLUE ? "胜利" : "失败";
        const shots = Math.max(1, game.state.stats.playerShots);
        const hitRate = Math.round(game.state.stats.playerHits / shots * 100);
        const remainingHp = game.aliveTeam(winner).reduce((sum, fighter) => sum + fighter.hp, 0);
        dom.resultStats.innerHTML = `
            <div class="stat-card"><small>伤害</small><strong>${game.state.stats.playerDamage}</strong></div>
            <div class="stat-card"><small>击杀</small><strong>${game.state.stats.playerKills}</strong></div>
            <div class="stat-card"><small>命中率</small><strong>${hitRate}%</strong></div>
            <div class="stat-card"><small>胜方剩余HP</small><strong>${remainingHp}</strong></div>
        `;
    }

    bind();
    return { setScreen, renderMaps, renderRoom, renderHud, renderControls, renderResult };
}
