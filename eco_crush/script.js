document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const scoreDisplay = document.getElementById('score');
    const restartBtn = document.getElementById('restart-btn');
    const width = 8;
    const squares = [];
    let score = 0;

    // Waste Items
    // Wet: Apple 🍎
    // Dry: Bottle 🥤
    // E-waste: Phone 📱
    // Hazardous: Bulb 💡
    // Biomedical: Pill 💊
    const candyColors = [
        '🍎',
        '🥤',
        '📱',
        '💡',
        '💊'
    ];

    // Create Board
    function createBoard() {
        grid.innerHTML = '';
        squares.length = 0;
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            square.setAttribute('draggable', true);
            square.setAttribute('id', i);
            square.classList.add('square');
            let randomColor = Math.floor(Math.random() * candyColors.length);
            square.textContent = candyColors[randomColor];

            // Add class based on type
            const type = getTypeFromIcon(candyColors[randomColor]);
            if (type) square.classList.add(type);

            grid.appendChild(square);
            squares.push(square);
        }
    }

    function getTypeFromIcon(icon) {
        if (icon === '🍎') return 'type-wet';
        if (icon === '🥤') return 'type-dry';
        if (icon === '📱') return 'type-ewaste';
        if (icon === '💡') return 'type-hazardous';
        if (icon === '💊') return 'type-biomedical';
        return '';
    }

    createBoard();

    // Dragging the Candy
    let colorBeingDragged;
    let colorBeingReplaced;
    let squareIdBeingDragged;
    let squareIdBeingReplaced;

    squares.forEach(square => square.addEventListener('dragstart', dragStart));
    squares.forEach(square => square.addEventListener('dragend', dragEnd));
    squares.forEach(square => square.addEventListener('dragover', dragOver));
    squares.forEach(square => square.addEventListener('dragenter', dragEnter));
    squares.forEach(square => square.addEventListener('dragleave', dragLeave));
    squares.forEach(square => square.addEventListener('drop', dragDrop));

    // Touch/Swipe Support
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    squares.forEach(square => {
        square.addEventListener('touchstart', handleTouchStart, { passive: false });
        square.addEventListener('touchmove', handleTouchMove, { passive: false });
        square.addEventListener('touchend', handleTouchEnd);
    });

    function handleTouchStart(e) {
        // e.preventDefault(); // Prevent scrolling while playing
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        colorBeingDragged = this.textContent;
        squareIdBeingDragged = parseInt(this.id);
    }

    function handleTouchMove(e) {
        e.preventDefault(); // Prevent scrolling
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd() {
        if (!squareIdBeingDragged && squareIdBeingDragged !== 0) return;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Determine direction (threshold of 30px)
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal
            if (Math.abs(diffX) > 30) {
                if (diffX > 0) {
                    // Right
                    squareIdBeingReplaced = squareIdBeingDragged + 1;
                } else {
                    // Left
                    squareIdBeingReplaced = squareIdBeingDragged - 1;
                }
            }
        } else {
            // Vertical
            if (Math.abs(diffY) > 30) {
                if (diffY > 0) {
                    // Down
                    squareIdBeingReplaced = squareIdBeingDragged + width;
                } else {
                    // Up
                    squareIdBeingReplaced = squareIdBeingDragged - width;
                }
            }
        }

        // Execute Swap if valid
        if (squareIdBeingReplaced !== null && squareIdBeingReplaced >= 0 && squareIdBeingReplaced < width * width) {
            // Check if wrapping (e.g. moving right from last column)
            const currentRow = Math.floor(squareIdBeingDragged / width);
            const targetRow = Math.floor(squareIdBeingReplaced / width);

            // Prevent wrapping across rows for left/right moves
            if (Math.abs(squareIdBeingReplaced - squareIdBeingDragged) === 1 && currentRow !== targetRow) {
                return;
            }

            colorBeingReplaced = squares[squareIdBeingReplaced].textContent;
            squares[squareIdBeingReplaced].textContent = colorBeingDragged;
            squares[squareIdBeingDragged].textContent = colorBeingReplaced;

            const validMove = checkValidMove();
            if (!validMove) {
                squares[squareIdBeingReplaced].textContent = colorBeingReplaced;
                squares[squareIdBeingDragged].textContent = colorBeingDragged;
            } else {
                squareIdBeingReplaced = null; // Reset
            }
        }
    }

    // For mobile/click support
    let selectedSquare = null;
    squares.forEach(square => square.addEventListener('click', clickSquare));

    function clickSquare() {
        if (!selectedSquare) {
            selectedSquare = this;
            this.classList.add('selected');
        } else {
            // Check if adjacent
            const currentId = parseInt(this.id);
            const prevId = parseInt(selectedSquare.id);
            const validMoves = [prevId - 1, prevId - width, prevId + 1, prevId + width];

            if (validMoves.includes(currentId)) {
                // Swap
                colorBeingDragged = selectedSquare.textContent;
                colorBeingReplaced = this.textContent;
                squareIdBeingDragged = prevId;
                squareIdBeingReplaced = currentId;

                squares[squareIdBeingDragged].textContent = colorBeingReplaced;
                squares[squareIdBeingReplaced].textContent = colorBeingDragged;

                const validMove = checkValidMove();
                if (!validMove) {
                    squares[squareIdBeingDragged].textContent = colorBeingDragged;
                    squares[squareIdBeingReplaced].textContent = colorBeingReplaced;
                }
            }

            selectedSquare.classList.remove('selected');
            selectedSquare = null;
        }
    }


    function dragStart() {
        colorBeingDragged = this.textContent;
        squareIdBeingDragged = parseInt(this.id);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
    }

    function dragLeave() {
    }

    function dragDrop() {
        colorBeingReplaced = this.textContent;
        squareIdBeingReplaced = parseInt(this.id);
        this.textContent = colorBeingDragged;
        squares[squareIdBeingDragged].textContent = colorBeingReplaced;
    }

    function dragEnd() {
        // What is a valid move?
        let validMoves = [
            squareIdBeingDragged - 1,
            squareIdBeingDragged - width,
            squareIdBeingDragged + 1,
            squareIdBeingDragged + width
        ];
        let validMove = validMoves.includes(squareIdBeingReplaced);

        if (squareIdBeingReplaced && validMove) {
            squareIdBeingReplaced = null;
            const valid = checkValidMove();
            if (!valid) {
                squares[squareIdBeingReplaced].textContent = colorBeingReplaced;
                squares[squareIdBeingDragged].textContent = colorBeingDragged;
            }
        } else if (squareIdBeingReplaced && !validMove) {
            squares[squareIdBeingReplaced].textContent = colorBeingReplaced;
            squares[squareIdBeingDragged].textContent = colorBeingDragged;
        } else {
            squares[squareIdBeingDragged].textContent = colorBeingDragged;
        }
    }

    // Checking for Matches
    function checkRowForThree() {
        for (let i = 0; i < 61; i++) { // 64 - 3 = 61, but need to handle row wrapping
            let rowOfThree = [i, i + 1, i + 2];
            let decidedColor = squares[i].textContent;
            const isBlank = squares[i].textContent === '';

            // Check if wrapping
            if (i % width > width - 3) continue;

            if (rowOfThree.every(index => squares[index].textContent === decidedColor && !isBlank)) {
                score += 3;
                scoreDisplay.innerHTML = score;
                rowOfThree.forEach(index => {
                    squares[index].textContent = '';
                    squares[index].className = 'square';
                });
            }
        }
    }

    function checkColumnForThree() {
        for (let i = 0; i < 47; i++) { // 64 - (width*2) = 48? No, 64 - 16 = 48. 0 to 47.
            let columnOfThree = [i, i + width, i + width * 2];
            let decidedColor = squares[i].textContent;
            const isBlank = squares[i].textContent === '';

            if (columnOfThree.every(index => squares[index].textContent === decidedColor && !isBlank)) {
                score += 3;
                scoreDisplay.innerHTML = score;
                columnOfThree.forEach(index => {
                    squares[index].textContent = '';
                    squares[index].className = 'square';
                });
            }
        }
    }

    function checkValidMove() {
        // Temporarily check if the move results in a match
        let isMatch = false;

        // Check Rows
        for (let i = 0; i < 64; i++) {
            if (i % width > width - 3) continue;
            let rowOfThree = [i, i + 1, i + 2];
            let decidedColor = squares[i].textContent;
            if (decidedColor === '') continue;
            if (rowOfThree.every(index => squares[index].textContent === decidedColor)) {
                return true;
            }
        }

        // Check Cols
        for (let i = 0; i < 48; i++) {
            let columnOfThree = [i, i + width, i + width * 2];
            let decidedColor = squares[i].textContent;
            if (decidedColor === '') continue;
            if (columnOfThree.every(index => squares[index].textContent === decidedColor)) {
                return true;
            }
        }

        return false;
    }

    // Drop candies down
    function moveDown() {
        for (let i = 0; i < 55; i++) {
            if (squares[i + width].textContent === '') {
                squares[i + width].textContent = squares[i].textContent;
                squares[i + width].className = squares[i].className; // Copy class
                squares[i].textContent = '';
                squares[i].className = 'square'; // Reset class

                // Refill top row
                const firstRow = [0, 1, 2, 3, 4, 5, 6, 7];
                const isFirstRow = firstRow.includes(i);
                if (isFirstRow && squares[i].textContent === '') {
                    let randomColor = Math.floor(Math.random() * candyColors.length);
                    squares[i].textContent = candyColors[randomColor];
                    squares[i].className = 'square ' + getTypeFromIcon(candyColors[randomColor]);
                }
            }
        }
        // Also ensure top row is filled if empty
        for (let i = 0; i < width; i++) {
            if (squares[i].textContent === '') {
                let randomColor = Math.floor(Math.random() * candyColors.length);
                squares[i].textContent = candyColors[randomColor];
                squares[i].className = 'square ' + getTypeFromIcon(candyColors[randomColor]);
            }
        }
    }

    // Game Loop
    window.setInterval(function () {
        moveDown();
        checkRowForThree();
        checkColumnForThree();
    }, 100);

    restartBtn.addEventListener('click', () => {
        score = 0;
        scoreDisplay.innerHTML = score;
        createBoard();
    });

    // Rules Modal
    const rulesBtn = document.getElementById('rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeRulesBtn = document.getElementById('close-rules-btn');

    rulesBtn.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
    });

    closeRulesBtn.addEventListener('click', () => {
        rulesModal.classList.add('hidden');
    });
});
