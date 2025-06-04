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
  #dolly;

  // Controller members
  #controller0;
  #controller1;

  // Loader members
  #gltfLoader;
  #mtlLoader;
  #objLoader;

  // Data and game world members
  #camHeight;
  #scale;
  #structure;
  #world;

  // Game state members
  #frameCounter = 0;

  constructor() {}

  getScene() { return this.#scene; }
  getListener() { return this.#listener; }

  getGltfLoader() { return this.#gltfLoader };
  getMtlLoader() { return this.#mtlLoader };
  getObjLoader() { return this.#objLoader };

  getScale() { return this.#scale; }
  getStructure() { return this.#structure; }
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
    this.#scale = this.#ascertainScale();

    // Initialise the loaders
    this.#gltfLoader = new GLTFLoader();
    this.#mtlLoader = new MTLLoader();
    this.#objLoader = new OBJLoader();

    // Initialise the structure object for collidables
    this.#structure = [];

    // Add a grid-helper at the floor level
    const gridHelper = new THREE.GridHelper((100 * this.#scale), 100, 0xff0000, 0x004400);
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

    let p = SETUP.buildPlayer( { x: 0, y: 0, z: 0 } );
    this.#player = p[0];
    this.#playerBox = p[1];
    this.#scene.add(this.#player);

    // Create and add the controllers; add event listeners
    this.#controller0 = null;
    this.#controller0 = SETUP.buildController(0, this.#renderer, this.#dolly);
    this.#controller1 = null;
    this.#controller1 = SETUP.buildController(1, this.#renderer, this.#dolly);    

    // Initialise the world object
    this.#world = new World(this);
    await this.#world.loadWorldData();
    
    // Set the dolly at the required start position
    const vec = this.#world.getAvatarPosition();
    this.#dolly.position.set(vec.x, vec.y, vec.z);

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

  #ascertainScale() {

    return 1;
  }

  animate() {

    this.#world.process(this.#frameCounter);
    this.#frameCounter++;

    LOOP.handleControllerInput(this.#controller0, this.#controller1, this.#scene, this.#cameraVector, this.#dolly, this.#player, this.#playerBox, this.#structure, this.#scale);
    
    MESH_UI.update();

    this.#renderer.render(this.#scene, this.#camera);    
  }
}
