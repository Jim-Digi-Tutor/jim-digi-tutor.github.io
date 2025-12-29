import * as MESH_UI from "mesh-ui";
import * as THREE from "three";



import * as GUI from "./gui-components/gui-components.js";

import * as LOOP from "./loop.js";
import * as SETUP from "./setup.js";
import * as UTILS from "./utils.js";

import { World } from "./world.js";

let engine;
export { engine };

export function initEngine() {

  engine = new Engine();
}

export class Engine {

  // Custom objects
  #setupManager;

  // Scene members
  #scene;
  #camera;
  #listener;

  // Renderer and engine members
  #renderer;
  #baseRefSpace;
  #vrSession;
  #glContext;
  #xrCamera;
  #cameraVector;
  
  // Player members
  #playerPosition;
  #player;
  #playerBox;
  #playerHeight;
  #playerRadius;
  #dolly;

  // Controller members
  #controller0;
  #controller1;
  #interactRange;

  // Raycast members
  #gravityRay;
  #gravityMatrix;
  #gravityRange;

  // Data and game world members
  #camSet;
  #camHeight = 2;
  #uniScale;
  #modScale;
  #terrain;
  #structure;
  #world;
  
  // Game state members
  #firstFrame = true;
  #frameCounter = 0;
  #movementSpeed = 0.004;
  #rotationSpeed = 0.5;
  #gravLower = 0;
  #gravUpper = 3.5;
  #gravOffset = 0.1;
  #currentRegion = 0;
  
  #gui;

  constructor() {}

