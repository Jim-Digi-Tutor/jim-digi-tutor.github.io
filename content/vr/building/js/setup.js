// The code below loads the Three.js libraries we mapped earlier
// We can use them in our code
// They have to be imported for each, individual JavaScript file we create
import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

/**
 * Creates the dolly and adds the camera to it
 */
export function buildDolly(camera) {

  let dolly = new THREE.Object3D();
  dolly.add(camera);
  return dolly;
}

/**
 * Creates the player and the playerBox
 * They are returned to the CORE program as an array
 */
export function buildPlayer() {
  
  // Build the player outline and its bounding box
  let rad = 0.3;
  let height = 0.5;
  let geo = new THREE.CylinderGeometry(rad, rad, height, 32); 
  let mat = new THREE.MeshBasicMaterial( { wireframe: true, opacity: 1 } ); 
  
  // When our game is complete, we can hide the player object by uncommenting the line below
  // This will make the player transparent
  // mat.transparent = true;
  
  let player = new THREE.Mesh(geo, mat);
  player.geometry.computeBoundingBox();
  let bb = new THREE.Box3();
  bb.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);

  return [ player, bb ];
}

/**
 * Sets up a controller and adds it to the dolly
 * This also involves creating a visual representation of the controller for the graphical environment
 */
export function buildController(index, renderer, dolly, pickDistance) {

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
  line.scale.z = pickDistance;
  group.controller.add(line.clone());
  
  return group;
}

/**
 * This function is a convenience method that moves code from the CORE file, making it easier to read
 * It loads the models that make up the dungeon
 */
export function loadModels(e) {

  // e represents the engine
  // Using e instead of engine makes the code a little easier to type!

  // Load the floor model
  e.loadModel("./models/floor.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [], []);  

  // Load the perimeter wall models
  e.loadModel("./models/north-perimeter.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/east-perimeter.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/south-perimeter.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/west-perimeter.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);

  // Load the models that make up the Gold Key room
  e.loadModel("./models/gk-room-1.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/gk-room-2.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/gk-room-3.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/gk-room-4.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/gk-room-5.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
 
  // Load the models that make up the Silver Key room
  e.loadModel("./models/sk-room-1.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/sk-room-2.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/sk-room-3.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);

  // Load the models that make up the Final Room
  e.loadModel("./models/final-room-1.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/final-room-2.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/final-room-3.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);

  // Load the models that make up the general maze
  e.loadModel("./models/maze-1.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-2.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-3.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-4.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-5.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-6.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-7.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-8.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-9.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-10.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-11.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-12.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);
  e.loadModel("./models/maze-13.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure ], []);

  // Load the models that represent the doors
  e.loadModel("./models/gk-room-door.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure, e.interactions ], [ { name: "itemId", value: "gk-room-door" } ]);
  e.loadModel("./models/sk-room-door.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure, e.interactions ], [ { name: "itemId", value: "sk-room-door" } ]);
  e.loadModel("./models/puzzle-room-door.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.structure, e.interactions ], [ { name: "itemId", value: "final-room-door" } ]);
  
  // Load the Silver Key (position its light accordingly)
  // Notice that the position array is slightly different to that of the above models
  e.loadModel("./models/silver-key.glb", [ 56, [ 0.5, 0.5, 0 ] ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [ e.interactions ], [ { name: "itemId", value: "silver-key" } ]);

  // Load the Gold Key (position its light accordingly)
  // Notice that the position array is slightly different to that of the above models  
  e.loadModel("./models/gold-key.glb", [ 265, [ 0, 0.5, -0.5 ] ], [ 0, 180, 0 ], [ 0.2, 0.2, 0.2 ], [ e.interactions ], [ { name: "itemId", value: "gold-key" } ]);

  // Load the model to represent the Victory Text
  e.loadModel("./models/finish-text.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [], []);
}