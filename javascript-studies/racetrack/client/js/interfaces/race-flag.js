// js/race-flag.js
import { socket } from "../index.js"; 
const raceFlagElements = {};

document.addEventListener("DOMContentLoaded", () => {
    raceFlagElements.flagImg = document.getElementById("flag-img")
    socket.emit("initialize-ongoing-flag"); // if ongoing race exist, this will fetch flag
});

export function getRaceFlagDom() {
    return raceFlagElements;
}