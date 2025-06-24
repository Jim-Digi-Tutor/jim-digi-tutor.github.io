import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import * as UTILS from "../utils.js";

export class Models {

  #region;
  #data;
  #path;

  #models;

  constructor(region, data) {

    this.#region = region;
    this.#data = data;

    this.#models = [];
  }

  async processModels() {

    const uniScale = this.#region.getWorld().getEngine().getUniversalScale();
    const modScale = this.#region.getWorld().getEngine().getModelScale();

    const models = this.#data.getElementsByTagName("model");
    for(let a = 0; a < models.length; a++) {      

      const model = models[a];  
      const file = model.querySelector("file").textContent.trim();
      const type = model.querySelector("type").textContent.trim();
      const size = UTILS.getVectorFromXml(model.querySelector("size"), 0);
      const position = UTILS.getVectorFromXml(model.querySelector("position"), 0);
      const adjPosition = UTILS.adjustChildPositionToParent(position, this.#region.getScaledSize(), this.#region.getAdjustedPosition(), uniScale, modScale);
      const scale = UTILS.getVectorFromXml(model.querySelector("scale"), 0);
      const rotation = UTILS.getVectorFromXml(model.querySelector("rotation"), 0);
      
      // Load the simple model
      let load = null;
      this.#path = ("./assets/models/scene/" + this.#region.getAlias() + "/models/");
      if(type === "OBJ") {
        
        load = await UTILS.loadObj(
          (this.#path + file + ".obj"),
          new OBJLoader(), 
          new MTLLoader(), 
          uniScale,
          false, adjPosition,
          true, scale,
          true, rotation,
          []
        );
      }
            
      const mod = load.model;
      mod.userData.ModelType = "Model";
      mod.userData.RegionModelId = ("Region-Model-" + this.#region.getId() + "-" + a);
      this.#region.getWorld().getEngine().getScene().add(mod);
      const modelPiece = {
        file: file,
        type: type,
        pos: adjPosition,
        scale: scale,
        rot: rotation,
        current: load.model,
        simple: load.model,
        complex: null
      };

      // Check if a complex model exists
      // If it doesn't, complex remains null, a simple model is always used
      const path = (this.#path + file + "-complex." + type.toLowerCase());
      const complex = await UTILS.checkModelExists(path);
      if(complex)
        modelPiece.complex = "EXISTS";

      this.#models.push(modelPiece);
    }
  }

  manageModels(proximity) {

    const uniScale = this.#region.getWorld().getEngine().getUniversalScale();
    const modScale = this.#region.getWorld().getEngine().getModelScale();

    const simple = (proximity === "NEAR" || proximity === "DISTANT");
    for(let a = 0; a < this.#models.length; a++) {
    
      const model = this.#models[a];
      
      if(!simple) {

        if(model.complex !== null && model.complex === "EXISTS") {

          // The model exists, but isn't loaded, load it
          if(model.type === "OBJ") {
            
            new OBJLoader().load(

              (this.#path + model.file + "-complex.obj"),
              
              (obj) => {
                
                //const model = gltf.scene;
                
                obj.position.x = model.pos.x;
                obj.position.y = model.pos.y;
                obj.position.z = model.pos.z;

                obj.scale.x = (model.scale.x * uniScale);
                obj.scale.y = (model.scale.y * uniScale);
                obj.scale.z = (model.scale.z * uniScale);
                   
                obj.rotation.x = THREE.MathUtils.degToRad(model.rot.x);
                obj.rotation.y = THREE.MathUtils.degToRad(model.rot.y);
                obj.rotation.z = THREE.MathUtils.degToRad(model.rot.z);

                this.#region.getWorld().getEngine().getScene().remove(model.simple);
                this.#region.getWorld().getEngine().getScene().add(obj);
                model.complex = obj;
                model.current = model.complex;
              },

              undefined, // Optional onProgress
              
              (error) => {

                console.warn("Failed to load the model: ", error);
              }
           );
          }

        } else if(model.complex !== null && model.complex !== "EXISTS") {

          this.#region.getWorld().getEngine().getScene().remove(model.simple);
          this.#region.getWorld().getEngine().getScene().add(model.complex);
          model.current = model.complex;
        } 

      } else {

        this.#region.getWorld().getEngine().getScene().remove(model.complex);
        this.#region.getWorld().getEngine().getScene().add(model.simple);
        model.current = model.simple;
      }

      const dispose = (proximity === "DISTANT");
      if(dispose) {

        if(model.complex !== null && model.complex !== "EXISTS" && (model.complex instanceof THREE.Object3D || model.complex instanceof THREE.Group)) {

          UTILS.disposeModel(model.complex, this.#region.getWorld().getEngine().getScene());
          model.complex = null;
          model.complex = "EXISTS";
        }
      }
    } 
  }
}