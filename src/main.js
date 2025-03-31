import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
//import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
//import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.querySelector('#experience-canvas');
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// Loaders
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

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
        'nz.webp'
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
        dayTexture.colorSpace = THREE.SRGBColorSpace
        loadedTextures.day[key] = dayTexture;
    });

    textureLoader.load(paths.night, (nightTexture) => {
        nightTexture.flipY = false;
        nightTexture.colorSpace = THREE.SRGBColorSpace
        loadedTextures.night[key] = nightTexture;
    });
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 0,
    opacity: .7,
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

loader.load('/models/Bazaar5.glb', (glb) => {
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            if (child.name.includes("glass") || child.name === "windows" || child.name === "jar.004") { // Apply to any mesh named Windows
                child.material = glassMaterial;
                console.log("Applied glass material to:", child.name); // Debug
            }
           // else if (child.name.includes("jar_004") || child.name === "jar_004") { // Apply to any mesh named Windows
           //     child.material = glassMaterial;
           //     console.log("Applied glass material to:", child.name); // Debug
           // }
            else if (child.name.includes("neonfont") || child.name === "projects" || child.name === "about" || child.name === "contact") {
                child.material = neonfontMaterial;
                console.log("Neon material applied to:", child.name);
            }
            else {
                Object.keys(textureMap).forEach((key) => {
                    if (child.name === key) {
                        const material = new THREE.MeshBasicMaterial({
                            map: loadedTextures.day[key],
                        });
                        child.material = material;
                        console.log("Applied day texture", key, "to mesh", child.name);
                    }
                    if (child.name === key + 'Night') {
                        const material = new THREE.MeshBasicMaterial({
                            map: loadedTextures.night[key],
                        });
                        child.material = material;
                        console.log("Applied night texture", key, "to mesh", child.name);

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
camera.position.set(-10.29687964815422, 5.395157308130587, 60.89652930161158)

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(18.135466879967332, 13.579382542888288, 8.728309344992161)

// --- Bloom Post-Processing ---
//const composer = new EffectComposer(renderer);
//const renderPass = new RenderPass(scene, camera);
//composer.addPass(renderPass);

//const bloomPass = new BloomPass(
//    1,
//    25,
//    4,
//    256
//);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.1, 0.4);
bloomPass.strength = 1.5;
bloomPass.radius = 0.85;
bloomPass.threshold = 0.43;
//composer.addPass(bloomPass);


// bject { x: 18.135466879967332, y: 5.579382542888288, z: 6.728309344992161 }
//x: 18.135467123657797
//y: 5.579382542893043
//z: 6.728309549250295
//<prototype>: Object { isVector3: true, … } 18.135466879967332, 5.579382542888288, 6.728309344992161
//main.js:192:12
//Object { x: -32.29687964815422, y: 12.395157308130587, z: 66.89652930161158 }
//x: -32.296879416791555
//y: 12.39515730813511
//z: 66.89652949553673
//<prototype>: Object { isVector3: true, … }
//main.js:190:12
//000000000000 main.js:191:12
//Object { x: 18.135466892151868, y: 5.579382542888526, z: 6.728309355205078 }
//x: 18.13546712365799
//y: 5.579382542893045
//z: 6.728309549250461
//<prototype>: Object { isVector3: true, … }
//main.js:192:12
//Object { x: -32.29687963657891, y: 12.395157308130813, z: 66.89652931131386 }
//x: -32.296879416648096
//y: 12.395157308135106
//z: 66.89652949565695



window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    //composer.setSize(sizes.width, sizes.height);
});

const render = () => {
    controls.update();

  //  console.log (camera.position);
   // console.log ("000000000000");
   // console.log (controls.target);

    renderer.render(scene, camera);
    //composer.render();
    window.requestAnimationFrame(render);
};
render();
