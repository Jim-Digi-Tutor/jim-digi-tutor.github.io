import * as MESH_UI from "mesh-ui";
import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

import { InfoBoard } from "./world-components/info-board.js"
import { Region } from "./world-components/region.js"
import { Torch } from "./world-components/torch.js"
import { XMLLoader } from "./xml-loader.js";

import * as UTILS from "./utils.js";

import * as NAP from "./asset-loaders/nature-asset-pack.js";
import * as LPT from "./asset-loaders/low-poly-trees.js";

export class World {

  #engine;

  #uniScale;
  #modScale;
  #scaledWorld;
  #worldPosition;
  
  #avatarPosition;
  #avatarDirection;

  #ambientLight;
  #hemisphereLight;
  #torchColours;

  #regions;

  #commonModels = [
    { file: "grass", type: "OBJ", scale: new THREE.Vector3(0.02, 0.02, 0.02), rotation: new THREE.Vector3(-90, 0, 0), model: null, scaled: null },
    { file: "info-board", type: "OBJ", scale: new THREE.Vector3(0.2, 0.2, 0.2), rotation: new THREE.Vector3(-90, 0, 0), model: null, scaled: null },
    { file: "info-board-large", type: "OBJ", scale: new THREE.Vector3(0.2, 0.2, 0.2), rotation: new THREE.Vector3(-90, 0, 0), model: null, scaled: null },
    { file: "tree-0", type: "OBJ", scale: new THREE.Vector3(0.04, 0.04, 0.04), rotation: new THREE.Vector3(-90, 0, 0), model: null, scaled: null }
  ]

  constructor(engine) {

    this.#engine = engine;
  }

  getScaledWorld() { return this.#scaledWorld; }
  getWorldPosition() { return this.#worldPosition; }

  getEngine() { return this.#engine; }
  getAvatarPosition() { return this.#avatarPosition; }
  getAvatarDirection() { return this.#avatarDirection; }
  getCommonModels() { return this.#commonModels; }
  getTorchColours() { return this.#torchColours; }

  getRegions() { return this.#regions; }
  getRegion(index) { return this.#regions[index]; }

  async loadWorldData() {

    await XMLLoader.loadXml("./assets/xml/world-data.xml", async (xml) => await this.#buildWorld(xml), XMLLoader.handleError, null, XMLLoader.handleProgress, null);
  }

  manageProximities(proximities) {

    for(let a = 0; a < this.#regions.length; a++) {

      const prox = proximities[a];
      this.#regions[a].manageProximity(prox);
    }
  }

  async #buildWorld(xml) {

    this.#uniScale = this.#engine.getUniversalScale();
    this.#modScale = this.#engine.getModelScale();

    // Reference the XML pertaining to the global world
    const global = xml.querySelector("global");

    //this.#engine.getScene().fog = new THREE.Fog(
      //0x8C8370,
      //UTILS.scaleDistance(0.05, this.#uniScale, this.#modScale),
      //UTILS.scaleDistance(400, this.#uniScale, this.#modScale)
    //);

    // Ascertain the width and depth of the world
    this.#uniScale = this.#engine.getUniversalScale();
    this.#modScale = this.#engine.getModelScale();
    const w = parseInt(global.querySelector("width").textContent.trim());
    const d = parseInt(global.querySelector("depth").textContent.trim());
    this.#scaledWorld = new THREE.Vector3((w * this.#uniScale * this.#modScale), 0, (d * this.#uniScale * this.#modScale));
    this.#worldPosition = UTILS.applyVectorToWorld(UTILS.getVectorFromXml(global.querySelector("position"), 0), this.#uniScale, this.#modScale);

    // Add a grid-helper at the floor level
    // const gridSize = ((this.#scaledWorld.x > this.#scaledWorld.z) ? this.#scaledWorld.x : this.#scaledWorld.z);
    // const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0xff0000, 0x004400);
    // gridHelper.position.set(0, 0, 0);
    // this.#engine.getScene().add(gridHelper);

    // Ascertain the avatar's position and direction
    const ap = UTILS.getVectorFromXml(global.querySelector("avatar-position"), 0);
    this.#avatarPosition = UTILS.applyVectorToWorld(ap, this.#uniScale, this.#modScale);
    this.#avatarDirection = UTILS.getVectorFromXml(global.querySelector("avatar-direction"), 0);

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

    // Load the common models
    this.#loadCommonModels();

    // Process the different torch colours
    this.#torchColours = [];
    const torchCols = global.querySelector("torch-colours").getElementsByTagName("colour");
    for(let a = 0; a < torchCols.length; a++)
      this.#torchColours.push(UTILS.getRgbFromXml(torchCols[a], 0));

    // Process the regions of the world
    this.#regions = [];
    const regions = xml.getElementsByTagName("region");
    for(let a = 0; a < regions.length; a++) {

      const region = new Region(this, a, regions[a]);
      await region.processRegion()
      this.#regions.push(region);
    }
  }

  async #processRegion(id, data) {

    const uniScale = this.#uniScale;
    const modScale = this.#modScale;

    const alias = data?.querySelector("alias")?.textContent.trim() || "unknown-region";
    const name = data?.querySelector("name")?.textContent.trim() || "Unknown Region";
    const region = new Region(this, id, alias, name);

    const size = UTILS.getVectorFromXml(data.querySelector("size"), 0);
    region.setSize(size);
    region.setScaledSize(new THREE.Vector3((size.x * this.#uniScale * this.#modScale), 1, (size.z * this.#uniScale * this.#modScale)));
    region.setScale(UTILS.getVectorFromXml(data.querySelector("scale"), 0));
    const position = UTILS.getVectorFromXml(data.querySelector("position"), 0);
    region.setPosition(UTILS.adjustChildPositionToParent(position, this.#scaledWorld, this.#worldPosition, uniScale, modScale));
      /*
      const models = data.querySelector("models").getElementsByTagName("model");
      for(let a = 0; a < models.length; a++) {

        const model = models[a];
        const file = model.querySelector("file").textContent.trim();
        const size = UTILS.getVectorFromXml(model.querySelector("size"), 0);
        const position = UTILS.getVectorFromXml(model.querySelector("position"));
        const scale = UTILS.getVectorFromXml(model.querySelector("scale"), 0.2);
        const rotation = UTILS.getVectorFromXml(model.querySelector("rotation"), 0);
        
        //const adjPos = UTILS.adjustChildPositionToParent(position, region.getScaledSize(), region.getPosition(), uniScale, modScale);
        //const load = await UTILS.loadObj(
          //("./assets/models/scene/" + alias + "/models/" + file + ".obj"),
          //new OBJLoader(), 
          //new MTLLoader(), 
          //uniScale,
          //false, adjPos,
          //true, scale,
          //true, rotation,
          //[]
        //);

//path, gltfLoader, baseScale, adjustPosition, pos, adjustScale, scale, adjustRotation, rot, addTo
        const adjPos = UTILS.adjustChildPositionToParent(position, region.getScaledSize(), region.getPosition(), uniScale, modScale);
        const load = await UTILS.loadGltf(
          ("./assets/models/scene/" + alias + "/models/" + file + ".glb"),
          new GLTFLoader(), 
          uniScale,
          false, adjPos,
          true, scale,
          true, rotation,
          []
        );

        const obj = load.model;
        region.setModel(obj);
        obj.userData.RegionModelId = ("Region-Model-" + id + "-" + a);
        this.#engine.getScene().add(obj);
      } */ 

      // Build the collision meshes
      /*
      const structures = data.querySelector("structures").getElementsByTagName("structure");
      for(let a = 0; a < structures.length; a++) {

        const struct = structures[a];
        const type = struct.querySelector("type").textContent;        
        const size = (UTILS.getVectorFromXml(struct.querySelector("size"), 0));
        const position = (UTILS.getVectorFromXml(struct.querySelector("position"), 0));
        const adjPos = UTILS.adjustChildPositionToParent(position, region.getScaledSize(), region.getPosition(), uniScale, modScale);
        const structScale = (UTILS.getVectorFromXml(struct.querySelector("scale"), 0));
        const rotation = (UTILS.getVectorFromXml(struct.querySelector("rotation"), 0));

        switch(type) {

          case "GLB":
            const path = ("./assets/models/scene/" + alias + "/collidables/" + struct.querySelector("model").textContent.trim());
            const load = await UTILS.loadGltf(
              path,
              new GLTFLoader(), 
              uniScale,
              false, adjPos,
              true, structScale,
              true, rotation,
              [ this.#engine.getStructure() ]
            );

            const gltf = load.model;
            gltf.userData.CollisionMeshId = ("Collision-Mesh-" + id + "-" + a);    
            // No need to add to the scene as the meshes are intended to be invisible
            //this.#engine.getScene().add(load.model);
            break;
        }
      }*/

      // Process the lights in the scene

      /*
      const lights = data.querySelector("lights").getElementsByTagName("light");
      for(let a = 0; a < lights.length; a++) {

        const light = lights[a];
        const type = light.querySelector("type").textContent.trim();
        const position = UTILS.getVectorFromXml(light.querySelector("position"), 0);

        // Adjust the position of the light based on the scaled size of the model
        const adjPos = UTILS.adjustChildPositionToParent(position, region.getScaledSize(), region.getPosition(), uniScale, modScale);
        
        let lightObject = null;
        switch(type) {

          case "TORCH":
            lightObject = new Torch(region, a, type, adjPos, false);
            break;
        }

        if(lightObject !== null)
          region.setLight(lightObject)
      }*/
        

      // Build the scenery objects
      /*
      const scenery = data.querySelector("scenery").getElementsByTagName("item");
      for(let a = 0; a < scenery.length; a++) {

        const item = scenery[a];
        const file = item.querySelector("model").textContent.trim(); 
        const type = item.querySelector("type").textContent.trim();        
        const collidable = item.querySelector("collidable").textContent.trim();        
        const position = (UTILS.getVectorFromXml(item.querySelector("position"), 0));
        const adjPos = UTILS.adjustChildPositionToParent(position, region.getScaledSize(), region.getPosition(), uniScale, modScale);
        const scale = (UTILS.getVectorFromXml(item.querySelector("scale"), 0));
        const rotation = (UTILS.getVectorFromXml(item.querySelector("rotation"), 0));

        let model = null;
        switch(type) {

          case "COMMON":
            const mods = this.#commonModels;
            let data = null;
            for(let a = 0; a < mods.length; a++) {

              if(mods[a].file === file) {

                data = mods[a];
                break;
              }
            }
            
            if(data !== null) {

              model = data.model.clone(true);
              model.position.x = adjPos.x;
              model.position.y = adjPos.y;
              model.position.z = adjPos.z;
              model.rotation.x += THREE.MathUtils.degToRad(rotation.x);
              model.rotation.y += THREE.MathUtils.degToRad(rotation.y);
              model.rotation.z += THREE.MathUtils.degToRad(rotation.z); 
              model.scale.x += THREE.MathUtils.degToRad((scale.x * modScale) * uniScale);
              model.scale.y += THREE.MathUtils.degToRad((scale.y * modScale) * uniScale);
              model.scale.z += THREE.MathUtils.degToRad((scale.z * modScale) * uniScale);               
            }

            break;

          case "OBJ":
            const load = await UTILS.loadObj(
              ("./assets/models/common/" + file + "/" + file + ".obj"),
              new OBJLoader(), 
              new MTLLoader(), 
              uniScale,
              false, adjPos,
              true, scale,
              true, rotation,
              [],
            );

            model = load.model;
            break;                 
        }

        if(model !== null) {

          model.userData.CollisionMeshId = ("Scenery-Model-" + id + "-" + a);    
          this.#engine.getScene().add(model);

          if(collidable === "YES")
            this.#engine.setStructure(model);
        }        
      }*/

      // Process the info boards in the scene
      /*
      const boards = data.querySelector("info-boards").getElementsByTagName("info-board");
      for(let a = 0; a < boards.length; a++) {

        const board = new InfoBoard(region, a, boards[a]);
        await board.setupBoard();
        region.setBoard(board);
      }*/

    //  return region;
    
  }

  async #loadCommonModels() {

    const uniScale = this.#uniScale;
    const models = this.#commonModels;
    for(let a = 0; a < models.length; a++) {

      const mod = models[a];
      switch(mod.type) {

        case "OBJ":
          const load = await UTILS.loadObj(
            ("./assets/models/common/" + mod.file + "/" + mod.file + ".obj"),
            new OBJLoader(), 
            new MTLLoader(), 
            uniScale,
            true, new THREE.Vector3(0, 0, 0),
            true, mod.scale,
            true, mod.rotation,
            []
          );

          mod.model = load.model;
          mod.scaled = load.scaled;
          break;
      }
    }

    await this.#loadAssetPacks();
  }

  async #loadAssetPacks() {

    NAP.loadNatureAssetPack(this.#commonModels);
    LPT.loadLowPolyTrees(this.#commonModels);
  }

  process(frame) {

    for(let a = 0; a < this.#regions.length; a++)
      this.#regions[a].process(frame);
  }
}