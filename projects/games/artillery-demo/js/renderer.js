import { terrainY } from "../systems/terrain-system.js";

export function createRenderer(canvas, game) {
    const ctx = canvas.getContext("2d");

    function draw() {
        drawSky();
        drawTerrain();
        drawAim();
        game.state.fighters.forEach(drawFighter);
        drawProjectile();
        drawBlast();
        drawMessage();
    }

    function drawSky() {
        const { width, height } = game.world;
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#081122");
        gradient.addColorStop(1, "#050914");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(56, 201, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    function drawTerrain() {
        const { width, height, terrain } = game.world;
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 2) {
            ctx.lineTo(x, terrainY(terrain, width, x));
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 470, 0, height);
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
        ctx.fillRect(-14, 12, 28, 18);

        ctx.strokeStyle = fighter.color;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(10 * fighter.facing, -5);
        ctx.lineTo(38 * fighter.facing, -20);
        ctx.stroke();

        if (fighter.id === game.state.activeFighter?.id) {
            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = "#eaf2ff";
        ctx.font = "900 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${fighter.name} ${fighter.hp}`, 0, -34);
        ctx.restore();
    }

    function drawProjectile() {
        const projectile = game.state.projectile;
        if (!projectile) return;

        game.state.trail.forEach((point, index) => {
            ctx.globalAlpha = index / game.state.trail.length;
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

    function drawBlast() {
        const blast = game.state.blast;
        if (!blast) return;

        ctx.globalAlpha = 0.24;
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawAim() {
        const fighter = game.state.activeFighter;
        if (!fighter || fighter.type !== "player" || game.state.projectile || game.state.screen !== "BATTLE") return;

        const angle = game.controls.angle * Math.PI / 180;
        const length = 45 + game.controls.power * 0.7;
        ctx.strokeStyle = "rgba(114, 221, 255, 0.72)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(fighter.x, fighter.y - 26);
        ctx.lineTo(
            fighter.x + Math.cos(angle) * length * fighter.facing,
            fighter.y - 26 - Math.sin(angle) * length
        );
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawMessage() {
        ctx.fillStyle = "rgba(3, 7, 18, 0.72)";
        ctx.fillRect(24, 24, 640, 44);
        ctx.strokeStyle = "rgba(56, 201, 255, 0.32)";
        ctx.strokeRect(24, 24, 640, 44);
        ctx.fillStyle = "#dbeafe";
        ctx.font = "900 17px Arial";
        ctx.fillText(game.state.message, 44, 52);
    }

    return { draw };
}
