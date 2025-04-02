function calculateFines(jsonData) {
    const cars = JSON.parse(jsonData);
    let totalFines = 0;
    const finedCars = [];
  
    cars.forEach(([make, model, reg, year, fuel]) => {
      let fine = 0;
  
      // Determine fines based on the business logic
      if (year < 2000) {
        fine = 20;
      } else if (fuel === "diesel" && year < 2015) {
        fine = 10;
      }
  
      // If the car has a fine, add it to the results
      if (fine > 0) {
        totalFines += fine;
        finedCars.push({ reg, year, fuel, fine });
      }
    });
  
    return JSON.stringify({ totalFines, cars: finedCars });
  }
  
