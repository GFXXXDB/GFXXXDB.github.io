const LEVEL_CONFIG = {
    easy: { angleNoise: 18, powerNoise: 22, powerBias: 0.92 },
    normal: { angleNoise: 10, powerNoise: 13, powerBias: 1 },
    hard: { angleNoise: 5, powerNoise: 7, powerBias: 1.05 }
};

export function chooseAiShot(shooter, targets, wind) {
    const target = targets[Math.floor(Math.random() * targets.length)];
    const config = LEVEL_CONFIG[shooter.aiLevel] ?? LEVEL_CONFIG.normal;
    const distance = Math.abs(target.x - shooter.x);
    const baseAngle = 40;
    const angle = clamp(baseAngle + randomRange(-config.angleNoise, config.angleNoise), 18, 76);
    const windCorrection = wind * 0.24 * shooter.facing;
    const heightCorrection = (shooter.y - target.y) * 0.045;
    const power = clamp(distance / 13 * config.powerBias + windCorrection + heightCorrection + randomRange(-config.powerNoise, config.powerNoise), 35, 100);

    return { angle, power };
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