  getScene() { return this.#scene; }
  getListener() { return this.#listener; }

  getCamVector() { return this.#cameraVector; }

  getPlayerHeight() { return this.#playerHeight; }
  getPlayerRadius() { return this.#playerRadius; }
  getDolly() { return this.#dolly; }

  getController0() { return this.#controller0; }
  getController1() { return this.#controller1; }
  getGravityRay() { return this.#gravityRay; }
  getGravityMatrix() { return this.#gravityMatrix; }

  getUniversalScale() { return this.#uniScale; }
  getModelScale() { return this.#modScale; }
  getTerrain() { return this.#terrain; }
  setTerrain(terrain) { this.#terrain.push(terrain); }
  getStructure() { return this.#structure; }
  setStructure(structure) { this.#structure.push(structure); }
  getWorld() { return this.#world; }


  // Launches the VR scene
  launch() {
    
    console.log("Launching VR Environment");
    this.#setupManager = new SETUP.SetupManager();
    
    // Setup the scene including the camera and audio-listener
    const sceneSetup = this.#setupManager.setupScene();
    this.#scene = sceneSetup.scene;
    this.#camera = sceneSetup.camera;
    this.#listener = sceneSetup.listener;    

    // Create the renderer and add it to the webpage
    this.#renderer = this.#setupManager.setupRenderer();
    // Initialise the Reference Space, potentially used in teleport calculations later
    this.#renderer.xr.addEventListener("sessionstart", () => this.#baseRefSpace = this.#renderer.xr.getReferenceSpace());
    this.#renderer.xr.enabled = true;
    // Initialise the XR camera and camera vector
    this.#xrCamera = this.#renderer.xr.getCamera(this.#camera);
    this.#cameraVector = new THREE.Vector3();

    // Check if the session is null (it should be!)
    // Start the session
    if(this.#vrSession === undefined || this.#vrSession === null) {
      
      document.getElementById("launch-button").style.display = "none";
    
      const sessionInit = {
        optionalFeatures: [ "local-floor" ],
        requiredFeatures: [ "hand-tracking" ]
      };

      navigator.xr
        .requestSession("immersive-vr", sessionInit)
        .then(this.sessionStarted.bind(this));
      
    } else {
        
      // If the session isn't null, close it
      this.#vrSession.end();
    }
  }

  sessionStarted(session) {

    console.log("VR Session Started");
    session.addEventListener("end", this.sessionEnded.bind(this));
    this.#vrSession = session;
  
    this.setupWebGLLayer().then(() => { this.#renderer.xr.setSession(this.#vrSession); });

    // Ascertain the camera height and the scale to use for the world
    this.#camHeight = this.#setupManager.ascertainCameraHeight();
    this.#uniScale = this.#setupManager.ascertainUniversalScale();
    this.#modScale = this.#setupManager.ascertainModelScale();

    // Set the speeds and comparison values
    this.#movementSpeed = (this.#movementSpeed * this.#uniScale);
    this.#rotationSpeed = (this.#rotationSpeed * this.#uniScale);
    this.#gravLower = ((this.#gravLower * this.#modScale) * this.#uniScale);
    this.#gravUpper = ((this.#gravUpper * this.#modScale) * this.#uniScale);
  
    // Initialise the terrain and structure objects for collidables
    this.#terrain = [];
    this.#structure = [];
    
    // Initialise and add the dolly; this code needs to go here to prevent problems adding the controllers
    this.#dolly = this.#setupManager.buildDolly(this.#scene, this.#camera, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
    // Create and add the controllers; add event listeners
    this.#interactRange = UTILS.scaleDistance(3, this.#uniScale, this.#modScale);
    this.#controller0 = null;
    this.#controller0 = this.#setupManager.buildController(0, this.#renderer, this.#dolly, this.#interactRange);
    this.#controller1 = null;
    this.#controller1 = this.#setupManager.buildController(1, this.#renderer, this.#dolly, this.#interactRange);    
    
    // Initialise the world object
    this.#world = new World(this);
    this.#world.loadWorldData().then(function() {
    
      // Ascertain the player's position in the world
      const vec = this.#world.getAvatarPosition();
      const dir = this.#world.getAvatarDirection();
      // Set the dolly to the starting position
      this.#dolly.position.set(vec.x, vec.y, vec.z);
      this.#dolly.rotation.y = THREE.MathUtils.degToRad(dir.y);
      // Build the player and its collision mesh
      this.#playerHeight = UTILS.scaleDistance(2, this.#uniScale, this.#modScale);
      this.#playerRadius = UTILS.scaleDistance(0.5, this.#uniScale, this.#modScale);      
      const pData = this.#setupManager.buildPlayer(this.#scene, vec, this.#playerHeight, this.#playerRadius);
      this.#player = pData.player;
      this.#playerBox = pData.bb;
      
      // Configure the raycaster for the gravity ray
      this.#gravityRange = UTILS.scaleDistance(1, this.#uniScale, this.#modScale);
      const gData = this.#setupManager.setupGravityRay(this.#gravityRange);
      this.#gravityRay = gData.ray;
      this.#gravityMatrix = gData.matrix;

      // Setup the performance GUI panel
      // this.#gui = new GUI.GuiPanel(this.#scene, this.#camera, this.#renderer, this.#uniScale, this.#modScale);

      // The scene is initialised, start the animation    
      this.#renderer.setAnimationLoop(this.animate.bind(this));
    
    }.bind(this));
  }

  sessionEnded() {
  
    console.log("VR Session Ended");
    this.#vrSession.removeEventListener("end", this.sessionEnded);
    this.#vrSession = null;
  }

  setupWebGLLayer() {

    this.#glContext = this.#renderer.getContext();
    return this.#glContext.makeXRCompatible().then(() => {
      this.#vrSession.updateRenderState( { baseLayer: new XRWebGLLayer(this.#vrSession, this.#glContext) } );
    });
  }



  displayDebug(left, right, bottom) {

    //this.#gui.output(left, right, bottom);
  }

  
  lastTime = performance.now();
  frames = 0;
  fps = 0;
  animate() {

    // The code in the IF statement below will run one time only, after the app is completely setup and starts its animation loop. 
    if(!this.#camSet && this.#xrCamera && this.#xrCamera.cameras && this.#xrCamera.cameras.length > 0) {

      // Different devices display the VR world at different sizes...
      // ...which means the camera will not always appear to be at the same height from device to device.
      // The code below fixes this, displaying the camera at roughly the same height between devices.
      const y = this.#xrCamera.cameras[0].position.y.toFixed(2);
      UTILS.setCameraHeight(this.#camHeight, this.#dolly, this.#uniScale, this.#modScale, y);
      this.#camSet = true;
    }    
    
    if(this.#firstFrame) {

      console.log(this.#world.getCommonModels())
      this.#firstFrame = false;
    }
/*
    if(this.#firstFrame) {
      
      this.#proxAdj = UTILS.scaleDistance(this.#proxAdj, this.#uniScale, this.#modScale);
      this.#checkProximity();
      //this.displayDebug(null, null, this.#world.getRegion(this.#currentRegion).getName());
      //console.log("REGION", this.#world.getRegion(this.#currentRegion));
      this.#firstFrame = false;
    }

  const now = performance.now();
  this.frames++;

  if (now - this.lastTime >= 1000) {
    this.fps = this.frames;
    this.frames = 0;
    this.lastTime = now;

    // Update text content
    this.displayDebug(null, null, ("FPS: " + this.fps));
  }

    //this.#world.process(this.#frameCounter);
    //this.#frameCounter++; 
    */

    LOOP.handleControllerInput(
      this,
      this.#controller0,
      this.#controller1,
      this.#scene,
      this.#cameraVector,
      this.#dolly,
      this.#player,
      this.#playerBox,
      this.#gravityRay,
      this.#structure,
      this.#terrain,
      this.#movementSpeed,
      this.#rotationSpeed,
      this.#gravLower,
      this.#gravUpper,
      this.#gravOffset,
      this.#uniScale,
      this.#modScale,
      this.displayDebug.bind(this)
    );

    /*
    this.#gui.update();
    MESH_UI.update();
    */
    //console.log(this.#renderer.info.render.calls);
    this.#renderer.render(this.#scene, this.#camera);    
  }

  #proximityCheckFrequency = 500;
  #proxAdj = 150;

  #checkProximity() {

    const proximities = [];
    const pos = this.#dolly.position;
    const regions = this.#world.getRegions();
    for(let a = 0; a < regions.length; a++) {

      const region = regions[a];
      const rSize = region.getScaledSize();
      const rPos = region.getAdjustedPosition();

      const lowerX = (rPos.x - (rSize.x / 2));
      const upperX = (rPos.x + (rSize.x / 2));
      const lowerZ = (rPos.z - (rSize.z / 2));
      const upperZ = (rPos.z + (rSize.z / 2));

      // Express boundaries as a percentage of width and depth
      // This will handle thin but long regions, for example
      let prox = "DISTANT";
      if(pos.x >= lowerX && pos.x <= upperX && pos.z >= lowerZ && pos.z <= upperZ)
        prox = "IN";
      else if(pos.x >= (lowerX - this.#proxAdj) && pos.x <= (upperX + this.#proxAdj) && pos.z >= (lowerZ - + this.#proxAdj) && pos.z <= (upperZ + this.#proxAdj))
        prox = "ADJACENT";
      else if(pos.x >= (lowerX - (this.#proxAdj * 2)) && pos.x <= (upperX + (this.#proxAdj * 2)) && pos.z >= (lowerZ - + (this.#proxAdj * 2)) && pos.z <= (upperZ + (this.#proxAdj * 2)))      
        prox = "NEAR";

      proximities.push(prox);
    }
        
    // console.log(proximities);

    this.#world.manageProximities(proximities);
    setTimeout(this.#checkProximity.bind(this), this.#proximityCheckFrequency);
  }
}
