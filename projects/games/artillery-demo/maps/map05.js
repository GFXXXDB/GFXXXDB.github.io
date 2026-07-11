export default {
    id: "map05",
    name: "浮岛",
    preview: "islands",
    description: "多个分离地形区域，用于测试地形破坏和角色掉落。",
    terrain: {
        type: "islands",
        base: 720,
        islands: [
            { from: 60, to: 320, y: 472, seed: 0.022, rolling: 18 },
            { from: 430, to: 620, y: 520, seed: 0.031, rolling: 22 },
            { from: 700, to: 850, y: 500, seed: 0.027, rolling: 16 },
            { from: 960, to: 1220, y: 468, seed: 0.019, rolling: 18 }
        ],
        craters: [
            { x: 535, radius: 46, depth: 16 },
            { x: 775, radius: 40, depth: 14 }
        ]
    },
    spawnBlue: { x: 150, y: 250 },
    spawnRed: { x: 1130, y: 250 },
    wind: { value: -4, variance: 42 },
    features: ["separated-terrain", "fall-test"]
};
