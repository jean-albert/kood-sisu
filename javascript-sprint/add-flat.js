// Function to sum all numbers in a nested array
function sumNestedArray(arr) {
    let sum = 0;

    function recurse(array) {
        for (let item of array) {
            if (Array.isArray(item)) {
                // Recursively handle nested arrays
                recurse(item);
            } else if (typeof item === 'number') {
                // Add only numbers to the sum
                sum += item;
            }
        }
    }

    recurse(arr); // Start recursion
    return sum;
}

