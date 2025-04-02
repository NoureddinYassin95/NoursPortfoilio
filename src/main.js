// main.js
import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from './utils/OrbitsControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

// Get the button element from the HTML
const themeButton = document.getElementById('toggleEnv');

// Function to switch textures
let isNight = false;
const switchTextures = () => {
    isNight = !isNight;
    scene.traverse((child) => {
        if (child.isMesh) {
            Object.keys(textureMap).forEach((key) => {
                if (child.name === key) {
                    child.material.map = isNight ? loadedTextures.night[key] : loadedTextures.day[key];
                    if(child.material.map){child.material.needsUpdate = true;}
                }
                if (child.name === key + 'Night') {
                    child.material.map = isNight ? loadedTextures.night[key] : loadedTextures.day[key];
                    if(child.material.map){child.material.needsUpdate = true;}
                }
            });
        }
    });

    // Update button content based on isNight
    themeButton.textContent = isNight ? '☀️' : '🌙';
};

// Add event listener to the button
themeButton.addEventListener('click', switchTextures);

// Set initial button content
themeButton.textContent = '🌙'; // Start with sun



const modals = {
    about: document.querySelector('.about.modal'),
    contact: document.querySelector('.contact.modal'),
};

document.querySelectorAll('.modal-exit-button').forEach((button) => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = e.target.closest('.modal');
        hideModal(modal);
    });
});

let isModalOpen = false;
let animationFrameId;

const showModal = (modal) => {
    modal.style.display = 'block';
    isModalOpen = true;
    controls.enabled = false;
    if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
    }
    document.body.style.cursor = 'default';
    currentIntersects = [];
    gsap.set(modal, { opacity: 0 });
    gsap.to(modal, { opacity: 1, duration: 0.5 });
    cancelAnimationFrame(animationFrameId);
};

const hideModal = (modal) => {
    isModalOpen = false;
    controls.enabled = true;
    gsap.to(modal, { opacity: 0, duration: 0.5, onComplete: () => { modal.style.display = 'none'; } });
    animationFrameId = requestAnimationFrame(render);
};

Object.values(modals).forEach((modal) => {
    modal.querySelector('.modal-exit-button').addEventListener('click', () => {
        hideModal(modal);
    });
});

const raycaster = new THREE.Raycaster();
let currentIntersects = [];
let currentHoveredObject = null;

const socialLinks = {
    projects: "https://vimeo.com/user49153109",
    instagram: 'https://www.instagram.com/noor_y_95?igsh=bHM1enl0YjNieThq',
    linkedin: 'https://www.linkedin.com/in/noureddin-yassin/',
};

const pointer = new THREE.Vector2();
const RaycasterObjects = [];

const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
    .setPath('textures/skybox/')
    .load(['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp']);

const textureMap = {
    First: { day: '/texture/Room/day/FinalFirstTextureSetDay-1.webp', night: '/texture/Room/night/FinalFirstTextureSetNight-1.webp' },
    Second: { day: '/texture/Room/day/FinalSecondTextureSetDay.webp', night: '/texture/Room/night/FinalSecondTextureSetNight-2.webp' },
    Third: { day: '/texture/Room/day/FinalThirdTextureSetDay-1.webp', night: '/texture/Room/night/FinalThirdTextureSetNight-1.webp' },
    Fourth: { day: '/texture/Room/day/FinalFourthTextureSetDay-1.webp', night: '/texture/Room/night/FinalFourthTextureSetNight-1.webp' },
};

const loadedTextures = { day: {}, night: {} };

Object.entries(textureMap).forEach(([key, paths]) => {
    textureLoader.load(paths.day, (dayTexture) => {
        dayTexture.flipY = false;
        dayTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTextures.day[key] = dayTexture;
        dayTexture.minFilter = THREE.LinearFilter;
    });
    textureLoader.load(paths.night, (nightTexture) => {
        nightTexture.flipY = false;
        nightTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTextures.night[key] = nightTexture;
        nightTexture.minFilter = THREE.LinearFilter;
    });
});

const neonfontMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });

let lastPointerX = null;
let lastPointerY = null;
let hoveredObject = null;

