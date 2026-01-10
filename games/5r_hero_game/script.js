/**
 * 5R Hero Mission - Game Logic
 */

// --- Game State ---
const gameState = {
    currentLevel: 1,
    score: 0,
    unlockedLevels: 1,
    maxLevels: 5,
    audioEnabled: true
};

// --- Sound Manager ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundManager = {
    playTone: (freq, type, duration) => {
        if (!gameState.audioEnabled) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = type;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
    },
    playSuccess: () => {
        soundManager.playTone(600, 'sine', 0.1);
        setTimeout(() => soundManager.playTone(800, 'sine', 0.1), 100);
        setTimeout(() => soundManager.playTone(1000, 'sine', 0.2), 200);
    },
    playFail: () => {
        soundManager.playTone(300, 'sawtooth', 0.2);
        setTimeout(() => soundManager.playTone(200, 'sawtooth', 0.2), 150);
    },
    playClick: () => {
        soundManager.playTone(400, 'triangle', 0.05);
    }
};

// Unlock Audio on interaction
document.body.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });

// --- DOM Elements ---
const screens = {
    start: document.getElementById('start-screen'),
    levelSelect: document.getElementById('level-select-screen'),
    game: document.getElementById('game-screen'),
    complete: document.getElementById('level-complete-screen')
};

const hud = document.getElementById('game-hud');
const scoreDisplay = document.getElementById('score-display');
const levelCards = document.querySelectorAll('.level-card');
const gameArea = document.getElementById('game-area');
const dialogueBox = document.getElementById('dialogue-box');
const dialogueText = document.getElementById('dialogue-text');
const choicesContainer = document.getElementById('choices-container');

// --- Initialization ---
function init() {
    setupEventListeners();
    updateLevelMap();
}

function setupEventListeners() {
    document.getElementById('play-btn').addEventListener('click', () => {
        soundManager.playClick();
        gameState.score = 0;
        document.getElementById('score-display').innerText = 0;
        switchScreen('levelSelect');
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
        soundManager.playClick();
        switchScreen('levelSelect');
    });

    // Back to Map Button
    const mapBtn = document.getElementById('back-to-map-btn');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            soundManager.playClick();
            switchScreen('levelSelect');
        });
    }

    // Restart Button (HUD)
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            soundManager.playClick();
            startLevel(gameState.currentLevel);
        });
    }

    // Replay Button (Level Complete)
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            soundManager.playClick();
            startLevel(gameState.currentLevel);
        });
    }

    document.getElementById('next-level-btn').addEventListener('click', () => {
        soundManager.playClick();
        if (gameState.currentLevel < gameState.maxLevels) {
            startLevel(gameState.currentLevel + 1);
        } else {
            switchScreen('start'); // Loop back to start for now
        }
    });

    levelCards.forEach(card => {
        card.addEventListener('click', () => {
            const level = parseInt(card.dataset.level);
            if (level <= gameState.unlockedLevels) {
                soundManager.playClick();
                startLevel(level);
            }
        });
    });
}

// --- Navigation ---
function switchScreen(screenName) {
    // Hide all
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    hud.classList.add('hidden');

    // Show target
    if (screenName === 'game') {
        screens.game.classList.remove('hidden');
        hud.classList.remove('hidden');
    } else {
        screens[screenName].classList.remove('hidden');
    }

    // Special logic
    if (screenName === 'levelSelect') {
        updateLevelMap();
    }
}

function updateLevelMap() {
    levelCards.forEach(card => {
        const level = parseInt(card.dataset.level);
        if (level <= gameState.unlockedLevels) {
            card.classList.remove('locked');
            card.style.opacity = '1';
        } else {
            card.classList.add('locked');
        }
    });
}

// --- Level Logic Hub ---
function startLevel(level) {
    gameState.currentLevel = level;
    document.getElementById('level-title').innerText = `Level ${level}: ${getLevelName(level)}`;
    switchScreen('game');

    // Clear previous content
    gameArea.innerHTML = '';
    dialogueBox.classList.add('hidden');

    // Load specific level logic
    if (level === 1) loadRefuseLevel();
    else if (level === 2) loadReduceLevel();
    else if (level === 3) loadReuseLevel();
    else if (level === 4) loadRepairLevel();
    else if (level === 5) loadRecycleLevel();
}

function getLevelName(n) {
    return ["Refuse", "Reduce", "Reuse", "Repair", "Recycle"][n - 1];
}

