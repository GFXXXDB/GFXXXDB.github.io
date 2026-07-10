export const TEAMS = {
    BLUE: "blue",
    RED: "red"
};

export const AI_LEVELS = [
    { id: "easy", name: "简单" },
    { id: "normal", name: "普通" },
    { id: "hard", name: "困难" }
];

export function createInitialSlots() {
    const blue = Array.from({ length: 5 }, (_, index) => ({
        id: `blue-${index + 1}`,
        label: `B${index + 1}`,
        team: TEAMS.BLUE,
        type: index === 0 ? "player" : "empty",
        name: index === 0 ? "Player" : "",
        ready: false,
        aiLevel: "normal"
    }));

    const red = Array.from({ length: 5 }, (_, index) => ({
        id: `red-${index + 1}`,
        label: `R${index + 1}`,
        team: TEAMS.RED,
        type: "empty",
        name: "",
        ready: false,
        aiLevel: "normal"
    }));

    return [...blue, ...red];
}

export function addAi(slots, slotId, aiSerial, level = "normal") {
    const slot = slots.find(item => item.id === slotId);
    if (!slot || slot.type !== "empty") return aiSerial;

    slot.type = "ai";
    slot.name = `AI-${String(aiSerial).padStart(2, "0")}`;
    slot.ready = false;
    slot.aiLevel = level;
    return aiSerial + 1;
}

export function removeAi(slots, slotId) {
    const slot = slots.find(item => item.id === slotId);
    if (!slot || slot.type !== "ai") return;

    slot.type = "empty";
    slot.name = "";
    slot.ready = false;
    slot.aiLevel = "normal";
}

export function toggleReady(slots, slotId) {
    const slot = slots.find(item => item.id === slotId);
    if (!slot || slot.type === "empty") return;
    slot.ready = !slot.ready;
}

export function setAiLevel(slots, slotId, level) {
    const slot = slots.find(item => item.id === slotId);
    if (!slot || slot.type !== "ai") return;
    slot.aiLevel = level;
}

export function autoFillAi(slots, aiSerial) {
    let nextSerial = aiSerial;

    slots.forEach(slot => {
        if (slot.type === "empty") {
            nextSerial = addAi(slots, slot.id, nextSerial);
        }
    });

    return nextSerial;
}

export function getFilledSlots(slots) {
    return slots.filter(slot => slot.type !== "empty");
}

export function canStartRoom(slots) {
    const filled = getFilledSlots(slots);
    const hasBlue = filled.some(slot => slot.team === TEAMS.BLUE);
    const hasRed = filled.some(slot => slot.team === TEAMS.RED);
    return filled.length >= 2 && hasBlue && hasRed && filled.every(slot => slot.ready);
}

export function resetReady(slots) {
    slots.forEach(slot => {
        if (slot.type !== "empty") {
            slot.ready = false;
        }
    });
}
