import * as THREE from "three";
import { Settings } from "./settings.js";

export class InteractionManager {

  engine;
  mode;

  interactableData;
  interactableModels;

  gazePointer;
  gazecaster;
  gazeMatrix;
  gazePicked;
  
  controller0;  // A data representation of the left-hand controller
  raycaster0;   // The raycaster object for controller zero
  tempMatrix0;  // Used for raycasting calculations for controller zero
  picked0;      // The object picked out by the raycast of controller zero
  selected0;    // The object selected by the raycast of controller zero
  trigger0Down; // Whether or not the trigger is depressed

  controller1;  // A data representation of the right-hand controller
  raycaster1;   // The raycaster object for controller one
  tempMatrix1;  // Used for raycasting calculations for controller one
  picked1;      // The object picked out by the raycast of controller one
  selected1;    // The object selected by the raycast of controller one
  trigger1Down; // Whether or not the trigger is depressed

  constructor(eng, mode) {

    this.engine = eng; 
    this.mode = mode;
    this.interactableData = [];
    this.interactableModels = [];

    switch(this.mode) {

      case Settings.INTERACTION_MODE_CONTROLLER_DUAL:
        break;

      case Settings.INTERACTION_MODE_CONTROLLER_SINGLE:        
        break;

      case Settings.INTERACTION_MODE_GAZE:
        this.buildGazePointer();
        this.gazecaster = new THREE.Raycaster();
        this.gazecaster.near = 0;
        this.gazecaster.far = (Settings.pickDistance * this.engine.scale);
        this.gazeMatrix = new THREE.Matrix4();
        this.gazePicked = null;   
        break;
    }
  }

  addInteractable(id, type, model, modelType) {

    model.userData.id = id;
    let interactable = new Interactable(this, id, type, model, modelType);
    this.interactableData.push(interactable);
    this.interactableModels.push(model);
  }

  buildController(index, renderer, scene, pickDistance) {
  
    // Configure the raycaster for the right-hand controller (one)
    //this.raycaster1 = new THREE.Raycaster();
    //this.raycaster1.near = 0;
    //this.raycaster1.far = this.pickDistance;
    //this.tempMatrix1 = new THREE.Matrix4();
    //this.picked1 = { obj: null, dist: 999 };
    //this.selected1 = { obj: null, dist: 999 };
    //this.trigger1Down = false;

    //let factory = new XRControllerModelFactory();
    
    //let group = {};
    //group.controller = renderer.xr.getController(index);
    //group.grip = renderer.xr.getControllerGrip(index);
    //group.gamepad = null;
    //group.grip.add(factory.createControllerModel(group.grip));
    //group.controller.addEventListener("connected", (e) => {
      
      // This assigns the gamepad controls of the controller to the gamepad object
      //group.gamepad = e.data.gamepad;
    //});
  
    //scene.add(group.controller);
    //scene.add(group.grip);
  
    // Add the lines extending from the controller
    //let geo = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1) ] );
    //let line = new THREE.Line(geo);
    //line.scale.z = pickDistance;
    //group.controller.add(line.clone());
    
    //return group;
  }  

  buildGazePointer() {

    let geo = new THREE.SphereGeometry(this.engine.scale / 100);
    let mat = new THREE.MeshBasicMaterial( { color: 0xFF0000 } );
    this.gazePointer = new THREE.Mesh(geo, mat);
    this.engine.scene.add(this.gazePointer);
  }

  castGaze() {

    let cam = this.engine.camera;
    let scale = this.engine.scale;
    let renderer = this.engine.renderer;
    let tempMatrix = this.gazeMatrix;
    let raycaster = this.gazecaster;
    let interactables = this.interactableModels;
    
    // Calculate the position of the gazePointer
    let dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.multiplyScalar(1);
    let point = new THREE.Vector3();
    cam.getWorldPosition(point);
    point.add(dir);
    this.gazePointer.position.copy(point);
    
    // Prepare to cast the ray to determine interaction
    let session = renderer.xr.getSession();
    if(!session)
      return;
    
    // Get the XR camera (headset position and orientation)
    let xrCam = renderer.xr.getCamera();
    
    // Set the raycaster's origin and direction based on the headset's position and orientation
    tempMatrix.identity().extractRotation(xrCam.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(xrCam.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    // Perform raycasting to check intersections with objects in the scene
    let intersects = raycaster.intersectObjects(interactables);
    if(intersects.length > 0) {
    
      let object = intersects[0].object;
      let distance = intersects[0].distance;
      let data = this.getInteractableData(object.userData.id); 
      let checkDistance = Settings.pickDistance * this.engine.scale;
      if(data !== null && distance <= checkDistance) {
        
        this.managePick(data);
      } 

    } else {

      if(this.mode === Settings.INTERACTION_MODE_GAZE) {

        if(this.gazePicked !== null)
          this.nullifyPick();
      }
    }

    console.log("GAZE: " + this.gazePicked);
  }

  managePick(data) {

    if(this.mode === Settings.INTERACTION_MODE_GAZE) {
     
      if(this.gazePicked === null) {

        this.gazePicked = data;
        this.gazePicked.onPicked();

      } else if(this.gazePicked.id !== data.id) {

        this.gazePicked.onUnPicked();
        this.gazePicked = data;
        this.gazePicked.onPicked();
      }
    }
  }

  nullifyPick() {

    if(this.mode === Settings.INTERACTION_MODE_GAZE) {
      
      this.gazePicked.onUnPicked()
      this.gazePicked = null;
    }
  }

  getInteractableData(id) {

    for(let a = 0; a < this.interactableData.length; a++) {

      let data = this.interactableData[a]; 
      if(id === data.id)
        return data;
    }

    return null;
  }
}

export class Interactable {

  manager;
  id;
  type;
  model;
  modelType;

  constructor(manager, id, type, model, modelType) {

    this.manager = manager;
    this.id = id;
    this.type = type;
    this.model = model;
    this.modelType = modelType;
  }

  onPicked() {

    this.model.material.emissive = new THREE.Color(0xffffff);
    this.model.material.emissiveIntensity = 0.2;
    console.log(this.id);
  }

  onUnPicked() {

    this.model.material.emissive = new THREE.Color(0x000000);
  }

  onSelected() {

  }
}