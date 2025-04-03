// js/client-functions.js
import { socket } from "./index.js";
import { getInterfaceDom } from "./dom-control.js";

// This is currently a bit messy, due to the classic problem of trying to
// fix one thing and breaking ten. 

// LOG-IN
export function handleLogin(interfaceName) {
    const { loginForm } = getInterfaceDom(interfaceName);
    if (!loginForm) {
        return;
    }

    const accessKeyInput = loginForm.querySelector("#accessKey");
    if (!accessKeyInput) {
        console.error("Access key input not found!");
        return;
    }

    const accessKey = accessKeyInput.value.trim();
    console.log(`[${interfaceName}] Access key entered: "${accessKey}"`);

    if (!accessKey) {
        console.warn("Empty access key submitted!");
        return;
    }

    socket.emit("authenticate-user", { interfaceName, accessKey });
}

// ADD RACE SESSION
export function addNewSession() {
    let sessionName = prompt("Please add a name for the race", "New Race");
    if (!sessionName.trim()) {
        alert("Please insert a session name");
        return;
    } else {
        socket.emit('create-race-session', sessionName);
    }
}

// DELETE SESSION
export function deleteSession(sessionId) {
    if (confirm("Please confirm you wish to delete this session.")) {
        socket.emit("delete-race-session", sessionId);
    } else {
        return;
    }
}

// GET RACE DETAILS
export function requestRaceDetails(sessionId) {
    console.log(sessionId)
    socket.emit("request-session-details", sessionId);
}

export function updateRaceDetails(selectedSession, interfaceName) {
    if (!selectedSession) {
        console.warn("Session details not found!");
        return;
    }
    updateDriverList(selectedSession, interfaceName);
    if (interfaceName !== "front-desk") {
        displayNextRace(selectedSession, interfaceName);
    } else {
        setupRaceDetailsUI(selectedSession);
    }
}

// Next Race
export function updateNextRace(nextRace, interfaceName) {
    const { raceName } = getInterfaceDom(interfaceName);
    if (!raceName) {
        return;
    }
    if (nextRace == null) {
        raceName.textContent = "None";
        displayNoRacesMessage(raceName);
            return;
    } if (interfaceName === "next-race") {
        updateRaceDetails(nextRace, interfaceName);
    } else {
        updateRaceDetails(nextRace, interfaceName)
    }
}

function setupRaceDetailsUI(selectedSession) {
    const { detailDisplay, raceName, addDriverBtn, deleteRaceBtn } = getInterfaceDom("front-desk");
    detailDisplay.classList.remove("hidden");
    raceName.textContent = selectedSession.name;
    addDriverBtn.dataset.sessionId = selectedSession.id;
    deleteRaceBtn.dataset.sessionId = selectedSession.id;
}

function displayNextRace(selectedSession, interfaceName) {
    const { detailDisplay, raceName } = getInterfaceDom(interfaceName);
    if (!detailDisplay || !raceName) {
        return;
    }
    detailDisplay.classList.remove("hidden");
    raceName.textContent = selectedSession.name;
    if (interfaceName === "race-control") {
        startRaceBtn.dataset.sessionId = selectedSession.id;
    }
}

function updateDriverList(selectedSession, interfaceName) {
    const { driverList } = getInterfaceDom(interfaceName);
    if (!driverList) {
        return;
    }

    driverList.innerHTML = "";

    if (!selectedSession.drivers || selectedSession.drivers.length === 0) {
        displayNoDriversMessage(driverList);
        return;
    }

    selectedSession.drivers
        .sort((a, b) => selectedSession.carAssignments[a] - selectedSession.carAssignments[b]) // Sort drivers by car number
        .forEach(driver => createDriverListItem(driver, selectedSession, interfaceName, driverList));
}

function displayNoDriversMessage(driverList) {
    const noDriversMessage = document.createElement("li");
    noDriversMessage.textContent = "No drivers registered for this session.";
    noDriversMessage.classList.add("no-drivers");
    driverList.appendChild(noDriversMessage);
}

