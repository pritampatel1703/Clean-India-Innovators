document.addEventListener('DOMContentLoaded', () => {
    // Game State
    const gameState = {
        score: 0,
        compostLevel: 0, // 0 to 100
        stage: 0, // 0: Empty, 1: Forming, 2: Ready, 3: Green Garden
        levelThresholds: [0, 30, 70, 100],
        stageNames: ["Empty Bin", "Compost Forming", "Ready Compost", "Green Garden"],
        wasteItems: [],
        gameActive: true
    };

    // DOM Elements
    const elements = {
        scoreDisplay: document.getElementById('score'),
        stageNameDisplay: document.getElementById('stage-name'),
        wasteSource: document.getElementById('waste-source'),
        compostBin: document.getElementById('compost-bin'),
        compostFill: document.getElementById('compost-fill'),
        guideMessage: document.getElementById('guide-message'),
        gardenPlants: document.getElementById('garden-plants'),
        badgesContainer: document.getElementById('badges-container')
    };

    // Waste Data (Icon, Type, Name, Hint)
    const wasteTypes = [
        { id: 'apple', icon: '🍎', type: 'organic', name: 'Apple Core', hint: 'Great! Fruits break down easily!' },
        { id: 'banana', icon: '🍌', type: 'organic', name: 'Banana Peel', hint: 'Yes! Bananas add potassium to soil!' },
        { id: 'leaves', icon: '🍂', type: 'organic', name: 'Dry Leaves', hint: 'Perfect "Brown" matter for compost!' },
        { id: 'egg', icon: '🥚', type: 'organic', name: 'Egg Shell', hint: 'Good! Egg shells add calcium!' },
        { id: 'bottle', icon: '🥤', type: 'inorganic', name: 'Plastic Cup', hint: 'Oops! Plastic cannot be composted. Recycle it!' },
        { id: 'can', icon: '🥫', type: 'inorganic', name: 'Metal Can', hint: 'No! Metal doesn\'t rot. Recycle it!' },
        { id: 'glass', icon: '🥛', type: 'inorganic', name: 'Glass Jar', hint: 'Glass cannot be composted!' },
        { id: 'battery', icon: '🔋', type: 'inorganic', name: 'Battery', hint: 'Danger! E-waste is harmful to soil!' }
    ];

    // Audio Context (Mock for now, can be expanded)
    const audio = {
        correct: new Audio(), // Placeholder
        wrong: new Audio(),   // Placeholder
        playCorrect: () => console.log('Playing correct sound'),
        playWrong: () => console.log('Playing wrong sound')
    };

    // Initialize Game
    function initGame() {
        spawnWasteItem();
        spawnWasteItem();
        spawnWasteItem();
    }

    // Spawn a new waste item
    function spawnWasteItem() {
        if (elements.wasteSource.children.length >= 3) return; // Limit items on screen

        const randomWaste = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
        const itemEl = document.createElement('div');
        itemEl.classList.add('draggable-item');
        itemEl.textContent = randomWaste.icon;
        itemEl.setAttribute('draggable', 'true');
        itemEl.dataset.type = randomWaste.type;
        itemEl.dataset.name = randomWaste.name;
        itemEl.dataset.hint = randomWaste.hint;
        itemEl.id = 'waste-' + Date.now();

        // Drag Events
        itemEl.addEventListener('dragstart', handleDragStart);
        itemEl.addEventListener('dragend', handleDragEnd);

        // Touch Support (Basic implementation)
        // Note: Full touch support requires more robust pointer events or library for extensive testing

        elements.wasteSource.appendChild(itemEl);
    }

    // Drag Functionality
    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.setData('type', e.target.dataset.type);
        e.dataTransfer.setData('hint', e.target.dataset.hint);
        e.target.classList.add('dragging');
        elements.guideMessage.textContent = "Drag it to the bin!";
        gameState.dropHandled = false; // Reset flag
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        // Only show "Try again" if drop wasn't handled by the bin
        if (!gameState.dropHandled && !e.target.classList.contains('consumed')) {
            elements.guideMessage.textContent = "Try again!";
        }
    }

    // Drop Zone Events
    elements.compostBin.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
        elements.compostBin.classList.add('drag-hover');
        elements.compostBin.classList.add('open');
    });

    elements.compostBin.addEventListener('dragleave', () => {
        elements.compostBin.classList.remove('drag-hover');
        elements.compostBin.classList.remove('open');
    });

    elements.compostBin.addEventListener('drop', handleDrop);

    function handleDrop(e) {
        e.preventDefault();
        elements.compostBin.classList.remove('drag-hover');
        elements.compostBin.classList.remove('open');
        gameState.dropHandled = true; // Mark as handled

        const id = e.dataTransfer.getData('text/plain');
        const type = e.dataTransfer.getData('type');
        const hint = e.dataTransfer.getData('hint');
        const itemEl = document.getElementById(id);

        if (type === 'organic') {
            // Correct!
            handleCorrectDrop(itemEl, hint);
        } else {
            // Incorrect!
            handleIncorrectDrop(itemEl, hint);
        }
    }

    function handleCorrectDrop(item, hint) {
        item.remove(); // Consume item
        audio.playCorrect();

        // Update Stats
        gameState.score += 10;
        gameState.compostLevel += 10;

        // Cap compost level
        if (gameState.compostLevel > 100) gameState.compostLevel = 100;

        updateUI(hint);
        checkProgression();

        // Spawn new item after delay
        setTimeout(spawnWasteItem, 500);
    }

    function handleIncorrectDrop(item, hint) {
        // Animation for rejection (shake)
        item.style.animation = "shake 0.5s";
        item.addEventListener('animationend', () => {
            item.style.animation = "";
        });

        audio.playWrong();
        elements.guideMessage.textContent = hint;
        elements.guideMessage.parentElement.style.backgroundColor = "#ffebee"; // Light red warning
        setTimeout(() => {
            elements.guideMessage.parentElement.style.backgroundColor = "var(--light-green)";
        }, 2000);
    }

    function updateUI(message) {
        elements.scoreDisplay.textContent = gameState.score;
        elements.compostFill.style.height = gameState.compostLevel + '%';
        elements.guideMessage.textContent = message || "Good job! Keep going!";
    }

    function checkProgression() {
        // Determine Stage
        let newStage = 0;
        if (gameState.compostLevel >= gameState.levelThresholds[3]) newStage = 3;
        else if (gameState.compostLevel >= gameState.levelThresholds[2]) newStage = 2;
        else if (gameState.compostLevel >= gameState.levelThresholds[1]) newStage = 1;

        if (newStage > gameState.stage) {
            gameState.stage = newStage;
            elements.stageNameDisplay.textContent = gameState.stageNames[newStage];
            announceLevelUp();
            growGarden();
        }
    }

    function announceLevelUp() {
        const msg = `Level Up! Now entering: ${gameState.stageNames[gameState.stage]}!`;
        elements.guideMessage.textContent = msg;
        // Visual flair can be added here
    }

    function growGarden() {
        // Add a plant visualization based on stage
        const plantEmojis = ["🌱", "🌿", "🌻", "🌳"];
        const plant = document.createElement('div');
        plant.classList.add('plant');
        plant.textContent = plantEmojis[gameState.stage];
        elements.gardenPlants.appendChild(plant);
    }

    // CSS for shake animation (injecting dynamically or could be in CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);

    // Start
    initGame();
});