window.addEventListener('mousemove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (lastPointerX !== pointer.x || lastPointerY !== pointer.y) {
        handleHover();
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
    }
});

window.addEventListener('click', handleRaycasterClick);
window.addEventListener('touchstart', onTouchStart);
window.addEventListener('touchend', handleRaycasterClick);

function onTouchStart(event) {
    if (isModalOpen) return;
    const touch = event.touches[0];
    pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    handleHover();
}

function handleHover() {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(RaycasterObjects);
    if (intersects.length > 0) {
        hoveredObject = intersects[0].object;
        document.body.style.cursor = 'pointer';
    } else {
        hoveredObject = null;
        document.body.style.cursor = 'default';
    }
}

function handleRaycasterClick() {
    if (hoveredObject && !isModalOpen) {
        Object.entries(socialLinks).forEach(([key, url]) => {
            if (hoveredObject.name.includes(key)) {
                const newWindow = window.open(url, '_blank');
                if (newWindow) { newWindow.opener = null; }
            }
        });
        if (hoveredObject.name.includes('projects')) {
            window.open(socialLinks.projects, '_blank');
        } else if (hoveredObject.name.includes('about')) {
            showModal(modals.about);
        } else if (hoveredObject.name.includes('contact')) {
            showModal(modals.contact);
        }
        hoveredObject = null;
    }
}

