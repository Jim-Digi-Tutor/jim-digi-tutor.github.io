import * as THREE from "three";

import * as REGION from "./world-components/region.js";
import * as UTILS from "./utility/utils.js";

function computeExactWorldBox(root, { filter } = {}) {
  const box = new THREE.Box3().makeEmpty();
  const p = new THREE.Vector3();

  root.updateMatrixWorld(true);

  root.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (filter && !filter(o)) return;
    const pos = o.geometry.getAttribute('position');
    if (!pos) return;

    for (let i = 0; i < pos.count; i++) {
      p.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(o.matrixWorld);
      box.expandByPoint(p);
    }
  });

  return box; // <-- already a world-space Box3, ready to use
}


export function handleControllerInput(
  engine,
  gp0,
  gp1,
  scene,
  camVec,
  dolly,
  player,
  box,
  gravRay,
  structure,
  terrain,
  moveSpeed,
  rotSpeed,
  gravLower,
  gravUpper,
  gravOffset,
  uniScale,
  modScale,
  debug) {

  if(engine.getIsTeleporting())
    return;

  if (gp0.gamepad !== null && gp1.gamepad !== null) {
  // Inputs
  const axialActive   = Math.abs(gp1.gamepad.axes[3]) > 0.5;   // forward/back on gp1.axes[3]
  const rotateActive  = Math.abs(gp0.gamepad.axes[2]) > 0.5;   // rotate left/right on gp0.axes[2]
  // (If you later want strafe on a stick, add it as a sideways vector; this keeps your original mapping.)

  // --- 0) Rotation (now allowed simultaneously with axial) ---
  if (rotateActive) {
    const rotVal  = gp0.gamepad.axes[2]; // < 0 left, > 0 right (your original mapping)
    const rotDeg  = THREE.MathUtils.radToDeg(dolly.rotation.y);
    const newRot  = rotVal < 0 ? (rotDeg + rotSpeed) : (rotDeg - rotSpeed);
    dolly.rotation.y = THREE.MathUtils.degToRad(newRot);
  }

  // Early out if no movement requested
  if (!axialActive) return;

  // --- 1) Compute desired movement in XZ from camera forward ---
  const val = -gp1.gamepad.axes[3];           // forward = positive
  dolly.getWorldDirection(camVec);
  const moveX = -(camVec.x * moveSpeed * val);
  const moveZ = -(camVec.z * moveSpeed * val);

  // Old & candidate positions
  const oldX = dolly.position.x;
  const oldZ = dolly.position.z;

  const tryX = oldX + moveX;
  const tryZ = oldZ + moveZ;

  // --- 2) Collision helpers (uses your existing player/box workflow) ---
  const box = new THREE.Box3();

  function collidesAt(x, z) {
    // Position the player proxy and update matrices
    player.position.x = x;
    player.position.z = z;
    scene.updateMatrixWorld(true);

    // Build player world-space AABB
    box.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld);

    // Test against all potential colliders in `structure`
    for (let i = 0; i < structure.length; i++) {
      const test = structure[i];

      // If it's a Group, use your exact world box helper; otherwise test mesh directly
      if (test instanceof THREE.Group) {
        const groupBox = computeExactWorldBox(test);
        if (box.intersectsBox(groupBox)) return true;
      } else {
        if (checkCollision(box, test)) {
         
          if(test.userData.hasOwnProperty("teleport") && test.userData.teleport !== "") {
            const teleport = engine.getTeleportByAlias(test.userData.teleport);
            if(teleport !== null)
              return teleport;
          }
          
          return true;
        }
      }
    }
    return false;
  }

  // --- 3) Try full move; if blocked, slide along X or Z ---
  let moved = false;

  // Try full XZ move
  const moveStatus = collidesAt(tryX, tryZ);
  if(moveStatus instanceof REGION.Teleport) {

    moveStatus.trigger();

  } else if (!moveStatus) {
    dolly.position.x = tryX;
    dolly.position.z = tryZ;
    moved = true;
  } else {
    // Slide along X only
    if (!collidesAt(tryX, oldZ)) {
      dolly.position.x = tryX;
      dolly.position.z = oldZ;
      moved = true;
    }
    // If X failed, try Z only
    else if (!collidesAt(oldX, tryZ)) {
      dolly.position.x = oldX;
      dolly.position.z = tryZ;
      moved = true;
    }
  }

  // --- 4) Reset the player proxy to the dolly's *previous* pos for your gravity/other systems ---
  // (Matches your original pattern: player proxy isn't permanently moved by locomotion step)
  player.position.x = oldX;
  player.position.z = oldZ;

  // If you want a tiny wall “glide bias” (to prevent sticky corners), you can add a nudge:
  // if (!moved && axialActive) {
  //   const eps = 0.002;
  //   if (!collidesAt(oldX + Math.sign(moveX) * eps, oldZ)) dolly.position.x = oldX + Math.sign(moveX) * eps;
  //   if (!collidesAt(oldX, oldZ + Math.sign(moveZ) * eps)) dolly.position.z = oldZ + Math.sign(moveZ) * eps;
  // }



    const normal = UTILS.normalisePlayerPosition(engine.getWorld().getScaledWorld(), dolly.position);

    let pos = "";
    pos += ("Player Position {\n");
    pos += (UTILS.addSpace(4) + "x: " + normal.x.toFixed(2) + "\n");
    pos += (UTILS.addSpace(4) + "y: " + normal.y.toFixed(2) + "\n");
    pos += (UTILS.addSpace(4) + "z: " + normal.z.toFixed(2) + "\n");
    pos += ("}");
    //debug(pos, null, null);
  }
}

