// Execute immediately when script is loaded
(function() {
    // Create main content div
    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';

    // Create paragraph element
    const paragraph = document.createElement('p');
    paragraph.textContent = 'code';
    contentDiv.appendChild(paragraph);

    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'controls';

    // Button configurations
    const buttons = [
        { id: 'bold', text: 'B' },
        { id: 'italic', text: 'I' },
        { id: 'underline', text: 'U' },
        { id: 'highlight', text: 'Highlight' }
    ];

    // Create buttons with event listeners
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.id = btn.id;
        button.textContent = btn.text;
        
        button.addEventListener('click', () => {
            if (btn.id === 'highlight') {
                contentDiv.classList.toggle('highlight');
            } else {
                paragraph.classList.toggle(btn.id);
            }
        });

        controls.appendChild(button);
    });

    // Add elements to body
    document.body.appendChild(contentDiv);
    document.body.appendChild(controls);
})();