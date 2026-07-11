export default {
    id: "map03",
    name: "掩体",
    preview: "cover",
    description: "中央地形抬升形成掩体，可阻挡炮弹并被爆炸破坏。",
    terrain: {
        type: "heightmap",
        base: 526,
        seed: 0.011,
        rolling: 18,
        ripple: 9,
        valley: 4,
        valleyWidth: 420,
        hills: [
            { x: 640, width: 82, height: 154 },
            { x: 510, width: 58, height: 58 },
            { x: 770, width: 58, height: 58 }
        ],
        craters: []
    },
    spawnBlue: { x: 140, y: 290 },
    spawnRed: { x: 1140, y: 290 },
    wind: { value: 5, variance: 30 },
    features: ["cover", "destructible"]
};
