import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import { InfoBoards } from "./info-boards.js"
import { Models } from "./models.js"
import { Terrain } from "./terrain.js"
import { Torch } from "./torch.js"

import * as UTILS from "../utils.js";

export class Region {

  #world;
  #id;
  #data;
  #proximity;

  #uniScale;
  #modScale;

  #alias;
  #name;

  #size;
  #scaledSize;
  #position;
  #adjPosition;

  #terrain;
  #models;
  #lights;
  #boards;

  constructor(world, id, data) {

    this.#world = world;
    this.#id = id;
    this.#data = data;
    this.#proximity = "DISTANT";

    this.#uniScale = world.getEngine().getUniversalScale();
    this.#modScale = world.getEngine().getModelScale();
  }

  manageProximity(proximity) {

    // Prevent any further execution of code unless a change is required
    if(proximity !== this.#proximity) {
    
      if((proximity === "IN" && (this.#proximity === "NEAR" || this.#proximity === "DISTANT")) ||
         (proximity === "ADJACENT" && (this.#proximity === "NEAR" || this.#proximity === "DISTANT")) ||
         (proximity === "NEAR" || proximity === "DISTANT")) {

        // console.log("Region " + this.#id + " is changing to " + proximity);
        this.#terrain.manageModels(proximity);
        this.#models.manageModels(proximity);
        this.#boards.manageBoards(proximity);
      }

      this.#proximity = proximity;
    }
  }

  async processRegion() {

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
  getModels() { return this.#models; }
  setModel(model) { this.#models.push(model); }
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