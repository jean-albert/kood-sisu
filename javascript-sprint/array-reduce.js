// Calculates the total price from a shopping basket
function getTotalFromShoppingBasket(basket) {
    return basket.reduce((total, item) => total + item.price, 0);
  }
  
  // Calculates the average age from an array of people
  function getAverageAge(people) {
    if (people.length === 0) return 0;
    const totalAge = people.reduce((total, person) => total + person.age, 0);
    return totalAge / people.length;
  }
  
  // Converts an array of key-value pairs into a single object with values grouped into arrays
  function concatenateObjects(objects) {
    return objects.reduce((result, { key, value }) => {
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(value);
      return result;
    }, {});
  }
  
 