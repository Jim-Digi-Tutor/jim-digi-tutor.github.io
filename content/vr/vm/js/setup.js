import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

export function buildDolly(camera, position) {

  // Create the dolly and it to the scene
  let dolly = new THREE.Object3D();
  dolly.add(camera);
  dolly.position.set(position.x, position.y, position.z);
  dolly.rotation.y = THREE.MathUtils.degToRad(0);
  
  return dolly;
}

export function buildPlayer(position) {
  
  // Build the player outline and its bounding box
  let rad = 0.2;
  let height = 0.50;
  let geo = new THREE.CylinderGeometry(rad, rad, height, 32); 
  let mat = new THREE.MeshBasicMaterial( { wireframe: true, opacity: 1 } ); 
  //mat.transparent = true;
  let player = new THREE.Mesh(geo, mat);
  player.geometry.computeBoundingBox();
  let bb = new THREE.Box3();
  bb.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);
  player.position.set(position.x, 0, position.z);
  
  return [ player, bb ];
}

export function buildController(index, renderer, dolly) {

  let factory = new XRControllerModelFactory();
  
  let group = {};
  group.controller = renderer.xr.getController(index);
  group.grip = renderer.xr.getControllerGrip(index);
  group.gamepad = null;
  group.grip.add(factory.createControllerModel(group.grip));
  group.controller.addEventListener("connected", (e) => {
    // This assigns the gamepad controls of the controller to the gamepad object
    group.gamepad = e.data.gamepad;
  });

  dolly.add(group.controller);
  dolly.add(group.grip);

  // Add the lines extending from the controller
  let geo = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1) ] );
  let line = new THREE.Line(geo);
  line.scale.z = 5;
  group.controller.add(line.clone());
  
  return group;
}