import * as THREE from "three";

import * as UTILS from "./utils.js";

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

        // Check each structure for collision
        const test = structure[a];
        if(checkCollision(box, test)) {
          
          // Check if the collided object is climbable
          const testBox = new THREE.Box3().setFromObject(test);
          const min = testBox.max.y.toFixed(2);
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

          } else {

            moveForward = false;
            break;
          }
        }
      }

      if(moveForward) {
      
        dolly.position.x = newX;
        dolly.position.z = newZ; 

        // Check for gravity
        const intersects = checkGravity(scene, terrain, gravRay, dolly, gravOffset, uniScale, modScale);
        if(intersects !== null) {
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
        } else {

          // Gravity must intersect with something or it is a fall
          player.position.x = oldX;
          player.position.z = oldZ;
        }

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
    debug(pos, null, null);
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