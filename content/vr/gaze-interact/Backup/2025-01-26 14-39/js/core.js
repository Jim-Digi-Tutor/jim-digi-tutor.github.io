// The code below loads the Three.js libraries we mapped earlier
// We can use them in our code
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

// Imports the code from the loop.js and setup.js JavaScript files
// When we need to use the code, we can now use the references LOOP and SETUP
import { InteractionManager, Interactable } from "./interaction.js";
import { CustomTeleportMovementManager } from "./movement.js";
import { Settings } from "./settings.js";
import { Utility } from "./utility.js";
import { Setup } from "./setup.js";
import { LEVEL_DATA } from "./level-data.js";

let engine; // The engine object that will control the VR environment
export { engine };

/**
 * Initialises the Engine that will control our VR environment
 */
export function initEngine() {

  engine = new Engine();
}

/**
 * Engine is a JavaScript class, or a blueprint for a self-contained object  
 * The Engine controls 
 */
export class Engine {

  scene;        // Used to store the "physical" objects in our environment
  camera;       // The camera is the player's view of the world
  renderer;     // Takes all the data in the scene and renders it as a 2D image on screen
  vrSession;    // A VR session, while it is active, the browser will display the page content in VR mode
  glContext; 

  scale;        // The scale of the scene, used for setting the size of models and calculating distances

  // Declare the various manager objects
  interactionManager;
  movementManager;

  audioListener;
  music;
  audioLoader;

  firstPass = true; // Whether this is the first pass of the iteration loop
 
  // Set the player's starting position, elevation, and facing
  playerPosition = 354;
  playerFacing = 0;
  
  dolly;        // A "virtual carriage" used to move the camera and controllers within the game
  player;       // Visual representation of the player's "footprint" for determining collisions
  playerBox;    // Data representation of the player's "footprint" for determining collisions
  
  gltfLoader;

  lvl;    // The level data for the game

  // Declare the lights that will illuminate the scene
  ambientLight;
  mainLight;

  constructor() {}

  /**
   * This function launches and configures the VR session
   */
  launch() {

    console.log("Launching WebXR");

    // Initialises the Three.JS scene
    this.scene = new THREE.Scene();
        
    // Creates and positions the camera, the player's view of the environment
    this.camera = new THREE.PerspectiveCamera(Settings.fov, window.innerWidth / window.innerHeight, Settings.near, Settings.far);

    // create an AudioListener and add it to the camera
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);

    // create a global audio source
    this.music = new THREE.Audio(this.audioListener);

    // load a sound and set it as the Audio object's buffer
    this.audioLoader = new THREE.AudioLoader();
    this.audioLoader.load("./audio/nocturne-01.ogg", function(buffer) {
      
      this.music.setBuffer(buffer);
      this.music.setLoop(true);
      this.music.setVolume(0.5);
      this.music.play();
      this.music.pause();

    }.bind(this));

    // Create and configure the renderer
    this.renderer = Setup.setupRenderer();

