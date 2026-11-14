/* Flower Typer by Ksenia Kondrashova / Codrops, MIT.
 * https://github.com/uuuulala/WebGL-typing-tutorial
 * Original flower/leaf textures, particle behavior and instanced renderer retained.
 * Adapted to a locally hosted, viewport-paused Chinese confession sequence.
 */
import * as THREE from '../vendor/three.module.js';
// DOM selectors
const containerEl = document.querySelector('#flower-typer');
const textInputEl = document.querySelector('#flower-input');

// Settings
const fontName = 'Verdana';
const textureFontSize = 70;
const fontScaleFactor = .075;

// We need to keep the style of editable <div> (hidden inout field) and canvas
textInputEl.style.fontSize = textureFontSize + 'px';
textInputEl.style.font = '100 ' + textureFontSize + 'px ' + fontName;
textInputEl.style.lineHeight = 0.9 * textureFontSize + 'px';

// 3D scene related globals
let scene, camera, renderer, textCanvas, textCtx, particleGeometry, dummy, clock, cursorMesh;
let flowerInstancedMesh, leafInstancedMesh, flowerMaterial, leafMaterial;

// String to show
let string = '';
let frame = 0, active = false, lastDraw = 0, textStep = 0, typeTime = 0;
const message = ['佳佳\n', '佳佳我\n', '佳佳我爱\n', '佳佳我爱你\n', '佳佳我爱你\nI LOVE YOU'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Coordinates data per 2D canvas and 3D scene
let textureCoordinates = [];

// 1d-array of data objects to store and change params of each instance
let particles = [];

// Parameters of whole string per 2D canvas and 3D scene
let stringBox = {
    wTexture: 0,
    wScene: 0,
    hTexture: 0,
    hScene: 0,
    caretPosScene: []
};

// ---------------------------------------------------------------

await document.fonts.load('70px Verdana');
init();
new ResizeObserver(resize).observe(containerEl);
new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active && !document.hidden) { if (!frame) frame = requestAnimationFrame(render); }
    else { cancelAnimationFrame(frame); frame = 0; }
}, {threshold: .15}).observe(containerEl);
document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame); frame = 0;
    if (active && !document.hidden) frame = requestAnimationFrame(render);
});
document.querySelector('#replay-flowers').addEventListener('click', () => {
    textStep = 0; typeTime = 0;
    document.querySelector('#flower-question').classList.remove('is-visible');
    if (!frame && active) frame = requestAnimationFrame(render);
});
renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); cancelAnimationFrame(frame); frame = 0;
    document.querySelector('#flower-fallback').hidden = false;
});
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
function resize() {
    const {width, height} = containerEl.getBoundingClientRect();
    camera.aspect = width / height;
    renderer.setSize(width, height);
    camera.position.set(0, 0, 35);
    makeTextFitScreen();
    camera.updateProjectionMatrix();
}

function init() {
    camera = new THREE.PerspectiveCamera(45, containerEl.clientWidth / containerEl.clientHeight, .1, 1000);
    camera.position.z = 35;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
    containerEl.appendChild(renderer.domElement);



    textCanvas = document.createElement('canvas');
    textCanvas.width = textCanvas.height = 0;
    textCtx = textCanvas.getContext('2d');
    particleGeometry = new THREE.PlaneGeometry(1.2, 1.2);
    const flowerTexture = new THREE.TextureLoader().load('assets/typer/flower.png');
    flowerMaterial = new THREE.MeshBasicMaterial({
        alphaMap: flowerTexture,
        opacity: .3,
        depthTest: false,
        transparent: true,
    });
    const leafTexture = new THREE.TextureLoader().load('assets/typer/leaf.png');
    leafMaterial = new THREE.MeshBasicMaterial({
        alphaMap: leafTexture,
        opacity: .35,
        depthTest: false,
        transparent: true,
    });

    dummy = new THREE.Object3D();
    clock = new THREE.Clock();

    const cursorGeometry = new THREE.BoxGeometry(.09, 6.5, .03);
    cursorGeometry.translate(0, -4.4, 0)
    const cursorMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
    });
    cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
    cursorMesh.visible = false;
    scene.add(cursorMesh);
}


// ---------------------------------------------------------------

