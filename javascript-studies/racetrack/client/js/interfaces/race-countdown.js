// interfaces/race-countdown.js
import { socket } from "../index.js";

document.addEventListener("DOMContentLoaded", () => {
    const countdownDisplay = document.getElementById("countdownDisplay");

    socket.emit("initialize-ongoing-countdown");
    socket.on("timer-update", (formattedTime) => updateCountdownDisplay(formattedTime, countdownDisplay));

    // Initially, make sure the countdown shows 00:00 when there's no race
    if (countdownDisplay) {
        countdownDisplay.innerText = "00:00";
    }
});

function updateCountdownDisplay(formattedTime, countdownDisplay) {
    if (!countdownDisplay) return;
    countdownDisplay.innerText = `${formattedTime}`;
}