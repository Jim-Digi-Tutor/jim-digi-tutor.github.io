import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import * as LOOP from "./loop.js";
import * as SETUP from "./setup.js";
import * as GUI from "./gui-components/gui-components.js";
import * as UTILS from "./utility/utils.js";

import { World } from "./world-components/world.js";

let engine;
export { engine };

export function initEngine() {

  engine = new Engine();
}

export class Engine {

  // Flag whether or not to log information to the console
  #log = true;

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
  #player;
  #playerBox;
  #playerHeight;
  #playerRadius;
  #dolly;

  // Controller members
  #interactionManager;
  #controller0;
  #controller1;
  #interactRange;

  // Raycast members
  #gravityRay;
  #gravityMatrix;

  // Data and game world members
  #camSet;
  #camHeight = 2;
  #uniScale;
  #modScale;
  #terrain;
  #collidables;
  #interactables;
  #teleports;
  #teleportMeshes;
  #animations;
  #world;
  
  // Game state members
  #canLaunch = false;
  #firstFrame = true;
  #time;
  #frameCounter = 0;
  #movementSpeed = 0.04;
  #rotationSpeed = 0.5;
  #gravLower = 0;
  #gravUpper = 3.5;
  #gravOffset = 0.1;

  #locationPanel = null;
  #locationText = null;
  #debugPanel = null;
  #debugText = null;
  #lastRefresh = performance.now();
  #frames = 0;
  #fps = 0;  
  #camPos = new THREE.Vector3();
  #camQuat = new THREE.Quaternion();
 // #splashOffset = new THREE.Vector3(0, 0, 0.3);
 // #locOffset = new THREE.Vector3(0, -0.65, 0.8);
 // #debugOffset = new THREE.Vector3(-0.92, 0.63, 0.8);

 // Headset testing
  #splashOffset = new THREE.Vector3(0, 0, 0.3);
  #locOffset = new THREE.Vector3(0, -0.275, 0.8);
  #debugOffset = new THREE.Vector3(-0.50, 0.3, 0.8);

  #proximityCheckFrequency = 500;
  #proxAdj = 16;

  #splashPanel;

  #platform;
  #screenWidth;
  
  #teleportStartColour = new THREE.Color(0xFF8BA0);
  #teleportEndColour = new THREE.Color(0xFF0000);
  #teleportScaleLimit = 0.1;
  #teleportAnimationDuration = 650;
  #teleportGrow = true;
  #teleportLast = Date.now();
  
  #teleportFader;
  #isTeleporting = false;
  #teleportTarget = {};
  #teleportAt;
  #teleportDuration = 500;
  #teleportRepositioned = false;

  constructor() {}

