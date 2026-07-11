export default {
    id: "map02",
    name: "山谷",
    preview: "valley",
    description: "中间低洼，增加高度差，适合测试抛射曲线。",
    terrain: {
        type: "heightmap",
        base: 492,
        seed: 0.015,
        rolling: 28,
        ripple: 12,
        valley: 112,
        valleyWidth: 245,
        craters: [
            { x: 640, radius: 96, depth: 30 }
        ]
    },
    spawnBlue: { x: 150, y: 260 },
    spawnRed: { x: 1130, y: 260 },
    wind: { value: -8, variance: 34 },
    features: ["valley", "height-difference"]
};