// --- Shared Gameplay Helpers ---
function showDialogue(text, choices) {
    dialogueBox.classList.remove('hidden');
    dialogueText.innerText = text;
    choicesContainer.innerHTML = '';

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        if (choice.secondary) btn.classList.add('secondary');
        btn.innerText = choice.text;
        btn.onclick = () => {
            soundManager.playClick();
            choice.action();
        };
        choicesContainer.appendChild(btn);
    });
}

function handleSuccess(msg) {
    soundManager.playSuccess();
    gameState.score += 100;
    scoreDisplay.innerText = gameState.score;
    // Unlock next
    if (gameState.currentLevel === gameState.unlockedLevels && gameState.currentLevel < gameState.maxLevels) {
        gameState.unlockedLevels++;
    }

    document.getElementById('level-complete-msg').innerText = msg;
    switchScreen('complete');
}

function handleFailure(msg) {
    soundManager.playFail();
    // Use showDialogue logic directly to overwrite existing
    dialogueText.innerText = "Oops! " + msg;
    choicesContainer.innerHTML = '';

    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = "Try Again 🔄";
    btn.onclick = () => {
        soundManager.playClick();
        startLevel(gameState.currentLevel);
    };
    choicesContainer.appendChild(btn);
}

// --- Data Pools for Randomization ---
const refuseData = [
    { icon: '🥤', text: 'plastic straw', fail: 'Plastic straws hurt sea life!', win: 'No thanks! I sip directly.' },
    { icon: '🛍️', text: 'plastic bag', fail: 'Plastic bags clog drains!', win: 'No thanks! I have my own bag.' },
    { icon: '🥡', text: 'styrofoam cup', fail: 'Styrofoam never biodegrades!', win: 'No thanks! I brought my fluid container.' },
    { icon: '🥄', text: 'plastic spoon', fail: 'Single-use spoons pollute beaches!', win: 'No thanks! I use metal spoons.' }
];

const reduceItems = [
    { id: 'tap', iconOn: '🚰', iconOff: '🚱', text: 'Water Running!', labelOff: 'Fixed!' },
    { id: 'light', iconOn: '💡', iconOff: '🌑', text: 'Lights On!', labelOff: 'Off' },
    { id: 'fan', iconOn: '🌪️', iconOff: '❌', text: 'Fan Running!', labelOff: 'Off' },
    { id: 'tv', iconOn: '📺', iconOff: '⬛', text: 'TV On!', labelOff: 'Off' }
];

const reuseData = [
    { type: 'jar', target: 'pantry', icon: '🫙', label: 'Glass Jar' },
    { type: 'bag', target: 'bag', icon: '🛍️', label: 'Plastic Bag' },
    { type: 'box', target: 'pantry', icon: '📦', label: 'Cardboard Box' },
    { type: 'bottle', target: 'bag', icon: '🧴', label: 'Shampoo Bottle' }
];

const recycleData = [
    { type: 'banana', target: 'compost', icon: '🍌' },
    { type: 'apple', target: 'compost', icon: '🍎' },
    { type: 'bottle', target: 'recycle', icon: '🧴' },
    { type: 'paper', target: 'recycle', icon: '📰' },
    { type: 'can', target: 'recycle', icon: '🥫' },
    { type: 'battery', target: 'haz', icon: '🔋' },
    { type: 'bulb', target: 'haz', icon: '💡' }
];

// --- Specific Level Implementations (Randomized) ---

function setupDragAndDropLogic(containerId, onComplete) {
    let selectedItem = null;
    const items = document.querySelectorAll(`#${containerId} .drag-item`);
    const zones = document.querySelectorAll('.drop-zone');
    const feedback = document.querySelector('.hint-text');

    items.forEach(item => {
        item.onclick = () => {
            soundManager.playClick();
            items.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedItem = item;
            if (feedback) feedback.innerText = "Now tap the correct bin/place.";
        };
    });

    zones.forEach(zone => {
        zone.onclick = () => {
            if (!selectedItem) return;
            soundManager.playClick();

            const targetId = selectedItem.dataset.target;
            const zoneId = zone.dataset.id;

            if (targetId === zoneId) {
                // Correct
                selectedItem.style.visibility = 'hidden';
                selectedItem.classList.remove('selected');
                selectedItem = null;

                // Animation
                zone.style.transform = "scale(1.2)";
                setTimeout(() => zone.style.transform = "scale(1)", 200);

                const remaining = Array.from(items).filter(i => i.style.visibility !== 'hidden').length;
                if (remaining === 0) onComplete(0);
                else if (feedback) feedback.innerText = "Correct! Keep going.";
            } else {
                if (feedback) feedback.innerText = "Oops! Try again.";
                soundManager.playFail();
            }
        };
    });
}

