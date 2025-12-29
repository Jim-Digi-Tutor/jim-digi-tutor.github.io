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
            debug(null, ("Climb\nMin: " + min + "\nMax: " + max + "\nMax Bump: " + maxBump.toFixed(2)));

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

          // Get the required data from the intersected model
          const region = intersects.object.parent.userData.hasOwnProperty("RegionModelId") ? 
            intersects.object.parent.userData.hasOwnProperty("RegionModelId") : null;
          const type = intersects.object.parent.userData.ModelType.hasOwnProperty("ModelType") ?
            intersects.object.parent.userData.ModelType.hasOwnProperty("ModelType") : null; 
          
          const distance = (intersects.distance.toFixed(2) - UTILS.scaleDistance(gravOffset, uniScale, modScale));
          if(distance >= gravLower && distance <= gravUpper) {
            
            const oldY = (player.position.y);
            player.position.y -= distance; // - UTILS.scaleDistance(gravOffset, uniScale, modScale);
            scene.updateMatrixWorld();
            box.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld); 
            debug(null, ("Potential Drop\nLower: " + gravLower + "\nUpper: " + gravUpper + "\nDistance: " + distance));    
            if(checkForCollisions(box, structure) === null) {

              dolly.position.y -= distance;
              debug(null, ("Drop\nLower: " + gravLower + "\nUpper: " + gravUpper + "\nDistance: " + distance));        

            } else {

              //console.log(Math.random() * 10000)
              console.log(Math.random() * 10000 + ", " + checkForCollisions(box, structure).userData.RegionModelId)
              player.position.y = oldY;
            }
          }

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

    debug(("Player:\nx: " + dolly.position.x.toFixed(2) + "\ny: " + dolly.position.y.toFixed(2) + "\nz: " + dolly.position.z.toFixed(2)), null);
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