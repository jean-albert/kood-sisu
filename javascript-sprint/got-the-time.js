function printPrettyDate(date) {
    // Input validation
    if (!(date instanceof Date)) {
        throw new Error("Argument must be a Date object");
    }

    // Arrays for day and month names
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Get date components
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    // Get time components and convert to 12-hour format
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? "PM" : "AM";

    // Convert hours to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    hours = hours.toString().padStart(2, '0');

    // Create the formatted string
    console.log(`Today is ${day}, ${month} ${dayOfMonth}, ${year}, and the time is ${hours}:${minutes}:${seconds} ${ampm}.`);
}

// Example usage:
//printPrettyDate(new Date());