    // Check if the session is null (it should be!)
    // If isn't null, close it
    if(this.vrSession === undefined || this.vrSession === null) {
      
      // Hide the launch button
      document.getElementById("launch-button").style.display = "none";
    
      // Configure the session
      let sessionInit = {
        optionalFeatures: [ "local-floor" ]
      };

      navigator.xr
        .requestSession("immersive-vr", sessionInit)
        .then(this.sessionStarted.bind(this));
      
    } else {
        
      // If the session isn't null, close it
      this.vrSession.end();
    }
  }

  /**
   * This function adds our content to the VR environment
   * It also sets up some of the tools the player will use to interact and explore the environment
   */
  sessionStarted(session) {

    console.log("VR Session Started");

    // Add an event listener to "tidy-up" when the session ends
    session.addEventListener("end", this.sessionEnded.bind(this));
    this.vrSession = session;
  
    this.setupWebGLLayer().then(() => { this.renderer.xr.setSession(this.vrSession); });    

    this.lvl = LEVEL_DATA;
    let l = this.lvl; // Convenience variable, so we don't have to type this.lvl

    this.scale = Setup.calculateScale(this.renderer, this.camera);
    this.interactionManager = new InteractionManager(this, Settings.INTERACTION_MODE_GAZE);
    this.movementManager = new CustomTeleportMovementManager(this, Settings.MOVEMENT_MODE_CUSTOM_TELEPORT);    
    
    // Add a grid-helper at the floor level
    const gridHelper = new THREE.GridHelper((this.scale * 20), 20, 0xff0000, 0x004400);
    gridHelper.position.set((this.scale * 10), 0, (this.scale * 10));
    this.scene.add(gridHelper);

    // The dolly is a "virtual carriage" that stores the camera and controllers within the envionment
    // Basically, it allows us to move the camera and controllers in one go, rather than individually
    this.cameraVector = new THREE.Vector3();
    this.dolly = Setup.buildDolly(this.camera);     
    this.scene.add(this.dolly);
    
    // Place the dolly at the start tile for the player
    this.placeObjectAtTile(this.dolly, this.playerPosition, null);

    // Initialise the lights in the scene
    this.ambientLight = new THREE.AmbientLight(0x505050, 0.5);
    this.scene.add(this.ambientLight);
    this.mainLight = new THREE.PointLight( 0x555555, (1000 * this.scale), (250 * this.scale), 2);
    this.mainLight.position.set(20, 10, 30);
    this.mainLight.castShadow = true;    
    this.scene.add(this.mainLight);

    // Initialise the GLTF loader that loads the 3D models
    this.gltfLoader = new GLTFLoader();

    // Set the re-scale array for Tinkercad models
    let glbScale = [ (0.1 * this.scale), (0.1 * this.scale), (0.1 * this.scale) ];

    this.loadTinkercadGlb("./models/interaction-room.glb", 4, Settings.SCENERY_MODEL, [ (this.scale * 10), 0, (this.scale * 10) ], [0, 0, 0], [0, 0, 0], glbScale, true, true, {}, false);
   
    let lightSwitchFunction = function(interactable) {

      if(this.mainLight.intensity === 0) {

        this.mainLight.intensity = (1000 * this.scale);
        this.mainLight.distance = (250 * this.scale);

      } else {

        this.mainLight.intensity = 0;
        this.mainLight.distance = 0;        
      }

    }.bind(this);

    let lightSwitchProperties = {
      type: Settings.INTERACTABLE_MODEL_STANDARD, DestroyOnSelect: false, onSelect: lightSwitchFunction
    };

    this.loadTinkercadGlb("./models/light-switch.glb", 4, Settings.INTERACTABLE_MODEL_STANDARD, [ (this.scale * 10), 0, (this.scale * 10) ], [0, 0, 0], [0, 0, 0], glbScale, true, true, lightSwitchProperties, false);

    let recordFunction = function(interactable) {

      if(interactable.active) {

        interactable.active = false;
        this.music.pause();

      } else {

        interactable.active = true;
        this.music.play();
      }

    }.bind(this);

    let recordTickFunction = function(interactable) {

      interactable.model.rotation.y += THREE.MathUtils.degToRad(1);

    }.bind(this);

    let recordProperties = {
      type: Settings.INTERACTABLE_MODEL_STANDARD, DestroyOnSelect: false, onSelect: recordFunction, onPassiveTick: recordTickFunction
    };

    this.loadTinkercadGlb("./models/vinyl-record.glb", 5, Settings.INTERACTABLE_MODEL_STANDARD, 336, [0, 1.25, 0], [0, 0, 0], glbScale, true, true, recordProperties, false);    
    //this.loadTinkercadGlb("./models/climb-trigger.glb", 4, Settings.INTERACTABLE_MODEL_CLIMB_TRIGGER, 170, [0.5, 1, 0], [45, 90, 0], [0.3, 0.3, 0.3], true, true, { DestroyOnSelect: false, ClimbTargets: [ [ 170, 1 ], [ 328, 0 ] ], AccessFrom: [ 250, 328 ] } );

    //this.loadTinkercadGlb("./models/rotate-left-trigger.glb", 1, Settings.INTERACTABLE_MODEL_MOVEMENT_TRIGGER, 308, [0, 0, 0], [0, 0, 0], [0.02, 0.02, 0.02], true, true, { DestroyOnSelect: false, RotateLeftOnSelect: true, RotateRightOnSelect: false } );
    //this.loadTinkercadGlb("./models/rotate-right-trigger.glb", 2, Settings.INTERACTABLE_MODEL_MOVEMENT_TRIGGER, 308, [0, 0, 0], [0, 0, 0], [0.02, 0.02, 0.02], true, true, { DestroyOnSelect: false, RotateLeftOnSelect: false, RotateRightOnSelect: true } );

  
    //this.loadTinkercadGlb("./models/teleport-trigger.glb", 3, Settings.INTERACTABLE_MODEL_TELEPORT_TRIGGER, 328, [0, 0, 0], [0, 0, 0], [0.1, 0.1, 0.1], true, false, { DestroyOnSelect: false, TeleportTarget: [ 328, 0 ], AccessFrom: [ 348 ] } );
    
    
    // Ask the renderer to start the animation loop by calling the animate function
    setTimeout(
      function() { this.renderer.setAnimationLoop(this.animate.bind(this)) }.bind(this), 1000
    );

  }

  loadTinkercadGlb(filename, id, type, position, offset, rotate, scale, addToScene, castShadow, properties, active) {

    this.gltfLoader.load(filename, function(gltf) {
            
      // Initialise the model with its ID and model-type
      let model = gltf.scene;
      model.userData.id = id;
      model.userData.type = Settings.MODEL_TYPE_TINKERCAD_GLB;
        
      // If the model is intended to be interactable, process it accordingly
      if(Utility.isModelInteractable(type)) {
      
        this.interactionManager.interactableData.push(
          new Interactable(this.interactionManager, id, type, model, Settings.MODEL_TYPE_TINKERCAD_GLB, properties, active)
        );
        
        this.interactionManager.interactableModels.push(model);
      }

      // Determine whether the model is to be placed on an identified tile...
      // ...or at an absolute X, Y, Z position                 
      if(Array.isArray(position))
        model.position.set(position[0], position[1], position[2]);
      else
        this.placeObjectAtTile(model, position, offset);
      
      // Rotate and scale the model accordingly
      model.rotation.x = THREE.MathUtils.degToRad(rotate[0]);
      model.rotation.y = THREE.MathUtils.degToRad(rotate[1]);
      model.rotation.z = THREE.MathUtils.degToRad(rotate[2]);              
      model.scale.set( scale[0], scale[1], scale[2] ); 

      // If this model is to cast shadow, configure this
      if(castShadow) {

        model.castShadow = true;
        model.receiveShadow = true;
      }

      // If requested, add the model to the scene
      if(addToScene)
        this.scene.add(model);

    }.bind(this), undefined, function(error) {
      
      console.error("An error occurred loading the GLTF / GLB model: ", error);
    });

    return null;
  }

  sessionEnded() {
  
    console.log("VR Session Ended");
    this.vrSession.removeEventListener("end", this.sessionEnded);
    this.vrSession = null;
  }

  setupWebGLLayer() {

    this.glContext = this.renderer.getContext();
    return this.glContext.makeXRCompatible().then(() => {
      this.vrSession.updateRenderState(

        { baseLayer: new XRWebGLLayer(this.vrSession, this.glContext) }
      
      );
    });
  }


  /**
   * This function places an object on a given tile (specified by the tile parameter)
   * The object is passed as a GLTF or Three.js mesh, or a string that is used to locate existing objects
   * An offset can be specified to fine tune the position of the object
   */
  placeObjectAtTile(object, tile, offset) {

    // If the object provided is a string, search the existing objects that ID
    // This uses the getObjectFromId function
    if(typeof object === "string") {

      object = this.getObjectFromId(object);
    }

    if(object !== null) {

      // Calculate the x-position and z-position of the specified tile by calculating its column and row
      // The calculation of the x-position / column uses Modulo division to find the remainder
      let x = (((tile % 20) * this.scale) + (this.scale / 2));
      let z = ((Math.floor(tile / 20) * this.scale) + (this.scale / 2));

      // Calculate any offsets from the given array (which could be null, if not required)
      let offsetX = (offset !== null) ? (offset[0] * this.scale) : 0;
      let offsetY = (offset !== null) ? (offset[1] * this.scale) : 0;
      let offsetZ = (offset !== null) ? (offset[2] * this.scale) : 0;
      
      // Set the position of the object based on the calculated x and z, and any respective offsets
      object.position.x = (x + offsetX);
      object.position.y = offsetY;
      object.position.z = (z + offsetZ);
    }
  }

  /**
   * This function takes an ID as a parameter (id) and searches the interactions and structure...
   * ...arrays for an object matching that ID
   */
  getObjectFromId(id) {

    // First check the interactions array for the object
    for(let a = 0; a < this.interactions.length; a++) {

      let data = this.interactions[a].userData;

      // Does the ID match?
      if(data.hasOwnProperty("itemId") && data.itemId === id) {

        // If so, return the object
        return this.interactions[a];
      }
    }

    // Then check the structure array
    for(let a = 0; a < this.structure.length; a++) {

      let data = this.structure[a].userData;

      // Does the ID match?
      if(data.hasOwnProperty("itemId") && data.itemId === id) {
     
        // If so, return the object
        return this.structure[a];
      }
    }

    // If the object with that ID cannot be found, return null
    return null;
  }

  /**
   * This is the main loop of our application, it repeats over and over again, several times a second
   * In this loop, the player's movement, and any interactions, are managed
   * As are any specific instructions for individual objects (such as rotating the key models) 
   */
  animate() {

    if(this.firstPass) {

      //let leftTrigger = this.interactionManager.getInteractableData(1).model;
      //let rightTrigger = this.interactionManager.getInteractableData(2).model;
      //this.movementManager.setRotateTriggers(leftTrigger, rightTrigger);
      //this.movementManager.positionRotateTriggers(this.dolly);
      //this.movementManager.buildTeleportFader();
      this.firstPass = false;
    }

    // Call the handleMovement function in the LOOP code
    // Pass to it this engine object (this) so that it can access its variables
    //LOOP.handleMovement(this);
    
    if(this.interactionManager.mode === Settings.INTERACTION_MODE_GAZE)
      this.interactionManager.castGaze();

    let data = this.interactionManager.interactableData;
    for(let a = 0; a < data.length; a++) {

      if(data[a].active)
        data[a].passiveTick();
    }
    // Loop through the array of interactable objects
    // If the silver and / or gold keys are still in play, rotate them
    //for(let a = 0; a < this.interactions.length; a++) {

      //let data = this.interactions[a].userData;
      //if(data.hasOwnProperty("itemId") && (data.itemId === "gold-key" || data.itemId === "silver-key")) {
        
        //this.interactions[a].rotation.y += 0.05;
     // }
   // }

    // At the end of each loop, we render the scene
    // This means another 2D image is generated from the application data and projected onto the screen
    // Of course, this happens so quickly, it looks like real movement to the human eye
    this.renderer.render(this.scene, this.camera);    
  }
}