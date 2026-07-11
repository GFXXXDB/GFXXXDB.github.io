export function createTerrain(width, height, map) {
    const terrain = new Array(width + 1).fill(height);
    const config = map.terrain ?? {};

    if (config.type === "islands") {
        createIslandTerrain(terrain, width, height, config);
    } else {
        createHeightMapTerrain(terrain, width, height, config);
    }

    applyCraters(terrain, width, height, config.craters ?? []);
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

function createHeightMapTerrain(terrain, width, height, config) {
    const base = config.base ?? 520;
    const seed = config.seed ?? 0.012;
    const rollingPower = config.rolling ?? 24;
    const ripplePower = config.ripple ?? 10;
    const valleyPower = config.valley ?? 0;
    const valleyWidth = config.valleyWidth ?? 280;

    for (let x = 0; x <= width; x += 1) {
        const rolling = Math.sin(x * seed) * rollingPower + Math.sin(x * 0.027) * ripplePower;
        const valley = Math.exp(-Math.pow((x - width / 2) / valleyWidth, 2)) * valleyPower;
        const hillLift = getHillLift(config.hills ?? [], x);
        terrain[x] = clamp(base + rolling + valley - hillLift, 110, height);
    }
}

function createIslandTerrain(terrain, width, height, config) {
    terrain.fill(height);

    for (const island of config.islands ?? []) {
        const from = Math.max(0, Math.floor(island.from));
        const to = Math.min(width, Math.ceil(island.to));
        const center = (from + to) / 2;
        const half = Math.max(1, (to - from) / 2);

        for (let x = from; x <= to; x += 1) {
            const edgeDrop = Math.pow(Math.abs(x - center) / half, 2) * 36;
            const rolling = Math.sin(x * (island.seed ?? 0.02)) * (island.rolling ?? 12);
            terrain[x] = clamp((island.y ?? 500) + edgeDrop + rolling, 120, height);
        }
    }
}

function getHillLift(hills, x) {
    return hills.reduce((sum, hill) => {
        const halfWidth = Math.max(1, hill.width);
        const normalized = Math.abs(x - hill.x) / halfWidth;
        if (normalized >= 1) return sum;
        return sum + Math.cos(normalized * Math.PI / 2) * hill.height;
    }, 0);
}

function applyCraters(terrain, width, height, craters) {
    for (const crater of craters) {
        destroyTerrain(terrain, width, height, crater.x, terrainY(terrain, width, crater.x), crater.radius);
        if (crater.depth) {
            const start = Math.max(0, Math.floor(crater.x - crater.radius));
            const end = Math.min(width, Math.ceil(crater.x + crater.radius));
            for (let x = start; x <= end; x += 1) {
                const dx = Math.abs(x - crater.x) / crater.radius;
                terrain[x] = Math.min(height, terrain[x] + Math.max(0, 1 - dx) * crater.depth);
            }
        }
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
