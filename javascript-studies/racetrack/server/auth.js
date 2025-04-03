const DELAY_MS = 500;  // Required delay for failed logins
const { UNIVERSAL_KEY, FRONT_DESK_KEY, RACE_CONTROL_KEY, LAP_TRACKER_KEY } = require('../config');

async function validateAuth(interface, key) {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    // We have the keys from .env through config.js. We either check if input matches the universal key, or we map keys and interfaces for a check.
    const keys = {
        "front-desk": FRONT_DESK_KEY,
        "race-control": RACE_CONTROL_KEY,
        "lap-line-tracker": LAP_TRACKER_KEY,
    };
    // Universal key exists just in case. 
    if (key === UNIVERSAL_KEY) {
        return { success: true, error: null };
    }
    // Part of debugging process. Not strictly necessary, but retained. 
    if (!keys[interface]) {
        return { success: false, error: 'Invalid interface' };
    } 
    if (keys[interface] !== key) {
        return { success: false, error: 'Invalid access key' };
    }

    return { success: true, error: null };
}

module.exports = { validateAuth };