function setMessage(value) {
    string = value;
    const lines = string.split('\n');
    textCtx.font = '100 ' + textureFontSize + 'px ' + fontName;
    stringBox.wTexture = Math.ceil(Math.max(textCtx.measureText('佳佳我爱你').width, textCtx.measureText('I LOVE YOU').width)) + 24;
    stringBox.hTexture = 2 * textureFontSize * 1.15;
    stringBox.wScene = stringBox.wTexture * fontScaleFactor;
    stringBox.hScene = stringBox.hTexture * fontScaleFactor;
    stringBox.caretPosScene = [0, 0];
    refreshText();
}
function render(now) {
    if (!active || document.hidden) { frame = 0; return; }
    frame = requestAnimationFrame(render);
    lastDraw = now;
    if (reduceMotion.matches && textStep === 0) { setMessage(message.at(-1)); textStep = message.length; typeTime = now; }
    else if (textStep < message.length && now - typeTime > 750) {
        setMessage(message[textStep++]); typeTime = now;
    }
    if (flowerInstancedMesh) updateParticlesMatrices();
    renderer.render(scene, camera);
    containerEl.dataset.instances = particles.length;
    if (textStep === message.length && now - typeTime > 1300) {
        document.querySelector('#flower-question').classList.add('is-visible');
        if (reduceMotion.matches) { cancelAnimationFrame(frame); frame = 0; }
    }
}

function refreshText() {
    sampleCoordinates();

    particles = textureCoordinates.map((c, cIdx) => {
        const x = c.x * fontScaleFactor;
        const y = c.y * fontScaleFactor;
        let p = (c.old && particles[cIdx]) ? particles[cIdx] : Math.random() > .2 ? new Flower([x, y]) : new Leaf([x, y]);
        if (c.toDelete) {
            p.toDelete = true;
            p.scale = p.maxScale;
        }
        return p;
    });

    recreateInstancedMesh();
    makeTextFitScreen();
    updateCursorPosition();
}

// ---------------------------------------------------------------
// Input string to textureCoordinates

function sampleCoordinates() {
    // Draw text
    const lines = string.split(`\n`);
    const linesNumber = lines.length;
    textCanvas.width = stringBox.wTexture;
    textCanvas.height = stringBox.hTexture;
    textCtx.font = '100 ' + textureFontSize + 'px ' + fontName;
    textCtx.fillStyle = '#2a9d8f';
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    for (let i = 0; i < linesNumber; i++) {
        textCtx.fillText(lines[i], (stringBox.wTexture - textCtx.measureText(lines[i]).width) / 2, (i + .8) * stringBox.hTexture / linesNumber);
    }

    // Sample coordinates
    if (stringBox.wTexture > 0) {

        // Image data to 2d array
        const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
        const imageMask = Array.from(Array(textCanvas.height), () => new Array(textCanvas.width));
        for (let i = 0; i < textCanvas.height; i++) {
            for (let j = 0; j < textCanvas.width; j++) {
                imageMask[i][j] = imageData.data[(j + i * textCanvas.width) * 4] > 0;
            }
        }

        if (textureCoordinates.length !== 0) {

            // Clean up: delete coordinates and particles which disappeared on the prev step
            // We need to keep same indexes for coordinates and particles to reuse old particles properly
            textureCoordinates = textureCoordinates.filter(c => !c.toDelete);
            particles = particles.filter(c => !c.toDelete);

            // Go through existing coordinates (old to keep, toDelete for fade-out animation)
            textureCoordinates.forEach(c => {
                if (imageMask[c.y]) {
                    if (imageMask[c.y][c.x]) {
                        c.old = true;
                        if (!c.toDelete) {
                            imageMask[c.y][c.x] = false;
                        }
                    } else {
                        c.toDelete = true;
                    }
                } else {
                    c.toDelete = true;
                }
            });
        }

        // Add new coordinates
        for (let i = 0; i < textCanvas.height; i++) {
            for (let j = 0; j < textCanvas.width; j++) {
                if (imageMask[i][j]) {
                    textureCoordinates.push({
                        x: j,
                        y: i,
                        old: false,
                        toDelete: false
                    })
                }
            }
        }

    } else {
        textureCoordinates = [];
    }
}


// ---------------------------------------------------------------
// Handling params of each particle

function Flower([x, y]) {
    this.type = 0;
    this.x = x + .2 * (Math.random() - .5);
    this.y = y + .2 * (Math.random() - .5);
    this.z = 0;

    this.color = Math.random() * 60;

    this.isGrowing = true;
    this.toDelete = false;

    this.scale = 0;
    this.maxScale = .9 * Math.pow(Math.random(), 20);
    this.deltaScale = .03 + .1 * Math.random();
    this.age = Math.PI * Math.random();
    this.ageDelta = .01 + .02 * Math.random();
    this.rotationZ = .5 * Math.random() * Math.PI;

    this.grow = function () {
        this.age += this.ageDelta;
        if (this.isGrowing) {
            this.deltaScale *= .99;
            this.scale += this.deltaScale;
            if (this.scale >= this.maxScale) {
                this.isGrowing = false;
            }
        } else if (this.toDelete) {
            this.deltaScale *= 1.1;
            this.scale -= this.deltaScale;
            if (this.scale <= 0) {
                this.scale = 0;
                this.deltaScale = 0;
            }
        } else {
            this.scale = this.maxScale + .2 * Math.sin(this.age);
            this.rotationZ += .001 * Math.cos(this.age);
        }
    }
}

