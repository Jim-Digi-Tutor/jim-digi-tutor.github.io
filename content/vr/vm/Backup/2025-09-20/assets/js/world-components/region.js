import * as THREE from "three";

import * as UTILS from "../utility/utils.js";

import { InfoBoards } from "./info-boards.js"
import { XMLLoader } from "../utility/xml-loader.js";

export class Region {

  // Flag whether or not to log information to the console
  #log = true;

  #world;
  #file;
  #proximity;

  #uniScale;
  #modScale;

  #id;
  #alias;
  #name;

  #size;
  #scaledSize;
  #position;
  #adjPosition;

  #terrain;

  #modelData;
  #collidables;
  #interactables;
  
  #lights;
  #boards = null;

  constructor(world, file) {

    this.#world = world;
    this.#file = file;
    this.#proximity = UTILS.PROX_DISTANT;

    this.#uniScale = world.getEngine().getUniversalScale();
    this.#modScale = world.getEngine().getModelScale();
  }

  async loadRegionData(file) {
    
    const xml = await XMLLoader.loadXml(file, "Region Data", false, {
      onProgress: XMLLoader.handleProgress,
      onError: (e) => XMLLoader.handleError(e, null),
    });
  
    await this.#buildRegion(xml); // <-- Wait for the region to be built
  } 
   
  async #buildRegion(xml) {

    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    this.#id = parseInt(xml.querySelector("id").textContent.trim());
    this.#alias = xml.querySelector("alias").textContent.trim();
    this.#name = xml.querySelector("name").textContent.trim();

    const w = parseInt(xml.querySelector("width").textContent.trim());
    const d = parseInt(xml.querySelector("depth").textContent.trim());    
    this.#size = new THREE.Vector3(UTILS.scaleDistance(w, this.#uniScale, this.#modScale), 0, UTILS.scaleDistance(d, uniScale, modScale));
    this.#position = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(xml.querySelector("position"), 0), uniScale, modScale);
    
    // Add the underlying terrain model
    //const terrain = xml.querySelector("terrain");
    //const name = terrain.querySelector("name").textContent.trim();
    //const type = terrain.querySelector("type").textContent.trim();
    //const rotation = UTILS.getVectorFromXml(terrain.querySelector("rotation"), 0);
    //const scale = UTILS.getVectorFromXml(terrain.querySelector("scale"), 0);    
    //let tMod = null;
    //switch(type) {

      //case "common-model":
        //tMod = this.#world.getCommonModel(name).clone(true);
        //break;
    //}

    // Position the terrain piece
    //if(tMod !== null) {

      //tMod.position.set(this.#position.x, this.#position.y, this.#position.z);
      //tMod.scale.set(modScale, modScale, modScale);
      //this.#world.getEngine().getScene().add(tMod);
    //}
    