  getScene() { return this.#scene; }
  getListener() { return this.#listener; }
  getRenderer() { return this.#renderer; }

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
  getCollidables() { return this.#collidables; }
  setCollidable(collidable) { this.#collidables.push(collidable); }
  appendToCollidables(collidables) { this.#collidables.concat(collidables); }
  getInteractables() { return this.#interactables; }
  setInteractable(interactable) { this.#interactables.push(interactable); }  
  getTeleports() { return this.#teleports; }
  setTeleport(teleport) { this.#teleports.push(teleport); }  
  getTeleports() { return this.#teleports; }
  setTeleport(teleport) { this.#teleports.push(teleport); }  
  getTeleportByAlias(alias) {

    for(let a = 0; a < this.#teleports.length; a++) {
     
      if(this.#teleports[a].getAlias() === alias) {

        return this.#teleports[a];
      }
    }

    return null;
  }

  getTeleportMeshes() { return this.#teleportMeshes; }
  setTeleportMesh(mesh) { this.#teleportMeshes.push(mesh); }  
  getTeleportStartColour() { return this.#teleportStartColour; }

  getIsTeleporting() { return this.#isTeleporting; }

  getWorld() { return this.#world; }

  getSplashPanel() { return this.#splashPanel; }

  getPlatform() { return this.#platform; }

  prepareTeleport(port) {

    this.#isTeleporting = true;
    const region = this.#world.getRegionById(port.getRegion());
    this.#teleportTarget = {
      base: region.getPosition(),
      target: port.getTarget()
    }

    this.#teleportAt = Date.now();
    this.#teleportRepositioned = false;

    // Use camera.position.y for more effective blackout
    this.#teleportFader.position.set(this.#dolly.position.x, this.#camera.position.y, this.#dolly.position.z);
  }

  // Launches the VR scene
  async launch() {
    
    if(this.#log) console.log("Launching VR Environment");
    this.#setupManager = new SETUP.SetupManager();

    if(this.#log) console.log("Detecting Device Platform");
    const platformData = await this.#setupManager.detectPlatform();
    if(platformData.isMobileBrowser)
      this.#platform = "MOBILE";
    if(platformData.isHeadsetBrowser)
      this.#platform = "HEADSET";    
    if(platformData.isDesktopEmulator)
      this.#platform = "PC";
    
    this.#screenWidth = parseInt(window.innerWidth);
    if(this.#log) console.log("Platform Detected: " + this.#platform + " @ " + this.#screenWidth + "px Wide");
 
    // Create the renderer and add it to the webpage
    this.#renderer = this.#setupManager.setupRenderer();
    // Initialise the Reference Space, potentially used in teleport calculations later
    this.#renderer.xr.addEventListener("sessionstart", () => this.#baseRefSpace = this.#renderer.xr.getReferenceSpace());
    this.#renderer.xr.enabled = true;
    // Initialise the XR camera and camera vector
    this.#xrCamera = this.#renderer.xr.getCamera(this.#camera);
    this.#cameraVector = new THREE.Vector3();

    // Setup the scene including the camera and audio-listener
    const sceneSetup = this.#setupManager.setupScene(this.#renderer);
    this.#scene = sceneSetup.scene;
    this.#camera = sceneSetup.camera;
    this.#listener = sceneSetup.listener;    

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

    if(this.#log) console.log("VR Session Started");
    session.addEventListener("end", this.sessionEnded.bind(this));
    this.#vrSession = session;
  
    this.setupWebGLLayer().then(() => { this.#renderer.xr.setSession(this.#vrSession); });

    // Ascertain the camera height and the scale to use for the world
    this.#camHeight = this.#setupManager.ascertainCameraHeight();
    this.#uniScale = this.#setupManager.ascertainUniversalScale();
    this.#modScale = this.#setupManager.ascertainModelScale();

    // Set the speeds and comparison values
    this.#movementSpeed = UTILS.scaleDistance(this.#movementSpeed, this.#uniScale, this.#modScale);
    this.#rotationSpeed = (this.#rotationSpeed * this.#uniScale);
    this.#gravLower = ((this.#gravLower * this.#modScale) * this.#uniScale);
    this.#gravUpper = ((this.#gravUpper * this.#modScale) * this.#uniScale);
  
    // Set the camera distance for the HUD
    this.#locOffset = new THREE.Vector3(
      UTILS.scaleDistance(this.#locOffset.x, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(this.#locOffset.y, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(this.#locOffset.z, this.#uniScale, this.#modScale)
    );

    // Set the camera distance for the HUD
    this.#debugOffset = new THREE.Vector3(
      UTILS.scaleDistance(this.#debugOffset.x, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(this.#debugOffset.y, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(this.#debugOffset.z, this.#uniScale, this.#modScale)
    );

    // Set the proximity check value
    this.#proxAdj = UTILS.scaleDistance(this.#proxAdj, this.#uniScale, this.#modScale);    

    // Initialise the terrain and structure objects for collidables
    this.#terrain = [];
    this.#collidables = [];
    this.#interactables = [];
    this.#teleports = [];
    this.#teleportMeshes = [];
    
    // Initialise and add the dolly; this code needs to go here to prevent problems adding the controllers
    this.#dolly = this.#setupManager.buildDolly(this.#scene, this.#camera, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
    // Create and add the controllers; add event listeners
    this.#interactRange = UTILS.scaleDistance(3, this.#uniScale, this.#modScale);
    this.#controller0 = null;
    this.#controller0 = this.#setupManager.buildController(0, this.#renderer, this.#dolly, this.#interactRange);
    this.#controller1 = null;
    this.#controller1 = this.#setupManager.buildController(1, this.#renderer, this.#dolly, this.#interactRange);    

    // Setup and configure the interaction manager
    this.#interactionManager = new LOOP.InteractionManager(
      this,
      this.#controller0,
      this.#controller1,
      this.#uniScale,
      this.#modScale,
      this.#interactRange,
      this.#scene,
      this.#interactables
    )

    // Setup the Teleport Fader
    const fadeMat = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    const fadeGeo = new THREE.BoxGeometry(
      UTILS.scaleDistance(2, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(2, this.#uniScale, this.#modScale),
      UTILS.scaleDistance(2, this.#uniScale, this.#modScale)
    );

    this.#teleportFader = new THREE.Mesh(fadeGeo, fadeMat);
    this.#teleportFader.material.side = THREE.DoubleSide;
    this.#teleportFader.material.transparent = true;
    this.#teleportFader.material.opacity = 0.0;
    this.#scene.add(this.#teleportFader);    

    // The scene is initialised, start the animation    
    this.#renderer.setAnimationLoop(this.animate.bind(this));

    // Setup the splash-panel
    this.#splashPanel = new GUI.SplashPanel(
      this.#scene,
      this.#camera,
      this.#renderer,
      this.#platform,
      this.#screenWidth,
      this.#uniScale,
      this.#modScale
    );

    this.#splashPanel.buildPanel();

    if(this.getSplashPanel() !== null) {

      let platform = "";
      if(this.#platform === "MOBILE")
        platform = "Mobile Device";
      else if(this.#platform === "HEADSET")
        platform = "VR Headset";
      else if(this.#platform === "PC")
        platform = "Desktop / Laptop";
      else
        platform = "Unknown Device";            

      this.getSplashPanel().updatePanel("PlatformData", (platform + " @ " + this.#screenWidth + "px"));   
    }
    
    // Initialise the world object
    this.#world = new World(this);
    if(this.#log) console.log("Waiting for World Data to Load");
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

      // Flag that the app is ready to properly launch
      if(this.#log) console.log("World Data Loaded; Ready to Launch");
      this.#canLaunch = true;
    
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

  updateLocationPanel(text) {

    this.#locationText.set( { content: text } );
  }

  updateDebugPanel(text) {

    this.#debugText.set( { content: text } );
  }

  #checkProximities() {

    const proximities = [];
    const pos = this.#dolly.position;
    const regions = this.#world.getRegions();
    for(let a = 0; a < regions.length; a++) {

      const region = regions[a];
      const rSize = region.getSize();
      const rPos = region.getPosition();

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
        
    // If required, log the proximity data
    // console.log("Region Proximity Info: ", proximities);

    this.#world.manageProximities(proximities);
    setTimeout(this.#checkProximities.bind(this), this.#proximityCheckFrequency);
  }

  animate() {

    this.#time = Date.now();

    if(this.#canLaunch) {

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

        // Setup the GUI panel(s)
        const loc = this.#setupManager.buildLocationPanel(this.#camera, this.#uniScale, this.#modScale);
        this.#locationPanel = loc.panel;
        this.#locationText = loc.text;
        this.#scene.add(this.#locationPanel);

        const debug = this.#setupManager.buildDebugPanel(this.#camera, this.#uniScale, this.#modScale);
        this.#debugPanel = debug.panel;
        this.#debugText = debug.text;
        this.#scene.add(this.#debugPanel);

        if(this.#log) console.log("First Frame of Loaded World Rendering");

        // Check the region proximities
        this.#checkProximities();
        
        this.#firstFrame = false;
      }     

      // Handle the animation of the teleport meshes
      const tele = this.#teleportMeshes;
      for(let a = 0; a < tele.length; a++) {

        const t = tele[a];
        const current = (this.#teleportGrow) 
          ? (this.#time - this.#teleportLast)
          : ((this.#teleportLast + this.#teleportAnimationDuration) - this.#time);
        const percent  = Math.min(Math.max(current / this.#teleportAnimationDuration, 0), 1);
        const scale = (1 + (this.#teleportScaleLimit * percent));
        t.scale.set(scale, scale, scale);
        const blend = new THREE.Color().copy(this.#teleportStartColour).lerp(this.#teleportEndColour, percent);
        t.material.color.set(blend);
            
        if((this.#teleportGrow && current >= this.#teleportAnimationDuration) || (!this.#teleportGrow && current <= 0)) {

          this.#teleportLast = this.#time;
          this.#teleportGrow = !this.#teleportGrow;
        }
      }

      if(this.#isTeleporting) {
        
        const current = (!this.#teleportRepositioned) 
          ? (this.#time - this.#teleportAt)
          : ((this.#teleportAt + (this.#teleportDuration * 2)) - this.#time);

        const percent  = Math.min(Math.max(current / this.#teleportDuration, 0), 1);
        this.#teleportFader.material.opacity = percent;

        if(percent >= 0.95 && !this.#teleportRepositioned) {
          
          const base = this.#teleportTarget.base;
          const target = this.#teleportTarget.target;
          this.#dolly.position.x = (base.x + UTILS.scaleDistance(target.x, this.#uniScale, this.#modScale));
          this.#dolly.position.y = (base.y + UTILS.scaleDistance(target.y, this.#uniScale, this.#modScale));
          this.#dolly.position.z = (base.z + UTILS.scaleDistance(target.z, this.#uniScale, this.#modScale));
          this.#teleportFader.position.set(
            this.#dolly.position.x,
            this.#camera.position.y,
            this.#dolly.position.z
          );
          this.#teleportRepositioned = true;
          //this.#world.manageProximities();
        }

        if(percent <= 0.05 && this.#teleportRepositioned) {
          
          this.#teleportFader.material.opacity = 0;
          this.#teleportFader.position.y = (this.#dolly.position.y + 5)
          this.#isTeleporting = false;
          //this.#checkProximities();
        }
      }

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
        this.#collidables,
        this.#terrain,
        this.#movementSpeed,
        this.#rotationSpeed,
        this.#gravLower,
        this.#gravUpper,
        this.#gravOffset,
        this.#uniScale,
        this.#modScale,
        null
      );

      this.#interactionManager.checkInteractions();

          // Call the handleInteraction function in the LOOP code
          // Pass to it this engine object (this) so that it can access its variables
          //LOOP.handleInteraction(this);
      
          // Loop through the array of interactable objects
          // If the silver and / or gold keys are still in play, rotate them
          //for(let a = 0; a < this.interactions.length; a++) {
      
            //let data = this.interactions[a].userData;
            //if(data.hasOwnProperty("itemId") && (data.itemId === "gold-key" || data.itemId === "silver-key")) {
              
              //this.interactions[a].rotation.y += 0.05;
            //}
         // }
    
      //this.#gui.update();

      // Update the MESH-UI components
      // Reposition and reorient the location panel towards the camera
      if(this.#locationPanel !== null) {
       
        this.#camera.getWorldPosition(this.#camPos);
        this.#camera.getWorldQuaternion(this.#camQuat);

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.#camQuat);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.#camQuat);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.#camQuat);

        const worldPos = this.#camPos
          .clone()
          .addScaledVector(right, this.#locOffset.x)
          .addScaledVector(up, this.#locOffset.y)
          .addScaledVector(forward, this.#locOffset.z);

        this.#locationPanel.position.copy(worldPos);
        this.#locationPanel.quaternion.copy(this.#camQuat);  
      }

      // Update the MESH-UI components
      // Reposition and reorient the debug panel towards the camera
      if(this.#debugPanel !== null) {
       
        this.#camera.getWorldPosition(this.#camPos);
        this.#camera.getWorldQuaternion(this.#camQuat);

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.#camQuat);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.#camQuat);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.#camQuat);

        const worldPos = this.#camPos
          .clone()
          .addScaledVector(right, this.#debugOffset.x)
          .addScaledVector(up, this.#debugOffset.y)
          .addScaledVector(forward, this.#debugOffset.z);

        this.#debugPanel.position.copy(worldPos);
        this.#debugPanel.quaternion.copy(this.#camQuat);  
      }      

      // Calculate the frame-rate
      this.#frames++;
      if (this.#time - this.#lastRefresh >= 1000) {

        this.#fps = this.#frames;
        this.#frames = 0;
        this.#lastRefresh = this.#time;
      }      

      // Update the debug panel
      this.updateDebugPanel("FPS: " + this.#fps);
      
      MESH_UI.update();
      
      this.#world.process(this.#frameCounter, this.#time);
      this.#frameCounter++; 
    }        

    // Reposition and reorient the splash panel towards the camera
    if(this.#splashPanel !== null && this.#splashPanel.getPanel() !== null) {
       
      this.#camera.getWorldPosition(this.#camPos);
      this.#camera.getWorldQuaternion(this.#camQuat);

      const right = new THREE.Vector3(0, 0, 0).applyQuaternion(this.#camQuat);
      const up = new THREE.Vector3(0, 0, 0).applyQuaternion(this.#camQuat);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.#camQuat);

      const worldPos = this.#camPos
        .clone()
        .addScaledVector(right, this.#splashOffset.x)
        .addScaledVector(up, this.#splashOffset.y)
        .addScaledVector(forward, this.#splashOffset.z);

      this.#splashPanel.getPanel().position.copy(worldPos);
      this.#splashPanel.getPanel().quaternion.copy(this.#camQuat);  
      MESH_UI.update();
    }

    // Update and render the scene
    this.#renderer.render(this.#scene, this.#camera);    
  }  
}