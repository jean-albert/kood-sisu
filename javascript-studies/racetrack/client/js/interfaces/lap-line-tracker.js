// js/lap-line-tracker.js
import { socket } from "../index.js"; 
const lapLineTrackerElements = {};

document.addEventListener("DOMContentLoaded", () => {
    lapLineTrackerElements.authModal = document.getElementById("authModal");
    lapLineTrackerElements.loginForm = document.getElementById("authForm");
    lapLineTrackerElements.accessKey = document.getElementById("accessKey");
    lapLineTrackerElements.loginBtn = document.getElementById("loginBtn")
    lapLineTrackerElements.mainContent = document.getElementById("mainContent");
    lapLineTrackerElements.authError = document.getElementById("authError");
    
    socket.emit("initialize-ongoing-tracker"); // If ongoing race exists, this prepares interface
    socket.on("setup-late-lapbuttons", currentRace => { 
        setUpLapButtons(currentRace); 
    });
    socket.on("race-started", currentRace => { 
        setUpLapButtons(currentRace); 
    });
    socket.on("race-ended", currentRace => { 
        clearLapButtons(currentRace); 
    });
});

export function getLapLineTrackerDom() {
    return lapLineTrackerElements;
}

function setUpLapButtons(currentSession) {
    const btnsList = document.getElementById("lapButtonList");
    if (!btnsList) return;
    if (currentSession === null) {
        btnsList.textContent = "No cars found. Wait for race to begin."
    } else {
        btnsList.innerHTML = "";  // Clear the current list before re-populating
        Object.values(currentSession.carAssignments).forEach((carId) => {
            createLapButton(carId, btnsList);
        });
    }
}

function createLapButton(carId, btnsList) {
    const lapButton = document.createElement("li");
    lapButton.classList.add("car-button");
    lapButton.textContent = `Car ${carId}`; 
    lapButton.dataset.carId = carId;  
    btnsList.appendChild(lapButton);
}

function clearLapButtons() {
    const lapButtonList = document.getElementById("lapButtonList"); 
    if (!lapButtonList) return;
    lapButtonList.innerHTML = "";
}
