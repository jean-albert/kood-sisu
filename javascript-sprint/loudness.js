// Function to convert a string to uppercase without using toUpperCase
function makeLouder(inputString) {
    let result = '';
    for (let char of inputString) {
        const charCode = char.charCodeAt(0);
        // Convert lowercase a-z to uppercase A-Z
        if (charCode >= 97 && charCode <= 122) {
            result += String.fromCharCode(charCode - 32);
        } else {
            result += char; // Keep other characters as-is
        }
    }
    return result;
}

// Function to convert a string to lowercase without using toLowerCase
function makeQuieter(inputString) {
    let result = '';
    for (let char of inputString) {
        const charCode = char.charCodeAt(0);
        // Convert uppercase A-Z to lowercase a-z
        if (charCode >= 65 && charCode <= 90) {
            result += String.fromCharCode(charCode + 32);
        } else {
            result += char; // Keep other characters as-is
        }
    }
    return result;
}