function checkForCollisions(box, structure) {

  // Iterate through the objects in the scene and check for collision - check structure first
  for(let a = 0; a < structure.length; a++) {

    let obj = structure[a];
    if(checkCollision(box, obj))
      return obj;  
  }

  return null;
}  

function checkCollision(box, obj) {

  let collision = false;
  
  // Configure the object's bounding box 
  let test = new THREE.Box3().setFromObject(obj);
  
  // If the object's bounding box intersects with the bounds object, process the collision
  if(box.intersectsBox(test)) {

    collision = true;
  }
  
  return collision;
}

export function checkGravity(scene, terrain, ray, dolly, gravOffset, uniScale, modScale) {

  // Prepare the gravity check ray
  scene.updateMatrixWorld();
  ray.set(new THREE.Vector3(dolly.position.x, (dolly.position.y + UTILS.scaleDistance(gravOffset, uniScale, modScale)), dolly.position.z), new THREE.Vector3(0, -1, 0));
  const intersects = ray.intersectObjects(terrain, true);
  if(intersects.length > 0) {
    
    return intersects[0];
  }

  return null;
}

export class InteractionManager {

  #engine;
  #controller0;
  #controller1;
  #uniScale;
  #modScale;
  #range;

  #ray0;
  #matrix0;
  #picked0;
  #selected0;
  #trigger0Down;  
  
  #ray1;
  #matrix1;
  #picked1;
  #selected1;
  #trigger1Down;

  #scene;
  #interactables;

  constructor(engine, controller0, controller1, uniScale, modScale, range, scene, interactables) {

    this.#engine = engine;
    this.#controller0 = controller0;
    this.#controller1 = controller1;
    this.#uniScale = uniScale;
    this.#modScale = modScale;
    this.#range = range;

    this.#scene = scene;
    this.#interactables = interactables;

    this.#controller0.controller.addEventListener("selectstart", this.#selectStart.bind(this, 0));
    this.#controller0.controller.addEventListener("selectend", this.#selectEnd.bind(this, 0));    
    this.#controller1.controller.addEventListener("selectstart", this.#selectStart.bind(this, 1));
    this.#controller1.controller.addEventListener("selectend", this.#selectEnd.bind(this, 1));       

    this.#setupRays();
  }

  #setupRays() {

    // Configure the raycaster for the right-hand controller (zero)
    this.#ray0 = new THREE.Raycaster();
    this.#ray0.near = 0;
    this.#ray0.far = this.interactRange;
    this.#matrix0 = new THREE.Matrix4();
    this.#picked0 = { obj: null, dist: 999 };
    this.#selected0 = { obj: null, dist: 999 };
    this.#trigger0Down = false;

