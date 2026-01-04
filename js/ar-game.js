import * as THREE from 'https://unpkg.com/three@0.126.0/build/three.module.js';

// ==========================================
// 🌍 GLOBAL VARIABLES & CONSTANTS
// ==========================================
let camera, scene, renderer;
let video, videoTexture;
let handController = { x: 0, y: 0, isGrabbing: false, gesture: 'None' };
let score = 0;
let timeLeft = 180; // 3 minutes
let gameActive = false;
let trashItems = [];
let bins = [];
let heldItem = null;
let spawnInterval;
let timerInterval;

// DOM Elements
const uiLayer = {
    lobby: document.getElementById('lobby-screen'),
    tutorial: document.getElementById('tutorial-screen'),
    hud: document.getElementById('game-hud'),
    results: document.getElementById('results-screen'),
    score: document.getElementById('score'),
    timer: document.getElementById('timer'),
    feedback: document.getElementById('gesture-status'),
    progress: document.getElementById('progress-fill'),
    finalScore: document.getElementById('final-score'),
    handStatus: document.getElementById('hand-status-icon')
};

// Trash Types
const TRASH_TYPES = [
    { name: 'Plastic Bottle', type: 'recycle', color: 0x34d399 }, // Greenish
    { name: 'Banana Peel', type: 'compost', color: 0xfbbf24 },   // Yellow
    { name: 'Crumpled Paper', type: 'recycle', color: 0xffffff }, // White
    { name: 'Soda Can', type: 'recycle', color: 0x60a5fa },      // Blue
    { name: 'Apple Core', type: 'compost', color: 0xe11d48 },    // Red
    { name: 'Old Battery', type: 'landfill', color: 0x4b5563 },  // Grey
    { name: 'Wrapper', type: 'landfill', color: 0x9ca3af }       // Silver
];

// MediaPipe Setup
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
});
hands.onResults(onHandResults);

// ==========================================
// 🎮 GAME FLOW CONTROLLER
// ==========================================

function init() {
    setupUIListeners();
    // Default to Lobby
    showScreen('lobby');
}

function setupUIListeners() {
    document.getElementById('btn-start-ar').addEventListener('click', () => {
        showScreen('tutorial');
    });

    document.getElementById('btn-practice').addEventListener('click', startGame);
    document.getElementById('btn-exit').addEventListener('click', exitToLobby);

    // Pause / Resume would go here
}

function exitToLobby() {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);

    // Clean up scene
    trashItems.forEach(item => scene.remove(item.mesh));
    trashItems = [];

    // Hide Video Feed if needed (optional, keeping it for seamless re-entry)
    // video.style.display = 'none'; 

    showScreen('lobby');
}

function showScreen(screenName) {
    // Hide all
    Object.values(uiLayer).forEach(el => {
        if (el && el.classList) {
            el.classList.remove('active');
            el.classList.add('hidden');
        }
    });

    // Show target
    const target = uiLayer[screenName];
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}

async function startGame() {
    showScreen('hud');

    if (!renderer) {
        await initThreeJS();
        await initCamera();
    }

    resetGameVariables();
    gameActive = true;

    // Start Loops
    animate();
    startSpawning();
    startTimer();
}

function resetGameVariables() {
    score = 0;
    timeLeft = 180;
    trashItems.forEach(item => scene.remove(item.mesh));
    trashItems = [];
    updateScoreUI();
}

// ==========================================
// 📹 CAMERA & THREE.JS SETUP
// ==========================================

