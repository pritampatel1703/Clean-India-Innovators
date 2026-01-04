
// 3D Intro Animation Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the home page and the container exists
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // --- Random Message Logic ---
    const messages = [
        { title: "Swachh Bharat", text: "One step towards cleanliness, one giant leap for India." },
        { title: "Eco-Fact", text: "Plastic takes 450 years to decompose. Reuse and Recycle!" },
        { title: "Be a Hero", text: "Waste segregation is the first step to becoming a recycling hero." },
        { title: "Clean India", text: "Cleanliness is next to Godliness. Keep your surroundings pure." },
        { title: "Did You Know?", text: "Recycling one ton of paper saves 17 trees or 7,000 gallons of water!" },
        { title: "Stop Littering", text: "Every piece of trash you pick up helps save our planet." },
        { title: "Go Green", text: "There is no Planet B. Act now for a sustainable future." }
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    const leftPageTitle = document.querySelector('.page-left h2');
    const rightPageText = document.querySelector('.page-right p');

    if (leftPageTitle) leftPageTitle.textContent = randomMsg.title;
    if (rightPageText) rightPageText.textContent = randomMsg.text;

    // --- 1. SETUP THREE.JS ---
    const scene = new THREE.Scene();

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Ensure the canvas sits on top
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Bright ambient
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // --- 2. LOAD MODELS ---
    const loader = new THREE.GLTFLoader();

    let crumpledPaper = null;
    let plainPage = null;
    let loadedModels = 0;

    function checkLoad() {
        loadedModels++;
        if (loadedModels === 2) {
            playIntroAnimation();
        }
    }

    // Load Crumpled Paper and handle potential errors
    loader.load('assests/3d%20model/crumbled_paper.glb', (gltf) => {
        crumpledPaper = gltf.scene;
        crumpledPaper.scale.set(20, 20, 20);
        crumpledPaper.visible = false;
        scene.add(crumpledPaper);
        checkLoad();
    }, undefined, (error) => {
        console.error('Error loading crumpled paper:', error);
    });

    // Load Plain Page
    loader.load('assests/3d%20model/Meshy_AI_crumbled_plain_page_0103085721_texture.glb', (gltf) => {
        plainPage = gltf.scene;
        plainPage.scale.set(15, 15, 15);
        plainPage.rotation.x = Math.PI / 2; // Flat facing camera
        plainPage.visible = false;
        scene.add(plainPage);
        checkLoad();
    }, undefined, (error) => {
        console.error('Error loading plain page:', error);
    });

    // --- Responsive Layout Logic ---
    function getResponsiveSettings() {
        const width = window.innerWidth;
        if (width < 768) {
            // Mobile Settings
            return {
                paperScale: 2.5,
                paperY: 0,
                msgScale: 0.6,
                dustbinX: 2.2,     // Tucked in
                dustbinY: -2.5,    // Lower on mobile
                dustbinScale: 0.5
            };
        } else {
            // Desktop Settings
            return {
                paperScale: 4.5,
                paperY: 0,
                msgScale: 1,
                dustbinX: 5.5,     // Just to the right of the center-right image
                dustbinY: -1.0,    // Vertically aligned with typical image center
                dustbinScale: 1
            };
        }
    }
    
    // Calculate dustbin position in 3D space based on HTML element position
    function calculateDustbinPosition() {
        const dustbinElement = document.querySelector('.hero-dustbin');
        if (!dustbinElement) {
            // Fallback to responsive settings if element not found
            return getResponsiveSettings();
        }
        
        // Get the dustbin's position on screen
        const rect = dustbinElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Convert screen coordinates to normalized device coordinates (-1 to 1)
        const normalizedX = (centerX / window.innerWidth) * 2 - 1;
        const normalizedY = -(centerY / window.innerHeight) * 2 + 1;
        
        // Convert to 3D world coordinates based on camera
        // Camera is at z=10, so we need to project the point
        const distance = 10;
        const fov = 45;
        const aspect = window.innerWidth / window.innerHeight;
        const fovRad = (fov * Math.PI) / 180;
        const height = 2 * Math.tan(fovRad / 2) * distance;
        const width = height * aspect;
        
        const worldX = (normalizedX * width) / 2;
        const worldY = (normalizedY * height) / 2;
        
        // Get base settings for other values
        const baseSettings = getResponsiveSettings();
        
        return {
            ...baseSettings,
            dustbinX: worldX,
            dustbinY: worldY
        };
    }

    let settings = getResponsiveSettings();
    let animationComplete = false; // Track if exit animation is complete
    let hasTriggered = false; // Track if scroll has been triggered
    
    // ===== ANIMATION DURATION SETTINGS =====
    // Change this value to adjust how long the paper takes to reach the dustbin
    const PAPER_THROW_DURATION = 2; // Duration in seconds (e.g., 1, 2, 5, etc.)
    // ========================================

    // --- 3. ANIMATION SEQUENCE ---
    function playIntroAnimation() {
        settings = getResponsiveSettings(); // Update on play

        const msg = document.getElementById('message-container');

        // Initial States
        crumpledPaper.position.set(-8, -6, 0); // Start off-screen bottom-left
        crumpledPaper.rotation.set(0, 0, 0);
        crumpledPaper.visible = true;

        plainPage.visible = false;
        plainPage.scale.set(0, 0, 0);
        plainPage.position.set(0, 0, 0);

        // GSAP Timeline
        const tl = gsap.timeline();

        // Step 1: Throw
        tl.to(crumpledPaper.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.5,
            ease: "power2.out"
        }, "start");

        tl.to(crumpledPaper.rotation, {
            x: Math.PI * 2,
            y: Math.PI * 2,
            duration: 1.5,
            ease: "power2.out"
        }, "start");

        // Step 2: Swap
        tl.call(() => {
            crumpledPaper.visible = false;
            plainPage.visible = true;
        });

        // Step 3: Open (Responsive Scale)
        tl.to(plainPage.scale, {
            x: settings.paperScale,
            y: settings.paperScale,
            z: settings.paperScale,
            duration: 0.6,
            ease: "back.out(1.5)"
        });

        tl.to(plainPage.rotation, {
            x: Math.PI / 2 + 0.2, // Slight tilt
            y: Math.PI / 2, // Rotate 90 degrees on Y
            z: Math.PI / 2,
            duration: 0.6
        }, "<");

        // Step 4: Show Message
        tl.to(msg, {
            opacity: 1,
            // transform: `translate(-50%, -50%)`, // handled by CSS now for better response
            duration: 0.5,
            ease: "back.out"
        });
        
        // Step 5: Show Scroll Indicator (after message appears)
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            tl.to(scrollIndicator, {
                opacity: 1,
                duration: 0.5,
                delay: 0.5
            }, ">");
        }
    }

    // --- Dustbin (2D Image in 3D Space) ---
    // Removed 3D Plane Mesh - Using HTML element instead


    function updateDustbinLayout() {
        settings = getResponsiveSettings();
        if (dustbinMesh) {
            dustbinMesh.position.set(settings.dustbinX, settings.dustbinY, 0);
            // Update scale if needed, or just position
            const newSize = 5 * settings.dustbinScale;
            dustbinMesh.scale.set(1, 1, 1); // Reset scale to 1 before applying if generic
            // Better to recreate geometry or scale mesh? Scaling mesh is cheaper.
            // Let's just update scale relative to original 5x5
            dustbinMesh.geometry.dispose();
            dustbinMesh.geometry = new THREE.PlaneGeometry(newSize, newSize);
        }
    }



    // --- 4. EXIT ANIMATION ---
    window.playExitAnimation = function () {
        // Calculate dustbin position dynamically based on actual HTML element position
        settings = calculateDustbinPosition();
        const msg = document.getElementById('message-container');
        const blurOverlay = document.getElementById('blur-overlay');

        // Prevent scrolling on the page
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        const tl = gsap.timeline({
            onComplete: () => {
                document.getElementById('canvas-container').style.display = 'none';
                document.getElementById('message-container').style.display = 'none';
                if (blurOverlay) blurOverlay.style.display = 'none';
                // Re-enable scrolling after animation completes
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
                // Mark animation as complete
                animationComplete = true;
            }
        });

        // Step 1: Hide Message and Crumple Back simultaneously (0.1s)
        tl.to(msg, { opacity: 0, duration: 0.1 }, "start");
        tl.to(plainPage.scale, {
            x: 0, y: 0, z: 0, duration: 0.1, ease: "power2.in"
        }, "start");

        // Step 2: Swap (instant)
        tl.call(() => {
            plainPage.visible = false;
            crumpledPaper.visible = true;
            crumpledPaper.position.set(0, 0, 0);
            crumpledPaper.rotation.set(0, 0, 0);
        });

        // Step 3: Throw to Dustbin behind it - all happen together
        tl.to(crumpledPaper.position, {
            x: settings.dustbinX + 1, // Position behind dustbin
            y: settings.dustbinY,
            z: -0.5, // Behind the dustbin
            duration: PAPER_THROW_DURATION,
            ease: "power2.in"
        }, "throw");

        tl.to(crumpledPaper.rotation, {
            x: Math.PI * 2, y: Math.PI * 2, duration: PAPER_THROW_DURATION
        }, "throw");

        // Step 4: Gradually remove blur effect (starts with throw, completes by end)
        if (blurOverlay) {
            // Animate blur from 10px to 0px and opacity from 1 to 0
            tl.to(blurOverlay, {
                opacity: 0,
                duration: PAPER_THROW_DURATION,
                ease: "power2.in",
                onUpdate: function() {
                    // Animate backdrop-filter blur value
                    const progress = this.progress();
                    const blurValue = 10 * (1 - progress);
                    blurOverlay.style.backdropFilter = `blur(${blurValue}px)`;
                    blurOverlay.style.webkitBackdropFilter = `blur(${blurValue}px)`;
                }
            }, "throw");
        }

        // Step 5: Fade out while throwing (starts near the end of throw)
        const fadeOutStart = Math.max(0, PAPER_THROW_DURATION - 0.3); // Start 0.3s before end
        tl.to(crumpledPaper.scale, {
            x: 0, y: 0, z: 0, duration: 0.3, ease: "power2.in"
        }, `throw+=${fadeOutStart}`);
    };

    // --- 5. SCROLL DETECTION ---
    // Prevent scrolling on the page from the start
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Detect scroll down gesture - simplified and more responsive
    function handleScrollDown(e) {
        if (hasTriggered || animationComplete) return;
        
        // Prevent default scrolling
        e.preventDefault();
        e.stopPropagation();
        
        // Detect scroll down (positive deltaY means scrolling down)
        // Lower threshold for immediate response
        if (e.deltaY > 30) {
            hasTriggered = true;
            if (typeof window.playExitAnimation === 'function') {
                window.playExitAnimation();
            }
            // Clean up listeners
            window.removeEventListener('wheel', handleScrollDown, { passive: false });
            window.removeEventListener('touchstart', handleTouchStart, { passive: false });
            window.removeEventListener('touchmove', handleTouchMove, { passive: false });
            return false;
        }
        return false;
    }
    
    // Also detect touch scroll for mobile devices
    let touchStartY = 0;
    function handleTouchStart(e) {
        if (hasTriggered || animationComplete) return;
        touchStartY = e.touches[0].clientY;
    }
    
    function handleTouchMove(e) {
        if (hasTriggered || animationComplete) return;
        
        // Prevent default scrolling
        e.preventDefault();
        e.stopPropagation();
        
        const touchEndY = e.touches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        
        // Swipe up (finger moving up on screen - positive deltaY)
        if (deltaY > 30) {
            hasTriggered = true;
            if (typeof window.playExitAnimation === 'function') {
                window.playExitAnimation();
            }
            window.removeEventListener('touchstart', handleTouchStart, { passive: false });
            window.removeEventListener('touchmove', handleTouchMove, { passive: false });
        }
        return false;
    }
    
    // Animation complete flag will be set in playExitAnimation's onComplete
    
    // Add event listeners after message appears (wait for animation)
    setTimeout(() => {
        // Add scroll wheel listener (non-passive to prevent scrolling)
        window.addEventListener('wheel', handleScrollDown, { passive: false });
        
        // Add touch listeners for mobile (non-passive to prevent scrolling)
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
    }, 2500); // Wait for message animation to complete

    // --- 6. RENDER LOOP ---
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);

        if (plainPage && plainPage.visible) {
            plainPage.position.y = Math.sin(Date.now() * 0.001) * 0.1;
        }
    }
    animate();

    // Resize Handle
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Recalculate settings with updated dustbin position
        settings = calculateDustbinPosition();
        updateDustbinLayout();

        if (plainPage && plainPage.visible && plainPage.scale.x > 0.1) {
            gsap.to(plainPage.scale, {
                x: settings.paperScale,
                y: settings.paperScale,
                z: settings.paperScale,
                duration: 0.3
            });
        }
    });
});
