// Execute immediately when script is loaded
(function() {
    // Create letter container
    const letterContainer = document.createElement('div');
    letterContainer.className = 'letter-container';

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // Create letters A-Z
    for (let i = 0; i < 26; i++) {
        const letter = document.createElement('div');
        const letterChar = String.fromCharCode(65 + i);
        letter.className = 'letter';
        letter.id = letterChar.toLowerCase();
        letter.textContent = letterChar;
        letter.style.fontSize = '14px';
        
        // Make 'A' selected by default
        if (i === 0) {
            letter.classList.add('selected');
        }

        // Add click handler for letter selection
        letter.addEventListener('click', () => selectLetter(letter));
        letterContainer.appendChild(letter);
    }

    // Create and configure buttons
    const buttons = [
        { id: 'prev', text: ' < ', handler: selectPrevious },
        { id: 'next', text: ' > ', handler: selectNext },
        { id: 'decrease', text: ' - ', handler: decreaseSize },
        { id: 'increase', text: ' + ', handler: increaseSize }
    ];

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.id = btn.id;
        button.textContent = btn.text;
        button.addEventListener('click', btn.handler);
        buttonContainer.appendChild(button);
    });

    // Add containers to body
    document.body.appendChild(letterContainer);
    document.body.appendChild(buttonContainer);

    // Helper function to get currently selected letter
    function getSelectedLetter() {
        return document.querySelector('.letter.selected');
    }

    // Letter selection function
    function selectLetter(letter) {
        const currentSelected = getSelectedLetter();
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        letter.classList.add('selected');
    }

    // Navigation functions
    function selectPrevious() {
        const current = getSelectedLetter();
        const prev = current.previousElementSibling || letterContainer.lastElementChild;
        selectLetter(prev);
    }

    function selectNext() {
        const current = getSelectedLetter();
        const next = current.nextElementSibling || letterContainer.firstElementChild;
        selectLetter(next);
    }

    // Size modification functions
    function decreaseSize() {
        const selected = getSelectedLetter();
        const currentSize = parseInt(selected.style.fontSize);
        if (currentSize > 10) {
            selected.style.fontSize = (currentSize - 2) + 'px';
        }
    }

    function increaseSize() {
        const selected = getSelectedLetter();
        const currentSize = parseInt(selected.style.fontSize);
        if (currentSize < 26) {
            selected.style.fontSize = (currentSize + 2) + 'px';
        }
    }
})();