import * as THREE from "three";
import * as REGION from "./world-components/region.js";

/**
 * A class for managing in-game movement.
 * @class
 */
export class MovementManager {

  #engine;

  #controllers = [
    { 
      controller: null,
      active: false,
      forward: 0,
      turn: 0
    },
    {
      controller: null,
      active: false,
      forward: 0,
      turn: 0      
    }
  ];

  #scene;
  #cameraVector;
  #dolly;
  #player;
  #collidables;
  #movementSpeed;
  #rotationSpeed;

  #CONTROLLER_COUNT = 2;
  #STICK_DEADZONE = 0.25;
  #CHANGE_THRESHOLD = 0.05;
  #currentIndex = null;

  /**
   * Creates a MovementManager.
   * @param {Engine} engine The main game engine.
   * @param {ControllerGroup} controller0 The controller group for controller 0.
   * @param {ControllerGroup} controller1 The controller group for controller 1.
   * @param {THREE.Scene} scene The game scene.
   * @param {THREE.Vector3} cameraVector Used for determining the direction of movement.
   * @param {THREE.Object3D} dolly The dolly used for moving the camera and controllers around the game-world.
   * @param {THREE.Mesh} player A mesh representing the player; used for calculating collisions.
   * @param {Array} collidables An array of collidable objects.
   * @param {Number} movementSpeed The speed at which the player moves.
   * @param {Number} rotationSpeed The speed at which the player rotates.
  */
  constructor(
    engine,
    controller0,
    controller1,
    scene,
    cameraVector,
    dolly,
    player,
    collidables,
    movementSpeed,
    rotationSpeed
  ) {

    this.#engine = engine;

    this.#controllers[0].controller = controller0;
    this.#controllers[1].controller = controller1;

    this.#scene = scene;
    this.#cameraVector = cameraVector;
    this.#dolly = dolly;
    this.#player = player;
    this.#collidables = collidables;
    this.#movementSpeed = movementSpeed;
    this.#rotationSpeed = rotationSpeed;
  }

  /**
   * Handles whether or not the player has moved and whether there were any collisions.
   * Most of the code was provided by ChatGPT.
   */  
  checkMovement() {

    // If the player is currently teleporting, stop execution.
    if(this.#engine.getIsTeleporting()) return;

    const cont = this.#controllers;
    const gps = [cont[0].controller?.gamepad || null, cont[1].controller?.gamepad || null];

    // If no controllers are found, there's nothing to do so return
    if(gps[0] === null && gps[1] === null) return;

    // --- 1) Check both controllers and update controller state; pick the most recently moved
    for (let i = 0; i < this.#CONTROLLER_COUNT; i++) {
      
      const gp = gps[i];
      if(!gp) {

        cont[i].active = false;
        continue;
      }

      // Process the axes and get any movement values.
      const axes = gp.axes || [];
      const x = axes[2] || 0;       // Left / Right movement of stick
      const y = axes[3] || 0;       // Up / Down movement of stick

      // Map x and y to "forward" and "turn" values.
      const forward = -y;
      const turn = x;

      const magnitude = Math.hypot(forward, turn);
      const wasActive = cont[i].active;
      const isActive  = magnitude > this.#STICK_DEADZONE;
      let changed = false;  

      if(isActive) {
        
        // Consider it "changed" if it was inactive OR moved significantly
        const prev = cont[i];
        if (
          !wasActive ||
            Math.abs(prev.forward - forward) > this.#CHANGE_THRESHOLD ||
            Math.abs(prev.turn - turn) > this.#CHANGE_THRESHOLD
        ) {

          changed = true;
        }

        cont[i].active = true;
        cont[i].forward = forward;
        cont[i].turn = turn;

        if(changed)
          this.#currentIndex = i;

      } else {

        cont[i].active = false;
        cont[i].forward = 0;
        cont[i].turn = 0;
      }        
    }

    // If no one has moved, stop execution.
    if(this.#currentIndex === null) return;

    const active = cont[this.#currentIndex];
    if(!active.active) {
      
      // The last active controller let go; if the other one is active, hand it over.
      const otherIndex = ((this.#currentIndex + 1) % this.#CONTROLLER_COUNT);
      if(cont[otherIndex].active) {
        
        this.#currentIndex = otherIndex;
      
      } else {

        this.#currentIndex = null;
        return;
      }
    }
    
    const { forward, turn } = cont[this.#currentIndex];
    
    // --- 2) Interpret stick as Forward-only / Forward & Turn / Turn-only movement
    // These thresholds can be fine-tuned to better define the controller "conrridors".
    const forwardAbs = Math.abs(forward);
    const turnAbs = Math.abs(turn);
    const forwardOnlyThreshold  = 0.6; 
    const sideCorridorThreshold = 0.3;

    let useForward = 0;
    let useTurn = 0;

    if(forwardAbs > forwardOnlyThreshold && turnAbs < sideCorridorThreshold) {
        
      // Narrow forward corridor: move straight forward
      useForward = forward;
      useTurn = 0;

    } else if(forwardAbs > this.#STICK_DEADZONE && turnAbs >= sideCorridorThreshold) {
      
      // Forward quadrants: move and rotate
      useForward = forward;
      useTurn = turn;

    } else if(forwardAbs <= this.#STICK_DEADZONE && turnAbs >= sideCorridorThreshold) {
      
      // Side corridors: rotate in place
      useForward = 0;
      useTurn = turn;
      
    } else {
      
      // In the fuzzy middle or deadzone: no movement
      return;
    }
    
    // --- 3) Apply the rotation first (turn in place or while moving)
    if (Math.abs(useTurn) > 0) {

      const rotDeg = THREE.MathUtils.radToDeg(this.#dolly.rotation.y);
      // Scale rotation speed by stick movement for smoother control
      const rotStep = (this.#rotationSpeed * useTurn);
      const newRot = (rotDeg - rotStep);
      this.#dolly.rotation.y = THREE.MathUtils.degToRad(newRot);
    }

    // If no forward component has been applied, stop execution.
    if (Math.abs(useForward) <= this.#STICK_DEADZONE) {
      return;
    }   
    
    // --- 4) Compute desired forward movement in XZ from camera forward ---
    this.#dolly.getWorldDirection(this.#cameraVector);
    const moveX = -(this.#cameraVector.x * this.#movementSpeed * useForward);
    const moveZ = -(this.#cameraVector.z * this.#movementSpeed * useForward);
    const oldX = this.#dolly.position.x;
    const oldZ = this.#dolly.position.z;
    const tryX = (oldX + moveX);
    const tryZ = (oldZ + moveZ);

    // --- 5) Check for any collisions.
    let moved = false;
    const moveStatus = this.#collidesAt(tryX, tryZ);
    if (moveStatus instanceof REGION.Teleport) {
      
      moveStatus.trigger();
    
    } else if (!moveStatus) {
      
      this.#dolly.position.x = tryX;
      this.#dolly.position.z = tryZ;
      moved = true;

    } else {
    
      if (!this.#collidesAt(tryX, oldZ)) {
    
        // Slide along x-axis only
        this.#dolly.position.x = tryX;
        this.#dolly.position.z = oldZ;
        moved = true;

      } else if (!this.#collidesAt(oldX, tryZ)) {
      
        // If x-axis movement failed, try z-axis movement
        this.#dolly.position.x = oldX;
        this.#dolly.position.z = tryZ;
        moved = true;
      }
    }

    // Reset player proxy back to dolly's original XZ
    this.#player.position.x = oldX;
    this.#player.position.z = oldZ;
  }

  #collidesAt(x, z) {
      
    this.#player.position.x = x;
    this.#player.position.z = z;
    this.#scene.updateMatrixWorld(true);

    const boxTmp = new THREE.Box3();  
    boxTmp.copy(this.#player.geometry.boundingBox).applyMatrix4(this.#player.matrixWorld);

    for (let i = 0; i < this.#collidables.length; i++) {
      
      const test = this.#collidables[i];
      if (test instanceof THREE.Group) {
      
        const groupBox = computeExactWorldBox(test);
        if(boxTmp.intersectsBox(groupBox)) return true;
      
      } else {
        
        if(this.#checkCollision(boxTmp, test)) {
          
          if(test.userData.hasOwnProperty("teleport") && test.userData.teleport !== "") {
          
            const teleport = this.#engine.getTeleportByAlias(test.userData.teleport);
            if(teleport !== null) return teleport;
          }
          
          return true;
        }
      }
    }
  
    return false;
  }  

  #checkCollision(box, obj) {

    let collision = false;
  
    // Configure the object's bounding box 
    let test = new THREE.Box3().setFromObject(obj);
  
    // If the object's bounding box intersects with the bounds object, process the collision
    if(box.intersectsBox(test))
      collision = true;
  
    return collision;
  }  
}

/**
 * A class for managing the in-game interactions.
 * @class
 */
export class InteractionManager {

  /**
   * Whether or not to log construction and processing data to the console
   * @type {Boolean}
   * @private
   */
  #log = true;

  #engine;
  #controller0;
  #controller1;
  #range;

  #components = [
    {
      controller: null,
      ray: null,
      matrix: null,
      picked: null,
      selected: null,
      triggerDown: false
    },
    {
      controller: null,
      ray: null,
      matrix: null,
      picked: null,
      selected: null,
      triggerDown: false
    }    
  ];

  #scene;
  #interactables;
  #collidables;

  /**
   * Creates an InteractionManager.
   * @param {Engine} engine The main game engine.
   * @param {ControllerGroup} controller0 The controller group for controller 0.
   * @param {ControllerGroup} controller1 The controller group for controller 1.
   * @param {Number} range The maximum range of any interactions.
   * @param {THREE.Scene} scene The game scene.
   * @param {Array} interactables An array of interactable objects.
   * @param {Array} collidables An array of collidable objects.
  */
  constructor(engine, controller0, controller1, range, scene, interactables, collidables) {

    this.#engine = engine;
    this.#controller0 = controller0;
    this.#controller1 = controller1;
    this.#range = range;
      
    this.#scene = scene;
    this.#interactables = interactables;
    this.#collidables = collidables;

    this.#controller0.controller.addEventListener("selectstart", this.#selectStart.bind(this, 0));
    this.#controller0.controller.addEventListener("selectend", this.#selectEnd.bind(this, 0));    
    this.#controller1.controller.addEventListener("selectstart", this.#selectStart.bind(this, 1));
    this.#controller1.controller.addEventListener("selectend", this.#selectEnd.bind(this, 1));       

    this.#setupComponents(0);
    this.#setupComponents(1);
  }

  #setupComponents(index) {

    this.#components[index].controller =
      (index === 0) ?
        this.#controller0 :
        this.#controller1;
        
    this.#components[index].ray = new THREE.Raycaster();
    this.#components[index].ray.near = 0;
    this.#components[index].ray.far = this.#range;
    this.#components[index].matrix = new THREE.Matrix4();
    this.#components[index].picked = { obj: null, dist: 999 };
    this.#components[index].selected = { obj: null, dist: 999 };
    this.#components[index].triggerDown = false;
  }

  #castRay(index, target) {

    // Prepare the raycaster, set up the position and direction of the ray for the specified controller
    const comp = this.#components[index];
    if(!comp) return;

    this.#scene.updateMatrixWorld();
    comp.matrix.identity().extractRotation(comp.controller.controller.matrixWorld);
    comp.ray.ray.origin.setFromMatrixPosition(comp.controller.controller.matrixWorld);
    comp.ray.ray.direction.set(0, 0, -1).applyMatrix4(comp.matrix);

    // If the target is an array, use intersectObjects.
    // If it's a single object, use intersectObject.
    // Return the results of the check.
    // Setup the array to store interactions
    if(Array.isArray(target))
      return comp.ray.intersectObjects(target);
    else
      return comp.ray.intersectObject(target);
  }

  #checkObstacles(index, obj, distance, target, prepare = false) {

    const comp = this.#components[index];
    if(!comp) return;

    // If prepare has been passed and is true, prepare the specified ray
    if(prepare) {

      this.#scene.updateMatrixWorld();
      comp.matrix.identity().extractRotation(comp.controller.controller.matrixWorld);
      comp.ray.ray.origin.setFromMatrixPosition(comp.controller.controller.matrixWorld);
      comp.ray.ray.direction.set(0, 0, -1).applyMatrix4(comp.matrix);      
    }

    const check = (Array.isArray(target)) ?
      comp.ray.intersectObjects(target) :
      comp.ray.intersectObject(target);
    
    // If the check shows no intersections, there are no collidable obstacles in the ray's path; return false.
    // If the check shows that the nearest object is the object itself; return false.
    // If the check reveals other objects further away than the object; return true.
    // If the check identifies a collidable object nearer than the object; return true.
    if(check.length === 0 || check[0].object === obj || check[0].distance > distance)
      return false;
    else
      return true;
  }

  checkInteractions(index) {
        
    const comp = this.#components[index];
    if(!comp) return;

    // Check if the specified controller ray intersects anything
    const interactions = this.#castRay(index, this.#interactables);

    // If the array length is zero, no objects have been intersected
    if(interactions.length > 0) {

      const obj = interactions[0].object;
      if(comp.picked.obj !== null && comp.picked.obj !== obj) {

        this.#nullifyPicked(index);
      }

      // Record the distance from the intersected object
      const distance = interactions[0].distance;

      // If the distance to the object is less than the interaction range, it is a valid pick
      if(distance <= this.#range) {

        // Check whether the ray is blocked by a collidable object
        const obstacle = this.#checkObstacles(index, obj, distance, this.#collidables);
        if(!obstacle) {
        
          // If no obstacle has been detected, process the interaction.
          // Highlight the picked object with an emmisive colour to make it stand out.
          // However, exclude any screen interface objects from this.
          const data = obj.userData;
          if(!data.hasOwnProperty("screen")) {

            obj.material.emissive = new THREE.Color(0xFFFFFF);
            obj.material.emissiveIntensity = 0.05;
          
          } else {

            if(data.hasOwnProperty("trackOnControllerOver") && data.trackOnControllerOver) {
              
              const board = this.#getInfoBoardFromAction(data.screen);
              if(board !== null)
                board.onControllerOver(obj.worldToLocal(interactions[0].point.clone()));
            }
          }

          // Set the respective picked object to the currently highlighted object
          comp.picked.obj = obj;
          comp.picked.distance = distance;
          
        } else {

          // If a structure is intersected before the picked object, nullify it.
          // The ray should not pass through solid structures.
          this.#nullifyPicked(index);
        }
      }

    } else {

      // If there are no interactable objects detected, nullify picked1
      this.#nullifyPicked(index);
    }      
  }

  #nullifyPicked(index) {

    const comp = this.#components[index];
    if(!comp) return;

    if(comp.picked.obj !== null) {

      // De-highlight the picked object with an emmisive colour to make it stand out.
      // However, exclude any screen interface objects from this.
      const data = comp.picked.obj.userData;
      if(!data.hasOwnProperty("screen")) {
      
        comp.picked.obj.material.emissive = new THREE.Color(0x000000);
      
      } else {
        
        const action = data.screen;
        if(action.includes("INFO-BOARD-SCREEN-")) {

          const board = this.#getInfoBoardFromAction(action);
          board.refresh(this.#engine.getTime(), true, true);
        }
      }
    }

    comp.picked.obj = null;
    comp.picked.distance = 999;
  }  

  #nullifySelected(index) {}

  #selectStart(index) {

    const comp = this.#components[index];
    if(!comp) return;
    
    // Set the triggerDown flag to indicate that the trigger is pressed
    comp.triggerDown = true;
    
    // If an object has been picked by this controller, set the selected object to match it
    if(comp.picked.obj !== null) {

      comp.selected.obj = comp.picked.obj;
      comp.selected.distance = comp.picked.distance;

      // If the object is a screen, it could be hosting an app.
      // In turn, the app might have clickable components.
      const data = comp.picked.obj.userData;
      if(data.hasOwnProperty("screen")) {
        
        const action = data.screen;
        if(action.includes("INFO-BOARD-SCREEN-")) {

          const board = this.#getInfoBoardFromAction(action);
          if(board !== null) {

            // Cast a ray; it will be needed to identify where on the board the ray was when the button was pressed.
            const points = this.#castRay(index, comp.picked.obj);
            // Setup the array to store interactions
            board.onControllerClickDown(comp.picked.obj.worldToLocal(points[0].point.clone()));
          }
        } 
      }      
    }
  }  

  #selectEnd(index) {

    const comp = this.#components[index];
    if(!comp) return;
    
    // Ensure that the object currently picked is the same one initially selected
    if(comp.selected.obj !== null && comp.picked.obj === comp.selected.obj) 
      this.#processSelected(index);

    // The trigger has been released
    // Nullify the selected object and release the trigger1Down flag
    this.#nullifyPicked(index);
    this.#nullifySelected(index);
    comp.triggerDown = false;    
  }

  #processSelected(index) {

    const comp = this.#components[index];
    if(!comp) return;

    // Check the selected object's userData to ascertain action
    const data = comp.selected.obj.userData;
    if(data.hasOwnProperty("screen")) {
      
      const action = data.screen;
      if(action.includes("INFO-BOARD-SCREEN-")) {

        const board = this.#getInfoBoardFromAction(action);
        if(board !== null) {

          // Cast a ray; it will be needed to identify where on the board the ray was when the button was pressed.
          const points = this.#castRay(index, comp.selected.obj);
          // Setup the array to store interactions
          board.onControllerClickRelease(comp.selected.obj.worldToLocal(points[0].point.clone()));
        }
      } 
    }
  }

  #getInfoBoardFromAction(action) {

    const regionId = parseInt(action.split("-")[3]);
    const boardId = parseInt(action.split("-")[4]);
    const region = this.#engine.getWorld().getRegionById(regionId);
    if(region !== null)
      return region.getInfoBoardManager().getBoardById(boardId);
          
    return null;
  }
}