import * as THREE from "three";

export function handleControllerInput(gp0, gp1, scene, vec, dolly, player, box, structure) {
  
  let movementSpeed = 0.025;
  let rotationSpeed = 0.5;

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
      let newX = (dolly.position.x - (vec.x * movementSpeed * val));
      let newZ = (dolly.position.z - (vec.z * movementSpeed * val));

      // Prepare the scene for collision checking
      player.position.x = newX;
      player.position.z = newZ;
      scene.updateMatrixWorld();
      box.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld); 
      if(checkForCollisions(box, structure) !== null) {

        player.position.x = oldX;
        player.position.z = oldZ;

      } else {
      
        dolly.position.x = newX;
        dolly.position.z = newZ; 
      }      
  
    } else if(!axial && lateral) {
  
      let rot = THREE.MathUtils.radToDeg(dolly.rotation.y);
      let newRot = (gp0.gamepad.axes[2] < 0) ? (rot + rotationSpeed) : (rot - rotationSpeed);
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