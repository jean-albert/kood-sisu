// Filters out odd numbers from an array
function filterOutOddNumbers(numbers) {
    return numbers.filter(num => num % 2 === 0)
}

// Filters objects by name length
function filterObjectsByNameLength(objects, maxNameLength) {
    return objects.filter(obj => obj.name.length <= maxNameLength);
}

// Filters products based on multiple criteria
function compoundFilter(products) {
    return products.filter(product => {
      return (
        product.code.length > 5 &&
        !product.category.includes("special") &&
        product.price > 50 &&
        product.location !== "Underground"
      );
    });
  }
