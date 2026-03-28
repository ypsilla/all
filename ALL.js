import * as THREE from "https://cdn.skypack.dev/three@0.133.1/build/three.module";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/controls/OrbitControls";

const containerEl = document.querySelector(".globe-wrapper");
const canvas3D = document.querySelector("#globe-3d");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

let renderer;
let scene;
let camera;
let controls;
let globe;
let atmosphere;
let globeShell;
let mapMaterial;
let earthTexture;
let animationFrameId = null;

initMenu();

if (containerEl && canvas3D) {
    initScene();
    window.addEventListener("resize", updateSize);
}

function initMenu() {
    if (!menuToggle || !nav) return;

    menuToggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            nav.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });
}

function initScene() {
    renderer = new THREE.WebGLRenderer({
        canvas: canvas3D,
        alpha: true,
        antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera(-1.1, 1.1, 1.1, -1.1, 0.1, 10);
    camera.position.set(0, 0, 1.35);

    createOrbitControls();

    new THREE.TextureLoader().load(
        "https://ksenia-k.com/img/earth-map-colored.png",
        (mapTex) => {
            earthTexture = mapTex;
            earthTexture.wrapS = THREE.ClampToEdgeWrapping;
            earthTexture.wrapT = THREE.ClampToEdgeWrapping;
            earthTexture.needsUpdate = true;

            createGlobe();
            createAtmosphere();
            updateSize();
            render();
        },
        undefined,
        (error) => {
            console.error("Texture loading error:", error);
        }
    );
}

function createOrbitControls() {
    controls = new OrbitControls(camera, canvas3D);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.rotateSpeed = 0.45;
    controls.minPolarAngle = 0.42 * Math.PI;
    controls.maxPolarAngle = 0.58 * Math.PI;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.9;
}

function createGlobe() {
    const globeGeometry = new THREE.IcosahedronGeometry(1, 22);

    mapMaterial = new THREE.ShaderMaterial({
        vertexShader: document.getElementById("vertex-shader-map").textContent,
        fragmentShader: document.getElementById("fragment-shader-map").textContent,
        uniforms: {
            u_map_tex: { value: earthTexture },
            u_dot_size: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    globe = new THREE.Points(globeGeometry, mapMaterial);
    globe.scale.set(1.03, 1.03, 1.03);
    scene.add(globe);

    globeShell = new THREE.Mesh(
        globeGeometry,
        new THREE.MeshBasicMaterial({
            color: 0x0a2c58,
            transparent: true,
            opacity: 0.12
        })
    );
    globeShell.scale.set(1.01, 1.01, 1.01);
    scene.add(globeShell);
}

function createAtmosphere() {
    const atmosphereGeometry = new THREE.SphereGeometry(1.045, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x1f8fff,
        transparent: true,
        opacity: 0.075
    });

    atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
}

function render() {
    animationFrameId = requestAnimationFrame(render);

    if (controls) {
        controls.update();
    }

    if (globe) {
        globe.rotation.y += 0.0008;
    }

    if (globeShell) {
        globeShell.rotation.y += 0.0008;
    }

    if (atmosphere) {
        atmosphere.rotation.y += 0.0006;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function updateSize() {
    if (!containerEl || !renderer || !camera) return;

    const width = Math.max(containerEl.clientWidth, 1);
    const height = Math.max(containerEl.clientHeight, 1);

    renderer.setSize(width, height, false);

    const aspect = width / height;
    const frustumSize = 2.2;

    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();

    if (mapMaterial) {
        mapMaterial.uniforms.u_dot_size.value = Math.max(width, height) * 0.0205;
    }
}

window.addEventListener("beforeunload", () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    if (controls) controls.dispose();
    if (renderer) renderer.dispose();
});