function Leaf([x, y]) {
    this.type = 1;
    this.x = x;
    this.y = y;
    this.z = 0;

    this.rotationZ = .6 * (Math.random() - .5) * Math.PI;

    this.color = 100 + Math.random() * 50;

    this.isGrowing = true;
    this.toDelete = false;

    this.scale = 0;
    this.maxScale = .1 + .7 * Math.pow(Math.random(), 7);
    this.deltaScale = .03 + .03 * Math.random();
    this.age = Math.PI * Math.random();

    this.grow = function () {
        if (this.isGrowing) {
            this.deltaScale *= .99;
            this.scale += this.deltaScale;
            if (this.scale >= this.maxScale) {
                this.isGrowing = false;
            }
        }
        if (this.toDelete) {
            this.deltaScale *= 1.1;
            this.scale -= this.deltaScale;
            if (this.scale <= 0) {
                this.scale = 0;
            }
        }
    }
}

// ---------------------------------------------------------------
// Handle instances

function recreateInstancedMesh() {
    scene.remove(flowerInstancedMesh, leafInstancedMesh);
    flowerInstancedMesh?.dispose(); leafInstancedMesh?.dispose();
    const totalNumberOfFlowers = particles.filter(v => v.type === 0).length;
    const totalNumberOfLeafs = particles.filter(v => v.type === 1).length;
    flowerInstancedMesh = new THREE.InstancedMesh(particleGeometry, flowerMaterial, totalNumberOfFlowers);
    leafInstancedMesh = new THREE.InstancedMesh(particleGeometry, leafMaterial, totalNumberOfLeafs);
    scene.add(flowerInstancedMesh, leafInstancedMesh);

    let flowerIdx = 0;
    let leafIdx = 0;
    particles.forEach(p => {
        if (p.type === 0) {
            flowerInstancedMesh.setColorAt(flowerIdx, new THREE.Color("hsl(" + p.color + ", 100%, 50%)"));
            flowerIdx ++;
        } else {
            leafInstancedMesh.setColorAt(leafIdx, new THREE.Color("hsl(" + p.color + ", 100%, 20%)"));
            leafIdx ++;
        }
    })

    leafInstancedMesh.position.x = flowerInstancedMesh.position.x = -.5 * stringBox.wScene;
    leafInstancedMesh.position.y = flowerInstancedMesh.position.y = -.5 * stringBox.hScene;
}

function updateParticlesMatrices() {
    let flowerIdx = 0;
    let leafIdx = 0;
    particles.forEach(p => {
        p.grow();
        dummy.quaternion.copy(camera.quaternion);
        dummy.rotation.z += p.rotationZ;
        dummy.scale.set(p.scale, p.scale, p.scale);
        dummy.position.set(p.x, stringBox.hScene - p.y, p.z);
        if (p.type === 1) {
            dummy.position.y += .5 * p.scale;
        }
        dummy.updateMatrix();
        if (p.type === 0) {
            flowerInstancedMesh.setMatrixAt(flowerIdx, dummy.matrix);
            flowerIdx ++;
        } else {
            leafInstancedMesh.setMatrixAt(leafIdx, dummy.matrix);
            leafIdx ++;
        }
    })
    flowerInstancedMesh.instanceMatrix.needsUpdate = true;
    leafInstancedMesh.instanceMatrix.needsUpdate = true;}

// ---------------------------------------------------------------
// Move camera so the text is always visible

function makeTextFitScreen() {
    const fov = camera.fov * (Math.PI / 180);
    const fovH = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
    const distance = Math.max(.58 * stringBox.wScene / Math.tan(.5 * fovH), .58 * stringBox.hScene / Math.tan(.5 * fov), 1);
    camera.position.set(0, 0, distance);
    camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------
// Cursor related

function updateCursorPosition() {
    cursorMesh.position.x = -.5 * stringBox.wScene + stringBox.caretPosScene[0];
    cursorMesh.position.y = .4 * stringBox.hScene - stringBox.caretPosScene[1];
}

function updateCursorOpacity() {
    let roundPulse = (t) => Math.sign(Math.sin(t * Math.PI)) * Math.pow(Math.sin((t % 1) * 3.14), .2);

    if (document.hasFocus() && document.activeElement === textInputEl) {
        cursorMesh.material.opacity = roundPulse(2 * clock.getElapsedTime());
    } else {
        cursorMesh.material.opacity = 0;
    }
}