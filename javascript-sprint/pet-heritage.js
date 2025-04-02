// Base Pet class
class Pet {
    constructor(name, age, species) {
      this.name = name;
      this.age = age;
      this.species = species;
    }
  
    makeSound() {
      console.log(`I am a ${this.species}`);
    }
  }
  
  // Dog class extending Pet
  class Dog extends Pet {
    constructor(name, age, breed, favoriteToy) {
      super(name, age, 'Dog');
      this.breed = breed;
      this.favoriteToy = favoriteToy;
    }
  
    fetch() {
      console.log(`${this.name} is fetching its ${this.favoriteToy}`);
    }
  }
  
  // Cat class extending Pet
  class Cat extends Pet {
    constructor(name, age, color, favoriteNapSpot) {
      super(name, age, 'Cat');
      this.color = color;
      this.favoriteNapSpot = favoriteNapSpot;
    }
  
    purr() {
      console.log(`${this.name} purrs on the ${this.favoriteNapSpot}`);
    }
  }
  
 