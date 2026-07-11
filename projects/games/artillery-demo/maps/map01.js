export default {
    id: "map01",
    name: "碎石平原",
    preview: "plain",
    description: "平缓地形，双方无遮挡，用于基础炮击测试。",
    terrain: {
        type: "heightmap",
        base: 532,
        seed: 0.012,
        rolling: 24,
        ripple: 10,
        valley: 12,
        valleyWidth: 360,
        craters: [
            { x: 310, radius: 42, depth: 18 },
            { x: 930, radius: 48, depth: 16 }
        ]
    },
    spawnBlue: { x: 130, y: 300 },
    spawnRed: { x: 1150, y: 300 },
    wind: { value: 0, variance: 28 },
    features: ["open-field", "starter"]
};
