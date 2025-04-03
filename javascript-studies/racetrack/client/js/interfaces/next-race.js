// js/next-race.js
import { socket } from "../index.js"; 
const nextRaceElements = {};

document.addEventListener("DOMContentLoaded", () => {
    nextRaceElements.detailDisplay = document.getElementById("detailDisplay") 
    nextRaceElements.raceDetails = document.getElementById("raceDetails");
    nextRaceElements.raceName = document.getElementById("raceName");
    nextRaceElements.driverList = document.getElementById("driverList"); 
    const messageDisplay = document.getElementById("messageDisplay");
    socket.emit("get-next-race"); // If next race exists, this will prepare the interface
    socket.on("clear-race-session", () => messageDisplay.classList.remove("hidden"));
    socket.on("race-started", () => messageDisplay.classList.add("hidden"));
});

export function getNextRaceDom() {
    return nextRaceElements;
}