    // Process any models and add them to the scene
    this.#modelData = [];
    this.#collidables = [];
    this.#interactables = [];
    const models = xml.querySelector("models").getElementsByTagName("model");
    for(let a = 0; a < models.length; a++) {
      
      const m = models[a];
      const name = m.querySelector("name").textContent.trim();
      const modName = m?.querySelector("model-name")?.textContent.trim() || "";
      const type = m.querySelector("type").textContent.trim();
      const collidable = parseInt(m.querySelector("collidable").textContent.trim()) === 0 ? false : true; 
      const scale = m?.querySelector("scale")?.textContent.trim() || 1;
      const position = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(m.querySelector("position"), 0), uniScale, modScale);
      const rotation = UTILS.getVectorFromXml(m.querySelector("rotation"), 0);
      switch(type) {

        case "common-model":
          const cMod = new CommonModel(this, name, scale, position, rotation, this.#world.getCommonModel(modName).clone(true));
          cMod.buildModel(
            this.#uniScale,
            this.#modScale,
            ((collidable) ? this.#world.getEngine().getCollidables() : null),
            this.#interactables,
            this.#world.getEngine().getScene()
          );
          break;

        case "multi-part-common-model":
          const parts = UTILS.buildMultiPartModel(m.getElementsByTagName("part"), this.#world.getCommonModel.bind(this.#world));
          const mpMod = new MultiPartModel(this, name, position, rotation, parts);
          mpMod.buildModel(
            this.#uniScale,
            this.#modScale,
            ((collidable) ? this.#world.getEngine().getCollidables() : null),
            this.#interactables,
            this.#world.getEngine().getScene()
          );
          break;
      }
    }

    // Process any lights in the region
    this.#lights = [];
    const lights = xml.querySelector("lights").getElementsByTagName("light");
    for(let a = 0; a < lights.length; a++)
      this.#lights.push(new LightSource(lights[a], this.#world.getEngine().getScene(), uniScale, modScale));

    // Process the information boards
    if(this.#log) console.log("Loading Info Boards for Region " + this.#name + " (" + this.#id + ")");
    const boards = xml.querySelector("info-boards").getElementsByTagName("info-board");
    this.#boards = new InfoBoards(this, boards);
    await this.#boards.processInfoBoards();
    if(this.#log) console.log("Finished Loading Info Boards for Region " + this.#name + " (" + this.#id + ")");
  }

  manageProximity(proximity) {

    // Prevent any further execution of code unless a change is required
    if(proximity !== this.#proximity) {
    
      if((proximity === "IN" && (this.#proximity === "NEAR" || this.#proximity === "DISTANT")) ||
         (proximity === "ADJACENT" && (this.#proximity === "NEAR" || this.#proximity === "DISTANT")) ||
         (proximity === "NEAR" || proximity === "DISTANT")) {

        // console.log("Region " + this.#id + " is changing to " + proximity);
        //this.#terrain.manageModels(proximity);
        //this.#models.manageModels(proximity);
        //this.#boards.manageBoards(proximity);
      }

      this.#proximity = proximity;
    }
  }

  getWorld() { return this.#world; }
  getId() { return this.#id; }
  getAlias() { return this.#alias; }
  getName() { return this.#name; }

  getSize() { return this.#size; }
  setSize(size) { this.#size = size; }
  getScaledSize() { return this.#scaledSize; }
  setScaledSize(scaledSize) { this.#scaledSize = scaledSize; }  
  getPosition() { return this.#position; }
  setPosition(position) { this.#position = position; }  
  getAdjustedPosition() { return this.#adjPosition; }
  setAdjustedPosition(adjPosition) { this.#adjPosition = adjPosition; }  

  getTerrain() { return this.#terrain; }
  setTerrain(terrain) { this.#terrain = terrain; }
  getModels() { return this.#modelData; }
  getLights() { return this.#lights; }
  setLight(light) { this.#lights.push(light); }
  setLights(lights) { this.#lights = lights; }
  getBoards() { return this.#boards; }
  setBoard(board) { this.#boards.push(board); }
  seBoards(boards) { this.#boards = boards; }

  getRadius() {

    if(this.#size.x > this.#size.z)
      return (this.#scaledSize.x / 2)
    else
      return (this.#scaledSize.z / 2)
  }

  process(frame, time) {

    //for(let a = 0; a < this.#lights.length; a++)
      //this.#lights[a].process(frame);

    //if(this.#boards !== null)
      this.#boards.process(frame, time);
  }
    
}

class LightSource {

  #name;
  #light;

  constructor(data, scene, uniScale, modScale) {
  
    this.#name = data.querySelector("name").textContent.trim();
    switch(data.querySelector("type").textContent.trim()) {

      case "point-light":
        this.#light = new THREE.PointLight(
          Number("0x" + data.querySelector("colour").textContent.trim()),
          parseFloat(data.querySelector("intensity").textContent.trim()),
          parseInt(data.querySelector("distance").textContent.trim()),
          parseFloat(data.querySelector("decay").textContent.trim())
        );
        break;
    }

    const pos = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(data.querySelector("position"), 0), uniScale, modScale);
    this.#light.position.set(pos.x, pos.y, pos.z);
    scene.add(this.#light);
  }
}

class CommonModel {

  #region;
  #name;
  #scale;
  #position;
  #rotation;
  #model;

  constructor(region, name, scale, position, rotation, model) {

    this.#region = region;
    this.#name = name;
    this.#scale = scale;
    this.#position = position;
    this.#rotation = rotation;
    this.#model = model;
  }

  buildModel(uniScale, modScale, collidables, interactables, scene) {

    const scl = this.#scale;
    const pos = this.#position;
    const rot = this.#rotation;
    const mod = this.#model;

    // The scale of most common models at region-level should be 1
    // The base scale of the common models should typically be set at world level when loaded
    mod.scale.multiply(new THREE.Vector3(scl, scl, scl));

    mod.position.set(pos.x, pos.y, pos.z);
    mod.rotation.set(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    );

    if(collidables !== null)
      collidables.push(mod);

    if(scene !== null)
      scene.add(mod);    
  }
}

class MultiPartModel {

  #region;
  #name;
  #position;
  #rotation;
  #parts;

  #group;

  constructor(region, name, position, rotation, parts) {

    this.#region = region;
    this.#name = name;
    this.#position = position;
    this.#rotation = rotation;
    this.#parts = parts;
    this.#group = new THREE.Group();
  }

  buildModel(uniScale, modScale, collidables, interactables, scene) {

    const parts = this.#parts;
    const group = this.#group;
    const pos = this.#position;
    const rot = this.#rotation;
    for(let a = 0; a < parts.length; a++) {

      const p = parts[a];
      const norm = UTILS.applyVectorToWorld(p.offset, uniScale, modScale);
      p.model.position.set(norm.x, norm.y, norm.z);
      p.model.rotation.set(
        THREE.MathUtils.degToRad(p.rotation.x),
        THREE.MathUtils.degToRad(p.rotation.y),
        THREE.MathUtils.degToRad(p.rotation.z)
      );

      group.add(p.model);
    }

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.set(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    );  

    if(collidables !== null)
      collidables.push(group);

    if(scene !== null)
      scene.add(group);    
  }
}