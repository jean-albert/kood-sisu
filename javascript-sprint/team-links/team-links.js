function createLinks(teams) {
    // Remove existing list if present
    const existingList = document.getElementById('team-list-nav');
    if (existingList) {
        existingList.remove();
    }

    // Create new list
    const ul = document.createElement('ul');
    ul.id = 'team-list-nav';
    ul.className = 'team-links';

    teams.forEach(team => {
        // Create list item
        const li = document.createElement('li');
        li.style.backgroundColor = team.primary;

        // Create link
        const a = document.createElement('a');
        a.href = team.url;
        a.style.color = team.secondary;
        a.textContent = team.name;

        // Create copy span
        const span = document.createElement('span');
        span.textContent = '[copy]';
        span.addEventListener('click', () => {
            navigator.clipboard.writeText(team.url)
                .catch(err => console.error('Failed to copy URL:', err));
        });

        // Assemble elements
        li.appendChild(a);
        li.appendChild(document.createTextNode(' ')); // Space between link and [copy]
        li.appendChild(span);

        ul.appendChild(li);
    });

    // Add to body
    document.body.appendChild(ul);
}