const wasteItems = [
    // Wet Waste
    { name: 'Banana Peel', type: 'Wet', icon: '🍌' },
    { name: 'Apple Core', type: 'Wet', icon: '🍎' },
    { name: 'Fish Bone', type: 'Wet', icon: '🐟' },
    { name: 'Egg Shell', type: 'Wet', icon: '🥚' },
    { name: 'Leftover Pizza', type: 'Wet', icon: '🍕' },
    { name: 'Tea Bag', type: 'Wet', icon: '🍵' },

    // Dry Waste
    { name: 'Plastic Bottle', type: 'Dry', icon: '🥤' },
    { name: 'Newspaper', type: 'Dry', icon: '📰' },
    { name: 'Cardboard', type: 'Dry', icon: '📦' },
    { name: 'Soda Can', type: 'Dry', icon: '🥫' },
    { name: 'Glass Jar', type: 'Dry', icon: '🫙' },
    { name: 'Chip Bag', type: 'Dry', icon: '🍟' },

    // E-waste
    { name: 'Old Phone', type: 'E-waste', icon: '📱' },
    { name: 'Battery', type: 'E-waste', icon: '🔋' },
    { name: 'Broken Mouse', type: 'E-waste', icon: '🖱️' },
    { name: 'Circuit Board', type: 'E-waste', icon: '📟' },
    { name: 'Laptop', type: 'E-waste', icon: '💻' },
    { name: 'Headphones', type: 'E-waste', icon: '🎧' },

    // Hazardous Waste
    { name: 'Paint Can', type: 'Hazardous', icon: '🎨' },
    { name: 'Light Bulb', type: 'Hazardous', icon: '💡' },
    { name: 'Spray Can', type: 'Hazardous', icon: '🧴' },
    { name: 'Thermometer', type: 'Hazardous', icon: '🌡️' },
    { name: 'Cleaning Bleach', type: 'Hazardous', icon: '🧪' },

    // Biomedical Waste
    { name: 'Syringe', type: 'Biomedical', icon: '💉' },
    { name: 'Bandage', type: 'Biomedical', icon: '🩹' },
    { name: 'Pills', type: 'Biomedical', icon: '💊' },
    { name: 'Face Mask', type: 'Biomedical', icon: '😷' },
    { name: 'Gloves', type: 'Biomedical', icon: '🧤' }
];

// Game State
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;

// DOM Elements
const grid = document.getElementById('game-grid');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const modal = document.getElementById('game-over-modal');
const finalMovesDisplay = document.getElementById('final-moves');
const restartBtn = document.getElementById('restart-btn');
const toast = document.getElementById('message-toast');
const toastIcon = document.getElementById('toast-icon');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');

// Initialize Game
function initGame() {
    // Select 8 random pairs (16 cards total) for a balanced 4x4 grid
    // Or just use 8 specific items. Let's pick 8 items randomly to keep it fresh.
    const selectedItems = shuffleArray([...wasteItems]).slice(0, 8);
    const gameDeck = [...selectedItems, ...selectedItems]; // Duplicate for pairs
    cards = shuffleArray(gameDeck);

    // Reset State
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    updateStats();
    modal.classList.add('hidden');
    grid.innerHTML = '';

    // Render Cards
    cards.forEach((item, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index;
        card.dataset.name = item.name;
        card.dataset.category = item.type;

        card.innerHTML = `
            <div class="card-face card-front"></div>
            <div class="card-face card-back">${item.icon}</div>
        `;

        card.addEventListener('click', () => flipCard(card, item));
        grid.appendChild(card);
    });
}

function flipCard(card, item) {
    if (isLocked || card.classList.contains('flipped') || flippedCards.includes(card)) return;

    card.classList.add('flipped');
    flippedCards.push({ card, item });

    if (flippedCards.length === 2) {
        moves++;
        updateStats();
        checkMatch();
    }
}

function checkMatch() {
    isLocked = true;
    const [first, second] = flippedCards;

    if (first.item.name === second.item.name) {
        // Match!
        matchedPairs++;
        updateStats();
        showToast(first.item);
        flippedCards = [];
        isLocked = false;

        if (matchedPairs === 8) {
            setTimeout(showGameOver, 1000);
        }
    } else {
        // No Match
        setTimeout(() => {
            first.card.classList.remove('flipped');
            second.card.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 1000);
    }
}

function showToast(item) {
    toastIcon.textContent = item.icon;
    toastTitle.textContent = `${item.name}`;
    toastMessage.textContent = `is ${item.type} Waste!`;

    // Color code toast
    let color = '#fff';
    if (item.type === 'Wet') color = 'var(--accent-wet)';
    if (item.type === 'Dry') color = 'var(--accent-dry)';
    if (item.type === 'E-waste') color = 'var(--accent-ewaste)';
    if (item.type === 'Hazardous') color = 'var(--accent-hazardous)';
    if (item.type === 'Biomedical') color = 'var(--accent-biomedical)';

    toastTitle.style.color = color;

    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

function updateStats() {
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = `${matchedPairs} / 8`;
}

function showGameOver() {
    finalMovesDisplay.textContent = moves;
    modal.classList.remove('hidden');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

restartBtn.addEventListener('click', initGame);

// Start the game
initGame();
