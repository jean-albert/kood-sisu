// js/race-control.js
import { socket } from "../index.js";
const raceControlElements = {};

document.addEventListener("DOMContentLoaded", () => {
    raceControlElements.authModal = document.getElementById("authModal");
    raceControlElements.loginForm = document.getElementById("authForm");
    raceControlElements.accessKey = document.getElementById("accessKey");
    raceControlElements.loginBtn = document.getElementById("loginBtn")
    raceControlElements.mainContent = document.getElementById("mainContent");
    raceControlElements.authError = document.getElementById("authError");
    raceControlElements.raceName= document.getElementById("raceName");
    raceControlElements.driverList= document.getElementById("driverList");
    raceControlElements.raceDetails = document.getElementById("raceDetails"); 
    raceControlElements.detailDisplay = document.getElementById("detailDisplay"); 
    raceControlElements.startRaceBtn = document.getElementById("startRaceBtn");
    raceControlElements.clearContainer = document.getElementById("clearContainer");
    raceControlElements.clearRaceBtn = document.getElementById("clearRaceBtn")
    socket.emit("get-next-race"); // if next race already exists, this will prepare interface
    socket.emit("initialize-ongoing-control"); // if on-going race exists, this will prepare interface
    socket.on("reveal-race-buttons", () => revealRaceButtons());
    socket.on("hide-race-buttons", () => hideRaceButtons()); 
    socket.on("clear-race-session", () => clearRaceControl());
    socket.on("reveal-clear-button", () => revealClearButton());
});

export function getRaceControlDom() {
    return raceControlElements;
}

function clearRaceControl() {
    const raceDisplay = document.getElementById("raceDisplay");
    const clearContainer = document.getElementById("clearContainer");
    if (!raceDisplay || !clearContainer) {
        return;
    }
    raceDisplay.style.display = "";
    clearContainer.style.display = "none";
    socket.emit("get-next-race");
}

function revealRaceButtons() {
    const raceDisplay = document.getElementById("raceDisplay");
    const buttonsContainer = document.getElementById("buttonsContainer"); 
    const clearContainer = document.getElementById("clearContainer"); //Duplicated to make sure

    if (!raceDisplay || !buttonsContainer) return;

    raceDisplay.style.display = "none";
    clearContainer.style.display = "none";
    buttonsContainer.style.display = "grid";
}

function hideRaceButtons() {
    const btnsContainer = document.getElementById("buttonsContainer");
    if (!btnsContainer) return;
    btnsContainer.style.display = "none";
}

function revealClearButton() {
    const clearContainer = document.getElementById("clearContainer");
    if (!clearContainer) return;
    clearContainer.style.display = "flex";
}