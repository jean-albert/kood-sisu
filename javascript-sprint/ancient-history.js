function classifyDate(date) {

    const now = new Date();

    // Calculate one year before and after today
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    // Classify the date
    if (date <= now) {
        if (date < oneYearAgo) {
            return "ancient";
        }
        return "past";
    } else {
        if (date > oneYearFromNow) {
            return "distant future";
        }
        return "future";
    }
}

