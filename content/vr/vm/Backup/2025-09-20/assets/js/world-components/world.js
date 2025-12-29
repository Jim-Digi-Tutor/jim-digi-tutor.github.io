import * as THREE from "three";

import * as ObjAPL from "../asset-loaders/obj-group-asset-pack-loader.js";
import * as UTILS from "../utility/utils.js";

import { Region } from "./region.js"
import { XMLLoader } from "../utility/xml-loader.js";

export class World {

  // Flag whether or not to log information to the console
  #log = true;

  #engine;

  #uniScale;
  #modScale;
  #unscaledWorld; // The unscaled size of the world
  #scaledWorld;   // The scaled size of the world; a Vector3 object
  #worldPosition; // The position of the world; a Vector3 object
  
  #ambientLight;
  #hemisphereLight;
  
  #avatarPosition;
  #avatarDirection;

  #commonModels;
  #commonModelsLoaded = 0;

  #regions;
  #regionsLoaded = 0;

  constructor(engine) {

    this.#engine = engine;
    //this.#regions = [];
  }

  getScaledWorld() { return this.#scaledWorld; }
  getWorldPosition() { return this.#worldPosition; }

  getEngine() { return this.#engine; }
  getAvatarPosition() { return this.#avatarPosition; }
  getAvatarDirection() { return this.#avatarDirection; }
  getCommonModels() { return this.#commonModels; }
  getCommonModel(name) {

    for(let a = 0; a < this.#commonModels.length; a++) {

      if(this.#commonModels[a].name === name) {

        return this.#commonModels[a].model;
      }
    }

    return null;
  }

  getRegions() { return this.#regions; }
  getRegion(index) { return this.#regions[index]; }
  getRegionById(id) {

    for(let a = 0; a < this.#regions.length; a++)
      if(this.#regions[a].getId() === id)
        return this.#regions[a];
    
    return null;
  }

  async loadWorldData() {
    
    const xml = await XMLLoader.loadXml("./assets/xml/world-data.xml", "World Data", false, {
      onProgress: XMLLoader.handleProgress,
      onError: (e) => XMLLoader.handleError(e, null),
    });
  
    await this.#buildWorld(xml); // <-- Wait for the world to be built
  }

  async #buildWorld(xml) {

    if(this.#log) console.log("World Data Loaded; Starting to Build World");
    this.#uniScale = this.#engine.getUniversalScale();
    this.#modScale = this.#engine.getModelScale();

    // Reference the XML pertaining to the global world
    const global = xml.querySelector("global");

    // Ascertain the width and depth of the world
    const w = parseInt(global.querySelector("width").textContent.trim());
    const d = parseInt(global.querySelector("depth").textContent.trim());
    this.#unscaledWorld = new THREE.Vector3(w, 0, d);

    this.#scaledWorld = new THREE.Vector3(
      UTILS.scaleDistance(w, this.#uniScale, this.#modScale),
      0, // No need to scale along the y-axis
      UTILS.scaleDistance(d, this.#uniScale, this.#modScale)
    );
    
    this.#worldPosition = UTILS.applyVectorToWorld(
      UTILS.getVectorFromXml(global.querySelector("position"), 0),
      this.#uniScale,
      this.#modScale
    );

    // Add an axes-helper at the world center
    this.#buildAxesHelper();    
    // Add a grid-helper at the floor level
    this.#buildGridHelper();
    // Build the skybox with the XML data
    this.#buildSkyBox(global.querySelector("skybox").getElementsByTagName("box-image"));
    // Add the ambient light
    this.#ambientLight = this.#buildAmbientLight(global.querySelector("ambient-light")); 
    // Build the hemispherical light
    this.#hemisphereLight = this.#buildHemisphereLight(global.querySelector("hemisphere-light")); 

    // Ascertain the avatar's position and direction
    const ap = UTILS.getVectorFromXml(global.querySelector("avatar-position"), 0);
    this.#avatarPosition = UTILS.applyVectorToWorld(ap, this.#uniScale, this.#modScale);
    this.#avatarDirection = UTILS.getVectorFromXml(global.querySelector("avatar-direction"), 0);

    // Load the common models and store them
    if(this.#log) console.log("Beginning to Load Common Models");
    const common = global.querySelector("common-models").getElementsByTagName("model");
    this.#commonModels = await this.#loadCommonModels(
      common,
      (total) => { 
        this.#commonModelsLoaded++;
        console.log("Common Models Loaded: " + this.#commonModelsLoaded + " / " + total);
      }
    );
    
    if(this.#log) console.log("Common Models: ", this.#commonModels)
    if(this.#log) console.log("Finished Loading Common Models");

    // Load any asset packs
    await Promise.all([
      ObjAPL.loadAssetPack("low-poly-trees", this.#commonModels),
      ObjAPL.loadAssetPack("nature-asset-pack", this.#commonModels)
    ]);
    
    // Process the regions in the world
    if(this.#log) console.log("Beginning to Build Regions");
    const regions = global.querySelector("region-data").getElementsByTagName("file");
    this.#regions = await this.#buildRegions(
      regions,
      (total) => { 
        this.#regionsLoaded++;
        console.log("Regions Loaded: " + this.#regionsLoaded + " / " + total);
      }
    );
    
    if(this.#log) console.log("Regions: ", this.#regions)
    if(this.#log) console.log("Finished Loading Regions");
  }

  #buildAxesHelper() {

    // Add the Axes Helper
    const axesHelper = new THREE.AxesHelper(100);
    axesHelper.position.set(0, 0.1, 0);
    this.#engine.getScene().add(axesHelper);   
  }

  #buildGridHelper() {

    const size = ((this.#scaledWorld.x > this.#scaledWorld.z) ? this.#scaledWorld.x : this.#scaledWorld.z);
    const divisions = ((this.#unscaledWorld.x > this.#unscaledWorld.z) ? this.#unscaledWorld.x : this.#unscaledWorld.z);
    const gridHelper = new THREE.GridHelper(size, divisions, 0x004400, 0x004400);
    gridHelper.position.set(0, 0, 0);
    this.#engine.getScene().add(gridHelper);
  }

  #buildSkyBox(images) {

    const loader = new THREE.CubeTextureLoader();
    const boxTex = loader.load([
      images[0].textContent.trim(), images[1].textContent.trim(), images[2].textContent.trim(),
      images[3].textContent.trim(), images[4].textContent.trim(), images[5].textContent.trim()
    ]);
    
    this.#engine.getScene().background = boxTex;
  }

  #buildAmbientLight(data) {

    const colour = data?.querySelector("colour")?.textContent.trim() || "#FFFFFF";
    const intensity = parseFloat(data?.querySelector("intensity")?.textContent.trim() || 0.1);
    const light = new THREE.AmbientLight(new THREE.Color(colour), intensity);
    this.#engine.getScene().add(light);
    return light;
  }

  #buildHemisphereLight(data) {

    const sky = data?.querySelector("sky-colour")?.textContent.trim() || "#FFFFBB";
    const ground = data?.querySelector("ground-colour")?.textContent.trim() || "#080820";
    const intensity = parseFloat(data?.querySelector("intensity")?.textContent.trim() || 0.1);
    const light = new THREE.HemisphereLight(new THREE.Color(sky), new THREE.Color(ground), intensity);
    this.#engine.getScene().add(light);
    return light;
  }

  async #loadCommonModels(common, onModelLoaded) {

    const promises = [];
    for(let a = 0; a < common.length; a++) {

      const c = common[a];
      const name = c.querySelector("name").textContent.trim();
      const file = c.querySelector("file").textContent.trim();
      const merge = parseInt(c.querySelector("merge").textContent.trim()) === 0 ? false : true; 
      const scale = parseFloat(c.querySelector("scale").textContent.trim());
      const dim = UTILS.getVectorFromXml(c.querySelector("dimensions"), 0);
      const rot = UTILS.getVectorFromXml(c.querySelector("rotation"), 0);
      const model = await UTILS.loadCommonGlb(file, merge, scale, this.#engine.getRenderer());
      promises.push({
        name: name,
        file: file,
        merge: merge,
        scale: scale,
        dimensions: dim,
        rotation: rot,
        model: model
      });

      onModelLoaded(common.length);
    }

    return Promise.all(promises); 
  }

  async #buildRegions(regions, onRegionLoaded) {
    
    const promises = [];
    for(let a = 0; a < regions.length; a++) {

      const r = regions[a];
      const file = r.textContent.trim();
      const region = new Region(this, file);
      await region.loadRegionData(file).then(function() {

        promises.push(region);

      }.bind(this));

      onRegionLoaded(regions.length);
    }

    return Promise.all(promises);
  }

  manageProximities(proximities) {

    for(let a = 0; a < this.#regions.length; a++) {

      const prox = proximities[a];
      this.#regions[a].manageProximity(prox);
    }
  }  

  process(frame, time) {

    for(let a = 0; a < this.#regions.length; a++)
      this.#regions[a].process(frame, time);
  }
}