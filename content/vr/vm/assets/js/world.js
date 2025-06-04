import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import { InfoBoard } from "./world-components/info-board.js"
import { XMLLoader } from "./xml-loader.js";

import * as UTILS from "./utils.js";

export class World {

  #engine;

  #avatarPosition;

  #ambientLight;
  #hemisphereLight;
  #torchColours;

  #regions;

  constructor(engine) {

    this.#engine = engine;
  }

  getEngine() { return this.#engine; }
  getAvatarPosition() { return this.#avatarPosition; }
  getTorchColours() { return this.#torchColours; }

  async loadWorldData() {

    await XMLLoader.loadXml("./assets/xml/world-data.xml", (xml) => this.#buildWorld(xml), XMLLoader.handleError, null, XMLLoader.handleProgress, null);
  }

  #buildWorld(xml) {

    const scale = this.#engine.getScale();

    // Reference the XML pertaining to the global world
    const global = xml.querySelector("global");
    
    // Ascertain the avatar's position
    this.#avatarPosition = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(global.querySelector("avatar-position"), 0), scale);

    // Process the ambient light
    const ambient = global.querySelector("ambient-light");
    const ambientColour = ambient?.querySelector("colour")?.textContent.trim() || "#FFFFFF";
    const ambientIntensity = parseFloat(ambient?.querySelector("intensity")?.textContent.trim() || 0.1);
    this.#ambientLight = UTILS.buildAmbientLight(this.#engine.getScene(), ambientColour, ambientIntensity);    

    // Process the hemisphere light
    const hemisphere = global.querySelector("hemisphere-light");
    const skyColour = hemisphere?.querySelector("sky-colour")?.textContent.trim() || "#FFFFBB";
    const groundColour = hemisphere?.querySelector("ground-colour")?.textContent.trim() || "#080820";
    const hemisphereIntensity = parseFloat(hemisphere?.querySelector("intensity")?.textContent.trim() || 0.1);
    this.#hemisphereLight = UTILS.buildHemisphereLight(this.#engine.getScene(), skyColour, groundColour, hemisphereIntensity);

    // Process the different torch colours
    this.#torchColours = [];
    const torchCols = global.querySelector("torch-colours").getElementsByTagName("colour");
    for(let a = 0; a < torchCols.length; a++)
      this.#torchColours.push(UTILS.getRgbFromXml(torchCols[a], 0));

    // Process the regions of the world
    this.#regions = [];
    const regions = xml.getElementsByTagName("region");
    for(let a = 0; a < regions.length; a++)
      this.#processRegion(a, regions[a]);
  }

  async #processRegion(id, data) {

    const alias = data?.querySelector("alias")?.textContent.trim() || "unknown-region";
    const name = data?.querySelector("name")?.textContent.trim() || "Unknown Region";
    const region = new Region(this, id, alias, name);

    if(alias !== "unknown-region") {
      
      const scale = this.#engine.getScale();

      const model = data.querySelector("model");
      region.setSize(UTILS.getVectorFromXml(model.querySelector("size"), 0));
      region.setPosition(UTILS.applyVectorToWorld(UTILS.getVectorFromXml(model.querySelector("position"), 0), scale));
      region.setScale(UTILS.getVectorFromXml(model.querySelector("scale"), 0.2));
      region.setRotation(UTILS.getVectorFromXml(model.querySelector("rotation"), 0));
      
      const load = await UTILS.loadObj(
        ("./assets/models/scene/" + alias + "/tinker.obj"),
        this.#engine.getObjLoader(), 
        this.#engine.getMtlLoader(), 
        this.#engine.getScale(),
        false, region.getPosition(),
        true, region.getScale(),
        true, region.getRotation(),
        []
      );

      const obj = load.model;
      const scaled = load.scaled;
      obj.userData.RegionModelId = ("Region-Model-" + id);
      this.#engine.getScene().add(obj);

      // Set the region's members
      region.setModel(obj);
      region.setScaledSize(scaled);      

      // Build the collision meshes
      const structures = data.querySelector("structures").getElementsByTagName("structure");
      for(let a = 0; a < structures.length; a++) {

        const struct = structures[a];
        const type = struct.querySelector("type").textContent;        
        const size = (UTILS.getVectorFromXml(struct.querySelector("size"), 0));
        const position = (UTILS.getVectorFromXml(struct.querySelector("position"), 0));
        const structScale = (UTILS.getVectorFromXml(struct.querySelector("scale"), 0));
        const rotation = (UTILS.getVectorFromXml(struct.querySelector("rotation"), 0));

        switch(type) {

          case "GLB":
            const path = ("./assets/models/scene/" + alias + "/collision-meshes/" + struct.querySelector("model").textContent);
            const load = await UTILS.loadGltf(
              path,
              this.#engine.getGltfLoader(), 
              this.#engine.getScale(),
              false, region.getPosition(),
              true, structScale,
              true, rotation,
              [ this.#engine.getStructure() ]
            );

            const gltf = load.model;
            gltf.userData.CollisionMeshId = ("Collision-Mesh-" + id + "-" + a);
            // No need to add to the scene as the meshes are intended to be invisible
            break;
        }
      }

      // Process the lights in the scene
      const lights = data.querySelector("lights").getElementsByTagName("light");
      for(let a = 0; a < lights.length; a++) {

        const light = lights[a];
        const type = light.querySelector("type").textContent.trim();
        const pos = UTILS.getVectorFromXml(light.querySelector("position"), 0);

        // Adjust the position of the light based on the scaled size of the model
        const adjusted = UTILS.adjustVectorToRegionModel(pos, region.getScaledSize(), region.getPosition(), scale, region.getScale());
        
        let lightObject = null;
        switch(type) {

          case "TORCH":
            lightObject = new Torch(region, a, type, adjusted, true);
            break;
        }

        if(lightObject !== null)
          region.setLight(lightObject)
      }

      // Process the lights in the scene
      const boards = data.querySelector("info-boards").getElementsByTagName("info-board");
      for(let a = 0; a < boards.length; a++) {

        const board = new InfoBoard(region, a, boards[a]);
        region.setBoard(board);
      }

      this.#regions.push(region);
    }
  }

  process(frame) {

    for(let a = 0; a < this.#regions.length; a++)
      this.#regions[a].process(frame);
  }
}

class Region {

  #world;
  #id;
  #alias;
  #name;

  #size;
  #position;
  #scale;
  #rotation;
  #scaledSize;

  #model;
  #lights;
  #boards;

  constructor(world, id, alias, name) {

    this.#world = world;
    this.#id = id;
    this.#alias = alias;
    this.#name = name;

    this.#lights = [];
    this.#boards = [];
  }

  getWorld() { return this.#world; }
  getId() { return this.#id; }
  getAlias() { return this.#alias; }
  getName() { return this.#name; }

  getSize() { return this.#size; }
  setSize(size) { this.#size = size; }
  getPosition() { return this.#position; }
  setPosition(position) { this.#position = position; }  
  getScale() { return this.#scale; }
  setScale(scale) { this.#scale = scale; }  
  getRotation() { return this.#rotation; }
  setRotation(rotation) { this.#rotation = rotation; }    
  getScaledSize() { return this.#scaledSize; }
  setScaledSize(scaledSize) { this.#scaledSize = scaledSize; }  

  getModel() { return this.#model; }
  setModel(model) { this.#model = model; }
  getLights() { return this.#lights; }
  setLight(light) { this.#lights.push(light); }
  setLights(lights) { this.#lights = lights; }
  getBoards() { return this.#lights; }
  setBoard(board) { this.#boards.push(board); }
  seBoards(boards) { this.#boards = boards; }
  
  process(frame) {

    for(let a = 0; a < this.#lights.length; a++)
      this.#lights[a].process(frame);
  }
}

class Torch {

  #parent;
  #id;
  #type;
  #position;
  
  #tick = 80;
  #intensity = 0.01;
  #distance = 20;
  #decay = 0.5;
  #volume = 0.5
  #proximity = 2;
  
  #dimFlicker = { frequency: 20, upper: 1.1, lower: 0.9 };

  #previousCol;
  #currentCol;
  #previousDim;
  #currentDim;

  #object;
  #sound;
  
  constructor(parent, id, type, position, indicate) {

    this.#parent = parent;
    this.#id = id;
    this.#type = type;
    this.#position = position;
    
    this.#buildSource(indicate);
  }

  #buildSource(indicate) {
    
    const col = this.#parent.getWorld().getTorchColours()[0];
    this.#previousCol = col;
    this.#currentCol = col;
    this.#previousDim = this.#intensity;
    this.#currentDim = this.#intensity;

    const scale = this.#parent.getWorld().getEngine().getScale();
    this.#object = new THREE.PointLight(new THREE.Color(col.r, col.g, col.b), this.#intensity, (this.#distance * scale), (this.#decay * scale));
    this.#object.position.set(this.#position.x, this.#position.y, this.#position.z);
    this.#object.castShadow = true;
    this.#parent.getWorld().getEngine().getScene().add(this.#object);

    const id = ("Light-" + this.#parent.getId() + "-" + this.#id);
    this.#object.userData.LightSourceId = id;

    if(indicate) {

      const geo = new THREE.SphereGeometry(0.1, 16, 16);
      const mat = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.copy(this.#object.position);
      this.#parent.getWorld().getEngine().getScene().add(sphere);
    }
    
    // Setup the sound of the torch
    // Sound Effect by freesound_community from Pixabay
    const loader = new THREE.AudioLoader();
    this.#sound = new THREE.PositionalAudio(this.#parent.getWorld().getEngine().getListener());
    loader.load("./assets/sounds/crackling-torch.mp3", function(buffer) {
        
      this.#sound.setBuffer(buffer);
      // Distance from object where the volume is full
      this.#sound.setRefDistance(this.#proximity);
      this.#sound.setLoop(true);
      this.#sound.setVolume(this.#volume);
      this.#sound.play();

    }.bind(this));

    this.#object.add(this.#sound);
  }

  process(frame) {

    const count = (frame % this.#tick);
    if(count === 0) {

      // Active changes triggered by meeting the tick threshold, generate a random number to identify a new colour
      const cols = this.#parent.getWorld().getTorchColours();
      const rand = Math.floor(Math.random() * cols.length);
      this.#previousCol = this.#currentCol;
      this.#currentCol = cols[rand];

      if((frame % this.#dimFlicker.frequency) === 0) {

        // Generate a random number to create a new dim / intensity setting
        const dim = this.#clampDim((Math.random() * 2).toFixed(2), this.#dimFlicker.lower, this.#dimFlicker.upper);
        this.#previousDim = this.#currentDim;
        this.#currentDim = (this.#intensity * dim);
      }
      
    } else {

      // Passive changes with the torch phasing between two states
      const colPercent = (count / this.#tick);
      const col = new THREE.Color();
      col.lerpColors(this.#previousCol, this.#currentCol, colPercent);
      this.#object.color.copy(col);

      const dimPercent = ((frame % this.#dimFlicker.frequency) / this.#dimFlicker.frequency);
      const eased = dimPercent * dimPercent * (3 - 2 * dimPercent);  // "Smoothsteps" the animation
      this.#object.intensity = THREE.MathUtils.lerp(this.#previousDim, this.#currentDim, eased);
    }
  }

  #clampDim(val, lower, upper) {

    return Math.min(Math.max(val, lower), upper);
  }  
}