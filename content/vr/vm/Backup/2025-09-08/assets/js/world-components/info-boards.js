import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import { InfoBoard } from "./info-board.js";

import * as UTILS from "../utils.js";

export class InfoBoards {

  #region;
  #data;

  #boards;

  constructor(region, data) {

    this.#region = region;
    this.#data = data;

    this.#boards = [];
  }

  getRegion() { return this.#region; }
  
  processInfoBoards() {

    const data = this.#data;

    // Process the info boards in the scene
    const boards = data.getElementsByTagName("info-board");
    for(let a = 0; a < boards.length; a++) {

      const board = new InfoBoard(this, a, boards[a]);
      board.setupBoard();
      this.#boards.push(board);
    }
  }

  manageBoards(proximity) {

    const uniScale = this.#region.getWorld().getEngine().getUniversalScale();
    const modScale = this.#region.getWorld().getEngine().getModelScale();

    for(let a = 0; a < this.#boards.length; a++) {
    
      const board = this.#boards[a];
      if(proximity === "DISTANT") {

        // Dispose of board completely
        if(board.getScreen() !== null)
          board.disposeBoard();

      } else if(proximity === "NEAR") {

        // Remove from scene, if added
        if(this.#region.getWorld().getEngine().getScene().children.includes(board.getScreen()))
          this.#region.getWorld().getEngine().getScene().remove(board.getScreen());
      
      } else if(proximity === "ADJACENT" || proximity === "IN") {

        if(board.getScreen() === null) {
          
          board.buildScreen();
          board.buildContent();
        }

        this.#region.getWorld().getEngine().getScene().add(board.getScreen());
      }
        
    
    
    //this.#buildScreen(this.#data.querySelector("screen"));
    //this.#buildContent(this.#screen, this.#data.querySelector("contents"));
        //if(model.complex !== null && model.complex === "EXISTS") {

          // The model exists, but isn't loaded, load it
          //if(model.type === "OBJ") {
            
            //new OBJLoader().load(

            //  (this.#path + model.file + "-complex.obj"),
              
            //  (obj) => {
                
                //const model = gltf.scene;
                
            //    obj.position.x = model.pos.x;
             //   obj.position.y = model.pos.y;
              //  obj.position.z = model.pos.z;

             //   obj.scale.x = (model.scale.x * uniScale);
             //   obj.scale.y = (model.scale.y * uniScale);
             //   obj.scale.z = (model.scale.z * uniScale);
                   
            //    obj.rotation.x = THREE.MathUtils.degToRad(model.rot.x);
             //   obj.rotation.y = THREE.MathUtils.degToRad(model.rot.y);
              //  obj.rotation.z = THREE.MathUtils.degToRad(model.rot.z);

              //  this.#region.getWorld().getEngine().getScene().remove(model.simple);
              //  this.#region.getWorld().getEngine().getScene().add(obj);
             // /  model.complex = obj;
               // model.current = model.complex;
              //},

             // undefined, // Optional onProgress
              
             // (error) => {

               // console.warn("Failed to load the model: ", error);
             // }
          // );
         // }

       // } else if(model.complex !== null && model.complex !== "EXISTS") {

         // this.#region.getWorld().getEngine().getScene().remove(model.simple);
        //  this.#region.getWorld().getEngine().getScene().add(model.complex);
        //  model.current = model.complex;
       // } 

      //} else {

       // this.#region.getWorld().getEngine().getScene().remove(model.complex);
       // this.#region.getWorld().getEngine().getScene().add(model.simple);
       // model.current = model.simple;
     // }

      //const dispose = (proximity === "DISTANT");
     // if(dispose) {

       // if(model.complex !== null && model.complex !== "EXISTS" && (model.complex instanceof THREE.Object3D || model.complex instanceof THREE.Group)) {

       //   UTILS.disposeModel(model.complex, this.#region.getWorld().getEngine().getScene());
       //   model.complex = null;
       //   model.complex = "EXISTS";
       // }
      
    } 
  }
}