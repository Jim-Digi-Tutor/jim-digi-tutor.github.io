import * as THREE from "three";

import * as UTILS from "./utils.js";

export function handleControllerInput(engine, gp0, gp1, scene, vec, dolly, player, box, structure, scale) {

  const uniScale = engine.getUniversalScale();
  const modScale = engine.getModelScale();
  const baseSpeed = 0.05;
  const baseRotation = 1;
  const gravRayOffset = (0.5 * uniScale);
  const gravLower = (1.5 * uniScale * modScale).toFixed(2);
  const gravUpper = (3 * uniScale * modScale).toFixed(2);

  if(gp0.gamepad !== null && gp1.gamepad !== null) {
    
    let axial = (Math.abs(gp1.gamepad.axes[3]) > 0.5);
    let lateral = (Math.abs(gp0.gamepad.axes[2]) > 0.5);

    if(axial) {

      // Axial movement always takes precedence
      let val = -gp1.gamepad.axes[3];
      dolly.getWorldDirection(vec);

      // Store the dolly's current position
      let oldX = dolly.position.x;
      let oldZ = dolly.position.z;

      // Calculate the new, potential position prior to collision detection
      let newX = (dolly.position.x - (vec.x * (baseSpeed * scale) * val));
      let newZ = (dolly.position.z - (vec.z * (baseSpeed * scale) * val));

      // Prepare the scene for collision checking
      player.position.x = newX;
      player.position.z = newZ;
      scene.updateMatrixWorld();
      box.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld); 

      //engine.displayDebug(": " + gravLower + ", " + gravUpper);
      let move = true;
      let struct = engine.getStructure();
      for(let a = 0; a < struct.length; a++) {

        let test = struct[a];
        if(checkCollision(box, test)) {
console.log("COLLIDE")
          const testBox = new THREE.Box3().setFromObject(test);
          const testBox2 = new THREE.Box3().setFromObject(player);
          engine.displayDebug("CollideMax: " + testBox.max.y.toFixed(2) + " CollideMin: " + testBox2.min.y);
          console.log(testBox);
          //engine.displayDebug(". : " + (testBox.max.y - box.min.y));
          

          //if(distance >= gravLower && distance <= gravUpper) {

          //}
          //engine.displayDebug("CollideMin: " + box.min.y);
//const bottomOfB = boxB.min.y;
          //const boxB = new THREE.Box3().setFromObject(meshA);
          move = false;
          player.position.x = oldX;
          player.position.z = oldZ;
        }
      }
      
      if(move) {
      
        dolly.position.x = newX;
        dolly.position.z = newZ; 

        const intersects = checkGravity(engine.getScene(), engine.getTerrain(), engine.getGravityRay(), engine.getDolly(), uniScale, modScale);
        if(intersects !== null) {

          const type = intersects.object.parent.userData.ModelType
          const distance = intersects.distance.toFixed(2);
          engine.displayDebug(": " + gravLower + ", " + gravUpper + ", " + distance);
          if(distance >= gravLower && distance <= gravUpper) {
            
            
            player.position.y -= distance;
            dolly.position.y -= distance;
            engine.displayDebug("Drop, " + gravLower + ", " + gravUpper + ", " + distance);        
          }
        }
      }
          
        
        //} else {

          //engine.displayDebug("No Drop, " + gravLower.toFixed(2) + ", " + gravUpper.toFixed() + ", " + distance);
        //}     
  
    } else if(!axial && lateral) {
  
      let rot = THREE.MathUtils.radToDeg(dolly.rotation.y);
      let newRot = (gp0.gamepad.axes[2] < 0) ? (rot + baseRotation) : (rot - baseRotation);
      dolly.rotation.y = THREE.MathUtils.degToRad(newRot);
    }
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

export function checkGravity(scene, terrain, ray, dolly, uniScale, modScale) {

  // Prepare the gravity check ray
  scene.updateMatrixWorld();

  console.log("SCALED ", UTILS.scaleDistance(0.5, uniScale, modScale))
  ray.set(new THREE.Vector3(dolly.position.x, (dolly.position.y + UTILS.scaleDistance(0.5, uniScale, modScale)), dolly.position.z), new THREE.Vector3(0, -1, 0));
  const intersects = ray.intersectObjects(terrain, true);
  if(intersects.length > 0) {
    
    return intersects[0];
  }

  return null;
}