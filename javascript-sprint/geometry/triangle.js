export class Triangle {
    constructor(sideA, sideB, sideC) {
      this.sideA = sideA;
      this.sideB = sideB;
      this.sideC = sideC;
    }
  
    area() {
      // Heron's formula
      const s = this.perimeter() / 2;
      return Math.sqrt(
          s * 
          (s - this.sideA) * 
          (s - this.sideB) * 
          (s - this.sideC)
      );
  }
  
    perimeter() {
      return this.sideA + this.sideB + this.sideC;
    }
  }
  
  export const triangle = new Triangle(3, 4, 5);

  