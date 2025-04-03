// js/dom-control.js
import { getFrontDeskDom } from "./interfaces/front-desk.js";
import { getRaceControlDom } from "./interfaces/race-control.js";
import { getLapLineTrackerDom } from "./interfaces/lap-line-tracker.js";
import { getLeaderBoardDom } from "./interfaces/leader-board.js";
import { getNextRaceDom } from "./interfaces/next-race.js";
import { getRaceFlagDom } from "./interfaces/race-flag.js";

//this file parses what page we are on for various functions and retrieves variables accordingly.
//Individual events and variables can be then used by retrieving the through getInterfaceDom
//Its meant to be more efficient, but has been a mixed success so far. 

export function getInterfaceDom(interfaceName) {
    switch (interfaceName) {
        case "front-desk":
            return getFrontDeskDom();
        case "race-control":
            return getRaceControlDom();
        case "lap-line-tracker":
            return getLapLineTrackerDom();
        case "leader-board":
            return getLeaderBoardDom();
        case "next-race":
            return getNextRaceDom()
        case "race-flag":
            return getRaceFlagDom();
        default:
            console.warn("Unknown interface:", interfaceName);
            return {};
    }
}