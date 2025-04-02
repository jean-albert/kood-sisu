// Converts a 2D array to an array of objects
function convert2DArrayToObjectArray(data) {
    return data.map(([key, value]) => ({ [key]: value }));
  }
  
  // Converts an array of objects to an array of formatted strings
  //function convertArrayOfObjectsToStrings(objects) {
  //  return objects.map(obj => {
  //    return `Name: ${obj.name}, Age: ${obj.age}, City: ${obj.city}`;
  //  });
  //}

  function convertArrayOfObjectsToStrings(objects) {
    // Input validation
    if (!Array.isArray(objects)) {
        throw new TypeError('Input must be an array');
    }

    return objects.map(obj => {
        if (typeof obj !== 'object' || obj === null) {
            throw new TypeError('Each element must be an object');
        }

        return Object.entries(obj)
            .map(([key, value]) => `${key.charAt(0).toUpperCase()}${key.slice(1)}: ${value}`)
            .join(', ');
    });
}
  
  // Concatenates strings longer than max length and adds ellipsis
  function concatenateStrings(strings, maxLength) {
    return strings.map(str => {
      return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    });
  }
  
 