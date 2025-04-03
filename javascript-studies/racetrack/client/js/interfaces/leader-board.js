// interfaces/leader-board.js
import { socket } from "../index.js";

const leaderBoardElements = {};
document.addEventListener("DOMContentLoaded", () => {
    leaderBoardElements.timerDisplay = document.getElementById("timerDisplay");
    leaderBoardElements.flagImg = document.getElementById("flag-img");

    socket.emit("initialize-ongoing-board"); // if race already exists, this will prepare interface
    socket.emit("initialize-ongoing-flag"); // if ongoing race exist, this will fetch flag

    socket.on("timer-update", (formattedTime) => updateTimerDisplay(formattedTime));

    socket.on("race-started", (raceSession) => renderLeaderBoard(raceSession));
    socket.on("setup-late-leaderboard", (raceSession) => renderLeaderBoard(raceSession));
    socket.on("update-race", (raceSession) => renderLeaderBoard(raceSession));
    socket.on("race-ended", () => updateTimerDisplay("Race Over!"));
    socket.on("clear-race-session", clearLeaderBoard);
});

export function getLeaderBoardDom() {
    return leaderBoardElements;
}

function updateTimerDisplay(formattedTime) {
    const timerDisplay = leaderBoardElements.timerDisplay;
    if (timerDisplay) timerDisplay.innerText = `${formattedTime}`;
}

function renderLeaderBoard(raceSession) {
    const leaderboard = document.getElementById("carList");
    if (!leaderboard) return;

    leaderboard.innerHTML = ""; // Clear existing leaderboard items

    const leaderboardData = Object.entries(raceSession.carAssignments || {}).map(([driverName, carId]) => {
        const lapTimes = raceSession.lapTimes[carId] || [];
        const currentLap = raceSession.currentLaps[carId] ?? 0; // Show Lap 0 explicitly

        // Filter valid lap times (Lap 1 onward)
        const validLapTimes = lapTimes.filter(lap => lap.lapNumber > 0);
        const fastestLap = validLapTimes.length > 0 ? getFastestLap(validLapTimes) : null;

        // Determine lap status message
        let fastestLapText;
        if (currentLap === 0) {
            fastestLapText = "Waiting for first lap...";
        } else if (fastestLap === null) {
            fastestLapText = "Waiting for lap time...";
        } else {
            fastestLapText = `Fastest Lap: ${formatTime(fastestLap)}`;
        }

        return { carId, driverName, fastestLap, currentLap, fastestLapText };
    });

    // Sort: Valid lap times first, then by fastest time
    leaderboardData.sort((a, b) => {
        if (a.fastestLap === null && b.fastestLap !== null) return 1; // Push "Waiting" messages lower
        if (a.fastestLap !== null && b.fastestLap === null) return -1;
        return a.fastestLap - b.fastestLap;
    });

    // Render leaderboard
    leaderboardData.forEach(({ carId, driverName, fastestLapText, currentLap }, rank) => {
        const li = document.createElement("li");
        li.classList.add("leaderboard-item");
        li.dataset.carId = carId;
        li.dataset.rank = rank + 1;

        li.innerHTML = `
            <span class="driver-info">#${carId}: ${driverName}</span>
            <span class="fastest-lap">${fastestLapText}</span>
            <span class="current-lap">Current Lap: ${currentLap}</span>
        `;
        leaderboard.appendChild(li);
    });
}

function clearLeaderBoard() {
    const leaderboard = document.getElementById("carList");
    if (leaderboard) leaderboard.innerHTML = "";
}

function getFastestLap(lapTimes) {
    if (!lapTimes || lapTimes.length === 0) return null; 
    return Math.min(...lapTimes.map(lap => lap.lapTime));
}

function formatTime(timeInSeconds) {
    if (!timeInSeconds || timeInSeconds <= 0 || timeInSeconds === Infinity) return "N/A";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}