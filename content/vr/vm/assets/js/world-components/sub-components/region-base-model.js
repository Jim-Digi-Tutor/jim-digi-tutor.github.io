import * as THREE from "three";

import * as UTILS from "../../utility/utils.js";

export class RegionBaseModel {

  #parent;

  #name;
  #scale;
  #rotation;

  #highModel;
  #midModel;
  #lowModel;
  #noModel;

  #lastDetail;

  constructor(parent, data, mod) {

    this.#parent = parent;

    this.#name = data.querySelector("name").textContent;
    this.#scale = parseFloat(data.querySelector("scale").textContent);
    this.#rotation = UTILS.getVectorFromXml(data.querySelector("rotation"), 0);

    this.#highModel = {

      exists: false,
      remap: false,
      merge: false,
      model: null
    }

    this.#midModel = {

      exists: false,
      remap: false,      
      merge: false,
      model: null
    }
    
    this.#lowModel = {

      exists: false,
      remap: false,      
      merge: false,
      model: null
    }
    
    this.#noModel = {

      exists: false,
      remap: false,      
      merge: false,
      model: null
    }    

    this.#lastDetail = -1;

    if(this.#parent.getLog()) {

      console.log("-------- Name: " + this.#name);
      console.log("-------- Scale: " + this.#scale);
      console.log("-------- Rotation: (" +
        this.#rotation.x + ", " +
        this.#rotation.y + ", " +
        this.#rotation.z + ")"
      );
    } 
  }
  
  getDetailLevelExists(detail) {

    if(detail === 0)
      return this.#noModel.exists;
    else if(detail === 1)
      return this.#lowModel.exists;
    else if(detail === 2)
      return this.#midModel.exists;
    else if(detail === 3)
      return this.#highModel.exists;            

    return false;
  }

  getModelData(detail = 3) {

    if(detail === 0 && this.#noModel.exists)
      return this.#noModel;
    else if(detail === 1 && this.#lowModel.exists)
      return this.#lowModel;
    else if(detail === 2 && this.#midModel.exists)
      return this.#midModel;
    else
      return this.#highModel;
    
    return null;
  }

  processModel(detail, model, remap, merge) {

    if(this.#parent.getLog()) console.log("-------- Processing Base Region Model, Detail: " + detail);

    let target = null;
    if(detail === 0)
      target = this.#noModel;
    else if(detail === 1)
      target = this.#lowModel;
    else if(detail === 2)
      target = this.#midModel;
    else if(detail === 3)
      target = this.#highModel;

    target.exists = true;

    if(remap) {

      UTILS.remapColours(model);
      target.remap = true;
    }

    if(merge) {

      if(this.#parent.getLog()) console.log("-------- Merging Model into single vertex colours...");
      const m = UTILS.mergeToSingleVertexColorMesh(model);
      UTILS.removeAndDisposeObject3D(model);
      target.model = null;
      target.model = m;  
      target.merge = true; 

    } else {

      target.model = model;
      target.merge = false;
    }

    if(!remap && !merge) {

      model.traverse((obj) => {

        if (!obj.isMesh) return;

        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of materials) {
        
          if (!mat) continue;

          if (mat.side === THREE.DoubleSide) {
            mat.side = THREE.FrontSide;   // usually correct
            mat.needsUpdate = true;
          }
        }
      });      
    }

    if(this.#parent.getLog()) console.log("-------- Model Data: ", target);
    
    // Scale, position, and rotate the model    
    const uniScale = this.#parent.getWorld().getEngine().getUniversalScale();
    const modScale = this.#parent.getWorld().getEngine().getModelScale();

    target.model.scale.set((modScale * uniScale), (modScale * uniScale), (modScale * uniScale));
    
    // No need to scale position, the region's position has already been normalised
    const pos = this.#parent.getPosition();
    target.model.position.set(pos.x, pos.y, pos.z);
  
    target.model.rotation.set(
      THREE.MathUtils.degToRad(this.#rotation.x),
      THREE.MathUtils.degToRad(this.#rotation.y),
      THREE.MathUtils.degToRad(this.#rotation.z)
    )
  } 

  showModel(detail) {

    const scene = this.#parent.getWorld().getEngine().getScene();
    if(detail !== this.#lastDetail) {
 
      const now = this.getModelData(detail);
      const then = this.getModelData(this.#lastDetail);
      scene.add(now.model);
      if(then !== null && now !== then)
        scene.remove(then.model);
    }

    this.#lastDetail = detail;
  }
}