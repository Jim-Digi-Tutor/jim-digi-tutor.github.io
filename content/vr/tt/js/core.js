import * as THREE from "three";

import Stats from 'three/addons/libs/stats.module.js';

import * as MESH_UI from "mesh-ui";

import * as LOOP from "./loop.js";
import * as SETUP from "./setup.js";
import * as UTILS from "./utils.js";
import * as WORLD from "./world.js";

let engine;
export { engine };

export function initEngine() {

  engine = new Engine();
}

export class Engine {

  gridSize = 100;

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
  
  fpsGroup;
  fpsPanel;
  fpsText;
  
  lastTime = performance.now();
  frames = 0;
  fps = 0;

  loader;

  structure;

  constructor() {}

  // Launches the VR scene
  launch() {

    console.log("Launching VR Environment");

    // Setup the scene including the camera and audio-listener
    this.scene = new THREE.Scene();
    
    // Create and position the scene camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 0);
    
    // Setup the audio listener
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);  

    // Create the renderer and add it to the webpage
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialise the Reference Space, potentially used in teleport calculations later
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

    const worldScale = UTILS.ascertainWorldScale();
    const modelScale = UTILS.ascertainModelScale();

    console.log("VR Session Started");
    session.addEventListener("end", this.sessionEnded.bind(this));
    this.vrSession = session;
  
    this.setupWebGLLayer().then(() => { this.renderer.xr.setSession(this.vrSession); });

			const clock = new THREE.Clock();
			const container = document.getElementById( 'stats' );

			this.stats = new Stats();
			container.appendChild( this.stats.dom );    

    // Create the dolly and bounding boxes that manage player movement
    this.xrCamera = this.renderer.xr.getCamera(this.camera);
    this.cameraVector = new THREE.Vector3();
    this.playerPosition = { x: UTILS.scaleDistance(10, worldScale, modelScale), y: 0, z: UTILS.scaleDistance(10, worldScale, modelScale) };
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
    const gridHelper = new THREE.GridHelper(UTILS.scaleDistance(this.gridSize, worldScale, modelScale), Math.floor(this.gridSize / 10));
    gridHelper.position.set(0, 0, 0);
    this.scene.add(gridHelper);

    // Add the Axes Helper
    let axesHelper = new THREE.AxesHelper(UTILS.scaleDistance(this.gridSize, worldScale, modelScale));
    axesHelper.position.set(0, 0, 0);
    this.scene.add(axesHelper);      

    const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
    this.scene.add( light );

    // Create a basic light and add it to the scene
    this.mainLight = new THREE.DirectionalLight(0xffffff, 5);
    this.mainLight.position.set(10, 20, 10);
    this.scene.add(this.mainLight);

    // Target the main-light at the centre of the grid
    this.mainLight.target.position.set(10, 0, 10);
    this.scene.add(this.mainLight.target)

    // Add some ambient light to further illuminate the scene
    //this.ambientLight = new THREE.AmbientLight(0x505050, 1);
    //this.scene.add(this.ambientLight);

    const info = UTILS.createFpsPanel();
    this.fpsPanel = info.panel;
    this.fpsText = info.text;
    
    console.log(this.fpsPanel)

    
        this.fpsGroup = new THREE.Group();
        this.scene.add(this.fpsGroup);
        this.fpsGroup.add(this.fpsPanel);

    this.structure = [];
    this.interactions = [];

    WORLD.buildWorld(this.scene);
    // ** This is where the models are loaded
    // ** You will need to change the file names to those of your own models
    //this.loadModel("./models/red-sphere.glb", [ 6, 0.25, 10 ], [ 0.1, 0.1, 0.1 ], []);
    //this.loadModel("./models/green-sphere.glb", [ 10, 0.25, 10 ], [ 0.1, 0.1, 0.1 ], []);
    //this.loadModel("./models/blue-sphere.glb", [ 14, 0.25, 10 ], [ 0.1, 0.1, 0.1 ], []);

    console.log(this.camera)
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

  cameraWorldPos = new THREE.Vector3();
  cameraWorldQuat = new THREE.Quaternion();
  animate() {

    LOOP.handleControllerInput(this.controller0, this.controller1, this.scene, this.cameraVector, this.dolly, this.player, this.playerBox, this.structure);

    //const now = performance.now();
    //this.frames++;

    //if (now - this.lastTime >= 1000) {
      //this.fps = this.frames;
      //this.frames = 0;
      //this.lastTime = now;

      // Update text content
      
      //console.log(this.fps)
    //}

    //const now = performance.now();
    //console.log('Frame time:', now - this.lastTime);
    //this.lastTime = now;

    //this.fpsText.set( { content: ("FPS: " + this.fps) } );
    //this.fpsText.set( { content: ("FPS: " + this.fps) } );

    //const cameraWorldPos = new THREE.Vector3();
    //this.camera.getWorldPosition(this.cameraWorldPos);

    //const cameraWorldQuat = new THREE.Quaternion();
    //this.camera.getWorldQuaternion(this.cameraWorldQuat);

    //this.fpsGroup.position.copy(this.cameraWorldPos);
    //this.fpsGroup.quaternion.copy(this.cameraWorldQuat);

    //if (this.frames % 30 === 0) { MESH_UI.update(); }
 //     MESH_UI.update();

				this.stats.update();
    this.renderer.render(this.scene, this.camera);    
  }
}