function createDriverListItem(driver, selectedSession, interfaceName, driverList) {
    const listItem = document.createElement("li");
    listItem.id = `driver-${encodeURIComponent(driver)}`;
    listItem.textContent = `${driver} on car #${selectedSession.carAssignments[driver]}`;

    if (interfaceName === "front-desk") {
        const editButton = createEditDriverButton(driver, selectedSession.id);
        listItem.appendChild(editButton);
    }

    // Only "front-desk" can add driver management buttons
    if (interfaceName === "front-desk") {
        const deleteButton = createDeleteDriverButton(driver, selectedSession.id);
        listItem.appendChild(deleteButton);
    }

    driverList.appendChild(listItem);
}

export function displayNoRacesMessage(htmlElement) {
    const noRacesMessage = document.createElement("li");
    noRacesMessage.textContent = "No upcoming races scheduled.";
    noRacesMessage.classList.add("no-races");
    htmlElement.appendChild(noRacesMessage);
}

function createEditDriverButton(driver, sessionId) {
    const editButton = document.createElement("button");
    editButton.id = "editDriverBtn";
    editButton.textContent = "Edit";
    editButton.dataset.driverId = driver;
    editButton.dataset.sessionId = sessionId;
    return editButton;
}

function createDeleteDriverButton(driver, sessionId) {
    const deleteButton = document.createElement("button");
    deleteButton.id = "deleteDriverBtn";
    deleteButton.textContent = "Remove";
    deleteButton.dataset.driverId = driver;
    deleteButton.dataset.sessionId = sessionId;
    return deleteButton;
}

export function closeRaceControlDetails(interfaceName) {
    const { detailDisplay } = getInterfaceDom(interfaceName);
    if (!detailDisplay) {
        console.warn("Detail display element not found for interface:", interfaceName);
        return;
    }
    detailDisplay.classList.add("hidden");
}

// ADD DRIVER DETAILS
export function addDriverDetails(sessionId) {
    let driverName = prompt("Please add the driver's name");
    if (!driverName.trim()) {
        alert("Please insert the driver's name");
        return;
    } else {
        socket.emit('add-race-driver', sessionId, driverName);
    }
}

// EDIT DRIVER DETAILS
export function editDriverDetails(sessionId, driverId) {
    let driverName = prompt("Please enter the new driver's name");
    if (!driverName.trim()) {
        alert("Please insert the new driver's name");
        return;
    } else {
        socket.emit('edit-race-driver', sessionId, driverId, driverName);
    }
}

// DELETE DRIVER
export function deleteDriver(sessionId, driverName) {
    if (confirm("Please confirm you wish to remove this driver.")) {
        socket.emit("delete-race-driver", sessionId, driverName);
    } else {
        return;
    }
}

// HIGHLIGHT RACE SESSION
export function updateSessionUI(selectedSessionId, interfaceName) {
    const { raceList } = getInterfaceDom(interfaceName);
    if (!raceList) {
        return;
    }

    raceList.querySelectorAll(".race-session").forEach(sessionElement => {
        sessionElement.classList.toggle(
            "selected",
            sessionElement.dataset.sessionId === selectedSessionId
        );
    });
}

// START RACE
export function startRaceSession(sessionId) {
    if (confirm("Please confirm you wish to begin this race.")) {
        changeRaceStatus("safe"); 
        socket.emit("start-race-session", sessionId);
        socket.emit("get-next-race")
    } else {
        return;
    }
}

// CHANGE RACE STATUS
export function changeRaceStatus(newStatus) {
    socket.emit("change-race-status", newStatus)
}

// DISPLAY FLAG
export function updateRaceFlag(newStatus, interfaceName) {
    const { flagImg } = getInterfaceDom(interfaceName);
    if (!flagImg) {
        return;
    }
    flagImg.src = '';
    flagImg.src = `images/${newStatus}.png`;
}
