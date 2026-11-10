
import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { PointerLockControls } from
"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js";

// SPELVÄRLD

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eb9c5);
scene.fog = new THREE.Fog(0x9eb9c5, 25, 90);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  150
);

camera.position.set(0, 1.7, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.getElementById("game").appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// LJUS

scene.add(new THREE.HemisphereLight(0xffffff, 0x58604b, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(-10, 20, 10);
sunlight.castShadow = true;
scene.add(sunlight);

// MATERIAL

const material = color =>
  new THREE.MeshStandardMaterial({ color });

// SKAPA OBJEKT

function createBox(name, x, y, z, sx, sy, sz, color) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material(color)
  );

  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  object.userData.name = name;

  scene.add(object);
  return object;
}

// LAGERGOLV

createBox("Golv", 0, -0.2, 0, 24, 0.4, 24, 0x65746d);

// VÄGGAR

createBox("Bakvägg", 0, 3, -11, 24, 6, 0.3, 0xc4c9c1);
createBox("Vänstervägg", -12, 3, 0, 0.3, 6, 22, 0xc4c9c1);
createBox("Högervägg", 12, 3, 0, 0.3, 6, 22, 0xc4c9c1);

// TAK

createBox("Tak", 0, 6, 0, 24, 0.3, 22, 0x89948e);

// GARAGEPORT

const garage = createBox(
  "Garageport",
  0, 2.7, 10.8,
  7, 5.4, 0.2,
  0x77858c
);

// DATOR

createBox("Skrivbord", -8, 1, -6, 3, 1.2, 1.4, 0x684b35);
createBox("Datorskärm", -8, 2, -6, 1.5, 1.1, 0.1, 0x18232a);

// HYLLOR

for (let i = 0; i < 2; i++) {
  createBox("Pakethylla", -3, 1.5, -2 + i * 3,
    5, 0.25, 0.7, 0x87918e);
}

// PAKET

const packageTypes = [
  { name: "T-shirt", emoji: "👕", price: 25, color: 0x579ac0 },
  { name: "LEGO-byggsats", emoji: "🧱", price: 50, color: 0xd7b44b },
  { name: "Möbel", emoji: "🪑", price: 100, color: 0x987455 }
];

const packages = [];

function createPackage(type, index) {
  const box = createBox(
    type.name,
    -4.5 + (index % 3) * 1.5,
    0.6,
    -2 + Math.floor(index / 3) * 3,
    0.9, 0.8, 0.8,
    type.color
  );

  box.userData.package = type;
  packages.push(box);
}

// BIL

const van = createBox(
  "Paketbil",
  0, 1.2, 6,
  3.2, 2.2, 5.5,
  0xe7e9e5
);

// KONTROLLER

const keys = {};

window.addEventListener("keydown", event => {
  keys[event.code] = true;

  if (event.code === "Escape") {
    closeAll();
    document.getElementById("settings").classList.remove("hidden");
    controls.unlock();
  }

  if (event.code === "KeyE") interact();

  if (event.code === "KeyF") pickup();

  if (event.code === "KeyM") {
    document.getElementById("gps").classList.remove("hidden");
  }

  if (event.code === "KeyT") {
    document.getElementById("chat").classList.remove("hidden");
    document.getElementById("chat-input").focus();
  }
});

window.addEventListener("keyup", event => {
  keys[event.code] = false;
});

renderer.domElement.addEventListener("click", () => {
  if (document.pointerLockElement !== renderer.domElement) {
    controls.lock();
  }
});

// INTERAKTION

function getTarget() {
  const raycaster = new THREE.Raycaster();

  raycaster.setFromCamera(
    new THREE.Vector2(0, 0),
    camera
  );

  const hits = raycaster.intersectObjects(scene.children, true);

  return hits.find(hit => hit.distance < 4)?.object;
}

let garageOpen = false;

function interact() {
  const target = getTarget();

  if (!target) return;

  if (target.userData.name === "Garageport") {
    garageOpen = !garageOpen;
    garage.position.y = garageOpen ? 7 : 2.7;
    message(garageOpen ? "Garageporten öppnas!" : "Garageporten stängs!");
  }

  if (target.userData.name === "Datorskärm") {
    document.getElementById("computer").classList.remove("hidden");
    controls.unlock();
    renderProducts();
  }

  if (target.userData.name === "Paketbil") {
    message("Du tittar på paketbilen.");
  }
}

function pickup() {
  const target = getTarget();

  if (target?.userData.package) {
    message("Du plockade upp " + target.userData.package.name);
    target.visible = false;
  }
}

// RÖRELSE

function animate() {
  requestAnimationFrame(animate);

  const delta = 0.016;

  if (controls.isLocked) {
    if (keys.KeyW) controls.moveForward(5 * delta);
    if (keys.KeyS) controls.moveForward(-5 * delta);
    if (keys.KeyA) controls.moveRight(-5 * delta);
    if (keys.KeyD) controls.moveRight(5 * delta);

    controls.getObject().position.y = 1.7;
  }

  renderer.render(scene, camera);
}

animate();

// WEBBSHOP

let selectedProduct = null;

function renderProducts() {
  const root = document.getElementById("products");
  root.innerHTML = "";

  packageTypes.forEach(type => {
    const div = document.createElement("div");
    div.className = "product";

    div.innerHTML = `
      <h3>${type.emoji} ${type.name}</h3>
      <p>${type.price} kr leveransersättning</p>
      <button>Välj</button>
    `;

    div.querySelector("button").onclick = () => {
      selectedProduct = type;
      message("Vald: " + type.name);
    };

    root.appendChild(div);
  });
}

function orderProducts() {
  if (!selectedProduct) {
    message("Välj en vara först!");
    return;
  }

  createPackage(selectedProduct, packages.length);

  closeWindow("computer");
  message("Varorna har kommit till lagret!");
}

// GPS

function startNavigation() {
  const address = document.getElementById("address").value;

  document.getElementById("gps-status").textContent =
    address ? "Kör mot " + address : "Skriv en adress!";
}

// RUM

function showRoom() {
  document.getElementById("room-code").textContent =
    "Supabase behöver anslutas först.";
}

function joinRoom() {
  message("Multiplayer kräver Supabase-anslutning.");
}

// CHATT

function sendChat() {
  const input = document.getElementById("chat-input");

  if (!input.value.trim()) return;

  const messageElement = document.createElement("p");
  messageElement.textContent = "Du: " + input.value;

  document.getElementById("chat-messages").appendChild(messageElement);
  input.value = "";
}

// HJÄLPFUNKTIONER

function closeWindow(id) {
  document.getElementById(id).classList.add("hidden");
}

function closeAll() {
  ["phone", "computer", "settings", "gps", "chat"].forEach(closeWindow);
}

function message(text) {
  const element = document.getElementById("message");

  element.textContent = text;
  element.style.display = "block";

  setTimeout(() => {
    element.style.display = "none";
  }, 2500);
}

// STARTUPPDRAG

setTimeout(() => {
  document.getElementById("mission-title").textContent =
    "Nytt leveransuppdrag!";

  document.getElementById("mission-info").textContent =
    "Gå till telefonen och kontrollera kundens beställning.";

  document.getElementById("phone-content").textContent =
    "Kunden har beställt en T-shirt. Leveransadress: Björkvägen 12.";

  document.getElementById("phone").classList.remove("hidden");
}, 3000);

// FÖNSTERSTORLEK

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
