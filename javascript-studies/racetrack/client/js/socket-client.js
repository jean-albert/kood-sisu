// socket-client.js
import { getInterfaceDom } from "./dom-control.js";
import { renderRaceSessions } from "./interfaces/front-desk.js";
import { 
    updateRaceDetails, 
    updateSessionUI, 
    updateNextRace,
    updateRaceFlag 
} from "./client-functions.js";

export function handleSocketEvents(socket, interfaceName, allSessions, nextRaceClient) {
    socket.on("validate-user", (result) => {
        const { authModal, authError, mainContent } = getInterfaceDom(interfaceName);
        // Ensure both authError and mainContent elements exist. This was originally for debugging, but I'll leave it here for now. 
        if (!authError || !mainContent) {
            console.log("DOM elements not found!");
            return;
        }
        // Remove/add hidden based on successful or failed login. 
        if (result.success) {
            mainContent.classList.remove("hidden");
            authModal.classList.add("hidden");
            authError.classList.add("hidden");
            console.log(`[${interfaceName}] User authenticated!`);
        } else {
            authError.textContent = result.error || "Invalid access key";
            authError.classList.remove("hidden");
            console.log(`[${interfaceName}] Authentication failed:`, result.error);
        }
    });
    // New session added
    socket.on("new-session-added", (newSession) => {
        console.log('New session added:', newSession);
        allSessions.push(newSession);

        updateSessionUI(newSession.id, interfaceName);
        renderRaceSessions(allSessions)  
    
        const selectedSession = allSessions.find(session => session.id === newSession.id);
        if (interfaceName == "front-desk") {
            updateRaceDetails(selectedSession, interfaceName); 
        }
    });
    // Session deleted
    socket.on("session-deleted", (sessionId) => {
        console.log("Session deleted:", sessionId);
    
        allSessions = allSessions.filter(session => session.id !== sessionId);
        renderRaceSessions(allSessions);
    
        const raceDetails = document.getElementById("detailDisplay");
        if (!raceDetails) {
            return;
        }
        raceDetails.classList.add("hidden");
    
        document.getElementById("raceName").textContent = '';
        document.getElementById("driverList").innerHTML = '';
    });
    // New driver added
    // socket.on("new-driver-added", ) //Orphan socket? Might be removed, as it is not needed by client or server.
    
    // Handler for driver edited event
    socket.on("driver-edited", (updatedSession) => {
        
        // Update the session in allSessions array
        const sessionIndex = allSessions.findIndex(session => session.id === updatedSession.id);
        if (sessionIndex !== -1) {
            allSessions[sessionIndex] = updatedSession;
        }
            
        // Update the UI with the changes
        updateRaceDetails(updatedSession, interfaceName);
    });

    socket.on("update-sessions", (sessions) => {
        allSessions.length = 0;
        allSessions.push(...sessions);
        renderRaceSessions(allSessions);
    });

    socket.on("update-next-race", (nextRaceServer) => {
        nextRaceClient = nextRaceServer; //get the current next race to client. 
        if (interfaceName === "next-race" || interfaceName === "race-control") {
        updateNextRace(nextRaceClient, interfaceName);
        }
    });
    
    socket.on("session-details", (session) => {
        if (interfaceName !== "next-race") {
        updateSessionUI(session.id, interfaceName);  
        updateRaceDetails(session, interfaceName);
        } 
    });

    socket.on("race-status-changed", newStatus => {
        updateRaceFlag(newStatus, interfaceName);
    });
    
    socket.on("race-ended", () => {
        console.log("race ended!")
    });

    socket.on("server-message", serverMessage => {
        window.alert(serverMessage);
    });
}
