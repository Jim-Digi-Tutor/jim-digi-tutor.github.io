// The code below loads the Three.js libraries we mapped earlier
// We can use them in our code
// They have to be imported for each, individual JavaScript file we create
import * as THREE from "three";

/**
 * This function handles any changes to the controller joysticks
 * It calculates the new position of the player and checks there is nothing preventing movement there
 */
export function handleMovement(eng) {  
  
  // Create references to the engine variables
  // This just makes writing and reading the code further down easier
  let gp0 = eng.controller0; 
  let gp1 = eng.controller1;
  let scene = eng.scene;
  let vec = eng.cameraVector;
  let dolly = eng.dolly;
  let player = eng.player;
  let box = eng.playerBox;
  let structure = eng.structure;
  let movementSpeed = eng.movementSpeed;
  let rotationSpeed = eng.rotationSpeed;

  // First of all, make sure neither of the controllers are null
  // If a controller is null, it means there's a problem with it
  if(gp0.gamepad !== null && gp1.gamepad !== null) {
    
    /**
     * Axial movement means forwards and backwards - this is controlled by the right controller joystick
     * Lateral movement means side to side (although in our app, it means rotation)
     * Lateral movement is controlled by the left controller joystick
     */

    // Now we check whether either of the controller joysicks has been pushed
    // Although we only consider the joystick pushed if it is pushed more than halfway
    // The axial variable is true only if the right controller joystick is pushed forward or backward
    let axial = (Math.abs(gp1.gamepad.axes[3]) > 0.5);
    // The lateral variable is true if the left controller joystick has been pushed left or right
    let lateral = (Math.abs(gp0.gamepad.axes[2]) > 0.5);

    // Check whether axial or lateral joystick movement has been detected
    if(axial) {

      // Axial (forward or backward) movement always takes precedence
      // If a player is moving back or forward, they can't turn / rotate
      // Get the value of the fourth axes of the right controller
      // This tells us how far the joystick has been pushed
      let val = -gp1.gamepad.axes[3];

      dolly.getWorldDirection(vec);

      // Store the dolly's current position
      // We need this in case there is a collision and we need to reset any movement
      let oldX = dolly.position.x;
      let oldZ = dolly.position.z;

      // Calculate the new, potential position prior to collision detection
      // If there is no barrier to movement, this will be where the dolly will be moved to
      // The more the joystick was pushed, the faster the movement
      // This based on the direction of the camera, the speed of movement, and how far the joystick has been pushed
      let newX = (dolly.position.x - (vec.x * movementSpeed * val));
      let newZ = (dolly.position.z - (vec.z * movementSpeed * val));

      // Prepare the scene for collision checking
      // Update the position of the player (the visual mesh used to record the player's footprint)
      player.position.x = newX;
      player.position.z = newZ;
      scene.updateMatrixWorld();

      // Using the position of the player, update the player's bounding box ready for collision checks
      box.copy(player.geometry.boundingBox).applyMatrix4(player.matrixWorld); 

      // Check for collisions using the checkForCollisions function
      if(checkForCollisions(box, structure) !== null) {

        // A collision has occured
        // The player mesh is returned to its previous position
        // Basically, nothing happens and the player doesn't move
        player.position.x = oldX;
        player.position.z = oldZ;

      } else {
      
        // No collision occured so we move the dolly to the new, pre-calculated position
        // The player mesh has already been moved
        dolly.position.x = newX;
        dolly.position.z = newZ; 

        // The player has moved, we now check whether any events are triggered if a new tile is entered
        let col = Math.floor(dolly.position.x / 2); // Calculate the column the dolly is now in
        let row = Math.floor(dolly.position.z / 2); // Calculate the row the dolly is now in
        let tile = ((row * 20) + col);              // Calculate the actual tile that the dolly is in
        
        // Check whether that tile is the location of an event
        // In the case below, entering tile 157 results in a portcullis appearing and preventing escape!
        // This is not the most elegant, or efficient, way of managing tile events, but it does work...
        if(tile === 157 && !eng.portcullisDown) {

          // Add the portcullis models to prevent further movement
          eng.loadModel("./models/portcullis-1.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [structure], []);
          eng.loadModel("./models/portcullis-2.glb", [ 20, 0, 20 ], [ 0, 270, 0 ], [ 0.2, 0.2, 0.2 ], [structure], []);
          eng.portcullisDown = true;
        }
      }      
  
    } else if(!axial && lateral) {
  
      // The left joystick has been pushed either left or right
      // Get the rotation of the dolly
      let rot = THREE.MathUtils.radToDeg(dolly.rotation.y);

      // If the value of Axes Two of the left joystick is greater than zero, the rotation is rightward
      // If it is less than or equal to zero, the rotation is left
      let newRot = (gp0.gamepad.axes[2] < 0) ? (rot + rotationSpeed) : (rot - rotationSpeed);

      // Update the final rotation of the dolly
      dolly.rotation.y = THREE.MathUtils.degToRad(newRot);
    }
  }
}

/**
 * This function checks the bounding box (box) against the array of structure objects (structure)
 * If a collision occurs, the first object the box collides with is returned
 * If there is no collision, it returns null
 */
function checkForCollisions(box, structure) {

  // Iterate through the objects in the structure array and check each for collisions against box
  for(let a = 0; a < structure.length; a++) {

    let obj = structure[a];
    // Check the individual collision using the checkCollision function
    if(checkCollision(box, obj)) {

      return obj;  
    }
  }

  return null;
} 

/**
 * Checks whether there is a collision between an individual object (obj) and a bounding box
 */
function checkCollision(box, obj) {

  // Configure the object's bounding box, store the new box in the test variable 
  let test = new THREE.Box3().setFromObject(obj);

  // If the object's bounding box intersects with the bounds object, return true
  if(box.intersectsBox(test)) {

    return true;
  }
  
  return false;
}

/**
 * This function handles interaction between the controller raycasters and interactable objects
 * It calculates if any object has been intersected by the raycasters
 */
export function handleInteraction(eng) {  

  // Create references to the engine variables
  // This just makes writing and reading the code further down easier
  let controller1 = eng.controller1;
  let scene = eng.scene;
  let ray1 = eng.raycaster1;
  let matrix1 = eng.tempMatrix1;
  let picked1 = eng.picked1;
  let structure = eng.structure;
  let interactions = eng.interactions;
  let pickDistance = eng.pickDistance;
      
  // Prepare the raycaster by setting up the position and direction of the ray for Controller One
  scene.updateMatrixWorld();
  matrix1.identity().extractRotation(controller1.controller.matrixWorld);
  ray1.ray.origin.setFromMatrixPosition(controller1.controller.matrixWorld);
  ray1.ray.direction.set(0, 0, -1).applyMatrix4(matrix1);

  // Check whether the raycaster for Controller One intersects with any interactables
  // This code uses the intersectObjects function that is part of Three.js
  // intersectObjects returns an array of objects that have been intersected by the raycaster
  let checkInteractables1 = ray1.intersectObjects(interactions);

  // If the array length is zero, no objects have been intersected
  if(checkInteractables1.length > 0) {

    // There are objects in the array
    // The one at index 0 is nearest to the player
    // Create a reference to it
    let obj = checkInteractables1[0].object;

    // The object picked1 stores the object that is currently targeted by the raycaster (picked1.obj)
    // If picked1.obj is null, then our raycast is not targeting anything at the moment
    // If it isn't null, but it is not the same object as was found by this raycast, make it null
    if(picked1.obj !== null && picked1.obj !== obj) {

      nullifyPicked1(picked1);
    }

    // As well as containing an object, the raycast array also stores the distance from the ray origin
    // It can be accessed using the variable distance, as shown below
    // Record the distance
    let distance = checkInteractables1[0].distance;

    // If the distance to the object is less than the pickDistance we set earlier, it is a valid pick
    if(distance <= pickDistance) {

      // Because we only checked the interactions array, there might be a structure object in between
      // This would, of course, block the ray - check whether this is the case
      // This code also uses the intersectObjects function
      let checkStructure1 = ray1.intersectObjects(structure);

      // If no structure has been intersected, or any structure is further away, process the interaction
      if(checkStructure1.length === 0 || checkStructure1[0].distance > distance || checkStructure1[0].object === obj) {

        // Highlight the picked object with an emmisive colour to make it stand out
        obj.material.emissive = new THREE.Color(0xffffff);
        obj.material.emissiveIntensity = 0.05;

        // Set the picked1 object to the currently highlighted object
        picked1.obj = obj;
        picked1.distance = distance;
        
      } else {

        // If a structure is intersected before the picked object, nullify it
        // Our ray should not pass through walls or doors!
        nullifyPicked1(picked1);
      }
    }

  } else {

    // If there are no interactable objects detected, nullify picked1
    nullifyPicked1(picked1);
  }
}

/**
 * This function makes the picked1.obj object null
 * It removes the emissive colour from the object
 */
function nullifyPicked1(picked1) {

  if(picked1.obj !== null) {
        
    picked1.obj.material.emissive = new THREE.Color(0x000000);
  }

  picked1.obj = null;
  picked1.distance = 999;
}

/**
 * This function runs when the user depresses the trigger of Controller One
 * It takes whatever the raycast has currently picked and sets the selected1 object with it
 * The selected1 object will be the "clicked on" when the trigger is released
 */
export function selectStartController1(eng) {

  // Set the trigger1Down flag to indicate that the trigger is pressed
  eng.trigger1Down = true;

  // If an object has been picked, set the selected object to match it
  if(eng.picked1.obj !== null) {

    eng.selected1.obj = eng.picked1.obj;
    eng.selected1.distance = eng.picked1.distance;
  }
}

/**
 * This function runs when the user releases the trigger of Controller One
 * If an object is selected, releasing the trigger will act on that object
 * By doing this, we can remove objects such as doors or collect object such as keys
 */
export function selectEndController1(eng) {

  // Ensure that the object currently picked is the same one initially selected
  if(eng.selected1.obj !== null && eng.picked1.obj === eng.selected1.obj) {

    // If the selected object has an itemId, it is an interactable object
    // Identify what the object is, get its itemId, and process it
    let data = eng.selected1.obj.parent.parent.userData;
    if(data.hasOwnProperty("itemId")) {

      let itemId = data.itemId;

      // The door to the Silver Key room
      if(itemId === "sk-room-door") {

        // This door doesn't need a key so we can remove it from the scene (i.e. open it!)
        removeObject("sk-room-door", eng.scene, eng.structure, eng.interactions);
      }
      
      // The door to the Gold Key room
      if(itemId === "gk-room-door") {

        // This door needs the Silver Key, only open it if the key has been collected
        if(eng.hasSilverKey) {
          
          removeObject("gk-room-door", eng.scene, eng.structure, eng.interactions);
        }
      }

      // The door to the Final Room
      if(itemId === "final-room-door") {

        // This door needs the Gold Key, only open it if the key has been collected
        if(eng.hasGoldKey) {
          
          removeObject("final-room-door", eng.scene, eng.structure, eng.interactions);
        }
      }

      // This item is the Silver Key
      // Set the hasSilverKey flag to true and then remove the model from the scene
      if(itemId === "silver-key") {

        eng.hasSilverKey = true;
        removeObject("silver-key", eng.scene, eng.structure, eng.interactions);
      }

      // This item is the Gold Key
      // Set the hasGoldKey flag to true and then remove the model from the scene        
      if(itemId === "gold-key") {

        eng.hasGoldKey = true;
        removeObject("gold-key", eng.scene, eng.structure, eng.interactions);
      }
    }
  }

  // The trigger has been released
  // Nullify the selected object and release the trigger1Down flag
  eng.selected1.obj = null;
  eng.selected1.distance = 999;
  eng.trigger1Down = false;
}

/**
 * This function removes an object from the scene; it will no longer feature in our environment
 * It also removes it from the structure and interactions arrays
 */
function removeObject(id, scene, structure, interactions) {

  // Remove the object from the interactions array, removing it from the scene in the process
  for(let a = 0; a < interactions.length; a++) {

    let data = interactions[a].userData;
    if(data.hasOwnProperty("itemId") && data.itemId === id) {
   
      scene.remove(interactions[a]);
      interactions.splice(a, 1);
      break;
    }
  }

  // Now remove the item from the structure array, if it exists there
  for(let a = 0; a < structure.length; a++) {

    let data = structure[a].userData;
    if(data.hasOwnProperty("itemId") && data.itemId === id) {
   
      structure.splice(a, 1);
      break;
    }
  }
}