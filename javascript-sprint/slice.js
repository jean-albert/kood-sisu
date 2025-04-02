// Function to slice a portion of an array or string based on element values
function sliceFunc(arr, start, end) {
    /*
      arr is a string or array
      sliceFunc should return a shallow slice of arr

      start & end are values of elements/characters in arr.
      these represent the start/end of the slice to be returned.

      the logic for finding start/end indexes must be the same as `Array.indexOf` and `Array.lastIndexOf`.
      slice logic must be the same as `Array.slice`.
    */

    // Find the start and end indexes
    const startIndex = arr.indexOf(start);
    const endIndex = arr.lastIndexOf(end);

    // Return the slice (endIndex + 1 to include the end element/character)
    return arr.slice(startIndex, endIndex + 1);
}