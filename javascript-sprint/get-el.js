// Function to get all elements by tag name
function getElementsByTag(tag) {
    if (typeof tag !== 'string') {
        throw new TypeError('Tag must be a string');
    }
    return document.getElementsByTagName(tag);
}

// Function to get all elements by class name
function getElementsByClassName(className) {
    if (typeof className !== 'string') {
        throw new TypeError('Class name must be a string');
    }
    return document.getElementsByClassName(className);
}

// Function to get an element by ID
function getElementById(id) {
    if (typeof id !== 'string') {
        throw new TypeError('ID must be a string');
    }
    const element = document.getElementById(id);
    return element || undefined;
}

// Function to get elements by attribute name and optional value
function getElementsByAttribute(attributeName, attributeValue) {
    if (typeof attributeName !== 'string') {
        throw new TypeError('Attribute name must be a string');
    }
    
    if (attributeValue !== undefined && typeof attributeValue !== 'string') {
        throw new TypeError('Attribute value must be a string if provided');
    }
    
    let selector;
    if (attributeValue === undefined) {
        selector = `[${attributeName}]`;
    } else {
        selector = `[${attributeName}="${attributeValue}"]`;
    }
    
    return document.querySelectorAll(selector);
}

// Example usage in a browser console
// console.log(getElementsByTag('div'));
// console.log(getElementsByClassName('example-class'));
// console.log(getElementById('example-id'));
// console.log(getElementsByAttribute('data-example', 'value'));
// console.log(getElementsByAttribute('data-example'));
