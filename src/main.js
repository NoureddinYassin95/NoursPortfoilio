// main.js
import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from "gsap";

const canvas = document.querySelector('#experience-canvas');
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

const modals = {
    projects: document.querySelector(".projects.modal"),
    about: document.querySelector(".about.modal"),
    contact: document.querySelector(".contact.modal"),
};

const showModal = (modal) => {
    modal.style.display = "block";
    gsap.set(modal, { opacity: 0 });
    gsap.to(modal, {
        opacity: 1,
        duration: 0.5,
    });
};

const hideModal = (modal) => {
    gsap.to(modal, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            modal.style.display = "none";
        },
    });
};

Object.values(modals).forEach((modal) => {
    modal.querySelector(".modal-exit-button").addEventListener("click", () => {
        hideModal(modal);
    });
});

const raycaster = new THREE.Raycaster();
let currentIntersects = [];

const socialLinks = {
    "projects": "https://vimeo.com/user49153109",
    "instagram": "https://www.instagram.com/noor_y_95?igsh=bHM1enl0YjNieThq",
    "linkedin": "https://www.linkedin.com/in/noureddin-yassin/",
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
    .load([
        'px.webp',
        'nx.webp',
        'py.webp',
        'ny.webp',
        'pz.webp',
        'nz.webp',
    ]);

const textureMap = {
    First: {
        day: '/texture/Room/day/FinalFirstTextureSetDay.webp',
        night: '/texture/Room/night/FinalFirstTextureSetNight.webp',
    },
    Second: {
        day: '/texture/Room/day/FinalSecondTextureSetDay-1.webp',
        night: '/texture/Room/night/FinalSecondTextureSetNight.webp',
    },
    Third: {
        day: '/texture/Room/day/FinalThirdTextureSetDay.webp',
        night: '/texture/Room/night/FinalThirdTextureSetNight.webp',
    },
    Fourth: {
        day: '/texture/Room/day/FinalFourthTextureSetDay.webp',
        night: '/texture/Room/night/FinalFourthtextureSetNight.webp',
    },
};

const loadedTextures = {
    day: {},
    night: {},
};

Object.entries(textureMap).forEach(([key, paths]) => {
    textureLoader.load(paths.day, (dayTexture) => {
        dayTexture.flipY = false;
        dayTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTextures.day[key] = dayTexture;
    });

    textureLoader.load(paths.night, (nightTexture) => {
        nightTexture.flipY = false;
        nightTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTextures.night[key] = nightTexture;
    });
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 0,
    opacity: 0.7,
    transparent: true,
    metalness: 0,
    roughness: 0.5,
    ior: 0.5,
    thickness: 0.01,
    specularIntensity: 1,
    envMap: environmentMap,
    envMapIntensity: 1,
    depthWrite: false,
    transmissionResolutionScale: 1,
});

const neonfontMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1,
});

window.addEventListener('mousemove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    if (currentIntersects.length > 0) {
        const object = currentIntersects[0].object;

        Object.entries(socialLinks).forEach(([key, url]) => {
            if (object.name.includes(key)) {
                const newWindow = window.open(url, '_blank');
                if (newWindow) {
                    newWindow.opener = null;
                }
            }
        });
        if (object.name.includes ('projects')) {
            showModal(modals.projects);
        } else if (object.name.includes('about')) {
            showModal(modals.about);
        } else if (object.name.includes('contact')) {
            showModal(modals.contact);
        }
        if (object.name === 'projects') {
            showModal(modals.projects);
        } else if (object.name === 'about') {
            showModal(modals.about);
        } else if (object.name === 'contact') {
            showModal(modals.contact);
        }
    }
});

loader.load('/models/Bazaar5.glb', (glb) => {
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes('glass') || child.name === 'windows' || child.name === "jar.004") {
                child.material = glassMaterial;
                console.log('Applied glass material to:', child.name);
            } else if (child.name.includes('neonfont') || child.name === 'projects' || child.name === 'about' || child.name === 'contact' || child.name.includes("Pointer")) {
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

                        if (child.material.map) {
                            child.material.map.minFilter = THREE.LinearFilter;
                        }
                    }
                });
            }
        }
    });

    scene.add(glb.scene);
}, undefined, function (error) {
    console.error(error);
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(-10.29687964815422, 5.395157308130587, 60.89652930161158);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(18.135466879967332, 13.579382542888288, 8.728309344992161);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.1, 0.4);
bloomPass.strength = 0.2;
bloomPass.radius = 0.85;
bloomPass.threshold = 0.43;
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

const render = () => {
    controls.update();

    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(RaycasterObjects);

    if (currentIntersects.length > 0) {
        let isPointer = false;
        for (let i = 0; i < currentIntersects.length; i++) {
            if (currentIntersects[i].object.name.includes("Pointer")) {
                isPointer = true;
                break;
            }
        }

        if (isPointer) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    } else {
        document.body.style.cursor = 'default';
    }

    composer.render();
    window.requestAnimationFrame(render);
};

render();