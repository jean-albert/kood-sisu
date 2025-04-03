// server/func-race.js 
const { DEV_DURATION, RACE_DURATION } = require('../config');

let currentRace = null;
let currentFlag = null;
let raceTimer = null;

function updateRaceStatus(io, newStatus) {
    currentFlag = newStatus;
    if (newStatus === "finish") {
        stopTimer();
        io.emit("hide-race-buttons");
        io.emit("reveal-clear-button");
        endRace(io);
    }
    io.emit("race-status-changed", newStatus);
}

function startRace(io, currentSession) {
    currentRace = currentSession;
    currentRace.startTime = Date.now()
    Object.values(currentRace.carAssignments).forEach((carId) => {
        currentRace.lapStamps[carId] = currentRace.startTime; 
        currentRace.currentLaps[carId] = 0;
    });
    io.emit("race-status-changed", "safe");
    io.emit("reveal-race-buttons");
    io.emit("race-started", currentRace);
    setTimer(io);
}

function endRace(io) {
    io.emit("race-ended");
}

function clearRaceSession(io) {
    currentRace = null;
    raceTimer = null;
    io.emit("race-status-changed", "danger");
    io.emit("clear-race-session");
}

function recordLap(io, carId) {
    //This works by recording Date.now() of a completed lap and comparing it to previous
    //Date.now(). The initial value is the time of the race start (set in startRace). 
    //The difference between the two occasions of Date.now() is the lap time. 
    const currentTime = Date.now();

    if (!currentRace || !currentRace.lapStamps || !currentRace.lapStamps[carId]) {
        console.error("Error: Session or carId not valid.");
        return;
    }

    const lastLapTimestamp = currentRace.lapStamps[carId];
    const lapTime = (currentTime - lastLapTimestamp) / 1000; // Lap time in seconds

    //Creates a lap record with lap number and lap time
    const lapRecord = {
        lapNumber: currentRace.currentLaps[carId],
        lapTime: lapTime
    };

    // Store the lap record in the car's lapTimes array
    if (!currentRace.lapTimes[carId]) {
        currentRace.lapTimes[carId] = [];  // empty array if not already present
    }
    currentRace.lapTimes[carId].push(lapRecord);
    currentRace.lapStamps[carId] = currentTime;
    currentRace.currentLaps[carId]++;

    io.emit("update-race", currentRace);
}

function setTimer(io) {
    const raceDuration = process.env.NODE_ENV === "development" ? DEV_DURATION : RACE_DURATION;
    let remainingTime = raceDuration;

    raceTimer = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(raceTimer);
            updateRaceStatus(io, "finish")
            endRace(io) 
        } else {
            let minutes = Math.floor(remainingTime / 60);
            let seconds = remainingTime % 60;
            io.emit("timer-update", `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`); // Time minutes and seconds
            remainingTime--;
        }
    }, 1000);
}

function stopTimer() {
    if (raceTimer) {
        clearInterval(raceTimer);
        raceTimer = null;
    }
}

//Show status flag if race-flag is opened
function initializeRaceFlag(io) {
    if (currentFlag === null) {
        io.emit("race-status-changed", "default");
    } else {
        io.emit("race-status-changed", currentFlag);
    }
}

//Reveal buttons if race control is opened during ongoing race
function initializeRaceControl(io) {
    if (currentRace !== null && currentFlag !== "finish") {
        io.emit("reveal-race-buttons");
    } else if (currentRace !== null && currentFlag === "finish") {
        io.emit("hide-race-buttons");
        io.emit("reveal-clear-button");
    } else {
       return;
    }
}

//Send info to leader-board if opened during ongoing race
function initializeLapLineTracker(io) {
    if (currentRace !== null) {
        io.emit("setup-late-lapbuttons", currentRace);
        io.emit("race-status-changed", currentFlag);
    } else {
        return;
    }
}
//Send info to leader-board if opened during ongoing race
function initializeLeaderboard(io) {
    if (currentRace !== null) {
        io.emit("setup-late-leaderboard", currentRace);
    } else {
        return;
    }
}
//Send info to race-countdown if opened during ongoing race
// NOTE: CAN PROBABLY BE REMOVED.
function initializeRaceCountdown() {
    if (!raceTimer) {
        return;
    }
}

module.exports = { 
    updateRaceStatus,
    startRace,
    endRace,
    recordLap,
    clearRaceSession,
    initializeLeaderboard,
    initializeLapLineTracker,
    initializeRaceControl, 
    initializeRaceFlag,
    initializeRaceCountdown
};