import * as THREE from "three";

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

  if(gp0.gamepad !== null && gp1.gamepad !== null) {
    
    const axial = (Math.abs(gp1.gamepad.axes[3]) > 0.5);
    const lateral = (Math.abs(gp0.gamepad.axes[2]) > 0.5);

    if(axial) {

      // Axial movement always takes precedence
      const val = -gp1.gamepad.axes[3];
      dolly.getWorldDirection(camVec);

      // Store the dolly's current position
      const oldX = dolly.position.x;
      const oldZ = dolly.position.z;

      // Calculate the new, potential position prior to collision detection
      const newX = (dolly.position.x - (camVec.x * moveSpeed * val));
      const newZ = (dolly.position.z - (camVec.z * moveSpeed * val));

      // Prepare the scene for collision checking
      player.position.x = newX;
      player.position.z = newZ;
      scene.updateMatrixWorld();
      box.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld); 
      let moveForward = true;
      let maxBump = 0;
      
      for(let a = 0; a < structure.length; a++) {


        //////*********************************************************** */
        // REMEMBER MODELS ARE BROUGHT IN AS A WRAPPER WILL
        // NNED TO BE UNWRAPPED FOR COLLISIONS
        // CHECK CHATGPT
        /////!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // Check each structure for collision
        let test = structure[a];
        let group = false;
        let test_ = null;
        if(test instanceof THREE.Group) {

          //console.log("compute from group")
          test_ = computeExactWorldBox(test);
          group = true;
        }
        //console.log("PRIOR")
        if((!group && checkCollision(box, test)) || (group && box.intersectsBox(test_))) {
       
          // Check if the collided object is climbable
          
          const testBox = test instanceof THREE.Group ? test_ : new THREE.Box3().setFromObject(test);
          
          const boxHelper = new THREE.Box3Helper(testBox, 0xff0000); // red lines
          scene.add(boxHelper);   

         /* const min = testBox.max.y.toFixed(2);
          const max = box.min.y.toFixed(2);
          const diff = Math.abs(testBox.max.y - box.min.y);
          if(diff >= gravLower && diff <= gravUpper) {

            maxBump = (diff > maxBump) ? diff : maxBump;
            player.position.y += maxBump;
            dolly.position.y += maxBump;    
            
            let climb = "";
            climb += ("Climb {\n");
            climb += (UTILS.addSpace(2) + "Min. Y: " + min + "\n");
            climb += (UTILS.addSpace(2) + "Max. Y: " + max + "\n");
            climb += (UTILS.addSpace(2) + "Bump: " + maxBump.toFixed(2) + "\n");
            climb += ("}")
            debug(null, climb, null);

          } else {*/

            moveForward = false;
            break;
          /*}*/ 
        }
      }

      if(moveForward) {
      
        dolly.position.x = newX;
        dolly.position.z = newZ; 

        // Check for gravity
        //const intersects = checkGravity(scene, terrain, gravRay, dolly, gravOffset, uniScale, modScale);
        //if(intersects !== null) {
/*
          // Get the required data from the intersected model
          const region = intersects.object.parent.userData.hasOwnProperty("RegionModelId") ? 
            intersects.object.parent.userData.RegionModelId : null;
          const type = intersects.object.parent.userData.ModelType.hasOwnProperty("ModelType") ?
            intersects.object.parent.userData.ModelType : null; 
          
          const temp = new THREE.Box3().setFromObject(intersects.object);
          // This solution is inelegant, but seems to work
          // Consider an occasional "reset" to properly align te player with the models
          const distance = Math.abs(dolly.position.y - temp.max.y) - (UTILS.scaleDistance(gravOffset, uniScale, modScale) / 2);
          if(distance >= gravLower && distance <= gravUpper) {
            
            const oldY = (player.position.y);
            player.position.y -= distance;
            scene.updateMatrixWorld();
            box.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld); 

            let pot = "";
            pot += ("Potential Drop {\n");
            pot += (UTILS.addSpace(2) + "Grav.Low: " + gravLower.toFixed(2) + "\n");
            pot += (UTILS.addSpace(2) + "Grav.Up: " + gravUpper.toFixed(2) + "\n");
            pot += (UTILS.addSpace(2) + "Distance: " + distance.toFixed(2) + "\n");
            pot += ("}")
            debug(null, pot, null);
            
            const collide = checkForCollisions(box, structure);
            if(collide === null) {

              dolly.position.y -= distance;

              let act = "";
              act += ("Actual Drop {\n");
              act += (UTILS.addSpace(2) + "Grav.Low: " + gravLower.toFixed(2) + "\n");
              act += (UTILS.addSpace(2) + "Grav.Up: " + gravUpper.toFixed(2) + "\n");
              act += (UTILS.addSpace(2) + "Distance: " + distance.toFixed(2) + "\n");
              act += ("}")
              debug(null, act, null);        

            } else {
              
              player.position.y = oldY;
            }
          }
*/
        //} else {

          // Gravity must intersect with something or it is a fall
          player.position.x = oldX;
          player.position.z = oldZ;
        //}

      } else {

        player.position.x = oldX;
        player.position.z = oldZ;
      }

    } else if(!axial && lateral) {
  
      let rot = THREE.MathUtils.radToDeg(dolly.rotation.y);
      let newRot = (gp0.gamepad.axes[2] < 0) ? (rot + rotSpeed) : (rot - rotSpeed);
      dolly.rotation.y = THREE.MathUtils.degToRad(newRot);
    }

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