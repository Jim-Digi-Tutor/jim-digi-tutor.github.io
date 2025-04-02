import * as THREE from "three";
import { Settings } from "./settings.js";
import { Utility } from "./utility.js";

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

    console.error("Alert... Alert... Alert...");

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

  addInteractable(id, type, model, modelType, attributes) {

    model.userData.id = id;
    console.log(model)
    let interactable = new Interactable(this, id, type, model.scene, modelType, attributes);
    this.interactableData.push(interactable);
    this.interactableModels.push(model.scene);
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
    
    if(!this.engine.movementManager.teleporting) {

      let scene = this.engine.scene;
      let cam = this.engine.camera;
      let scale = this.engine.scale;
      let renderer = this.engine.renderer;
      let tempMatrix = this.gazeMatrix;
      let raycaster = this.gazecaster;
      let interactables = this.interactableModels;

      scene.updateMatrixWorld();
      
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
      
      //console.log("START RAY")
      
      // Perform raycasting to check intersections with objects in the scene
      let intersects = raycaster.intersectObjects(interactables);
      if(intersects.length > 0) {
        
        
        let object = intersects[0].object;
        let distance = intersects[0].distance;

              ///**********
        // Tinkercad GLB: parent.parent.userData
        // Three Mesh: userData 
        // 3D Builder OBJ : parent.userData;
        let id = -1;
        if(object.userData.hasOwnProperty("id"))  // Three.JS Mesh
          id = object.userData.id;
        else if(object.parent.userData.hasOwnProperty("id"))  // 3DBuilder OBJ
          id = object.parent.userData.id;
        else if(object.parent.parent.userData.hasOwnProperty("id")) // Tinkercad GLB
          id = object.parent.parent.userData.id;
        
        let data = this.getInteractableData(id); 
        let checkDistance = (Settings.pickDistance * scale);
        
        if(data !== null && distance <= checkDistance) {
          
          this.managePick(data);
        } 

      } else {

        if(this.mode === Settings.INTERACTION_MODE_GAZE) {

          if(this.gazePicked !== null)
            this.nullifyPick();
        }
      }

      //console.log("Current Gaze Target: ", this.gazePicked);
    
    } else {

      this.engine.movementManager.teleportTick();
    }
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
      
      } else if(this.gazePicked.id === data.id) {

        if(this.gazePicked.activeTick()) {

          this.gazePicked.onSelected();
          this.gazePicked = null;
        }
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

  destroyInteractable(id) {

    this.removeModel(id);
    this.removeData(id);
  }

  removeModel(id) {

    let models = this.interactableModels;
    for(let a = 0; a < models.length; a++) {

      let data = null;
      if(models[a].userData.hasOwnProperty("id")) {

        data = models[a].userData;

      } else if(models[a].userData.parent.hasOwnProperty("id")) {
        
        data = models[a].parent.userData;

      } else if(models[a].userData.parent.parent.hasOwnProperty("id")) {

        data = models[a].parent.parent.userData;
      }
      
      if(data.id === id) {

        let obj = models[a];

        if(data.type === Settings.MODEL_TYPE_3D_BUILDER_OBJ) {

          for(let a = 0; a < obj.children[0].material[0]; a++) {

            obj.children[0].material[a].dispose();
            obj.children[0].material[a] = null;
          } 

          for(let a = 0; a < obj.children[0].geometry[0]; a++) {

            obj.children[0].geometry[a].dispose();
            obj.children[0].geometry[a] = null;
          } 

          obj.children[0].removeFromParent();
          obj.children[0] = null;          
          obj.removeFromParent();
          obj = null;          

        } else if(data.type === Settings.MODEL_TYPE_THREE_MESH) {

          obj.geometry.dispose();
          obj.geometry = null;
          obj.material.dispose();
          obj.material = null;
          obj.removeFromParent();
          obj = null;
        
        } else if(data.type === Settings.MODEL_TYPE_TINKERCAD_GLB) {

          obj.children[0].children[0].geometry.dispose();
          obj.children[0].children[0].geometry = null;
          obj.children[0].children[0].material.dispose();
          obj.children[0].children[0].material = null;
          obj.children[0].children[0].removeFromParent();
          obj.children[0].children[0] = null;
          obj.children[0].removeFromParent();
          obj.children[0] = null;          
          obj.removeFromParent();
          obj = null;
        }

        models.splice(a, 1);
        return true;
      }
    }   
    
    return false;
  }

  removeData(id) {

    let data = this.interactableData;
    for(let a = 0; a < data.length; a++) {

      if(data[a].id === id) {

        data[a] = null;
        data.splice(a, 1);
        return true;
      }
    }   
    
    return false;
  }
}

