import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import * as UTILS from "../utils.js";

export class Terrain {

  #region;
  #data;
  #path;

  #pieces;

  constructor(region, data) {

    this.#region = region;
    this.#data = data;

    this.#pieces = [];
  }

  async processTerrain() {

    const uniScale = this.#region.getWorld().getEngine().getUniversalScale();
    const modScale = this.#region.getWorld().getEngine().getModelScale();

    const pieces = this.#data.getElementsByTagName("terrain-piece");
    for(let a = 0; a < pieces.length; a++) {      

      const piece = pieces[a];  
      const file = piece.querySelector("file").textContent.trim();
      const type = piece.querySelector("type").textContent.trim();
      const size = UTILS.getVectorFromXml(piece.querySelector("size"), 0);
      const position = UTILS.getVectorFromXml(piece.querySelector("position"), 0);
      const adjPosition = UTILS.adjustChildPositionToParent(position, this.#region.getScaledSize(), this.#region.getAdjustedPosition(), uniScale, modScale);
      const scale = UTILS.getVectorFromXml(piece.querySelector("scale"), 0);
      const rotation = UTILS.getVectorFromXml(piece.querySelector("rotation"), 0);
      
      // Load the simple model
      let load = null;
      this.#path = ("./assets/models/scene/" + this.#region.getAlias() + "/terrain/");
      if(type === "GLB") {

        load = await UTILS.loadGltf(
          (this.#path + file + ".glb"),
          new GLTFLoader(), 
          uniScale,
          false, adjPosition,
          true, scale,
          true, rotation,
          []
        );  
      }
        
      const mod = load.model;
      mod.userData.ModelType = "Terrain";
      mod.userData.TerrainId = ("Terrain-Model-" + this.#region.getId() + "-" + a);
      this.#region.getWorld().getEngine().getScene().add(mod);
      const terrainPiece = {
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
        terrainPiece.complex = "EXISTS";

      this.#pieces.push(terrainPiece);
    }
  }

  manageModels(proximity) {

    const uniScale = this.#region.getWorld().getEngine().getUniversalScale();
    const modScale = this.#region.getWorld().getEngine().getModelScale();

    const simple = (proximity === "NEAR" || proximity === "DISTANT");
    for(let a = 0; a < this.#pieces.length; a++) {
    
      const piece = this.#pieces[a];
      
      if(!simple) {

        if(piece.complex !== null && piece.complex === "EXISTS") {

          // The model exists, but isn't loaded, load it
          if(piece.type === "GLB") {
            
            new GLTFLoader().load(

              (this.#path + piece.file + "-complex.glb"),
              
              (gltf) => {
                
                const model = gltf.scene;
                
                model.position.x = piece.pos.x;
                model.position.y = piece.pos.y;
                model.position.z = piece.pos.z;

                model.scale.x = (piece.scale.x * uniScale);
                model.scale.y = (piece.scale.y * uniScale);
                model.scale.z = (piece.scale.z * uniScale);
                   
                model.rotation.x = THREE.MathUtils.degToRad(piece.rot.x);
                model.rotation.y = THREE.MathUtils.degToRad(piece.rot.y);
                model.rotation.z = THREE.MathUtils.degToRad(piece.rot.z);

                this.#region.getWorld().getEngine().getScene().remove(piece.simple);
                this.#region.getWorld().getEngine().getScene().add(model);
                piece.complex = model;
                piece.current = piece.complex;
              },

              undefined, // Optional onProgress
              
              (error) => {

                console.warn("Failed to load the model: ", error);
              }
           );
          }
        } 

      } else if(piece.complex !== null && piece.complex !== "EXISTS") {

        this.#region.getWorld().getEngine().getScene().remove(piece.complex);
        this.#region.getWorld().getEngine().getScene().add(piece.simple);
        piece.current = piece.simple;
      }

      const dispose = (proximity === "DISTANT");
      if(dispose) {

        if(piece.complex !== null && piece.complex !== "EXISTS" && (piece.complex instanceof THREE.Object3D || piece.complex instanceof THREE.Group)) {

          UTILS.disposeModel(piece.complex, this.#region.getWorld().getEngine().getScene());
          piece.complex = null;
          piece.complex = "EXISTS";
        }
      }
    } 
  }
}