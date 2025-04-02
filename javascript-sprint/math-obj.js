// Object containing mathematical functions
const mathObj = {
    // Function to return the absolute value of a number
    abs: function (num) {
        return num < 0 ? -num : num;
    },

    // Function to check if a number is even
    isEven: function (num) {
        return num % 2 === 0;
    },

    // Function to check if a number is odd
    isOdd: function (num) {
        return num % 2 !== 0;
    },

    // Function to check if a number is strictly positive
    isStrictlyPositive: function (num) {
        return num > 0;
    },

    // Function to return the smaller of two numbers
    min: function (a, b) {
        return a < b ? a : b;
    },

    // Function to return the larger of two numbers
    max: function (a, b) {
        return a > b ? a : b;
    }
};