function loadRefuseLevel() {
    // Level 1: Refuse (Randomized)
    const scenario = refuseData[Math.floor(Math.random() * refuseData.length)];

    gameArea.innerHTML = `<div class='scenario-box'>
        <div style='font-size:6rem'>${scenario.icon}</div>
        <h2>A shopkeeper offers you a ${scenario.text}.</h2>
    </div>`;

    showDialogue(`The shopkeeper gives you a ${scenario.text}. What do you do?`, [
        { text: "Take it", action: () => handleFailure(scenario.fail) },
        { text: "Refuse it!", action: () => handleSuccess(scenario.win) }
    ]);
}

function loadReduceLevel() {
    // Level 2: Reduce (Randomized items)
    const shuffled = [...reduceItems].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    let activeCount = 2;

    gameArea.innerHTML = `
        <div class="scene-room">
            <h2>Tap objects to reduce waste!</h2>
            <div class="room-items">
                ${selected.map(item => `
                    <div id="item-${item.id}" class="interactive-item on" data-id="${item.id}">
                        <span class="icon">${item.iconOn}</span>
                        <span class="label">${item.text}</span>
                    </div>
                `).join('')}
            </div>
            <p id="room-feedback" class="hint-text">Find 2 things to fix...</p>
        </div>
    `;

    setTimeout(() => {
        selected.forEach(item => {
            const el = document.getElementById(`item-${item.id}`);
            if (el) {
                el.onclick = () => {
                    if (!el.classList.contains('on')) return;
                    soundManager.playClick();
                    activeCount--;
                    el.classList.remove('on');
                    el.classList.add('off');
                    el.querySelector('.icon').innerText = item.iconOff;
                    el.querySelector('.label').innerText = item.labelOff;

                    if (activeCount === 0) {
                        const feedback = document.getElementById('room-feedback');
                        feedback.innerText = "Great job! Resources saved.";
                        setTimeout(() => handleSuccess("Excellent! You reduced household waste."), 1000);
                    }
                };
            }
        });
    }, 0);
}

function loadReuseLevel() {
    // Level 3: Reuse (Randomized)
    const shuffled = [...reuseData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);

    gameArea.innerHTML = `
        <div class="scene-market">
            <h2>Don't throw it away! Reuse it.</h2>
            <div class="drag-container" id="reuse-items">
                ${selected.map(item => `
                    <div class="drag-item" data-type="${item.type}" data-target="${item.target}">${item.icon}</div>
                `).join('')}
            </div>
            <div class="drop-zones">
                <div class="drop-zone" data-id="trash">
                    <span style="font-size:2.5rem">🗑️</span>
                    <span>Trash</span>
                </div>
                <div class="drop-zone" data-id="pantry">
                    <span style="font-size:2.5rem">🧊</span>
                    <span>Pantry</span>
                </div>
                <div class="drop-zone" data-id="bag">
                    <span style="font-size:2.5rem">🎒</span>
                    <span>Keep</span>
                </div>
            </div>
            <p class="hint-text">Tap item, then tap where it goes.</p>
        </div>
    `;

    setupDragAndDropLogic('reuse-items', (leftCount) => {
        if (leftCount === 0) {
            handleSuccess("Perfect! Reusing saves money and the planet.");
        }
    });
}

