// server/func-sessions.js
const { MAX_DRIVERS } = require('../config');
let raceSessions = [];
let nextRaceServer = null; // "Server" is just here to distinguish them from client-side versions
const { 
    startRace, 
} = require('./func-race.js');

function createRaceSession(io, sessionName) {
    const sessionId = Date.now().toString();
    const newSession = {
        id: sessionId,
        name: sessionName,
        startTime: null,
        drivers: [],
        cars: Array.from({ length: MAX_DRIVERS }, (_, i) => i + 1),
        carAssignments: {},
        lapStamps: {}, //stores the "lap mark", i.e., when a lap is completed, or by default race start
        lapTimes: {}, //times for completed laps
        currentLaps: {}
    };

    // Simply push the new session to the array
    raceSessions.push(newSession);
    io.emit("new-session-added", newSession);
    // updateRaceSessions(io);
}

function deleteRaceSession(io, sessionId) {
    const sessionIndex = raceSessions.findIndex(session => session.id === sessionId);

    if (sessionIndex === -1) {
        console.warn(`Session ${sessionId} not found.`);
        return;
    }
    raceSessions.splice(sessionIndex, 1); 

    io.emit("session-deleted", sessionId);

    updateRaceSessions(io);
}

function findRaceSession(io, sessionId) {
    const session = raceSessions.find(session => session.id === sessionId);
    if (session) {
        io.emit("session-details", session); 
    } else {
        console.warn(`Session ${session} not found.`);
    }
}

function addRaceDriver(io, sessionId, driverName) {
    const session = raceSessions.find(session => session.id === sessionId);
    let serverMessage = null

    if (!session) {
        console.log(`Session with ID ${sessionId} not found.`);
        return;
    }

    if (session.drivers.includes(driverName)) {
        serverMessage = `Driver ${driverName} is already in the list.`;
        io.emit("server-message", serverMessage);
    }

    let assignedCars = new Set(Object.values(session.carAssignments));

    // Find the first available car number
    let nextCarNumber = 1;
    while (assignedCars.has(nextCarNumber)) {
        nextCarNumber++;
    }

    if (nextCarNumber > MAX_DRIVERS) {
        serverMessage = `Cannot add more than ${MAX_DRIVERS} drivers.`;
        io.emit("server-message", serverMessage);
    }

    // Assign driver and car number
    session.drivers.push(driverName);
    session.carAssignments[driverName] = nextCarNumber;

    io.emit("session-details", session);
    updateRaceSessions(io);
}

function addRaceDriver(io, sessionId, driverName) {
    const session = raceSessions.find(session => session.id === sessionId);
    let serverMessage = null;

    if (!session) {
        console.log(`Session ${sessionId} not found.`);
        return;
    }

    if (!session.drivers.includes(driverName)) {
        // Get a list of assigned car numbers
        const assignedCars = new Set(Object.values(session.carAssignments));

        // Find the first available car number starting from 1
        let carNumber = 1;
        while (assignedCars.has(carNumber)) {
            carNumber++;
        }

        if (carNumber > MAX_DRIVERS) {
            serverMessage = `Cannot add more than ${MAX_DRIVERS} drivers.`;
            io.emit("server-message", serverMessage);
            return;
        }

        // Assign the driver to the first available car
        session.drivers.push(driverName);
        session.carAssignments[driverName] = carNumber;

        io.emit("session-details", session);
        updateRaceSessions(io, sessionId);
    } else {
        serverMessage = `Driver ${driverName} is already in the list.`;
        io.emit("server-message", serverMessage);
    }
}

// Function to edit a driver's name
function editRaceDriver(io, sessionId, driverId, newDriverName) {
    const session = raceSessions.find(session => session.id === sessionId);
    let serverMessage = null;

    if (!session) {
        console.log(`Session ${sessionId} not found.`);
        return;
    }

    if (!session.drivers.includes(driverId)) {
        serverMessage = `Driver ${driverId} not found in the list.`;
        io.emit("server-message", serverMessage);
        return;
    }

    // Check if the new name already exists (and it's not the same driver)
    if (driverId !== newDriverName && session.drivers.includes(newDriverName)) {
        serverMessage = `Driver ${newDriverName} already exists in the list.`;
        io.emit("server-message", serverMessage);
        return;
    }

    // Save the car number assigned to the original driver
    const carNumber = session.carAssignments[driverId];
    
    // Remove old driver entry
    session.drivers = session.drivers.filter(driver => driver !== driverId);
    delete session.carAssignments[driverId];
    
    // Add new driver entry with the same car number
    session.drivers.push(newDriverName);
    session.carAssignments[newDriverName] = carNumber;

    // Emit session details to update clients
    io.emit("session-details", session);
    io.emit("driver-edited", session);
    updateRaceSessions(io, sessionId);
}

function removeRaceDriver(io, sessionId, driverName) {
    const session = raceSessions.find(session => session.id === sessionId);

    if (!session || !session.drivers.includes(driverName)) {
        console.log(`Driver ${driverName} not found.`);
        return;
    }

    // Remove driver and their car assignment
    session.drivers = session.drivers.filter(driver => driver !== driverName);
    delete session.carAssignments[driverName];

    io.emit("session-details", session);
    updateRaceSessions(io, sessionId);
}

function initiateRaceSession(io, sessionId) {
    const session = raceSessions.find(session => session.id === sessionId);
    startRace(io, session)
    deleteRaceSession(io, sessionId)
}

function updateRaceSessions(io, currentSessionId = null) {
    // Send the current race sessions to all connected clients
    if (!Array.isArray(raceSessions) || raceSessions.length === 0) {
        nextRaceServer = null;
    } else {
        nextRaceServer = raceSessions[0];

        /*
        // If we have a currentSessionId, we should maintain selection
        // Otherwise, default to the first race
        if (currentSessionId) {
            // Find the current session in the race sessions
            const currentSession = raceSessions.find(session => session.id === currentSessionId);
            if (currentSession) {
                nextRaceServer = currentSession;
            } else {
                // Fallback to first race if the current session was deleted
                nextRaceServer = raceSessions[0];
            }
        } else {
            // Default behavior - set next race to first race
            nextRaceServer = raceSessions[0];
        } */
    }

    io.emit("update-sessions", raceSessions);
    io.emit("update-next-race", nextRaceServer);
}

module.exports = { 
    createRaceSession, 
    deleteRaceSession, 
    findRaceSession, 
    addRaceDriver,
    editRaceDriver,
    removeRaceDriver,
    initiateRaceSession,
    updateRaceSessions,
    raceSessions,
    nextRaceServer,
};