async function initThreeJS() {
    const container = document.createElement('div');
    container.id = 'three-container'; // Verify ID matches CSS
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '1';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0); // Eye level

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 5, 0);
    scene.add(dirLight);

    // Initial World Setup
    createBins();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createBins() {
    // We place 3 bins in front of the user
    // Recycle (Left), Compost (Center), Landfill (Right)
    const binConfig = [
        { type: 'recycle', color: 0x34d399, x: -1.5, label: 'Recycle' },
        { type: 'compost', color: 0xfbbf24, x: 0, label: 'Compost' },
        { type: 'landfill', color: 0x4b5563, x: 1.5, label: 'Landfill' }
    ];

    bins = binConfig.map(config => {
        const geometry = new THREE.CylinderGeometry(0.4, 0.3, 1, 32);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.9
        });
        const bin = new THREE.Mesh(geometry, material);
        bin.position.set(config.x, 0, -3); // 3 meters away

        // Label (Simple sprite or just context)
        bin.userData = { type: config.type, isBin: true };
        scene.add(bin);
        return bin;
    });
}

async function initCamera() {
    video = document.getElementById('input-video');

    try {
        let stream;
        try {
            // 0. Enumerate Devices to find "Back" or "Environment" camera ID directly
            // This bypasses flaky facingMode constraints on some Chrome versions
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            // Look for back/rear/environment
            const backCamera = videoDevices.find(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
            );

            if (backCamera) {
                console.log("Found Specific Back Camera:", backCamera.label);
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: backCamera.deviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
            } else {
                // No labeled back camera found, try standard constraint
                throw new Error("No labeled back camera found");
            }

        } catch (enumError) {
            console.warn("Enumeration strategy failed or no back camera found. Falling back to facingMode.", enumError);

            try {
                // 1. Try to force Rear Camera (Strict)
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { exact: "environment" } }
                });
            } catch (e1) {
                console.warn("Strict Rear failed", e1);
                try {
                    // 2. Rear Camera (Ideal)
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "environment" }
                    });
                } catch (e2) {
                    // 3. Last Resort: Any
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true
                    });
                }
            }
        }

        video.style.display = 'block';
        video.srcObject = stream;
        await video.play();

        // Start MediaPipe
        const cameraUtils = new Camera(video, {
            onFrame: async () => {
                await hands.send({ image: video });
            },
            width: video.videoWidth || 1280,   // Dynamic size
            height: video.videoHeight || 720
        });
        cameraUtils.start();

    } catch (error) {
        console.error("Camera Access Error:", error);

        let msg = "Camera Error: ";
        if (error.name === 'NotAllowedError') {
            msg += "Permission denied. Please allow camera access.";
        } else if (error.name === 'NotFoundError') {
            msg += "No camera device found.";
        } else if (error.name === 'NotReadableError') {
            msg += "Camera is in use by another app (Zoom, Teams, etc). Please close them and reload.";
        } else if (window.isSecureContext === false) {
            msg += "Secure Context required (HTTPS or localhost).";
        } else {
            msg += error.message || "Unknown error.";
        }

        alert(msg);
        showScreen('lobby');
    }
}


// ==========================================
// 🖐️ HAND GESTURE LOGIC
// ==========================================

function onHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // 1. Calculate Position (Normalized 0-1)
        // Use Index Finger Tip (8) as cursor
        const indexTip = landmarks[8];
        handController.x = (indexTip.x * 2) - 1; // Convert to NDC (-1 to 1)
        handController.y = -(indexTip.y * 2) + 1;

        // 2. Gesture Detection (Simple Grab)
        // Distance between Thumb Tip (4) and Index Tip (8)
        const thumbTip = landmarks[4];
        const dist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

        const wasGrabbing = handController.isGrabbing;
        handController.isGrabbing = dist < 0.05; // Threshold

        if (handController.isGrabbing && !wasGrabbing) {
            handController.gesture = 'Grab';
            attemptGrab();
        } else if (!handController.isGrabbing && wasGrabbing) {
            handController.gesture = 'Release';
            attemptDrop();
        }

        // Update UI Feedback
        const icon = handController.isGrabbing ? 'fa-hand-fist' : 'fa-hand';
        uiLayer.handStatus.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        uiLayer.handStatus.style.color = '#4ade80';

        // Move 3D Cursor (Visual debugger)
        updateCursor(handController.x, handController.y);
    } else {
        uiLayer.handStatus.innerHTML = `<i class="fa-solid fa-hand-holding"></i>`; // Lost tracking
        uiLayer.handStatus.style.color = '#ef4444';
    }
}