export class Interactable {

  manager;
  id;
  type;
  model;
  modelType;
  attributes;

  active;

  pickedAt;

  constructor(manager, id, type, model, modelType, attributes, active) {

    this.manager = manager;
    this.id = id;
    this.type = type;
    this.model = model;
    this.modelType = modelType;
    this.attributes = attributes;

    this.active = active;

    this.pickedAt = -1;
  }

  activeTick() {

    let now = Date.now();
    let duration = (now - this.pickedAt);
    let percent = (100 - Math.round((duration / Settings.pickTimer) * 100));
    let rgb = ("rgb(" + percent + "%, 100%, " + percent + "%)");
    
    if(this.modelType === Settings.MODEL_TYPE_3D_BUILDER_OBJ)
      this.model.children[0].material[0].emissive = new THREE.Color(rgb);
    else if(this.modelType === Settings.MODEL_TYPE_THREE_MESH)
      this.model.material.emissive = new THREE.Color(rgb);
    else if(this.modelType === Settings.MODEL_TYPE_TINKERCAD_GLB)
      this.model.children[0].children[0].material.emissive = new THREE.Color(rgb);

    return (duration > Settings.pickTimer);
  }

  passiveTick() {

    let att = this.attributes;
    
    if(Utility.getProperty(att, "type") === Settings.INTERACTABLE_MODEL_STANDARD) {

      if(Utility.getProperty(att, "onPassiveTick") !== null)
        att.onPassiveTick(this);
    }
  }

  onPicked() {

    this.pickedAt = Date.now();
    if(this.modelType === Settings.MODEL_TYPE_3D_BUILDER_OBJ) {

      this.model.children[0].material[0].emissive = new THREE.Color("rgb(100%, 100%, 100%)");
      this.model.children[0].material[0].emissiveIntensity = 0.2;

    } else if(this.modelType === Settings.MODEL_TYPE_THREE_MESH) {

      this.model.material.emissive = new THREE.Color("rgb(100%, 100%, 100%)");
      this.model.material.emissiveIntensity = 0.2;

    } else if(this.modelType === Settings.MODEL_TYPE_TINKERCAD_GLB) {

      this.model.children[0].children[0].material.emissive = new THREE.Color("rgb(100%, 100%, 100%)");
      this.model.children[0].children[0].material.emissiveIntensity = 0.2;
    }
  }

  onUnPicked() {

    this.pickedAt = -1;

    if(this.modelType === Settings.MODEL_TYPE_3D_BUILDER_OBJ)
      this.model.children[0].material[0].emissive = new THREE.Color("rgb(0%, 0%, 0%)");
    else if(this.modelType === Settings.MODEL_TYPE_THREE_MESH)
      this.model.material.emissive = new THREE.Color("rgb(0%, 0%, 0%)");
    else if(this.modelType === Settings.MODEL_TYPE_TINKERCAD_GLB)
      this.model.children[0].children[0].material.emissive = new THREE.Color("rgb(0%, 0%, 0%)");
  }

  onSelected() {

    let att = this.attributes;

    if(Utility.getProperty(att, "type") === Settings.INTERACTABLE_MODEL_STANDARD) {

      if(Utility.getProperty(att, "onSelect") !== null)
        att.onSelect(this);
    }

    if(Utility.getProperty(att, "ClimbTargets")) {

      this.manager.engine.movementManager.prepareClimb(att);
    }

    if(Utility.getProperty(att, "TeleportTarget")) {

      this.manager.engine.movementManager.prepareTeleport(att);
    }

    if(Utility.getProperty(att, "RotateLeftOnSelect")) {

      this.manager.engine.movementManager.rotate(Settings.MOVEMENT_ROTATE_LEFT);
    }

    if(Utility.getProperty(att, "RotateRightOnSelect")) {

      this.manager.engine.movementManager.rotate(Settings.MOVEMENT_ROTATE_RIGHT);
    }

    if(Utility.getProperty(att, "DestroyOnSelect"))
      this.manager.destroyInteractable(this.id);
    else
      this.onUnPicked();
  }
}