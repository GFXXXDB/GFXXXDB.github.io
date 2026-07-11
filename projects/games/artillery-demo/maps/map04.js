export default {
    id: "map04",
    name: "峡谷",
    preview: "canyon",
    description: "双方出生点较高，中间深坑，用于测试掉落和跨越。",
    terrain: {
        type: "heightmap",
        base: 452,
        seed: 0.009,
        rolling: 16,
        ripple: 8,
        valley: 205,
        valleyWidth: 178,
        hills: [
            { x: 155, width: 120, height: 48 },
            { x: 1125, width: 120, height: 48 }
        ],
        craters: []
    },
    spawnBlue: { x: 145, y: 240 },
    spawnRed: { x: 1135, y: 240 },
    wind: { value: 12, variance: 38 },
    features: ["canyon", "fall-test"]
};