let cursorMesh;
function updateCursor(x, y) {
    if (!cursorMesh) {
        cursorMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true })
        );
        scene.add(cursorMesh);
    }
    // Reproject 2D to 3D roughly
    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = 2; // Arbitrary reach distance
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    cursorMesh.position.copy(pos);
}

// ==========================================
// ♻️ GAMEPLAY LOGIC (Spawn, Grab, Score)
// ==========================================

function startSpawning() {
    spawnInterval = setInterval(() => {
        if (trashItems.length < 5) {
            spawnTrash();
        }
    }, 3000);
}

function spawnTrash() {
    const type = TRASH_TYPES[Math.floor(Math.random() * TRASH_TYPES.length)];

    // Procedurally generate simple shape
    const geometry = new THREE.DodecahedronGeometry(0.2); // Low poly ball
    const material = new THREE.MeshPhongMaterial({ color: type.color });
    const mesh = new THREE.Mesh(geometry, material);

    // Random Position on 'floor'
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * 2; // 2-4 meters away
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 3; // Shift forward (-z)

    mesh.position.set(x, 0.2, z); // Floating slightly above ground

    // Animation float
    mesh.userData = {
        type: type.type,
        name: type.name,
        floatOffset: Math.random() * 100,
        originalY: 0.2
    };

    scene.add(mesh);
    trashItems.push({ mesh, type: type.type });
}

function attemptGrab() {
    if (heldItem) return; // Already holding something

    // Raycast from hand position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(-handController.x, handController.y), camera); // Mirror X

    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.name) {
            heldItem = obj;
            // Visual feedback
            showToast(`Grabbed ${obj.userData.name}!`);
            break;
        }
    }
}

function attemptDrop() {
    if (!heldItem) return;

    // Check if over a bin
    // Simple distance check to bins
    let closestBin = null;
    let minDist = 1.0; // 1 meter tolerance

    bins.forEach(bin => {
        const dist = heldItem.position.distanceTo(bin.position);
        if (dist < minDist) {
            minDist = dist;
            closestBin = bin;
        }
    });

    if (closestBin) {
        // Evaluate
        if (closestBin.userData.type === heldItem.userData.type) {
            showToast("Correct! +100");
            score += 100;
            updateScoreUI();
        } else {
            showToast("Wrong Bin! -50");
            score = Math.max(0, score - 50);
            updateScoreUI();
        }
        // Destroy Item
        scene.remove(heldItem);
        trashItems = trashItems.filter(t => t.mesh !== heldItem);
    } else {
        // Just dropped on ground
        showToast("Dropped.");
    }

    heldItem = null;
}

function updateScoreUI() {
    uiLayer.score.innerText = score;
    // fill progress bar mock
    const percent = Math.min(100, (score / 1000) * 100);
    uiLayer.progress.style.width = `${percent}%`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        uiLayer.timer.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
    uiLayer.finalScore.innerText = score;
    showScreen('results');
}

function showToast(msg) {
    const el = document.querySelector('.toast-message');
    el.innerText = msg;
    el.style.opacity = 1;
    setTimeout(() => el.style.opacity = 0, 2000);
}

// ==========================================
// 🔄 RENDER LOOP
// ==========================================

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);

    // Float animation for trash
    const time = Date.now() * 0.002;
    trashItems.forEach(item => {
        if (item.mesh !== heldItem) {
            item.mesh.position.y = item.mesh.userData.originalY + Math.sin(time + item.mesh.userData.floatOffset) * 0.1;
            item.mesh.rotation.y += 0.01;
        }
    });

    // Move held item with cursor
    if (heldItem && cursorMesh) {
        // Lerp to cursor position
        heldItem.position.lerp(cursorMesh.position, 0.2);
    }

    renderer.render(scene, camera);
}

// Start
init();
