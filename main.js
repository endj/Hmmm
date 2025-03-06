import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const COLORS = {
  FLOOR: 0x2e1e1b,
  BACKGROUND: 0x1b0e04,
  MONOLITH: 0x222222,
};

const createCube = (args) => {
  const {
    color,
    width = 1,
    heigth = 1,
    depth = 1,
    material = new THREE.MeshBasicMaterial({ color: color }),
  } = args;
  const geometry = new THREE.BoxGeometry(width, heigth, depth);
  return new THREE.Mesh(geometry, material);
};

const createFloor = (args) => {
  const {
    width = 2000,
    height = 2000,
    color = COLORS.FLOOR,
    material = new THREE.MeshBasicMaterial({ color: color }),
  } = args ?? {};
  const floorGeometry = new THREE.PlaneGeometry(width, height);
  const floor = new THREE.Mesh(floorGeometry, material);
  floor.rotateX(-Math.PI / 2);
  return floor;
};

// Movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Textures
const loader = new THREE.TextureLoader();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.y = 1.8;
camera.position.z = 15;

// Scene
const scene = new THREE.Scene();
//scene.background = loader.load("assets/sky.png");
scene.background = new THREE.Color().setHex(0x085c99);
scene.fog = new THREE.Fog(0x040002, 0, 550);

// Light?
const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 2.5);
light.position.set(0.5, 1, 0.75);
scene.add(light);

// Controller
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);
document.addEventListener("click", function () {
  controls.lock();
});

// Render
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// CatMonolith
const createMonolith = (x, y, z, side, catPlane, scene) => {
  const cube = createCube({
    color: COLORS.MONOLITH,
    width: 2,
    depth: 36,
    heigth: 48,
  });

  catPlane.translateY(-25); // Cat height
  cube.translateY(y);
  cube.translateZ(z);

  if (side == "left") {
    cube.translateX(-x);
    catPlane.translateX(-x + 1.1);
  } else {
    cube.translateX(x);
    catPlane.translateX(x - 2);
  }

  catPlane.translateZ(z);
  if (side === "left") {
    catPlane.rotateY(Math.PI / 2);
  } else {
    catPlane.rotateY(-Math.PI / 2);
  }

  scene.add(cube);
  scene.add(catPlane);
  return [cube, catPlane];
};

// Cat
const catTextures = [
  loader.load("assets/cats/cat1.png"),
  loader.load("assets/cats/cat2.png"),
  loader.load("assets/cats/cat3.png"),
  loader.load("assets/cats/cat4.png"),
];
const randomCatPlane = () => {
  const texture = catTextures[Math.floor(Math.random() * catTextures.length)];
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const planeGeometry = new THREE.PlaneGeometry(24, 24);
  const plane = new THREE.Mesh(planeGeometry, material);
  return plane;
};

// Monoliths
const monoliths = [];
const catPlanes = [];
for (let i = 0; i < 15; i++) {
  const [monolith, catPlane] = createMonolith(
    48,
    -25,
    48 + -(i * 48),
    "left",
    randomCatPlane(),
    scene,
  );
  monoliths.push(monolith);
  catPlanes.push(catPlane);

  const [rMonolith, rCatPlane] = createMonolith(
    48,
    -25,
    48 + -(i * 48),
    "right",
    randomCatPlane(),
    scene,
  );
  monoliths.push(rMonolith);
  catPlanes.push(rCatPlane);

  /*
    const rightCube = createCube({color: COLORS.MONOLITH, width:2, depth:36,heigth: 48})
    rightCube.translateZ(48 + -(i*48))
    rightCube.translateX(-48) // Left
    rightCube.translateY(-25) // height
    scene.add(rightCube)
    monoliths.push(rightCube)*/
}

// Cubes
/*
const cubes = [
    createCube({color:0x00ff00}),
    createCube({color:0x0000ff}),
    createCube({color:0xff0000})
]
cubes.forEach((c,i) => {
    scene.add(c)
    c.translateX(4)
    c.translateY(1+ (2 * i))
})*/

// Floor
const floorTexture = loader.load("assets/grass.jpg");
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(128, 128);
const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
const floor = createFloor({ material: floorMaterial });
floor.position.y = 0;
scene.add(floor);

/**
const createFloor = (args) => {
    const {
     width = 2000,
     height = 2000,
     color = COLORS.FLOOR,
     material = new THREE.MeshBasicMaterial({ color: color})
    } = args ?? {}
    const floorGeometry = new THREE.PlaneGeometry(width, height)
    const floor = new THREE.Mesh(floorGeometry, material)
    floor.rotateX(-Math.PI/2)
    return floor;
}*/

// Strip
/*
const stripTexture = loader.load("assets/ground.png")
stripTexture.wrapS = THREE.RepeatWrapping;
stripTexture.wrapT = THREE.RepeatWrapping;
stripTexture.repeat.set(1,64)
const stripMaterial = new THREE.MeshBasicMaterial( { map:stripTexture } );
const strip = createFloor({width: 5, height: 200, color: 0x3D1711, material: stripMaterial})
strip.position.y = 0.01
strip.position.z = -80
scene.add(strip)
*/

let iterations = 0;
function animate() {
  /*
    cubes.forEach((c,i) => {
        c.rotateX(0.01 * (i+ 1))
        c.rotateY(0.01 * (i+ 1))
    })*/

  const time = performance.now();
  if (controls.isLocked === true) {
    if (iterations++ < 48 * 10) {
      monoliths.forEach((m) => m.translateY(0.1));
      catPlanes.forEach((m) => m.translateY(0.1));
    }

    const delta = (time - prevTime) / 1000;
    velocity.x -= velocity.x * 20.0 * delta;
    velocity.z -= velocity.z * 20.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }
  prevTime = time;

  renderer.render(scene, camera);
}

const onKeyDown = (event) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = true;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveLeft = true;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = true;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = true;
      break;
  }
};

const onKeyUp = (event) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = false;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveLeft = false;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = false;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = false;
      break;
  }
};

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);