    // Configure the raycaster for the left-hand controller (one)
    this.#ray1 = new THREE.Raycaster();
    this.#ray1.near = 0;
    this.#ray1.far = this.interactRange;
    this.#matrix1 = new THREE.Matrix4();
    this.#picked1 = { obj: null, dist: 999 };
    this.#selected1 = { obj: null, dist: 999 };
    this.#trigger1Down = false;
  }

  checkInteractions() {
        
    // Prepare the raycaster by setting up the position and direction of the ray for the controller
    this.#scene.updateMatrixWorld();
    this.#matrix1.identity().extractRotation(this.#controller1.controller.matrixWorld);
    this.#ray1.ray.origin.setFromMatrixPosition(this.#controller1.controller.matrixWorld);
    this.#ray1.ray.direction.set(0, 0, -1).applyMatrix4(this.#matrix1);

    // Setup the array to store interactions
    const interactions = this.#ray1.intersectObjects(this.#interactables);

    // If the array length is zero, no objects have been intersected
    if(interactions.length > 0) {

      const obj = interactions[0].object;
      if(this.#picked1.obj !== null && this.#picked1.obj !== obj) {

        this.#nullifyPicked(1);
      }

      // Record the distance from the intersected object
      const distance = interactions[0].distance;

      // If the distance to the object is less than the pickDistance we set earlier, it is a valid pick
      if(distance <= this.#range) {

        // Because we only checked the interactions array, there might be a structure object in between
        // This would, of course, block the ray - check whether this is the case
        // This code also uses the intersectObjects function
        //let checkStructure1 = ray1.intersectObjects(structure);

        // If no structure has been intersected, or any structure is further away, process the interaction
        //if(checkStructure1.length === 0 || checkStructure1[0].distance > distance || checkStructure1[0].object === obj) {

          // Highlight the picked object with an emmisive colour to make it stand out
          obj.material.emissive = new THREE.Color(0xffffff);
          obj.material.emissiveIntensity = 0.05;

          // Set the picked1 object to the currently highlighted object
          this.#picked1.obj = obj;
          this.#picked1.distance = distance;
          
        //} else {

          // If a structure is intersected before the picked object, nullify it
          // Our ray should not pass through walls or doors!
          //nullifyPicked1(picked1);
        //}
      }
    } else {

      // If there are no interactable objects detected, nullify picked1
      this.#nullifyPicked(1);
    }      
  }

  #nullifyPicked(index) {

    const picked = (index === 0) ? this.#picked0 : this.#picked1;
    if(picked.obj !== null) {
          
      picked.obj.material.emissive = new THREE.Color(0x000000);
    }

    picked.obj = null;
    picked.distance = 999;
  }  

  #selectStart(index) {

    const picked = (index === 0) ? this.#picked0 : this.#picked1;
    const selected = (index === 0) ? this.#selected0 : this.#selected1;
    // Set the trigger1Down flag to indicate that the trigger is pressed
    if(index === 0)
      this.#trigger0Down = true;
    else
      this.#trigger1Down = true;

    // If an object has been picked, set the selected object to match it
    if(picked.obj !== null) {

      selected.obj = picked.obj;
      selected.distance = picked.distance;
    }
  }  

  #selectEnd(index) {

    const picked = (index === 0) ? this.#picked0 : this.#picked1;
    const selected = (index === 0) ? this.#selected0 : this.#selected1;
    
    // Ensure that the object currently picked is the same one initially selected
    if(selected.obj !== null && picked.obj === selected.obj) {
      
      // If the selected object has an onClick attribute, it is an interactable object
      // Identify what the object is, get its onClick action, and process it
      // The referencing of userData needs to be made more robust and needs to factor both...
      // ...merged and unmerged GLB models.
      const data = selected.obj.userData;
      // const data = selected.obj.parent.parent.userData;
      console.log(data)
      if(data.hasOwnProperty("onClick")) {

        const action = data.onClick;
        if(action.includes("INFO-BOARD-PLAY-")) {

          const regionId = parseInt(action.split("-")[3]);
          const boardId = parseInt(action.split("-")[4]);
          const region = this.#engine.getWorld().getRegionById(regionId);
          if(region !== null) {

            const board = region.getBoards().getBoardById(boardId);
            if(board !== null)
              board.play();
          }

        } else if(action.includes("INFO-BOARD-PAUSE-")) {

          const regionId = parseInt(action.split("-")[3]);
          const boardId = parseInt(action.split("-")[4]);
          const region = this.#engine.getWorld().getRegionById(regionId);
          if(region !== null) {

            const board = region.getBoards().getBoardById(boardId);
            if(board !== null)
              board.pause();
          }
        
        } else if(action.includes("INFO-BOARD-RESTART-")) {

          const regionId = parseInt(action.split("-")[3]);
          const boardId = parseInt(action.split("-")[4]);
          const region = this.#engine.getWorld().getRegionById(regionId);
          if(region !== null) {

            const board = region.getBoards().getBoardById(boardId);
            if(board !== null)
              board.restart();
          }
        } 

      }

      // The trigger has been released
      // Nullify the selected object and release the trigger1Down flag
      //eng.selected1.obj = null;
      //eng.selected1.distance = 999;
      //eng.trigger1Down = false;    
    }
  }
}