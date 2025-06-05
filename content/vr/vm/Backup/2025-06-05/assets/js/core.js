import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import * as LOOP from "./loop.js";
import * as SETUP from "./setup.js";
import * as UTILS from "./utils.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import { XMLLoader } from "./xml-loader.js";

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

  // Loader members
  #gltfLoader;
  #mtlLoader;
  #objLoader;

  // Data and game world members
  #camHeight;
  #uniScale;
  #modScale;
  #terrain;
  #structure;
  #world;

  // Debugging panel
  #debugContainer;
  #debugText;

  // Game state members
  #firstFrame = true;
  #frameCounter = 0;

  constructor() {}

  getScene() { return this.#scene; }
  getListener() { return this.#listener; }

  getGltfLoader() { return this.#gltfLoader };
  getMtlLoader() { return this.#mtlLoader };
  getObjLoader() { return this.#objLoader };

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

      navigator.xr
        .requestSession("immersive-vr", sessionInit)
        .then(this.sessionStarted.bind(this));
      
    } else {
        
      // If the session isn't null, close it
      this.#vrSession.end();
    }
  }

  async sessionStarted(session) {

    console.log("VR Session Started");
    session.addEventListener("end", this.sessionEnded.bind(this));
    this.#vrSession = session;
  
    this.setupWebGLLayer().then(() => { this.#renderer.xr.setSession(this.#vrSession); });

    // Ascertain the camera height and the scale to use for the world
    this.#camHeight = 1;
    this.#uniScale = this.#ascertainUniversalScale();
    this.#modScale = this.#ascertainModelScale();

    // Initialise the loaders
    this.#gltfLoader = new GLTFLoader();
    this.#mtlLoader = new MTLLoader();
    this.#objLoader = new OBJLoader();

    // Initialise the terrain and structure objects for collidables
    this.#terrain = [];
    this.#structure = [];

    // Add a grid-helper at the floor level
    const gridHelper = new THREE.GridHelper((100 * this.#uniScale), 100, 0xff0000, 0x004400);
    gridHelper.position.set(0, 0, 0);
    this.#scene.add(gridHelper);

    // Add the Axes Helper
    let axesHelper = new THREE.AxesHelper(100);
    axesHelper.position.set(0, 0, 0);
    this.#scene.add(axesHelper);   

    // Create the dolly and bounding boxes that manage player movement
    this.#xrCamera = this.#renderer.xr.getCamera(this.#camera);
    this.#cameraVector = new THREE.Vector3();
    this.#dolly = SETUP.buildDolly(this.#camera, { x: 0, y: 0, z: 0 } );    
    this.#scene.add(this.#dolly);

    this.#playerHeight = UTILS.scaleDistance(8.5, this.#uniScale, this.#modScale);
    this.#playerRadius = UTILS.scaleDistance(1.6, this.#uniScale, this.#modScale);
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
    this.#gravityRay.far = UTILS.scaleDistance(4, this.#uniScale, this.#modScale);
    this.#gravityMatrix = new THREE.Matrix4();

    // Initialise the world object
    this.#world = new World(this);
    await this.#world.loadWorldData();
    
    // Set the dolly at the required start position
    const vec = UTILS.applyVectorToWorld(this.#world.getAvatarPosition(), this.#uniScale);
    const dir = this.#world.getAvatarDirection();
    this.#player.position.set(vec.x, this.#playerHeight, vec.z);
    this.#dolly.position.set(vec.x, vec.y, vec.z);
    this.#dolly.rotation.y = THREE.MathUtils.degToRad(dir.y);

    // Set up the debugging panel
    this.#debugContainer = new MESH_UI.Block({
      width: 1,
      height: 0.4,
      padding: 0.05,
      justifyContent: 'center',
      fontFamily: './assets/mesh-ui-fonts/Roboto-msdf.json',
      fontTexture: './assets/mesh-ui-fonts/Roboto-msdf.png',
      //backgroundColor: new THREE.Color(0x333388),
      backgroundOpacity: 0.8,
      borderRadius: 0.05,
    });

    this.#debugText = new MESH_UI.Text({
      content: "Hello from MeshUI!",
      fontSize: 0.04,
      color: new THREE.Color(0xFFFFFF),
    });

    this.#debugContainer.add(this.#debugText);
    this.#scene.add(this.#debugContainer);

    // The scene is initialised, start the animation    
    this.#renderer.setAnimationLoop(this.animate.bind(this));
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

    return 1;
  }

  #ascertainModelScale() {

    return 0.2;
  }

  displayDebug(text) {

    this.#debugText.set( { content: text } );
  }

  animate() {

    if(this.#firstFrame) {
//this.displayDebug("FALLING!")
  //    this.#firstFrame = false;
    //  const intersects = LOOP.checkGravity(this.#scene, this.#terrain, this.#gravityRay, this.#dolly);
      //if(intersects !== null) {
        
      //  const type = intersects[0].object.parent.userData.ModelType
      //  const distance = intersects[0].distance.toFixed(2);
      //  if(distance > 0) {
                
        //  player.position.y -= distance;
        //  dolly.position.y -= distance;
        //}
      //}
    }
    //this.#world.process(this.#frameCounter);
    this.#frameCounter++;
    //this.#displayDebug(this.#frameCounter.toString());

    LOOP.handleControllerInput(this, this.#controller0, this.#controller1, this.#scene, this.#cameraVector, this.#dolly, this.#player, this.#playerBox, this.#structure, this.#uniScale);
    
    this.#xrCamera.getWorldDirection(this.#cameraVector);
    this.#debugContainer.position.copy(this.#xrCamera.position).add(this.#cameraVector.multiplyScalar(1));
    this.#debugContainer.quaternion.copy(this.#xrCamera.quaternion);    
    MESH_UI.update();

    this.#renderer.render(this.#scene, this.#camera);    
  }
}
