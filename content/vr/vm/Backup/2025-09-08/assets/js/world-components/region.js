import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import { InfoBoards } from "./info-boards.js"
import { Models } from "./models.js"
import { Terrain } from "./terrain.js"
import { Torch } from "./torch.js"

import { XMLLoader } from "../xml-loader.js";

import * as UTILS from "../utils.js";


export class Region {

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
  #boards;

  constructor(world, file) {

    this.#world = world;
    this.#file = file;
    this.#proximity = UTILS.PROX_DISTANT;

    this.#uniScale = world.getEngine().getUniversalScale();
    this.#modScale = world.getEngine().getModelScale();
  }

  async loadRegionData(file) {
    
    await XMLLoader.loadXml(file, async (xml) => await this.#buildRegion(xml), XMLLoader.handleError, null, XMLLoader.handleProgress, null);
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
    const terrain = xml.querySelector("terrain");
    const name = terrain.querySelector("name").textContent.trim();
    const type = terrain.querySelector("type").textContent.trim();
    const rotation = UTILS.getVectorFromXml(terrain.querySelector("rotation"), 0);
    const scale = UTILS.getVectorFromXml(terrain.querySelector("scale"), 0);    
    let tMod = null;
    switch(type) {

      case "common-model":
        tMod = this.#world.getCommonModel(name);
        break;
    }

    // Position the terrain piece
    if(tMod !== null) {

      tMod.position.set(this.#position.x, this.#position.y, this.#position.z);
      tMod.scale.set(modScale, modScale, modScale);
      this.#world.getEngine().getScene().add(tMod);
    }
    
    // Process any models and add them to the scene
    this.#modelData = [];
    this.#collidables = [];
    this.#interactables = [];
    const models = xml.querySelector("models").getElementsByTagName("model");
    for(let a = 0; a < models.length; a++) {
      
      const m = models[a];
      const name = m.querySelector("name").textContent.trim();
      const type = m.querySelector("type").textContent.trim();
      const position = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(m.querySelector("position"), 0), uniScale, modScale);
      const rotation = UTILS.getVectorFromXml(m.querySelector("rotation"), 0);
      const scale = UTILS.getVectorFromXml(m.querySelector("scale"), 0);
      switch(type) {

        case "multi-part-common-model":
          const parts = UTILS.buildMultiPartModel(m.getElementsByTagName("part"), this.#world.getCommonModel.bind(this.#world));
          const data = new MultiPartModel(this, name, position, rotation, parts);
          data.buildModel(this.#uniScale, this.#modScale, this.#collidables, this.#interactables, this.#world.getEngine().getScene());
          break;
      }
    }

    // Process any lights in the region
    this.#lights = [];
    const lights = xml.querySelector("lights").getElementsByTagName("light");
    for(let a = 0; a < lights.length; a++)
      this.#lights.push(new LightSource(lights[a], this.#world.getEngine().getScene(), uniScale, modScale));
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

  async processRegion() {
/*
    const data = this.#data;
    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    this.#alias = data?.querySelector("alias")?.textContent.trim() || "unknown-region";
    this.#name = data?.querySelector("name")?.textContent.trim() || "Unknown Region";

    this.#size = UTILS.getVectorFromXml(data.querySelector("size"), 0);
    this.#scaledSize = new THREE.Vector3(
      UTILS.scaleDistance(this.#size.x, uniScale, modScale),
      UTILS.scaleDistance(this.#size.y, uniScale, modScale),
      UTILS.scaleDistance(this.#size.z, uniScale, modScale)
    );

    this.#position = UTILS.getVectorFromXml(data.querySelector("position"), 0);
    this.#adjPosition = UTILS.adjustChildPositionToParent(this.#position, this.#world.getScaledWorld(), this.#world.getWorldPosition(), uniScale, modScale);

    this.#terrain = new Terrain(this, data.querySelector("terrain"));
    await this.#terrain.processTerrain();

    this.#models = new Models(this, data.querySelector("models"));
    await this.#models.processModels();    

    this.#boards = new InfoBoards(this, data.querySelector("info-boards"));
    await this.#boards.processInfoBoards();  
    */      
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
  //setModel(model) { this.#modelData.push(model); }
  getLights() { return this.#lights; }
  setLight(light) { this.#lights.push(light); }
  setLights(lights) { this.#lights = lights; }
  getBoards() { return this.#lights; }
  setBoard(board) { this.#boards.push(board); }
  seBoards(boards) { this.#boards = boards; }

  getRadius() {

    if(this.#size.x > this.#size.z)
      return (this.#scaledSize.x / 2)
    else
      return (this.#scaledSize.z / 2)
  }

  process(frame) {

    for(let a = 0; a < this.#lights.length; a++)
      this.#lights[a].process(frame);
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
      p.model.position.set(p.offset.x, p.offset.y, p.offset.z);
      p.model.rotation.set(
        THREE.MathUtils.degToRad(p.rotation.x),
        THREE.MathUtils.degToRad(p.rotation.y),
        THREE.MathUtils.degToRad(p.rotation.z)
      );

      group.add(p.model);
      //console.log(p.model.parent)
    }

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.set(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    );  

    group.scale.set(modScale, modScale, modScale);

    if(scene !== null)
      scene.add(group);    
  }

  addToScene() {


  }
}