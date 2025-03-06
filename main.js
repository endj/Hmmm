import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const DEFAULT_CAMERA_HEIGHT = 1.8;
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
  const cube = new THREE.Mesh(geometry, material);
  return cube;
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
let canJump = false;
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
camera.position.y = DEFAULT_CAMERA_HEIGHT;
camera.position.z = 15;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color().setHex(0x000000);
scene.fog = new THREE.Fog(0x040002, 0, 100);

// Controller
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);
document.addEventListener("click", function () {
  controls.lock();
});

// Render
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// CatMonolith
const createMonolith = (x, y, z, side, catPlane, scene) => {
  const cube = createCube({
    color: COLORS.MONOLITH,
    width: 36,
    depth: 2,
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
    cube.rotateY(Math.PI / 2);
  } else {
    catPlane.rotateY(-Math.PI / 2);
    cube.rotateY(-Math.PI / 2);
  }

  scene.add(cube);
  scene.add(catPlane);
  return [cube, catPlane];
};

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
}

// Floor
const floorTexture = loader.load("assets/grass.jpg");
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(128, 128);
const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
const floor = createFloor({ material: floorMaterial });
floor.position.y = 0;
scene.add(floor);

const movingTowardsPlayer = {};

let iterations = 0;
let turnHeads = false;
function animate() {
  const time = performance.now();
  if (controls.isLocked === true) {
    if (iterations++ < 48 * 10) {
      monoliths.forEach((m) => m.translateY(0.1));
      catPlanes.forEach((m) => m.translateY(0.1));
    }
    if (iterations > 48 * 10 && iterations < 48 * 10 * 1.5) {
      monoliths.forEach((m) => m.translateY(-0.2));
    }
    if (iterations > 48 * 10 * 1.5) {
      turnHeads = true;
    }

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 1.0 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.object.position.y += velocity.y * delta;
    if (controls.object.position.y < DEFAULT_CAMERA_HEIGHT) {
      velocity.y = 0;
      controls.object.position.y = DEFAULT_CAMERA_HEIGHT;
      canJump = true;
    }

    if (turnHeads) {
      catPlanes.forEach((plane, i) => {
        const distance = camera.position.distanceTo(plane.position);
        if (!movingTowardsPlayer[i] && distance <= 30) {
          movingTowardsPlayer[i] = true;
          plane.material.color.set(0xff0000);
        }

        if (movingTowardsPlayer[i] && distance > 10) {
          plane.quaternion.copy(camera.quaternion);

          const baseMoveSpeed = 0.1;
          const maxMoveSpeed = 0.5;
          const maxDistance = 30; // Use the same distance threshold
          let moveSpeed =
            baseMoveSpeed +
            (maxMoveSpeed - baseMoveSpeed) *
              (1 - Math.min(distance / maxDistance, 1));
          moveSpeed = Math.max(
            baseMoveSpeed,
            Math.min(moveSpeed, maxMoveSpeed),
          );

          const directionToPlayer = new THREE.Vector3();
          directionToPlayer
            .subVectors(camera.position, plane.position)
            .normalize(); // Calculate direction
          plane.position.add(directionToPlayer.multiplyScalar(moveSpeed)); // Move the plane
        }
      });
    }
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
    case "Space":
      if (canJump) {
        velocity.y += 100;
        canJump = false;
      }
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);
