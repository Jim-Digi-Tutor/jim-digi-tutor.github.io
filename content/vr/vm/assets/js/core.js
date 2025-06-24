import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import Stats from 'three/addons/libs/stats.module.js';

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

  // Raycast members
  #gravityRay;
  #gravityMatrix;

  // Data and game world members
  #camHeight;
  #uniScale;
  #modScale;
  #terrain;
  #structure;
  #world;
  
  // Game state members
  #firstFrame = true;
  #frameCounter = 0;
  #movementSpeed = 0.04;
  #rotationSpeed = 1;
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

    // Setup the scene including the camera and audio-listener
    this.#scene = new THREE.Scene();
    
    // Create and position the scene camera
    this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.#camera.position.set(0, 0, 0);
    
    // Setup the audio listener
    this.#listener = new THREE.AudioListener();
    this.#camera.add(this.#listener);  

    // Create the renderer and add it to the webpage
    this.#renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.#renderer.setPixelRatio(window.devicePixelRatio);
    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    this.#renderer.outputEncoding = THREE.sRGBEncoding;
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialise the Reference Space, potentially used in teleport calculations later
    this.#renderer.xr.addEventListener("sessionstart", () => this.#baseRefSpace = this.#renderer.xr.getReferenceSpace());
    this.#renderer.xr.enabled = true;

    // Check if the session is null (it should be!)
    // Start the session
    if(this.#vrSession === undefined || this.#vrSession === null) {
      
      document.getElementById("launch-button").style.display = "none";
    
      let sessionInit = {
        optionalFeatures: [ "local-floor" ],
        requiredFeatures: [ "hand-tracking" ]
      };

     // navigator.xr
      //  .requestSession("immersive-vr", sessionInit)
       // .then(this.sessionStarted.bind(this));

               navigator.xr.requestSession("immersive-vr", {

            
})
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

          const clock = new THREE.Clock();
          const container = document.getElementById( 'stats' );
    
          this.stats = new Stats();
          container.appendChild( this.stats.dom );    
    // Ascertain the camera height and the scale to use for the world
    this.#camHeight = 1;
    this.#uniScale = this.#ascertainUniversalScale();
    this.#modScale = this.#ascertainModelScale();

    // Set the speeds and comparison values
    this.#movementSpeed = (this.#movementSpeed * this.#uniScale);
    this.#rotationSpeed = (this.#rotationSpeed * this.#uniScale);
    this.#gravLower = ((this.#gravLower * this.#modScale) * this.#uniScale);
    this.#gravUpper = ((this.#gravUpper * this.#modScale) * this.#uniScale);

    // Build the skybox
    const loader = new THREE.CubeTextureLoader();
    const skyboxTexture = loader.load([

      "./assets/images/skyboxes/brown-cloud/browncloud_ft.jpg",
      "./assets/images/skyboxes/brown-cloud/browncloud_bk.jpg",
      "./assets/images/skyboxes/brown-cloud/browncloud_up.jpg",
      "./assets/images/skyboxes/brown-cloud/browncloud_dn.jpg",
      "./assets/images/skyboxes/brown-cloud/browncloud_rt.jpg",
      "./assets/images/skyboxes/brown-cloud/browncloud_lf.jpg"
    ]);
    
    this.#scene.background = skyboxTexture;

    //const loader = new THREE.TextureLoader();
//loader.load('./assets/images/skyboxes/day-sky.png', (texture) => {
  //texture.mapping = THREE.EquirectangularReflectionMapping;
  //texture.encoding = THREE.sRGBEncoding;

  //this.#scene.background = texture;      // For visual background
  //this.#scene.environment = texture;     // Optional: for lighting reflections
//});   
    // Initialise the terrain and structure objects for collidables
    this.#terrain = [];
    this.#structure = [];

    // Add the Axes Helper
    // let axesHelper = new THREE.AxesHelper(100);
    // axesHelper.position.set(0, 0, 0);
    // this.#scene.add(axesHelper);   

    // Create the dolly and bounding boxes that manage player movement
    this.#xrCamera = this.#renderer.xr.getCamera(this.#camera);
    this.#cameraVector = new THREE.Vector3();
    this.#dolly = SETUP.buildDolly(this.#camera, { x: 0, y: 0, z: 0 } );    
    this.#scene.add(this.#dolly);

    this.#playerHeight = 4; //UTILS.scaleDistance(4, this.#uniScale, this.#modScale);
    this.#playerRadius = 0.4; //UTILS.scaleDistance(1.6, this.#uniScale, this.#modScale);
    let p = SETUP.buildPlayer( { x: 0, y: 0, z: 0 }, this.#playerHeight, this.#playerRadius);
    this.#player = p[0];
    this.#playerBox = p[1];
    this.#scene.add(this.#player);

    // Create and add the controllers; add event listeners
    this.#controller0 = null;
    this.#controller0 = SETUP.buildController(0, this.#renderer, this.#dolly);
    this.#controller1 = null;
    this.#controller1 = SETUP.buildController(1, this.#renderer, this.#dolly);    

    // Configure the raycaster for the gravity ray
    this.#gravityRay = new THREE.Raycaster();
    this.#gravityRay.near = 0;
    this.#gravityRay.far = UTILS.scaleDistance(10, this.#uniScale, this.#modScale);
    this.#gravityMatrix = new THREE.Matrix4();

    this.#gui = new GUI.GuiPanel(this.#scene, this.#camera, this.#renderer, this.#uniScale, this.#modScale);

      // Initialise the world object
    this.#world = new World(this);
    this.#world.loadWorldData().then(function() {
    
      // Set the dolly at the required start position
      const vec = this.#world.getAvatarPosition();
      const dir = this.#world.getAvatarDirection();
      this.#player.position.set(vec.x, vec.y + (this.#playerHeight / 2), vec.z);
      this.#dolly.position.set(vec.x, vec.y, vec.z);
      this.#dolly.rotation.y = THREE.MathUtils.degToRad(dir.y);

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

  #ascertainUniversalScale() {

    return 0.75;
  }

  #ascertainModelScale() {

    return 0.2;
  }

  displayDebug(left, right, bottom) {

    this.#gui.output(left, right, bottom);
  }

  
  lastTime = performance.now();
  frames = 0;
  fps = 0;
  animate() {

    if(this.#firstFrame) {
      
      this.#proxAdj = UTILS.scaleDistance(this.#proxAdj, this.#uniScale, this.#modScale);
      this.#checkProximity();
      //this.displayDebug(null, null, this.#world.getRegion(this.#currentRegion).getName());
      //console.log("REGION", this.#world.getRegion(this.#currentRegion));
      this.#firstFrame = false;
    }

  //const now = performance.now();
  //this.frames++;

  //if (now - this.lastTime >= 1000) {
    //this.fps = this.frames;
    //this.frames = 0;
    //this.lastTime = now;

    // Update text content
    //this.displayDebug(null, null, ("FPS: " + this.fps));
  //}

  this.stats.update();

    //this.#world.process(this.#frameCounter);
    //this.#frameCounter++;

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

    this.#gui.update();
    MESH_UI.update();

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
