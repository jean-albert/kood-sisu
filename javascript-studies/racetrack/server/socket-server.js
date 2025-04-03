// server/socket-server.js
const { authenticateUser } = require('./func-interface.js');
const { 
    createRaceSession, 
    deleteRaceSession, 
    findRaceSession, 
    addRaceDriver,
    editRaceDriver, 
    removeRaceDriver, 
    updateRaceSessions,
    initiateRaceSession
} = require('./func-sessions.js');
const { 
    updateRaceStatus, 
    recordLap,
    initializeRaceFlag,
    initializeRaceControl,
    initializeLeaderboard,
    initializeLapLineTracker,
    initializeRaceCountdown,
    clearRaceSession
} = require('./func-race.js');

function setupSocketEvents(io) {
    io.on("connection", (socket) => {
        console.log("A user connected");

        socket.on("authenticate-user", (data) => authenticateUser(socket, data, io));

        socket.on("disconnect", () => {
            console.log("User disconnected");
        });

        socket.on("create-race-session", (sessionName) => createRaceSession(io, sessionName)); 
        socket.on("delete-race-session", (sessionId) => deleteRaceSession(io, sessionId));
        socket.on("request-session-details", (sessionId) => findRaceSession(io, sessionId));
        socket.on("add-race-driver", (sessionId, driverName) => addRaceDriver(io, sessionId, driverName));
        socket.on("edit-race-driver", (sessionId, driverId, driverName) => editRaceDriver(io, sessionId, driverId, driverName));
        socket.on("delete-race-driver", (sessionId, driverName) => removeRaceDriver(io, sessionId, driverName));
        socket.on("start-race-session", (sessionId) => initiateRaceSession(io, sessionId));
        socket.on("initialize-front-desk", () => updateRaceSessions(io));
        socket.on("initialize-ongoing-control", () => initializeRaceControl(io));
        socket.on("initialize-ongoing-board", () => initializeLeaderboard(io));
        socket.on("initialize-ongoing-tracker", () => initializeLapLineTracker(io));
        socket.on("initialize-ongoing-flag", () => initializeRaceFlag(io));
        socket.on("initialize-ongoing-countdown", () => initializeRaceCountdown());
        socket.on("get-next-race", () => updateRaceSessions(io));
        socket.on("change-race-status", (newStatus) => updateRaceStatus(io, newStatus));
        socket.on("record-completed-lap", (carId) => recordLap(io, carId));
        socket.on("clear-current-race", () => clearRaceSession(io));
    });
}

module.exports = { setupSocketEvents };
