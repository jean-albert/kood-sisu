// Function to get the value of a key from an object
function getValueFromKey(obj, key) {
    return obj[key]; // Returns the value or undefined if the key does not exist
}

// Function to set a key-value pair into a new object
function setValueForKey(obj, keyValuePair) {
    // Use spread syntax to create a new object with the original properties and the new key-value pair
    return { ...obj, ...keyValuePair };
}

