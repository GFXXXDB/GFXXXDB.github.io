import { ArtilleryGame } from "./game.js";
import { createRenderer } from "./renderer.js";
import { createUI } from "./ui.js";

const canvas = document.getElementById("gameCanvas");
const game = new ArtilleryGame(null, null);
const ui = createUI(game);
const renderer = createRenderer(canvas, game);

game.ui = ui;
game.setRenderer(renderer);
game.boot();

let lastTime = 0;

function frame(time) {
    const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
    lastTime = time;
    game.update(dt);
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
