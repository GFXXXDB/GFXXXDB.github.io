import map01 from "../maps/map01.js";
import map02 from "../maps/map02.js";
import map03 from "../maps/map03.js";
import map04 from "../maps/map04.js";
import map05 from "../maps/map05.js";

export const MAPS = [map01, map02, map03, map04, map05];

export function getAllMaps() {
    return MAPS;
}

export function getDefaultMap() {
    return MAPS[0];
}

export function getMapById(mapId) {
    return MAPS.find(map => map.id === mapId) ?? getDefaultMap();
}

export function getMapWind(map) {
    const wind = map.wind ?? { value: 0, variance: 30 };
    const variance = Number.isFinite(wind.variance) ? wind.variance : 30;
    const baseValue = Number.isFinite(wind.value) ? wind.value : 0;
    return Math.round(baseValue + (Math.random() * 2 - 1) * variance);
}

export function getSpawnPoint(map, team, index, worldWidth) {
    const isBlue = team === "blue";
    const origin = isBlue ? map.spawnBlue : map.spawnRed;
    const fallbackX = isBlue ? 120 : worldWidth - 120;
    const spacing = 68;
    return {
        x: (origin?.x ?? fallbackX) + (isBlue ? index * spacing : -index * spacing),
        y: origin?.y ?? 300
    };
}