function loadRepairLevel() {
    // Level 4: Repair (Drag & Drop)
    // Randomize initial positions widely around the bench
    const getRandomPos = () => {
        const edge = Math.random() > 0.5 ? 'left' : 'right';
        const x = Math.random() * 80 + 10; // 10% to 90%
        return { [edge]: '-50px', top: `${Math.random() * 80 + 10}%` };
    };

    gameArea.innerHTML = `
        <div class="repair-scene" style="user-select: none;">
            <h2>Drag parts to fix the robot!</h2>
            <div class="repair-bench" id="robot-target">
                <div class="toy-body" style="font-size: 8rem;">🔲</div>
                <!-- Parts injected here but positioned absolutely relative to container -->
            </div>
            <!-- Scattered Parts Container (Overlay) -->
            <div id="parts-layer" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;">
                <div class="toy-part draggable" data-slot="fixed-head" style="top: 10%; left: 10%;">🤖</div>
                <div class="toy-part draggable" data-slot="fixed-arm-l" style="top: 80%; left: 15%;">🦾</div>
                <div class="toy-part draggable" data-slot="fixed-arm-r" style="top: 20%; right: 10%;">🦾</div>
                <div class="toy-part draggable" data-slot="fixed-leg-l" style="top: 80%; right: 20%;">🦿</div>
                <div class="toy-part draggable" data-slot="fixed-leg-r" style="top: 50%; right: 5%;">🦿</div>
            </div>
        </div>
    `;

    const parts = document.querySelectorAll('.draggable');
    const target = document.getElementById('robot-target');
    let completedCount = 0;
    const totalParts = parts.length;

    parts.forEach(part => {
        // Randomize start pos
        part.style.pointerEvents = 'auto'; // Re-enable pointer events

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const startDrag = (e) => {
            if (part.classList.contains('fixed')) return;
            e.preventDefault();

            isDragging = true;
            part.classList.add('dragging');
            soundManager.playClick();

            // Get pointer relative to the document
            startX = e.clientX || e.touches[0].clientX;
            startY = e.clientY || e.touches[0].clientY;

            // Get current element position
            const rect = part.getBoundingClientRect();
            // We need to work with offsets relative to parent if using absolute, 
            // but for simple drag, we can use transform translate during drag
            // or update top/left directly. Let's update top/left relative to gameArea.

            // Convert rect to local coordinates of #game-area?
            // Simpler: Just use delta.
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

            const dx = clientX - startX;
            const dy = clientY - startY;

            // Apply temporary transform
            part.style.transform = `translate(${dx}px, ${dy}px) scale(1.2)`;
        };

        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            part.classList.remove('dragging');

            // Check intersection with Target
            const partRect = part.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();

            // Simple center-to-center distance check
            const partCenter = { x: partRect.left + partRect.width / 2, y: partRect.top + partRect.height / 2 };
            const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };

            const dist = Math.hypot(partCenter.x - targetCenter.x, partCenter.y - targetCenter.y);

            if (dist < 100) { // Threshold
                // Snap!
                soundManager.playSuccess(); // Small success sound
                part.style.transform = 'none'; // Reset drag transform

                // Move element into target container logic? 
                // Or just use the pre-defined fixed classes which position relative to robot-target (repair-bench)
                // wait, .fixed classes rely on parent being .repair-bench.
                // Currently parts are in #parts-layer. We must move them.

                target.appendChild(part);
                part.classList.add('fixed');
                part.classList.add(part.dataset.slot);

                // Reset inline styles that might conflict
                part.style.top = '';
                part.style.left = '';
                part.style.right = '';
                part.style.bottom = '';
                part.style.pointerEvents = 'none';

                completedCount++;
                if (completedCount === totalParts) {
                    setTimeout(() => handleSuccess("Robot Repaired! Good as new."), 500);
                }
            } else {
                // Revert
                soundManager.playFail();
                part.style.transform = 'none';
            }
        };

        // Pointer Events for Uni-input
        part.addEventListener('pointerdown', startDrag);
        // Attach move/up to document to handle fast drags
        document.addEventListener('pointermove', onDrag);
        document.addEventListener('pointerup', endDrag);
        // Cleanup listener on level switch? (Simplification: relying on garbage collection on DOM removal, 
        // strictly speaking we should removeEventListener but for this scope it's okay)
    });
}

function loadRecycleLevel() {
    // Level 5: Recycle (Randomized)
    const shuffled = [...recycleData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    gameArea.innerHTML = `
        <div class="scene-recycle">
            <h2>Sort the waste!</h2>
            <div class="drag-container" id="recycle-items">
                ${selected.map(item => `
                    <div class="drag-item" data-type="${item.type}" data-target="${item.target}">${item.icon}</div>
                `).join('')}
            </div>
            <div class="drop-zones">
                <div class="drop-zone recycle-bin-zone" data-id="compost">
                    <span style="font-size:2rem">🍃</span>
                    <span>Wet</span>
                </div>
                <div class="drop-zone recycle-bin-zone" data-id="recycle">
                    <span style="font-size:2rem">♻️</span>
                    <span>Dry</span>
                </div>
                <div class="drop-zone recycle-bin-zone" data-id="haz">
                    <span style="font-size:2rem">☠️</span>
                    <span>Haz</span>
                </div>
            </div>
            <p class="hint-text">Green=Wet, Blue=Dry, Red=Hazardous</p>
        </div>
    `;

    setupDragAndDropLogic('recycle-items', (leftCount) => {
        if (leftCount === 0) {
            handleSuccess("You are a 5R Champion! The world is cleaner now.");
        }
    });
}

// Start
init();
