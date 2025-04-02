const rectObj = {
    width: 50,
    height: 30,
    area() {
      return this.width * this.height;
    },
    perimeter() {
      return 2 * (this.width + this.height);
    },
  };
  
  module.exports = { rectObj };
  