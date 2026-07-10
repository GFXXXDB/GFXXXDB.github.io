export const MAPS = [
    { id: "plain", name: "地图1：碎石平原", preview: "", seed: 0.012, valley: 42, base: 532 },
    { id: "valley", name: "地图2：中央低谷", preview: "valley", seed: 0.016, valley: 82, base: 506 },
    { id: "ridge", name: "地图3：高地脊线", preview: "ridge", seed: 0.01, valley: 22, base: 490 }
];

export function createTerrain(width, height, map) {
    const terrain = [];

    for (let x = 0; x <= width; x += 1) {
        const rolling = Math.sin(x * map.seed) * 28 + Math.sin(x * 0.027) * 12;
        const valley = Math.exp(-Math.pow((x - width / 2) / 260, 2)) * map.valley;
        terrain[x] = Math.min(height - 34, map.base + rolling + valley);
    }

    return terrain;
}

export function terrainY(terrain, width, x) {
    const clampedX = Math.max(0, Math.min(width, Math.round(x)));
    return terrain[clampedX] ?? 720;
}

export function destroyTerrain(terrain, width, height, x, y, radius) {
    const start = Math.max(0, Math.floor(x - radius));
    const end = Math.min(width, Math.ceil(x + radius));

    for (let tx = start; tx <= end; tx += 1) {
        const dx = tx - x;
        const bottom = y + Math.sqrt(Math.max(0, radius * radius - dx * dx));
        if (bottom > terrainY(terrain, width, tx)) {
            terrain[tx] = Math.min(height, bottom);
        }
    }
}
