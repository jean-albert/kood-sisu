(function() {
    // Create zones
    const outsideZone = document.createElement('div');
    outsideZone.className = 'zone outside';
    
    const insideZone = document.createElement('div');
    insideZone.className = 'zone inside';
    
    document.body.appendChild(outsideZone);
    document.body.appendChild(insideZone);

    let currentCharacter = null;
    let lastMouseEvent = null;

    // Track mouse position
    document.addEventListener('mousemove', (event) => {
        lastMouseEvent = event;
        updateCharacterPosition(event);
    });
    
    // Handle keyboard input
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const characters = document.querySelectorAll('.character');
            characters.forEach(char => char.remove());
            currentCharacter = null;
            return;
        }
        
        if (!/^[a-z]$/.test(event.key)) {
            return;
        }

        // Remove follow class from current character if exists
        if (currentCharacter) {
            currentCharacter.classList.remove('follow');
        }

        // Create new character
        const character = document.createElement('div');
        character.className = 'character follow';
        
        // Check if cursor is in jail when creating character
        const jail = document.querySelector('.inside');
        const jailRect = jail.getBoundingClientRect();
        const inJail = lastMouseEvent && 
            lastMouseEvent.clientX >= jailRect.left && 
            lastMouseEvent.clientX <= jailRect.right && 
            lastMouseEvent.clientY >= jailRect.top && 
            lastMouseEvent.clientY <= jailRect.bottom;

        if (inJail) {
            character.classList.add('trapped');
        }

        character.textContent = event.key;
        document.body.appendChild(character);
        currentCharacter = character;

        // Position at current mouse coordinates
        if (lastMouseEvent) {
            updateCharacterPosition(lastMouseEvent);
        }
    });

    function updateCharacterPosition(event) {
        if (!currentCharacter) return;

        const jail = document.querySelector('.inside');
        const jailRect = jail.getBoundingClientRect();
        const { clientX, clientY } = event;

        // Check if in jail
        const inJail = clientX >= jailRect.left && 
                      clientX <= jailRect.right && 
                      clientY >= jailRect.top && 
                      clientY <= jailRect.bottom;

        if (inJail) {
            if (!currentCharacter.classList.contains('trapped')) {
                currentCharacter.classList.add('trapped');
            }
            currentCharacter.style.left = `${clientX}px`;
            currentCharacter.style.top = `${clientY}px`;
        } else if (currentCharacter.classList.contains('trapped')) {
            // If trying to leave jail, detach and keep at boundary
            currentCharacter.classList.remove('follow');
            
            // Keep at jail boundary at 974.3515625px
            currentCharacter.style.left = '974.3515625px';
            currentCharacter.style.top = `${Math.min(Math.max(clientY, jailRect.top), jailRect.bottom)}px`;
            
            currentCharacter = null;
        } else {
            // Normal movement outside jail
            currentCharacter.style.left = `${clientX}px`;
            currentCharacter.style.top = `${clientY}px`;
        }
    }
})();