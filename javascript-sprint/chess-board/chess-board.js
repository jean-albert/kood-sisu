function initializeChessboard() {
    // Create main chessboard container
    const chessboard = document.createElement('div');
    chessboard.className = 'chessboard';

    // Keep track of the currently selected square
    let selectedSquare = null;

    // Create 64 squares (8x8)
    for (let row = 1; row <= 8; row++) {
        for (let col = 1; col <= 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.id = `square-${row}-${col}`;
            
            // Determine if square should be black
            // If row + col is even, it's white; if odd, it's black
            if ((row + col) % 2 !== 0) {
                square.classList.add('black');
            }

            // Add click handler
            square.addEventListener('click', function() {
                // Remove red background from previously selected square
                if (selectedSquare) {
                    selectedSquare.classList.remove('selected');
                }
                
                // If clicking the same square, just deselect it
                if (selectedSquare === this) {
                    selectedSquare = null;
                    return;
                }

                // Add red background to newly selected square
                this.classList.add('selected');
                selectedSquare = this;
            });

            chessboard.appendChild(square);
        }
    }

    // Find container element and append chessboard
    document.body.appendChild(chessboard);
}