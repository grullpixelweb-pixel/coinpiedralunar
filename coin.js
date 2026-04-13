import * as THREE from 'three';

let scene, camera, renderer, coin;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotationX = 0;
let targetRotationY = 0;
let isTossing = false;

const container = document.getElementById('coin-canvas-container');
const loaderElement = document.getElementById('loader');

function init() {
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x00d2ff, 50);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Load Textures
    const textureLoader = new THREE.TextureLoader();
    
    Promise.all([
        textureLoader.loadAsync('assets/heads.png'),
        textureLoader.loadAsync('assets/moon.png')
    ]).then(([headsTex, moonTex]) => {
        createCoin(headsTex, moonTex);
        loaderElement.style.display = 'none';
        animate();
    });

    setupInteraction();
}

function createCoin(headsTex, moonTex) {
    // Cylinder geometry: radiusTop, radiusBottom, height, radialSegments
    const geometry = new THREE.CylinderGeometry(2, 2, 0.2, 64);
    
    // Materials: 0: Side, 1: Top (Heads), 2: Bottom (Moon)
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 }), // Side
        new THREE.MeshStandardMaterial({ map: headsTex, metalness: 0.7, roughness: 0.3 }),  // Top
        new THREE.MeshStandardMaterial({ map: moonTex, metalness: 0.7, roughness: 0.3 })   // Bottom
    ];

    coin = new THREE.Mesh(geometry, materials);
    
    // Rotate to face camera (initially flat)
    coin.rotation.x = Math.PI / 2;
    scene.add(coin);
}

function setupInteraction() {
    container.addEventListener('pointerdown', (e) => {
        if (isTossing) return;
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging || isTossing) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        // Rotation based on movement
        // We update the target rotation or update directly
        coin.rotation.z += deltaMove.x * 0.01;
        coin.rotation.x += deltaMove.y * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
    });

    // Toss Button
    const tossButton = document.getElementById('toss-button');
    tossButton.addEventListener('click', tossCoin);

    // Resize handling
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function tossCoin() {
    if (isTossing) return;
    isTossing = true;

    const duration = 2000;
    const startTime = performance.now();
    const result = Math.random() > 0.5 ? 0 : Math.PI; // 0 for heads, PI for moon

    const initialRotationX = coin.rotation.x;
    const initialRotationZ = coin.rotation.z;
    const spins = 10 + Math.floor(Math.random() * 5);

    function animateToss(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing out
        const ease = 1 - Math.pow(1 - progress, 3);

        // Rotation
        coin.rotation.x = initialRotationX + (spins * Math.PI * 2 + result) * ease;
        coin.rotation.z = initialRotationZ + (spins * Math.PI) * ease;
        
        // Jump effect
        const jumpHeight = Math.sin(progress * Math.PI) * 2;
        coin.position.y = jumpHeight;

        if (progress < 1) {
            requestAnimationFrame(animateToss);
        } else {
            isTossing = false;
            // Snap to final result clean
            coin.rotation.x %= Math.PI * 2;
            coin.position.y = 0;
        }
    }

    requestAnimationFrame(animateToss);
}

function animate() {
    requestAnimationFrame(animate);

    if (!isDragging && !isTossing) {
        // Subtle floating/idle rotation
        coin.rotation.y += 0.005;
    }

    renderer.render(scene, camera);
}

init();
