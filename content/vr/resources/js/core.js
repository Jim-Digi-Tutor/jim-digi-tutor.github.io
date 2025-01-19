// The code below loads the Three.js libraries we mapped earlier
// We can use them in our code
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

// Imports the code from the loop.js and setup.js JavaScript files
// When we need to use the code, we can now use the references LOOP and SETUP
import { InteractionManager, Interactable } from "./interaction.js";
import { MovementManager, Collidable } from "./movement.js";
import { Settings } from "./settings.js";
import { Setup } from "./setup.js";

import * as LOOP from "./loop.js";
import * as SETUP from "./setup_.js";

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

  scale;

  // Declare the various manager objects
  interactionManager;
  movementManager;


  firstPass = true;
  refSpace;
 

  // cameraVector is a Vector object representing the direction of the camera
  // It isn't necessary to fully understand what it is at this point
  // However, it is used in the calculations for player movement, so it is important
  cameraVector;
  
  // The dungeon tile on which the player begins
  playerStart = 348;  

  dolly;      // A "virtual carriage" used to move the camera and controllers within the game
  player;     // Visual representation of the player's "footprint" for determining collisions
  playerBox;  // Data representation of the player's "footprint" for determining collisions
  
  gltfLoader;     // The GLTF loader used to load the 3D models
  objLoader;
  mtlLoader;

          
  movementSpeed = 0.025;  // The speed the player moves at
  rotationSpeed = 0.5;    // The speed the player rotates (turns) at
  pickDistance = 10;      // The length of the raycasters, how far they stretch

  // Declare the lights that will illuminate the scene
  ambientLight;     // General level of light, illuminates everything
  silverKeyLight;   // Sits in the same place as the Silver Key, making it stand out
  goldKeyLight;     // Sits in the same place as the Gold Key, making it stand out
  finishLight;      // Sits in the same place as the Victory Text, making it stand out
  
  // Declare the variables to manage the puzzles / traps
  hasSilverKey = false;
  hasGoldKey = false
  portcullisDown = false;

  tempBox;

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

    this.scale = 2; //Setup.calculateScale(this.renderer, this.camera);
    
    // The dolly is a "virtual carriage" that stores the camera and controllers within the envionment
    // Basically, it allows us to move the camera and controllers in one go, rather than individually
    this.cameraVector = new THREE.Vector3();
    this.dolly = Setup.buildDolly(this.camera);     
    this.scene.add(this.dolly);

    // Place the dolly at the start tile for the player
    this.placeObjectAtTile(this.dolly, this.playerStart, null);

    this.interactionManager = new InteractionManager(this, Settings.INTERACTION_MODE_GAZE);
    this.movementManager = new MovementManager(this, Settings.MOVEMENT_MODE_CUSTOM_TELEPORT);    

    // Add a grid-helper at the floor level
    const gridHelper = new THREE.GridHelper(40, 20, 0xff0000, 0x004400);
    gridHelper.position.set(20, 0, 20);
    this.scene.add(gridHelper);

    // Add the Axes Helper
    let axesHelper = new THREE.AxesHelper(20);
    axesHelper.position.set(0, 0, 0);
    this.scene.add(axesHelper);      

    // Initialise the lights in the scene
    this.ambientLight = new THREE.AmbientLight( 0x505050, 2 );
    this.scene.add(this.ambientLight);

    this.silverKeyLight = new THREE.PointLight( 0xbb9977, 2, 20, 2);
    this.scene.add(this.silverKeyLight);

    this.goldKeyLight = new THREE.PointLight( 0xbb9977, 2, 20, 2);
    this.scene.add(this.goldKeyLight);

    this.finishLight = new THREE.PointLight( 0xbb9977, 2, 20, 3);
    this.finishLight.position.set(10, 0.5, 9);
    this.scene.add(this.finishLight);

    // Initialise the GLTF loader that loads the 3D models
    this.gltfLoader = new GLTFLoader();
    this.objLoader = new OBJLoader();
    this.mtlLoader = new MTLLoader();

    // Call the SETUP function that loads all of the models and places them in the environment
    //SETUP.loadModels(this);

    let texLoader = new THREE.TextureLoader();
    let texture = texLoader.load("./textures/test-texture.png");
    let material = new THREE.MeshLambertMaterial( { map: texture } );
    let geometry = new THREE.BoxGeometry(2, 2, 2); 
    let cube = new THREE.Mesh(geometry, material);
    cube.material.side = THREE.DoubleSide;

    //static MODEL_TYPE_3D_BUILDER_OBJ = 0;
    //static MODEL_TYPE_THREE_MESH = 1;
    //static MODEL_TYPE_TINKERCAD_GLB = 2;
    
    let prop1 = { DestroyOnSelect: true };
    let int1 = new Interactable(this.interactionManager, 101, Settings.INTERACTABLE_TYPE_STANDARD, cube, Settings.MODEL_TYPE_THREE_MESH, prop1);
    cube.userData.id = 101;
    cube.userData.type = Settings.MODEL_TYPE_THREE_MESH;
    this.interactionManager.interactableData.push(int1);
    this.interactionManager.interactableModels.push(cube);
    this.placeObjectAtTile(cube, 371, [ 0, 0.5, 0 ]);
    this.scene.add(cube);
  
    
    
    
    this.load3dBuilderObj("./models/test-obj/test-obj", 99, Settings.INTERACTABLE_TYPE_STANDARD, 288, [0, 0, 0], [0, 0, 0], [0.1, 0.1, 0.1], true, { DestroyOnSelect: true });
    this.loadTinkercadGlb("./models/silver-key.glb", 25, Settings.INTERACTABLE_TYPE_STANDARD, 344, [0, 1, 0], [0, 0, 0], [1.5, 1.5, 1.5], true, { DestroyOnSelect: true });
    this.loadTinkercadGlb("./models/test.glb", 51, Settings.INTERACTABLE_TYPE_STANDARD, 304, [0, 0, 0], [0, 0, 0], [0.1, 0.1, 0.1], true, { DestroyOnSelect: true });


    // Ask the renderer to start the animation loop by calling the animate function
    this.renderer.setAnimationLoop(this.animate.bind(this));  

  }

  load3dBuilderObj(filename, id, type, tile, offset, rotate, scale, addToScene, properties) {
    
    this.mtlLoader.load(
      (filename + ".mtl"), // Path to your .mtl file
      function(materials) {
          materials.preload(); // Preload the materials
          this.objLoader.setMaterials(materials); // Apply materials to OBJLoader
          
          this.objLoader.load((filename + ".obj"),
          
            function(model) {
            
              model.userData.id = id;
              model.userData.type = Settings.MODEL_TYPE_3D_BUILDER_OBJ;
              
              this.interactionManager.interactableData.push(
                new Interactable(this.interactionManager, id, type, model, Settings.MODEL_TYPE_3D_BUILDER_OBJ, properties)
              );

              this.interactionManager.interactableModels.push(model);

              if(addToScene)
                this.scene.add(model);
                        
              this.placeObjectAtTile(model, tile, offset);
              model.rotation.x = THREE.MathUtils.degToRad(rotate[0]);
              model.rotation.y = THREE.MathUtils.degToRad(rotate[1]);
              model.rotation.z = THREE.MathUtils.degToRad(rotate[2]);              
              model.scale.set( scale[0], scale[1], scale[2] ); 
              
            }.bind(this),

              (xhr) => {
                  console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
              },
              (error) => {
                  console.error('An error occurred:', error);
              }
          );
      }.bind(this),
      (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded (materials)');
      },
      (error) => {
          console.error('An error occurred while loading materials:', error);
      }
    );
  }

  loadTinkercadGlb(filename, id, type, tile, offset, rotate, scale, addToScene, properties) {

    this.gltfLoader.load(filename,
               
      function(gltf) {
            
        let model = gltf.scene;

        model.userData.id = id;
        model.userData.type = Settings.MODEL_TYPE_TINKERCAD_GLB;
        
        this.interactionManager.interactableData.push(
          new Interactable(this.interactionManager, id, type, model, Settings.MODEL_TYPE_TINKERCAD_GLB, properties)
        );

        this.interactionManager.interactableModels.push(model);

        if(addToScene)
          this.scene.add(model);
                  
        this.placeObjectAtTile(model, tile, offset);
        model.rotation.x = THREE.MathUtils.degToRad(rotate[0]);
        model.rotation.y = THREE.MathUtils.degToRad(rotate[1]);
        model.rotation.z = THREE.MathUtils.degToRad(rotate[2]);              
        model.scale.set( scale[0], scale[1], scale[2] ); 
        
      }.bind(this),
               
      undefined,
               
      function(error) {
      
        console.error("An error occurred loading the GLTF model: ", error);
      }   
    );

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

  /*loadModel(filename, pos, rot, scale, addTo, properties) {

    this.loader.load(filename,
               
      function(gltf) {
                   
        // If this stage is reached, the model has been successfully loaded
        const model = gltf.scene;

        // If the pos array has three elements, it is to be placed directly on the scene
        // If not, it has been passed a tile ID at which it is to be placed and, possibly, offset
        if(pos.length === 3) {

          model.position.set(pos[0], pos[1], pos[2]);

        } else {

          this.placeObjectAtTile(model, pos[0], pos[1]);
        }
        
        // Set the model to the given scale
        model.scale.set(scale[0], scale[1], scale[2]);

        // Apply any rotations around each axes
        model.rotation.x = THREE.MathUtils.degToRad(rot[0]);
        model.rotation.y = THREE.MathUtils.degToRad(rot[1]);
        model.rotation.z = THREE.MathUtils.degToRad(rot[2]);

        // Apply any required properties
        // These properties help us identify the object later on, should we need to
        for(let a = 0; a < properties.length; a++) {
          
          model.userData[properties[a].name] = properties[a].value;
        }

        // Add the model to the scene
        this.scene.add(model);

        // Add the model to the specified arrays
        // For example, if the model is part of a dungeon wall, it is added to the structure array
        // If it is to be interacted with, it might be added to the interactions array
        // Or possibly, it might be added to both
        for(let a = 0; a < addTo.length; a++) {

          addTo[a].push(model);
        }

      }.bind(this),
               
      undefined,
               
      function(error) {
      
        console.error("An error occurred loading the GLTF model: ", error);
      }   
    );

    return null;
  }*/

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
      let x = ((tile % 20) * 2) + 1;
      let z = (Math.floor(tile / 20) * 2) + 1;

      // Calculate any offsets from the given array (which could be null, if not required)
      let offsetX = (offset !== null) ? offset[0] * 2 : 0;
      let offsetY = (offset !== null) ? offset[1] * 2 : 0;
      let offsetZ = (offset !== null) ? offset[2] * 2 : 0;
      
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

      this.firstPass = false;
    }

    // Call the handleMovement function in the LOOP code
    // Pass to it this engine object (this) so that it can access its variables
    //LOOP.handleMovement(this);
    
    if(this.interactionManager.mode === Settings.INTERACTION_MODE_GAZE)
      this.interactionManager.castGaze();

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