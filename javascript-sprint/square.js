const { Rectangle } = require('./rectangle.js');

class Square extends Rectangle {
  constructor(side) {
    super(side, side);
    this.side = side;
  }
}

const square = new Square(4);

module.exports = { Square, square };
