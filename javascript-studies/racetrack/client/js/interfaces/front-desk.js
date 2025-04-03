// js/front-desk.js
const frontDeskElements = {};
import { socket, interfaceName } from "../index.js";
import { displayNoRacesMessage } from "../client-functions.js"

document.addEventListener("DOMContentLoaded", () => {
    frontDeskElements.authModal = document.getElementById("authModal");
    frontDeskElements.loginForm = document.getElementById("authForm");
    frontDeskElements.accessKey = document.getElementById("accessKey");
    frontDeskElements.loginBtn = document.getElementById("loginBtn");
    frontDeskElements.mainContent = document.getElementById("mainContent");
    frontDeskElements.authError = document.getElementById("authError");
    frontDeskElements.addRaceBtn = document.getElementById("addRaceBtn");
    frontDeskElements.raceList = document.getElementById("raceList");
    frontDeskElements.raceName = document.getElementById("raceName");
    frontDeskElements.addDriverBtn = document.getElementById("addDriverBtn");
    frontDeskElements.deleteDriverBtn = document.getElementById("deleteDriverBtn");
    frontDeskElements.deleteRaceBtn = document.getElementById("deleteRaceBtn");
    frontDeskElements.raceSession = document.getElementsByClassName("race-session"); // Race sessions IDs are unique, so we retrieve with class instead.
    frontDeskElements.driverList = document.getElementById("driverList");
    frontDeskElements.detailDisplay = document.getElementById("detailDisplay"); 
    frontDeskElements.raceDetails = document.getElementById("raceDetails"); 
    frontDeskElements.safetyBtns = document.getElementById("buttonsContainer"); // Dummy
    socket.emit("initialize-front-desk"); // if sessions already exist, this will prepare interface
    socket.on("update-front-desk", (allSessions) => { renderRaceSessions(allSessions) });
});

export function getFrontDeskDom() {
    return frontDeskElements;
}

export function renderRaceSessions(allSessions) {
    if (interfaceName !== "front-desk") {
        return;
    }
    const { raceList } = getFrontDeskDom("front-desk");
    if (!raceList) {
        return;
    }
    raceList.innerHTML = ""; // Clears the list

    allSessions.forEach(session => {
        const sessionElement = document.createElement("div");
        sessionElement.classList.add("race-session");
        sessionElement.textContent = session.name;
        sessionElement.dataset.sessionId = session.id;
        raceList.appendChild(sessionElement);
    });

    if (!allSessions || allSessions.length === 0) {
        displayNoRacesMessage(raceList);
        return;
    }
}

