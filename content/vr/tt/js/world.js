import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import * as LOOP from "./loop.js";
import * as SETUP from "./setup.js";
import * as UTILS from "./utils.js";

export function buildWorld(scene) {

  const worldScale = UTILS.ascertainWorldScale();
  const modelScale = UTILS.ascertainModelScale();

  UTILS.loadObj(
    scene,
    "./models/tinkertown-town-hall.obj",
    worldScale,
    modelScale,
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.02, 0.02, 0.02),
    new THREE.Vector3(-90, 0, 0),
    []
  );
  
  UTILS.loadObj(
    scene,
    "./models/tinkertown-red-obelisk.obj",
    worldScale,
    modelScale,
    new THREE.Vector3(-45, 0, -45),
    new THREE.Vector3(0.02, 0.02, 0.02),
    new THREE.Vector3(-90, 0, 0),
    []
  );
  
  UTILS.loadObj(
    scene,
    "./models/tinkertown-blue-obelisk.obj",
    worldScale,
    modelScale,
    new THREE.Vector3(45, 0, -45),
    new THREE.Vector3(0.02, 0.02, 0.02),
    new THREE.Vector3(-90, 0, 0),
    []
  );
  
  UTILS.loadObj(
    scene,
    "./models/tinkertown-green-obelisk.obj",
    worldScale,
    modelScale,
    new THREE.Vector3(45, 0, 45),
    new THREE.Vector3(0.02, 0.02, 0.02),
    new THREE.Vector3(-90, 0, 0),
    []
  );
  
  UTILS.loadObj(
    scene,
    "./models/tinkertown-purple-obelisk.obj",
    worldScale,
    modelScale,
    new THREE.Vector3(-45, 0, 45),
    new THREE.Vector3(0.02, 0.02, 0.02),
    new THREE.Vector3(-90, 0, 0),
    []
  );  
}