const canvas = document.querySelector('#experience-canvas');
const sizes = { width: window.innerWidth, height: window.innerHeight };
const scene = new THREE.Scene();
scene.background = new THREE.Color('#D9CAD1');
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 10;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(18.135466879967332, 13.579382542888288, 8.728309344992161);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
const defaultMinAzimuthAngle = -Math.PI / 3;
const defaultMaxAzimuthAngle = Math.PI / 100;
controls.minAzimuthAngle = defaultMinAzimuthAngle;
controls.maxAzimuthAngle = defaultMaxAzimuthAngle;
const shiftMinAzimuthAngle = -Math.PI / 6;
const shiftMaxAzimuthAngle = Math.PI / 6;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
window.addEventListener('keydown', (event) => {
    if (event.shiftKey) {
        controls.minAzimuthAngle = shiftMinAzimuthAngle;
        controls.maxAzimuthAngle = shiftMaxAzimuthAngle;
        controls.update();
    }
});
window.addEventListener('keyup', (event) => {
    if (event.shiftKey) {
        controls.minAzimuthAngle = defaultMinAzimuthAngle;
        controls.maxAzimuthAngle = defaultMaxAzimuthAngle;
        controls.update();
    }
});
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.1, 0.4);
bloomPass.strength = 0.1;
bloomPass.radius = 0.5;
bloomPass.threshold = 0.2;
composer.addPass(bloomPass);
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(sizes.width, sizes.height);
});
function playHoverAnimation(object, isHovering) {
    if (!object.userData) { object.userData = {}; }
    if (object.userData.isAnimating) return;
    object.userData.isAnimating = true;
    if (object.userData.tweening) { gsap.killTweensOf(object.scale); gsap.killTweensOf(object.rotation); gsap.killTweensOf(object.position); }
    object.userData.tweening = true;
    if (isHovering) {
        gsap.to(object.scale, { x: object.userData.initialScale.x * 1.2, y: object.userData.initialScale.y * 1.2, z: object.userData.initialScale.z * 1.2, duration: 0.5, ease: 'bounce.out(1.8)' });
        gsap.to(object.rotation, { x: object.userData.initialRotation.x + Math.PI / 8, duration: 0.5, ease: 'bounce.out(1.8)', onComplete: () => { object.userData.isAnimating = false; object.userData.tweening = false; } });
    } else {
        gsap.to(object.scale, { x: object.userData.initialScale.x, y: object.userData.initialScale.y, z: object.userData.initialScale.z, duration: 0.3, ease: 'bounce.out(1.8)' });
        gsap.to(object.rotation, { x: object.userData.initialRotation.x, duration: 0.3, ease: 'bounce.out(1.8)', onComplete: () => { object.userData.isAnimating = false; object.userData.tweening = false; } });
    }
}
const render = () => {
    controls.update();
    composer.render();
    if (!isModalOpen) {
        raycaster.setFromCamera(pointer, camera);
        currentIntersects = raycaster.intersectObjects(RaycasterObjects);
        let newHoveredObject = null;
        for (let i = 0; i < currentIntersects.length; i++) {
            const currentIntersectObject = currentIntersects[i].object;
            if (currentIntersectObject.name.includes('Pointer')) {
                newHoveredObject = currentIntersectObject;
                if (currentIntersectObject !== currentHoveredObject) {
                    if (currentHoveredObject) { playHoverAnimation(currentHoveredObject, false); }
                    playHoverAnimation(currentIntersectObject, true);
                    currentHoveredObject = currentIntersectObject;
                }
                document.body.style.cursor = 'pointer';
                break;
            }
        }
        if (newHoveredObject === null && currentHoveredObject !== null) {
            playHoverAnimation(currentHoveredObject, false);
            currentHoveredObject = null;
            document.body.style.cursor = 'default';
        }
    }
    animationFrameId = requestAnimationFrame(render);
};
loader.load('/models/BAZAAR15.glb', (glb) => {
    let instagramMesh = null;
    glb.scene.traverse((child) => {
        if (child.isMesh && child.name === 'instagram') {
            instagramMesh = child;
        }
        if (child.isMesh) {
            child.userData.initialScale = new THREE.Vector3().copy(child.scale);
            child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            if (child.name.includes('glass') || child.name === 'windows' || child.name === 'jar.004') {
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes('Hover') || child.name.includes('instagram') || child.name.includes('linkedin') || child.name.includes('about') || child.name.includes('contact') || child.name.includes('projects') || child.name.includes('Key')) {
                if (child.name === 'instagram' && (!textureMap.Fourth || !loadedTextures.day.Fourth)) {
                    console.error('Textures for instagram not loaded for:', child.name);
                } else {
                    child.material = neonfontMaterial;
                    console.log('Applied neonfont material to:', child.name);
                }
            } else if (child.name.includes('neonfont') || child.name === 'projects' || child.name === 'about' || child.name === 'contact' || child.name.includes('Pointer')) {
                child.material = neonfontMaterial;
                console.log('Neon material applied to:', child.name);
                RaycasterObjects.push(child);
            } else {
                Object.keys(textureMap).forEach((key) => {
                    if (child.name === key) {
                        const material = new THREE.MeshBasicMaterial({
                            map: loadedTextures.day[key],
                        });
                        child.material = material;
                        console.log('Applied day texture', key, 'to mesh', child.name);
                    }
                    if (child.name === key + 'Night') {
                        const material = new THREE.MeshBasicMaterial({
                            map: loadedTextures.night[key],
                        });
                        child.material = material;
                        console.log('Applied night texture', key, 'to mesh', child.name);
                    }
                });
            }
        }
    });
    scene.add(glb.scene);
    if (instagramMesh) {
        const linkedin = glb.scene.getObjectByName('linkedin');
        const projects = glb.scene.getObjectByName('projects');
        const about = glb.scene.getObjectByName('about');
        const contact = glb.scene.getObjectByName('contact');
        if (linkedin && projects && about && contact) {
            playIntroAnimation(instagramMesh, linkedin, projects, about, contact);
            function playIntroAnimation(instagram, linkedin, projects, about, contact) {
                const t1 = gsap.timeline({
                    defaults: {
                        duration: 0.8,
                        ease: 'back.out(1.8)',
                    }
                });
                t1.to(instagram.scale, { z: 1, x: 1 })
                    .to(linkedin.scale, { z: 1, y: 1, x: 1 })
                    .to(projects.scale, { z: 1, y: 1, x: 1 })
                    .to(about.scale, { z: 1, y: 1, x: 1 })
                    .to(contact.scale, { z: 1, y: 1, x: 1 });
            }
        } else {
            console.error('One or more meshes not found in the GLB scene.');
        }
    } else {
        console.error('instagram mesh not found');
    }
    RaycasterObjects.push(glb.scene);
    animationFrameId = requestAnimationFrame(render);
}, undefined, function (error) {
    console.error(error);
});
if (window.innerWidth < 768) {
    camera.position.set(-10.29687964815422, 5.395157308130587, 60.89652930161158);
} else {
    camera.position.set(-10, 5, 60);
}