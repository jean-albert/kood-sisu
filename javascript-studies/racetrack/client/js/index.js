// client/index.js
export const socket = io(); 
export let allSessions = []; 
export let nextRaceClient = null; // "Client" is just to distinguish this from the server-side counterpart
// Next Race is always the first race session listed in the relevant array.

import { handleSocketEvents } from "./socket-client.js";  // Import the event handler
import { 
    handleLogin, 
    addNewSession, 
    deleteSession, 
    addDriverDetails,
    editDriverDetails, 
    deleteDriver, 
    startRaceSession, 
    requestRaceDetails,
    changeRaceStatus 
} from "./client-functions.js"; // Import functions from client-functions

export const interfaceName = document.body.dataset.interface;  // E.g., <body data-interface=front-desk>

// We handle all event listeners here for modularity. No need to keep track of them for each interface.
// Login form 
document.body.addEventListener("submit", (event) => {
    if (event.target.matches("#authForm")) {
        event.preventDefault();
        handleLogin(interfaceName);  // Pass interfaceName to handleLogin
    }
});

// Login button
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#loginBtn")) {
        event.preventDefault();
        handleLogin(interfaceName); 
    }
});

// Add race session button
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#addRaceBtn")) {
        event.preventDefault();
        addNewSession(socket); 
    }
});

// Select race session. 
document.body.addEventListener("click", (event) => {
    if (event.target.matches(".race-session")) {
        const sessionId = event.target.dataset.sessionId;
        requestRaceDetails(sessionId)
    }
});

// Add driver button
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#addDriverBtn")) {
        event.preventDefault();
        const sessionId = event.target.dataset.sessionId;
        addDriverDetails(sessionId, () => {
            // Update the UI to show the drivers list for the selected race
            const driverList = document.getElementById("driverList");
            const selectedSession = getSessionById(sessionId);
            driverList.innerHTML = "";
            selectedSession.drivers.forEach((driver) => {
                const driverElement = document.createElement("li");
                driverElement.textContent = driver;
                driverList.appendChild(driverElement);
            });
        });
    }
});

// Edit Driver button
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#editDriverBtn")) {
      const driverId = event.target.dataset.driverId;
      const sessionId = event.target.dataset.sessionId;
  
      // Enable editing of car number and name
      // const carNumberInput = document.getElementById("carNumberInput");
      const nameInput = document.getElementById("nameInput");
      editDriverDetails(sessionId, driverId);
    }
  });

// Delete driver button
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#deleteDriverBtn")) {
        event.preventDefault();
        const sessionId = event.target.dataset.sessionId;
        const driverName = event.target.dataset.driverId;
        deleteDriver(sessionId, driverName); 
    }
});

// Delete race session
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#deleteRaceBtn")) {
        const sessionId = event.target.dataset.sessionId;
        event.preventDefault();
        deleteSession(sessionId);
    }
});

// Start Race
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#startRaceBtn")) {
        event.preventDefault();

        const driverList = document.getElementById("driverList");
        if (!driverList || driverList.children.length === 0) return;

        // Check that there's at least one driver.
        // If only one child exists and it's the "No drivers" message, prevent race start
        if (driverList.children.length === 1 && driverList.children[0].classList.contains("no-drivers")) {
            alert("At least one driver is required for a race!");
            return;
        }

        const sessionId = event.target.dataset.sessionId;
        startRaceSession(sessionId);
    }
});

// Change Race Status
document.body.addEventListener("click", (event) => {
    if (event.target.matches(".safety-button")) {
        let newStatus = null
        if (event.target.matches("#safeBtn")) {
            newStatus = "safe"
        }
        if (event.target.matches("#hazardBtn")) {
            newStatus = "hazard"
        }
        if (event.target.matches("#dangerBtn")) {
            newStatus = "danger"
        }
        if (event.target.matches("#finishBtn")) {
            newStatus = "finish"
        }
        event.preventDefault();
        changeRaceStatus(newStatus); 
    }
});

// Record completed lap
document.body.addEventListener("click", (event) => {
    if (event.target.matches(".car-button")) {
        const carId = event.target.dataset.carId;
        event.preventDefault();
        socket.emit("record-completed-lap", carId)
    }
});

// Clear race session
document.body.addEventListener("click", (event) => {
    if (event.target.matches("#clearRaceBtn")) {
        event.preventDefault();
        socket.emit("clear-current-race");
    }
});

document.body.addEventListener("click", (event) => {
    if (event.target.matches("#fullscreenBtn")) {
        event.preventDefault();

        if (!document.fullscreenElement) {
            // Request full screen
            document.documentElement.requestFullscreen()
                .catch((err) => console.error(`Error attempting to enable fullscreen mode: ${err.message}`));
        } else {
            // Exit full screen
            if (document.exitFullscreen) {
                document.exitFullscreen()
                    .catch((err) => console.error(`Error attempting to exit fullscreen mode: ${err.message}`));
            }
        }
    }
});

// Initialize socket event handling here
handleSocketEvents(socket, interfaceName, allSessions, nextRaceClient);  // Handle generic socket events centrally