/**
 * Clean City Runner - Script
 * 
 * Core Game Logic:
 * 1. Infinite scrolling background (City/Park)
 * 2. Player logic (Run, Jump, Fall)
 * 3. Waste Spawning (Wet, Dry, Haz, E-waste)
 * 4. Collection & Sorting Mechanics
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_HEIGHT = 100; // Pixels from bottom
const BASE_SPEED = 5;

// State
let gameState = {
    isRunning: false,
    score: 0,
    lives: 3,
    speed: BASE_SPEED,
    frameCount: 0,
    heldItem: null
};

// Player Entity
const player = {
    x: 100,
    y: 0,
    width: 60,
    height: 90,
    dy: 0,
    isJumping: false,
    color: '#34495e'
};

// Assets & Sprites Logic
class BackgroundLayer {
    constructor(speedMod, color, type) {
        this.speedMod = speedMod;
        this.color = color;
        this.type = type; // 'city', 'clouds', 'trees'
        this.x = 0;
        this.elements = [];
        this.generateElements();
    }

    generateElements() {
        // Generate random buildings or trees
        if (this.type === 'city') {
            for (let i = 0; i < 20; i++) {
                this.elements.push({
                    x: i * 100 + Math.random() * 50,
                    y: 0, // from bottom
                    w: 60 + Math.random() * 80,
                    h: 100 + Math.random() * 200
                });
            }
        } else if (this.type === 'trees') {
            for (let i = 0; i < 15; i++) {
                this.elements.push({
                    x: i * 150 + Math.random() * 100,
                    w: 40,
                    h: 60 + Math.random() * 40
                });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                this.elements.push({
                    x: i * 300 + Math.random() * 200,
                    y: Math.random() * 150,
                    w: 100,
                    h: 40
                });
            }
        }
    }

    update(gameSpeed) {
        this.x -= gameSpeed * this.speedMod;
        // Wrap logic
        const width = 2000; // imaginary width
        if (this.x <= -width) this.x = 0;
    }

    draw(ctx, canvasHeight) {
        ctx.fillStyle = this.color;
        const groundY = canvasHeight - GROUND_HEIGHT;

        this.elements.forEach(el => {
            const drawX = el.x + this.x;

            // Loop wrap visual
            if (drawX < -200) {
                // If it went off screen left, usually we'd cycle it to right.
                // Simple infinite scroll hack: draw twice
            }

            // Draw based on type
            if (this.type === 'city') {
                ctx.fillRect(drawX, groundY - el.h, el.w, el.h);
                // Draw windows
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                if (Math.random() > 0.5) ctx.fillRect(drawX + 10, groundY - el.h + 10, 10, 10);
                if (Math.random() > 0.5) ctx.fillRect(drawX + 30, groundY - el.h + 30, 10, 10);
                ctx.fillStyle = this.color;
            } else if (this.type === 'trees') {
                // Trunk
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(drawX + 15, groundY - el.h / 2, 10, el.h / 2);
                // Leaves (Triangle)
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(drawX, groundY - el.h / 2);
                ctx.lineTo(drawX + 20, groundY - el.h);
                ctx.lineTo(drawX + 40, groundY - el.h / 2);
                ctx.fill();
            } else {
                // Clouds
                ctx.beginPath();
                ctx.arc(drawX, el.y, 30, 0, Math.PI * 2);
                ctx.arc(drawX + 40, el.y + 10, 40, 0, Math.PI * 2);
                ctx.arc(drawX + 80, el.y, 30, 0, Math.PI * 2);
                ctx.fill();
            }

            // Simple tiling for endless feeling
            // A real implementation would manage an array of active objects, popping/pushing.
            // For this scope, let's just draw a second set offset by 2000
            const drawX2 = drawX + 2000;
            if (drawX2 < 2000) { // Only draw if visible-ish
                if (this.type === 'city') {
                    ctx.fillRect(drawX2, groundY - el.h, el.w, el.h);
                } else if (this.type === 'trees') {
                    ctx.fillStyle = '#8d6e63';
                    ctx.fillRect(drawX2 + 15, groundY - el.h / 2, 10, el.h / 2);
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.moveTo(drawX2, groundY - el.h / 2);
                    ctx.lineTo(drawX2 + 20, groundY - el.h);
                    ctx.lineTo(drawX2 + 40, groundY - el.h / 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.arc(drawX2, el.y, 30, 0, Math.PI * 2);
                    ctx.arc(drawX2 + 40, el.y + 10, 40, 0, Math.PI * 2);
                    ctx.arc(drawX2 + 80, el.y, 30, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
    }
}

// Waste Manager
const WASTE_TYPES = {
    wet: { icon: '🍏', color: '#2ecc71', label: 'Wet' },
    dry: { icon: '🥤', color: '#3498db', label: 'Dry' },
    haz: { icon: '🔋', color: '#e74c3c', label: 'Haz' },
    ewaste: { icon: '💻', color: '#f1c40f', label: 'E-Waste' }
};

class WasteItem {
    constructor(canvasWidth) {
        this.x = canvasWidth;
        this.y = 0; // Will resolve to ground
        this.width = 40;
        this.height = 40;
        this.markedForDeletion = false;

        // Random Type
        const keys = Object.keys(WASTE_TYPES);
        this.typeKey = keys[Math.floor(Math.random() * keys.length)];
        this.data = WASTE_TYPES[this.typeKey];
    }

    update(speed) {
        this.x -= speed;
        if (this.x < -100) this.markedForDeletion = true;
    }

    draw(ctx, groundY) {
        this.y = groundY - 50; // sitting on ground

        // Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 35, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Icon
        ctx.font = '30px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(this.data.icon, this.x + 5, this.y + 30);
    }
}

// Background Layers
let bgLayers = [];
let wasteItems = [];
let nextSpawn = 0;

// Main Loop
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // UI Events
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', resetGame);

    // Controls
    window.addEventListener('keydown', handleInput);
    document.getElementById('game-container').addEventListener('mousedown', handleTouch);
    document.getElementById('game-container').addEventListener('touchstart', handleTouch, { passive: false });

    // Bin buttons
    document.querySelectorAll('.bin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent jump
            sortItem(btn.dataset.type);
        });
    });

    // Init Layers
    bgLayers = [
        new BackgroundLayer(0.2, '#ffffffaa', 'clouds'),
        new BackgroundLayer(0.5, '#b2dfdb', 'city'),
        new BackgroundLayer(1.0, '#27ae60', 'trees')
    ];

    // Start Loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = document.getElementById('game-container').offsetWidth;
    canvas.height = document.getElementById('game-container').offsetHeight;
    player.y = canvas.height - GROUND_HEIGHT - player.height; // Reset position
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.speed = BASE_SPEED;
    gameState.heldItem = null;
    wasteItems = [];
    nextSpawn = 0;
    updateUI();
}

function resetGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    startGame();
}

function handleInput(e) {
    if (!gameState.isRunning) return;

    // Jump
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !player.isJumping) {
        player.dy = JUMP_FORCE;
        player.isJumping = true;
        soundManager.playJump();
    }

    // Sort Keys (1,2,3,4)
    if (gameState.heldItem) {
        if (e.key === '1') sortItem('wet');
        if (e.key === '2') sortItem('dry');
        if (e.key === '3') sortItem('haz');
        if (e.key === '4') sortItem('ewaste');
    }
}

function handleTouch(e) {
    if (!gameState.isRunning) return;
    // Check if clicked inside game area (not on a button)
    if (!e.target.closest('.bin-btn')) {
        if (!player.isJumping) {
            player.dy = JUMP_FORCE;
            player.isJumping = true;
        }
    }
}

function sortItem(binType) {
    if (!gameState.heldItem) return;

    // Logic to check correctness
    const correct = gameState.heldItem.type === binType;
    if (correct) {
        gameState.score += 10;
        showFeedback(true, "Great! +10");
    } else {
        gameState.lives--;

        // Educational Hint
        let hint = "Oops!";
        const actualType = gameState.heldItem.type;
        if (actualType === 'wet') hint = "Food goes in Green!";
        else if (actualType === 'dry') hint = "Paper/Plastic in Blue!";
        else if (actualType === 'haz') hint = "Batteries are Hazardous (Red)!";
        else if (actualType === 'ewaste') hint = "Electronics in Yellow!";

        showFeedback(false, hint);
    }

    gameState.heldItem = null;
    updateUI();

    if (gameState.lives <= 0) gameOver();
}

function showFeedback(isPositive, text) {
    // Floating text logic will go here
    const overlay = document.getElementById('feedback-overlay');
    // ...
    console.log(text);
}

function gameOver() {
    gameState.isRunning = false;
    document.getElementById('final-score').innerText = gameState.score;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function updateUI() {
    document.getElementById('score-text').innerText = gameState.score;
    document.getElementById('lives-text').innerText = gameState.lives;

    const heldEl = document.getElementById('held-item');
    if (gameState.heldItem) {
        heldEl.classList.remove('hidden');
        document.getElementById('held-icon').innerText = gameState.heldItem.icon;
    } else {
        heldEl.classList.add('hidden');
    }
}

function update() {
    if (!gameState.isRunning) return;

    // Physics
    player.dy += GRAVITY;
    player.y += player.dy;

    // Ground Collision
    const floorY = canvas.height - GROUND_HEIGHT - player.height;
    if (player.y > floorY) {
        player.y = floorY;
        player.dy = 0;
        player.isJumping = false;
    }

    // Background
    bgLayers.forEach(layer => layer.update(gameState.speed));

    // Waste Spawning
    if (gameState.frameCount > nextSpawn) {
        wasteItems.push(new WasteItem(canvas.width));
        nextSpawn = gameState.frameCount + Math.random() * 200 + 100; // Random interval
        gameState.speed += 0.001; // Tiny speed up
    }
    gameState.frameCount++;

    // Waste Update & Collision
    wasteItems.forEach(item => {
        item.update(gameState.speed);

        // Collision
        if (!gameState.heldItem &&
            player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {

            // Collect
            gameState.heldItem = { type: item.typeKey, icon: item.data.icon };
            item.markedForDeletion = true;
            soundManager.playCollect(); // Placeholder
            updateUI();
        }
    });

    wasteItems = wasteItems.filter(i => !i.markedForDeletion);
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#d1f2eb');
    skyGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Backgrounds
    const groundLevel = canvas.height - GROUND_HEIGHT;
    bgLayers.forEach(layer => layer.draw(ctx, canvas.height));

    // Draw Ground
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, groundLevel, canvas.width, GROUND_HEIGHT);
    // Grass accent
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, groundLevel, canvas.width, 10);

    // Draw Waste
    wasteItems.forEach(item => item.draw(ctx, canvas.height - GROUND_HEIGHT));

    // Draw Player (Simple Eco Hero)
    // Body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Cape / Details
    ctx.fillStyle = '#e74c3c';
    if (gameState.isRunning) {
        // Simple run animation bob
        const bob = Math.sin(gameState.frameCount * 0.2) * 5;
        ctx.fillRect(player.x - 10, player.y + 10 + bob, 15, 30);
    }
}

// Sound Manager (Synthesized)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundManager = {
    enabled: true,
    playTone: (freq, type, duration, vol = 0.1) => {
        if (!soundManager.enabled) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = type;
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    playCollect: () => {
        soundManager.playTone(400, 'sine', 0.1);
        setTimeout(() => soundManager.playTone(600, 'sine', 0.1), 50);
    },
    playSuccess: () => {
        soundManager.playTone(500, 'sine', 0.1);
        setTimeout(() => soundManager.playTone(800, 'sine', 0.2), 100);
        setTimeout(() => soundManager.playTone(1200, 'sine', 0.4), 200);
    },
    playFail: () => {
        soundManager.playTone(300, 'sawtooth', 0.2);
        setTimeout(() => soundManager.playTone(200, 'sawtooth', 0.3), 150);
    },
    playJump: () => {
        soundManager.playTone(200, 'square', 0.1, 0.05);
    }
};

function showFeedback(isPositive, text) {
    const overlay = document.getElementById('feedback-overlay');

    // Create element
    const el = document.createElement('div');
    el.className = 'feedback-text';
    el.innerText = text;
    el.style.color = isPositive ? '#2ecc71' : '#e74c3c';
    el.style.left = '50%';
    el.style.top = '40%';
    el.style.transform = 'translate(-50%, -50%)';

    overlay.appendChild(el);
    overlay.classList.remove('hidden');

    // Play Sound
    if (isPositive) soundManager.playSuccess();
    else soundManager.playFail();

    // Remove after animation
    setTimeout(() => {
        el.remove();
        if (overlay.children.length === 0) overlay.classList.add('hidden');
    }, 1000);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Boot
init();
