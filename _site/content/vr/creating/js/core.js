import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import * as LOOP from "./loop.js";
import * as SETUP from "./setup.js";

let engine;
export { engine };

export function initEngine() {

  engine = new Engine();
}

export class Engine {

  scene;
  camera;
  renderer;
  baseRefSpace;
  vrSession;
  glContext;

  xrCamera;
  cameraVector;
  playerPosition;
  player;
  playerBox;
  dolly;

  controller0;
  controller1;

  mainLight;
  ambientLight;
  
  loader;

  structure;

  constructor() {}

  // Launches the VR scene
  launch() {

    console.log("Launching");

    // Set up the THREE scene
    this.scene = new THREE.Scene();
        
    // Create and position the scene camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 0);

    // Create the renderer and add it to the webpage
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Initialise the Reference Space, used in teleport calculations later
    this.renderer.xr.addEventListener("sessionstart", () => this.baseRefSpace = this.renderer.xr.getReferenceSpace());
    this.renderer.xr.enabled = true;

    // Check if the session is null (it should be!)
    // Start the session
    if(this.vrSession === undefined || this.vrSession === null) {
      
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
      this.vrSession.end();
    }
  }

  sessionStarted(session) {

    console.log("VR Session Started");
    session.addEventListener("end", this.sessionEnded.bind(this));
    this.vrSession = session;
  
    this.setupWebGLLayer().then(() => { this.renderer.xr.setSession(this.vrSession); });

    // Create the dolly and bounding boxes that manage player movement
    this.xrCamera = this.renderer.xr.getCamera(this.camera);
    this.cameraVector = new THREE.Vector3();
    this.playerPosition = { x: 10, y: 0, z: 20 };
    this.dolly = SETUP.buildDolly(this.camera, this.playerPosition);    
    this.scene.add(this.dolly);

    let p = SETUP.buildPlayer(this.playerPosition);
    this.player = p[0];
    this.playerBox = p[1];
    this.scene.add(this.player);

    // Create and add the controllers; add event listeners
    this.controller0 = null;
    this.controller0 = SETUP.buildController(0, this.renderer, this.dolly);
    this.controller1 = null;
    this.controller1 = SETUP.buildController(1, this.renderer, this.dolly);

    // Add a grid-helper at the floor level
    const gridHelper = new THREE.GridHelper(20, 20, 0xff0000, 0x004400);
    gridHelper.position.set(10, 0, 10);
    this.scene.add(gridHelper);

    // Add the Axes Helper
    let axesHelper = new THREE.AxesHelper(20);
    axesHelper.position.set(0, 0, 0);
    this.scene.add(axesHelper);      

    // Create a basic light and add it to the scene
    this.mainLight = new THREE.DirectionalLight(0xffffff, 5);
    this.mainLight.position.set(10, 20, 10);
    this.scene.add(this.mainLight);

    // Target the main-light at the centre of the grid
    this.mainLight.target.position.set(10, 0, 10);
    this.scene.add(this.mainLight.target)

    // Add some ambient light to further illuminate the scene
    this.ambientLight = new THREE.AmbientLight(0x505050, 1);
    this.scene.add(this.ambientLight);

    // Initialise the GLTF loader
    this.loader = new GLTFLoader();

    this.structure = [];
    this.interactions = [];

    // ** This is where the models are loaded
    // ** You will need to change the file names to those of your own models
    this.loadModel("./models/red-sphere.glb", [ 6, 0.25, 10 ], [ 0.1, 0.1, 0.1 ], [ this.structure ]);
    this.loadModel("./models/green-sphere.glb", [ 10, 0.25, 10 ], [ 0.1, 0.1, 0.1 ], [ this.structure ]);
    this.loadModel("./models/blue-sphere.glb", [ 14, 0.25, 10 ], [ 0.1, 0.1, 0.1 ], [ this.structure ]);

    // The scene is initialised, start the animation    
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  sessionEnded() {
  
    console.log("VR Session Ended");
    this.vrSession.removeEventListener("end", this.sessionEnded);
    this.vrSession = null;
  }

  setupWebGLLayer() {

    this.glContext = this.renderer.getContext();
    return this.glContext.makeXRCompatible().then(() => {
      this.vrSession.updateRenderState( { baseLayer: new XRWebGLLayer(this.vrSession, this.glContext) } );
    });
  }

  // A function to load the models; it takes the filename, position, and scale as arguments, as well as an array to add the content to
  loadModel(name, pos, scale, addTo) {

    this.loader.load(
               
      name,
               
      function(gltf) {
                   
        // The model has been successfully loaded
        const model = gltf.scene;
        model.position.set(pos[0], pos[1], pos[2]);
        model.scale.set(scale[0], scale[1], scale[2])
        this.scene.add(model);

        // Add the model to the specified arrays
        for(let a = 0; a < addTo.length; a++)
          addTo[a].push(model);

      }.bind(this),
               
      undefined,
               
      function(error) {
      
        console.error("An error occurred loading the GLTF model: ", error);
      }   
    );

    return null;
  }

  animate() {

    LOOP.handleControllerInput(this.controller0, this.controller1, this.scene, this.cameraVector, this.dolly, this.player, this.playerBox, this.structure);
    this.renderer.render(this.scene, this.camera);    
  }
}